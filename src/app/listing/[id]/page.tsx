import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Icon from "@/components/Icon";
import BackButton from "@/components/BackButton";
import { createClient } from "@/lib/supabase/server";
import { getListingById, getProfile, getCategories } from "@/lib/data";
import { formatPrice } from "@/lib/format";
import SellerActions from "./SellerActions";
import RemoveListingButton from "@/components/RemoveListingButton";
import DetailTabs from "./DetailTabs";
import EditProfileModal from "@/components/EditProfileModal";

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const [listing, { data: userData }, categories] = await Promise.all([
    getListingById(supabase, id),
    supabase.auth.getUser(),
    getCategories(supabase),
  ]);

  if (!listing) {
    return (
      <>
        <Header />
        <main>
          <section className="wrap">
            <div className="empty-state">
              Listing not found.{" "}
              <Link href="/" style={{ color: "var(--brand)", fontWeight: 700 }}>
                Back to browse
              </Link>
            </div>
          </section>
        </main>
        <Footer />
      </>
    );
  }

  const viewerProfile = userData.user ? await getProfile(supabase, userData.user.id) : null;
  const isOwner = userData.user?.id === listing.seller_id;
  const isAdmin = viewerProfile?.is_admin ?? false;

  const seller = listing.seller;
  const categoryName = categories.find((c) => c.slug === listing.category)?.name;

  return (
    <>
      <Header />
      <main>
        <section className="wrap">
          <BackButton />
          <div className="detail-layout">
            <div>
              <div className="seller-panel">
                <p className="price mono">{formatPrice(listing.price, listing.is_free)}</p>
                <h2>{listing.title}</h2>
                <div className="profile-id">
                  <div className="profile-avatar-wrap">
                    <div className="profile-avatar" style={{ background: seller?.avatar_color }}>
                      {seller?.display_name?.charAt(0) ?? "?"}
                    </div>
                    {seller?.available && <span className="profile-avail-dot" />}
                  </div>
                  <div className="profile-name-row">
                    <h2>{seller?.display_name ?? "Seller"}</h2>
                    {seller?.verified && <Icon name="BadgeCheck" />}
                  </div>
                  <p className="profile-rating-row">
                    <Icon name="Star" />
                    {(seller?.rating ?? 5).toFixed(1)} ({seller?.rating_count ?? 0} ratings)
                  </p>
                  {seller?.location && (
                    <p className="profile-location-row">
                      <Icon name="MapPin" />
                      {seller.location}
                    </p>
                  )}
                  {seller?.bio && <p className="profile-bio">{seller.bio}</p>}
                  <div className="profile-badge-row">
                    <span className="profile-badge">
                      <Icon name="CalendarDays" />
                      Since {seller ? new Date(seller.created_at).getFullYear() : ""}
                    </span>
                    {seller?.available && (
                      <span className="profile-badge good">
                        <Icon name="CircleDot" />
                        Available now
                      </span>
                    )}
                    {seller?.verified && (
                      <span className="profile-badge brand">
                        <Icon name="BadgeCheck" />
                        Verified
                      </span>
                    )}
                  </div>
                  {isOwner && <EditProfileModal profile={seller!} />}
                </div>
                {isOwner || isAdmin ? (
                  <>
                    <Link
                      href={`/listing/${listing.id}/edit`}
                      className="btn btn-line btn-block"
                      style={{ marginBottom: 10 }}
                    >
                      <Icon name="Pencil" />
                      Edit listing
                    </Link>
                    <RemoveListingButton
                      table="listings"
                      id={listing.id}
                      redirectTo="/account"
                      label="Remove this listing"
                    />
                  </>
                ) : (
                  <SellerActions
                    listingId={listing.id}
                    sellerId={listing.seller_id}
                    responseRate={seller?.response_rate ?? 90}
                    mmg={seller?.mmg_number ?? null}
                  />
                )}
              </div>
            </div>
            <div>
              <DetailTabs listing={listing} categoryName={categoryName} isOwner={isOwner} />
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
