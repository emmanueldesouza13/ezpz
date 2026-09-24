import Link from "next/link";
import Header from "@/components/Header";
import Icon from "@/components/Icon";
import BackButton from "@/components/BackButton";
import { createClient } from "@/lib/supabase/server";
import { getListingById, getProfile, getCategories, getSellerActiveListings } from "@/lib/data";
import SellerActions from "./SellerActions";
import DetailTabs from "./DetailTabs";
import EditProfileModal from "@/components/EditProfileModal";
import Avatar from "@/components/Avatar";
import ListingMedia from "@/components/ListingMedia";
import BlueTick from "@/components/BlueTick";
import T from "@/components/T";

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
              <T k="listing.notFound" />{" "}
              <Link href="/" style={{ color: "var(--brand)", fontWeight: 700 }}>
                <T k="listing.backToBrowse" />
              </Link>
            </div>
          </section>
        </main>
      </>
    );
  }

  const viewerProfile = userData.user ? await getProfile(supabase, userData.user.id) : null;
  const isOwner = userData.user?.id === listing.seller_id;
  const isAdmin = viewerProfile?.is_admin ?? false;

  const seller = listing.seller;
  const categoryName = categories.find((c) => c.slug === listing.category)?.name;

  // Pool photos/videos across all of this seller's active listings, since
  // the browse grid only shows one card per seller — the rest of their work
  // surfaces here instead of on separate listing cards.
  const sellerListings = await getSellerActiveListings(supabase, listing.seller_id);
  const sellerImages = (sellerListings.length > 0 ? sellerListings : [listing]).flatMap(
    (l) => l.images ?? []
  );
  const sellerVideos = (sellerListings.length > 0 ? sellerListings : [listing]).flatMap(
    (l) => l.videos ?? []
  );

  return (
    <>
      <Header />
      <main>
        <section className="wrap">
          <BackButton />
          <div className="detail-layout">
            <div>
              <div className="seller-panel">
                <div className={`profile-id${isOwner || isAdmin ? " profile-id-solo" : ""}`}>
                  {isOwner && seller ? (
                    <EditProfileModal profile={seller} listing={listing} categories={categories} />
                  ) : (
                    <div className="profile-avatar-wrap">
                      <Avatar
                        url={seller?.avatar_url}
                        color={seller?.avatar_color}
                        name={seller?.display_name}
                        className="profile-avatar"
                      />
                    </div>
                  )}
                  {isOwner ? (
                    <div className="profile-name-row">
                      <h2>{seller?.display_name ?? <T k="listing.sellerFallback" />}</h2>
                      {seller?.verified && <BlueTick size={16} />}
                    </div>
                  ) : (
                    <Link href={`/seller/${listing.seller_id}`} className="profile-name-row">
                      <h2>{seller?.display_name ?? <T k="listing.sellerFallback" />}</h2>
                      {seller?.verified && <BlueTick size={16} />}
                    </Link>
                  )}
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
                      <T k="listing.since" vars={{ year: seller ? new Date(seller.created_at).getFullYear() : "" }} />
                    </span>
                    {seller?.available && (
                      <span className="profile-badge good">
                        <Icon name="CircleDot" />
                        <T k="listing.availableNow" />
                      </span>
                    )}
                    {seller?.verified && (
                      <span className="profile-badge brand">
                        <Icon name="BadgeCheck" />
                        <T k="listing.verified" />
                      </span>
                    )}
                  </div>
                </div>
                {!isOwner && !isAdmin && (
                  <SellerActions
                    listingId={listing.id}
                    sellerId={listing.seller_id}
                  />
                )}
              </div>
            </div>
            <div>
              <DetailTabs listing={listing} categoryName={categoryName} isOwner={isOwner} />
              <ListingMedia images={sellerImages} videos={sellerVideos} />
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
