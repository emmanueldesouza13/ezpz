import Link from "next/link";
import Header from "@/components/Header";
import BackButton from "@/components/BackButton";
import Avatar from "@/components/Avatar";
import BlueTick from "@/components/BlueTick";
import Icon from "@/components/Icon";
import MessageSellerButton from "@/components/MessageSellerButton";
import ProfileTabs from "./ProfileTabs";
import T from "@/components/T";
import { createClient } from "@/lib/supabase/server";
import { getProfile, getSellerActiveListings, getSellerTaxiServices } from "@/lib/data";

// A standalone, listing-independent profile page — reached by tapping a
// person's name/avatar (from a chat, a review, etc.) rather than only ever
// seeing their profile alongside one specific listing. Mirrors the look of
// the seller panel on a listing detail page: avatar, name, rating, badges,
// a Message button, then About/Reviews/Schedule/Listings tabs.
export default async function SellerProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const [seller, { data: userData }, listings, taxiServices] = await Promise.all([
    getProfile(supabase, id),
    supabase.auth.getUser(),
    getSellerActiveListings(supabase, id),
    getSellerTaxiServices(supabase, id),
  ]);

  if (!seller) {
    return (
      <>
        <Header />
        <main>
          <section className="wrap">
            <div className="empty-state">
              <T k="seller.notFound" />{" "}
              <Link href="/" style={{ color: "var(--brand)", fontWeight: 700 }}>
                <T k="listing.backToBrowse" />
              </Link>
            </div>
          </section>
        </main>
      </>
    );
  }

  const isOwner = userData.user?.id === seller.id;
  // Messaging is always attached to one of this seller's own listings, so
  // buyer/seller line up with that listing's real seller_id — pick their
  // most recent one as the default context.
  const messageListingId = listings[0]?.id ?? null;

  return (
    <>
      <Header />
      <main>
        <section className="wrap">
          <BackButton />
          <div className="profile-id profile-id-solo" style={{ marginTop: 8 }}>
            <div className="profile-avatar-wrap">
              <Avatar
                url={seller.avatar_url}
                color={seller.avatar_color}
                name={seller.display_name}
                className="profile-avatar"
              />
            </div>
            <div className="profile-name-row">
              <h2>{seller.display_name}</h2>
              {seller.is_admin ? <BlueTick size={16} admin /> : seller.verified && <BlueTick size={16} />}
            </div>
            <p className="profile-rating-row">
              <Icon name="Star" />
              {(seller.rating ?? 5).toFixed(1)} ({seller.rating_count ?? 0} ratings)
            </p>
            <div className="profile-badge-row">
              <span className="profile-badge">
                <Icon name="CalendarDays" />
                <T k="listing.since" vars={{ year: new Date(seller.created_at).getFullYear() }} />
              </span>
              {seller.available && (
                <span className="profile-badge good">
                  <Icon name="CircleDot" />
                  <T k="listing.availableNow" />
                </span>
              )}
              {seller.verified && (
                <span className="profile-badge brand">
                  <Icon name="BadgeCheck" />
                  <T k="listing.verified" />
                </span>
              )}
            </div>
          </div>

          {!isOwner && messageListingId && (
            <div style={{ marginTop: 20 }}>
              <MessageSellerButton
                listingId={messageListingId}
                sellerId={seller.id}
                nextPath={`/seller/${seller.id}`}
              />
            </div>
          )}

          <ProfileTabs
            seller={seller}
            isOwner={isOwner}
            listings={listings}
            taxiServices={taxiServices}
          />
        </section>
      </main>
    </>
  );
}
