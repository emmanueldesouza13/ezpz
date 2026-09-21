import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCategories } from "@/lib/data";
import Icon from "./Icon";
import ServicesMenu from "./ServicesMenu";

export default async function CategoryNav({ active }: { active?: string }) {
  const supabase = await createClient();
  const categories = await getCategories(supabase);

  return (
    <nav className="cat-rail">
      <div className="wrap">
        <nav className="icon-nav-row" aria-label="Quick navigation">
          <Link href="/" className="icon-nav-btn" aria-label="Home">
            <Icon name="Home" size={18} />
          </Link>
          <Link href="/payments" className="icon-nav-btn" aria-label="Payments">
            <Icon name="Wallet" size={18} />
          </Link>
          <Link href="/messages" className="icon-nav-btn" aria-label="Messages">
            <Icon name="MessageCircle" size={18} />
          </Link>
          <Link href="/taxi" className="icon-nav-btn" aria-label="Taxi &amp; rides">
            <Icon name="Car" size={18} />
          </Link>
        </nav>
        <div className="cat-row">
          <ServicesMenu categories={categories} active={active} />
        </div>
      </div>
    </nav>
  );
}
