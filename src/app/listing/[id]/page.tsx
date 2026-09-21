import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Icon from "@/components/Icon";
import BackButton from "@/components/BackButton";
import { createClient } from "@/lib/supabase/server";
import { getListingById, getProfile, getCategories } from "@/lib/data";
import SellerActions from "./SellerActions";
import RemoveListingButton from "@/components/RemoveListingButton";
import DetailTabs from "./DetailTabs";
import EditProfileModal from "@/components/EditProfileModal";
import Avatar from "@/components/Avatar";

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
                <div className="profile-id">
                  {isOwner ? (
                    <EditProfileModal profile={seller!} listing={listing} categories={categories} />
                  ) : (
                    <div className="profile-avatar-wrap">
                      <Avatar
                        url={seller?.avatar_url}
                        color={seller?.avatar_color}
                        name={seller?.display_name}
                        className="profile-avatar"
                      />
                      {seller?.available && <span className="profile-avail-dot" />}
                    </div>
                  )}
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
                </div>
                {isOwner || isAdmin ? (
                  <RemoveListingButton
                    table="listings"
                    id={listing.id}
                    redirectTo="/account"
                    label="Remove this listing"
                  />
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
