# EzPz

A modern, trustworthy local classifieds marketplace — built to fix what's worst
about Craigslist: the 1999 design, the exposed phone numbers/emails, and the
total absence of trust signals.

## What's built

- **Browse page** — search bar, category chips, responsive listing grid
- **Listing detail page** — photo gallery, seller card, verified badge, in-app
  "Message seller" (no contact info ever exposed), safety reminder, report link
- **Post-a-listing flow** — photos, category, price/free toggle, condition,
  location, description
- **Safety page** — the trust & safety tips linked from the header and footer
- **Supabase schema** (`supabase/schema.sql`) — profiles, categories, listings,
  in-app messaging (conversations + messages), and reports, all with row-level
  security policies already written
- **Supabase client setup** (`src/lib/supabase/`) — browser and server clients,
  ready to swap in for the mock data once a project is connected

Right now the site runs on realistic mock data (`src/lib/mock-data.ts`) so you
can click through the whole experience immediately. Posting a listing shows a
confirmation screen but doesn't save yet — that's the next wiring step.

## Running it locally

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

## Cost to run this for real

Both pieces have generous free tiers that cover a new marketplace for a long
time before you'd pay anything:

- **Vercel** (hosting) — free Hobby plan
- **Supabase** (database, auth, storage) — free plan: 500MB database, 1GB file
  storage, 50,000 monthly active users

## Going live (do this with Claude, one step at a time)

1. Create a Supabase project and run `supabase/schema.sql` in its SQL editor
2. Copy `.env.local.example` to `.env.local` and fill in the project's URL/key
3. Swap the mock-data reads in `src/app/page.tsx` and
   `src/app/listing/[id]/page.tsx` for real Supabase queries
4. Wire up the post-listing form to actually insert a row
5. Push to GitHub and deploy to Vercel
6. Connect a domain
