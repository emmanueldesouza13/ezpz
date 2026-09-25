import { createClient } from "@/lib/supabase/server";
import { getCategories, getHasUnreadMessages } from "@/lib/data";
import IconNavRow from "./IconNavRow";
import ServicesMenu from "./ServicesMenu";

export default async function CategoryNav({ active }: { active?: string }) {
  const supabase = await createClient();
  const [categories, { data: userData }] = await Promise.all([
    getCategories(supabase),
    supabase.auth.getUser(),
  ]);
  const [hasUnread, profileRow] = await Promise.all([
    userData.user ? getHasUnreadMessages(supabase) : Promise.resolve(false),
    userData.user
      ? supabase.from("profiles").select("is_admin").eq("id", userData.user.id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);
  const isAdmin = profileRow.data?.is_admin ?? false;

  return (
    <nav className="cat-rail">
      <div className="wrap">
        <IconNavRow hasUnread={hasUnread} isAdmin={isAdmin} />
        <div className="cat-row">
          <ServicesMenu categories={categories} active={active} />
        </div>
      </div>
    </nav>
  );
}
