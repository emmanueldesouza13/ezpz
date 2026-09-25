"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import BackButton from "@/components/BackButton";
import Icon from "@/components/Icon";
import RemoveListingButton from "@/components/RemoveListingButton";
import EditProfileModal from "@/components/EditProfileModal";
import ProfileTabs from "@/components/ProfileTabs";
import VerifyIdentity from "@/components/VerifyIdentity";
import BlueTick from "@/components/BlueTick";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { createClient } from "@/lib/supabase/client";
import { getMyListings, getMyTaxiServices } from "@/lib/data";
import { isPhotoUrl } from "@/lib/format";
import type { Listing, Profile, TaxiService } from "@/lib/types";
import { toast } from "@/lib/toast";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function AccountPage() {
  const supabase = createClient();
  const router = useRouter();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [myListings, setMyListings] = useState<Listing[]>([]);
  const [myTaxi, setMyTaxi] = useState<TaxiService[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) { router.push("/sign-in?next=/account"); return; }
      const { data: profileRow } = await supabase
        .from("profiles").select("*").eq("id", data.user.id).maybeSingle();
      if (profileRow) {
        setProfile(profileRow as Profile);
      }
      const [listings, taxi] = await Promise.all([
        getMyListings(supabase, data.user.id),
        getMyTaxiServices(supabase, data.user.id),
      ]);
      setMyListings(listings);
      setMyTaxi(taxi);
      setLoading(false);
    })();
  }, [supabase, router]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/");
  }

  if (loading) return null;

  return (
    <>
      <main>
        <section className="wrap">
          <div className="post-wrap account-wrap">
            <div className="page-top-row">
              <BackButton fallback="/" disableSmartBack />
              {!profile?.is_admin && <LanguageSwitcher />}
            </div>
            <h1>{t("account.title")}</h1>
            {profile?.verified && <p className="lede">{t("account.verifiedSeller")}</p>}

            {profile && (
              <div className="account-layout">
                <div className="profile-id profile-id-solo">
                  <EditProfileModal profile={profile} onSaved={setProfile} />
                  <div className="profile-badge-row">
                    {!profile.is_admin && (
                      <span className="profile-badge">
                        <Icon name="CalendarDays" />
                        {t("listing.since", { year: new Date(profile.created_at).getFullYear() })}
                      </span>
                    )}
                    {profile.available && (
                      <span className="profile-badge good">
                        <Icon name="CircleDot" />
                        {t("listing.availableNow")}
                      </span>
                    )}
                  </div>
                  <div className="profile-name-row">
                    <h2>{profile.display_name}</h2>
                    {profile.is_admin ? <BlueTick size={16} admin /> : profile.verified && <BlueTick size={16} />}
                  </div>
                  {profile.location && (
                    <p className="profile-location-row">
                      <Icon name="MapPin" />
                      {profile.location}
                    </p>
                  )}
                  {profile.bio && <p className="profile-bio">{profile.bio}</p>}
                  <VerifyIdentity profile={profile} />
                </div>

                <div className="account-main">
                  <ProfileTabs profile={profile} isOwner />

                  {!profile.is_admin && (myListings.length > 0 || myTaxi.length > 0) && (
                    <>
                      <h2 style={{ marginTop: 28 }}>{t("account.myListings")}</h2>
                      <div className="admin-list">
                        {myListings.map((l) => (
                    <div className="admin-row" key={l.id}>
                      <div
                        className="admin-swatch my-listing-thumb"
                        style={isPhotoUrl(l.images[0]) ? undefined : { background: l.images[0] }}
                      >
                        {isPhotoUrl(l.images[0]) && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={l.images[0]} alt={l.title} className="admin-swatch-img" />
                        )}
                      </div>
                      <div className="admin-row-info">
                        <div className="admin-row-title">
                          <Link href={`/listing/${l.id}`}>{l.title}</Link>
                        </div>
                        <div className="admin-row-sub">{l.location}</div>
                      </div>
                      <div className="admin-row-actions">
                        <Link href={`/listing/${l.id}/edit`} className="admin-btn">
                          {t("common.edit")}
                        </Link>
                        <RemoveListingButton
                          table="listings"
                          id={l.id}
                          label={t("common.remove")}
                          variant="row"
                          onRemoved={() => setMyListings((cur) => cur.filter((x) => x.id !== l.id))}
                        />
                      </div>
                    </div>
                  ))}
                  {myTaxi.map((svc) => {
                    const taxiPhoto = svc.photo_url ?? svc.photos?.[0] ?? null;
                    return (
                    <div className="admin-row" key={svc.id}>
                      <div
                        className="admin-swatch my-listing-thumb"
                        style={!taxiPhoto ? { display: "flex", alignItems: "center", justifyContent: "center", color: "var(--accent)" } : undefined}
                      >
                        {taxiPhoto ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={taxiPhoto} alt={svc.driver_name} className="admin-swatch-img" />
                        ) : (
                          <Icon name="Car" />
                        )}
                      </div>
                      <div className="admin-row-info">
                        <div className="admin-row-title">
                          <Link href={`/taxi/${svc.id}`}>{svc.driver_name}</Link>
                          {!profile?.is_admin && svc.fee_status === "pending" && (
                            <span className="admin-flag off">{t("account.feePending")}</span>
                          )}
                        </div>
                        <div className="admin-row-sub">
                          {svc.vehicle_make} {svc.vehicle_model} &middot; {svc.service_area}
                        </div>
                      </div>
                      <div className="admin-row-actions">
                        <Link href={`/taxi/${svc.id}/edit`} className="admin-btn">
                          {t("common.edit")}
                        </Link>
                        <RemoveListingButton
                          table="taxi_services"
                          id={svc.id}
                          label={t("common.remove")}
                          variant="row"
                          onRemoved={() => setMyTaxi((cur) => cur.filter((x) => x.id !== svc.id))}
                        />
                      </div>
                    </div>
                  );})}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {profile && !profile.is_admin && (
              <Link
                href="/payments"
                className="btn btn-line btn-block"
                style={{ marginTop: 32, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
              >
                <Icon name="Wallet" size={16} />
                {t("nav.payments")}
              </Link>
            )}

            <button type="button" className="btn btn-line btn-block" style={{ marginTop: 12 }} onClick={handleSignOut}>
              {t("common.signOut")}
            </button>
          </div>
        </section>
      </main>
    </>
  );
}
