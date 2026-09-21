-- EzPz database schema v2 — services marketplace, Guyana-only, MMG payments, real admin
-- Replaces the original general-classifieds schema to match the shipped design.

-- 1. Profiles -----------------------------------------------------------------
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  avatar_color text not null default '#a72c53',
  verified boolean not null default false,
  is_admin boolean not null default false,
  mmg_number text,
  rating numeric(2,1) not null default 5.0,
  rating_count int not null default 0,
  response_rate int not null default 90,
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

-- SECURITY DEFINER helper so admin-check policies don't recurse into profiles' own RLS.
create or replace function is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce((select p.is_admin from profiles p where p.id = auth.uid()), false);
$$;

drop policy if exists "Profiles are viewable by everyone" on profiles;
create policy "Profiles are viewable by everyone"
  on profiles for select
  using (true);

drop policy if exists "Users can update their own profile" on profiles;
create policy "Users can update their own profile"
  on profiles for update
  using (auth.uid() = id or is_admin());

create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)));
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- 2. Categories -----------------------------------------------------------------
create table if not exists categories (
  slug text primary key,
  name text not null,
  icon text not null,
  sort_order int not null default 0
);

alter table categories enable row level security;

drop policy if exists "Categories are viewable by everyone" on categories;
create policy "Categories are viewable by everyone"
  on categories for select
  using (true);

drop policy if exists "Admins manage categories" on categories;
create policy "Admins manage categories"
  on categories for all
  using (is_admin())
  with check (is_admin());

insert into categories (slug, name, icon, sort_order) values
  ('services', 'Services', 'Briefcase', 1)
on conflict (slug) do nothing;

-- 3. Listings -----------------------------------------------------------------
create table if not exists listings (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  description text not null,
  price numeric(10,2) not null default 0,
  is_free boolean not null default false,
  category text not null references categories(slug),
  location text not null,
  images text[] not null default '{}',
  featured boolean not null default false,
  status text not null default 'active' check (status in ('active','sold','removed')),
  created_at timestamptz not null default now()
);

alter table listings enable row level security;

drop policy if exists "Active listings are viewable by everyone" on listings;
create policy "Active listings are viewable by everyone"
  on listings for select
  using (status = 'active' or seller_id = auth.uid() or is_admin());

drop policy if exists "Users can insert their own listings" on listings;
create policy "Users can insert their own listings"
  on listings for insert
  with check (seller_id = auth.uid());

drop policy if exists "Users can update their own listings" on listings;
create policy "Users can update their own listings"
  on listings for update
  using (seller_id = auth.uid() or is_admin());

drop policy if exists "Users can delete their own listings" on listings;
create policy "Users can delete their own listings"
  on listings for delete
  using (seller_id = auth.uid() or is_admin());

create index if not exists listings_category_idx on listings(category);
create index if not exists listings_created_at_idx on listings(created_at desc);

-- 4. Messages (in-app messaging, keeps contact info private) -------------------
create table if not exists conversations (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references listings(id) on delete cascade,
  buyer_id uuid not null references profiles(id) on delete cascade,
  seller_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (listing_id, buyer_id)
);

alter table conversations enable row level security;

drop policy if exists "Participants can view their conversations" on conversations;
create policy "Participants can view their conversations"
  on conversations for select
  using (auth.uid() = buyer_id or auth.uid() = seller_id or is_admin());

drop policy if exists "Buyers can start a conversation" on conversations;
create policy "Buyers can start a conversation"
  on conversations for insert
  with check (auth.uid() = buyer_id);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  sender_id uuid not null references profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

alter table messages enable row level security;

drop policy if exists "Participants can view messages in their conversations" on messages;
create policy "Participants can view messages in their conversations"
  on messages for select
  using (
    exists (
      select 1 from conversations c
      where c.id = conversation_id
        and (c.buyer_id = auth.uid() or c.seller_id = auth.uid())
    ) or is_admin()
  );

drop policy if exists "Participants can send messages in their conversations" on messages;
create policy "Participants can send messages in their conversations"
  on messages for insert
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from conversations c
      where c.id = conversation_id
        and (c.buyer_id = auth.uid() or c.seller_id = auth.uid())
    )
  );

-- 5. Reports (trust & safety) ---------------------------------------------------
create table if not exists reports (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references listings(id) on delete cascade,
  reporter_id uuid references profiles(id) on delete set null,
  reason text not null,
  created_at timestamptz not null default now()
);

alter table reports enable row level security;

drop policy if exists "Users can file a report" on reports;
create policy "Users can file a report"
  on reports for insert
  with check (true);

drop policy if exists "Admins can view reports" on reports;
create policy "Admins can view reports"
  on reports for select
  using (is_admin());

-- 6. Hardening: lock down search_path / RPC exposure on helper functions ------
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)));
  return new;
end;
$$ language plpgsql security definer set search_path = public;

revoke execute on function public.handle_new_user() from anon, authenticated, public;

-- is_admin() is called from inside RLS policy expressions, which run as the
-- querying role (anon/authenticated) — it must stay executable by them or
-- every select against listings/categories/etc starts failing.
grant execute on function public.is_admin() to anon, authenticated;

-- 7. Realtime ------------------------------------------------------------------
alter publication supabase_realtime add table messages;

-- 8. Storage: listing photo uploads --------------------------------------------
-- Public bucket. Objects are stored under "<uploader-user-id>/<filename>" so a
-- seller can only write/replace/delete inside their own folder (admins can too).
-- Everyone can read, since listing photos need to be publicly viewable.
insert into storage.buckets (id, name, public)
values ('listings', 'listings', true)
on conflict (id) do nothing;

drop policy if exists "listings_public_read" on storage.objects;
create policy "listings_public_read"
  on storage.objects for select
  using (bucket_id = 'listings');

drop policy if exists "listings_owner_write" on storage.objects;
create policy "listings_owner_write"
  on storage.objects for insert
  with check (
    bucket_id = 'listings'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "listings_owner_update" on storage.objects;
create policy "listings_owner_update"
  on storage.objects for update
  using (
    bucket_id = 'listings'
    and ((storage.foldername(name))[1] = auth.uid()::text or is_admin())
  );

drop policy if exists "listings_owner_delete" on storage.objects;
create policy "listings_owner_delete"
  on storage.objects for delete
  using (
    bucket_id = 'listings'
    and ((storage.foldername(name))[1] = auth.uid()::text or is_admin())
  );
