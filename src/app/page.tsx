import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CategoryNav from "@/components/CategoryNav";
import ListingCard from "@/components/ListingCard";
import FiltersButton from "@/components/FiltersButton";
import { createClient } from "@/lib/supabase/server";
import { getCategories, getListings } from "@/lib/data";

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string; minPrice?: string; maxPrice?: string }>;
}) {
  const { category, q, minPrice, maxPrice } = await searchParams;
  const supabase = await createClient();
  const [listings, categories] = await Promise.all([
    getListings(supabase, {
      category,
      q,
      minPrice: minPrice ? Number(minPrice) : null,
      maxPrice: maxPrice ? Number(maxPrice) : null,
    }),
    getCategories(supabase),
  ]);

  const cat = category ? categories.find((c) => c.slug === category) : null;
  const title = cat ? cat.name : "Nearby listings";
  const categoryNames = Object.fromEntries(categories.map((c) => [c.slug, c.name]));
  const sub =
    listings.length +
    (listings.length === 1 ? " listing" : " listings") +
    (q ? ` matching "${q}"` : "") +
    " across Guyana";

  return (
    <>
      <Header />
      <CategoryNav active={category} />
      <main>
        <section className="wrap">
          <div className="browse-head">
            <div>
              <h1>{title}</h1>
              <p>{sub}</p>
            </div>
            <FiltersButton
              categories={categories}
              current={{ category, q, minPrice, maxPrice }}
            />
          </div>
          <div className="listing-grid">
            {listings.map((l) => (
              <ListingCard listing={l} categoryName={categoryNames[l.category]} key={l.id} />
            ))}
          </div>
          {listings.length === 0 && (
            <div className="empty-state">
              {q || category
                ? "No listings match your search yet."
                : "No listings yet — be the first to post one."}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
