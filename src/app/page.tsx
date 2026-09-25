import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CategoryNav from "@/components/CategoryNav";
import ListingCard from "@/components/ListingCard";
import FiltersButton from "@/components/FiltersButton";
import VerifiedWarningPopup from "@/components/VerifiedWarningPopup";
import BrowseHeading from "@/components/BrowseHeading";
import T from "@/components/T";
import { createClient } from "@/lib/supabase/server";
import { getCategories, getListings } from "@/lib/data";

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: Promise<{
    category?: string;
    q?: string;
    region?: string;
    verified?: string;
    minRating?: string;
  }>;
}) {
  const { category, q, region, verified, minRating: minRatingParam } = await searchParams;
  const verifiedOnly = verified === "1";
  const minRating = minRatingParam ? Number(minRatingParam) : null;
  const supabase = await createClient();
  const [listings, categories] = await Promise.all([
    getListings(supabase, { category, q, region, verifiedOnly, minRating }),
    getCategories(supabase),
  ]);

  // One card per seller on the browse grid — their other listings' photos and
  // videos show up together once you open this one (see ListingMedia).
  const seenSellers = new Set<string>();
  const oneEach = listings.filter((l) => {
    if (seenSellers.has(l.seller_id)) return false;
    seenSellers.add(l.seller_id);
    return true;
  });

  const cat = category ? categories.find((c) => c.slug === category) : null;
  const categoryNames = Object.fromEntries(categories.map((c) => [c.slug, c.name]));

  return (
    <>
      <VerifiedWarningPopup />
      <Header />
      <CategoryNav active={category} />
      <main>
        <section className="wrap">
          <div className="browse-head">
            <BrowseHeading categoryName={cat?.name} count={oneEach.length} query={q} region={region} />
            <FiltersButton
              categories={categories}
              current={{ category, q, region, verified: verifiedOnly, minRating }}
            />
          </div>
          <div className="listing-grid">
            {oneEach.map((l) => (
              <ListingCard listing={l} categoryName={categoryNames[l.category]} key={l.id} />
            ))}
          </div>
          {oneEach.length === 0 && (
            <T k={q || category ? "browse.noneFiltered" : "browse.noneYet"} as="div" className="empty-state" />
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
