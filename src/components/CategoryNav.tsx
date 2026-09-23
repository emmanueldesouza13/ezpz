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
  const hasUnread = userData.user ? await getHasUnreadMessages(supabase) : false;

  return (
    <nav className="cat-rail">
      <div className="wrap">
        <IconNavRow hasUnread={hasUnread} />
        <div className="cat-row">
          <ServicesMenu categories={categories} active={active} />
        </div>
      </div>
    </nav>
  );
}
