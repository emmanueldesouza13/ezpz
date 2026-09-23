"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import BackButton from "@/components/BackButton";
import Icon from "@/components/Icon";
import RemoveListingButton from "@/components/RemoveListingButton";
import EditProfileModal from "@/components/EditProfileModal";
import PasswordInput from "@/components/PasswordInput";
import ProfileTabs from "@/components/ProfileTabs";
import VerifyIdentity from "@/components/VerifyIdentity";
import BlueTick from "@/components/BlueTick";
import { createClient } from "@/lib/supabase/client";
import { getMyListings, getMyTaxiServices } from "@/lib/data";
import { formatPrice } from "@/lib/format";
import type { Listing, Profile, TaxiService } from "@/lib/types";
import { toast } from "@/lib/toast";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function AccountPage() {
  const supabase = createClient();
  const router = useRouter();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [mmg, setMmg] = useState("");
  const [saving, setSaving] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
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
        setMmg(profileRow.mmg_number ?? "");
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

  async function handleSaveMmg(e: React.FormEvent) {
    e.preventDefault();
    const { data } = await supabase.auth.getUser();
    if (!data.user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ mmg_number: mmg.trim() || null })
      .eq("id", data.user.id);
    setSaving(false);
    if (error) toast("Couldn't save — try again");
    else toast("Saved");
  }

  async function handleSetPassword(e: React.FormEvent) {
    e.preventDefault();
    setSavingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setSavingPassword(false);
    if (error) {
      toast("Couldn't set password — " + error.message);
    } else {
      setNewPassword("");
      toast("Password set — you can sign in with it from now on");
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/");
  }

  if (loading) return null;

  return (
    <>
      <Header />
      <main>
        <section className="wrap">
          <div className="post-wrap">
            <BackButton fallback="/" disableSmartBack />
            <h1>{t("account.title")}</h1>
            {profile?.verified && <p className="lede">{t("account.verifiedSeller")}</p>}

            {profile && (
              <div className="profile-id" style={{ marginBottom: 20 }}>
                <EditProfileModal profile={profile} onSaved={setProfile} />
                <div className="profile-badge-row">
                  <span className="profile-badge">
                    <Icon name="CalendarDays" />
                    Since {new Date(profile.created_at).getFullYear()}
                  </span>
                </div>
                <div className="profile-name-row">
                  <h2>{profile.display_name}</h2>
                  {profile.verified && <BlueTick size={16} />}
                </div>
                <p className="profile-rating-row">
                  <Icon name="Star" />
                  {(profile.rating ?? 5).toFixed(1)} ({profile.rating_count ?? 0} ratings)
                </p>
                {profile.location && (
                  <p className="profile-location-row">
                    <Icon name="MapPin" />
                    {profile.location}
                  </p>
                )}
                {profile.bio && <p className="profile-bio">{profile.bio}</p>}
                {profile.available && (
                  <div className="profile-badge-row">
                    <span className="profile-badge good">
                      <Icon name="CircleDot" />
                      Available now
                    </span>
                  </div>
                )}
                <VerifyIdentity profile={profile} />
                <ProfileTabs profile={profile} isOwner />
              </div>
            )}

            <form onSubmit={handleSaveMmg}>
              <div className="field">
                <label htmlFor="mmgInput">{t("account.mmgLabel")}</label>
                <input className="control" id="mmgInput" value={mmg} onChange={(e) => setMmg(e.target.value)} placeholder="e.g. 642-1187" />
                <p className="hint">{t("account.mmgHint")}</p>
              </div>
              <button type="submit" className="btn btn-accent btn-block" disabled={saving}>
                {saving ? t("common.saving") : t("account.saveChanges")}
              </button>
            </form>
            <form onSubmit={handleSetPassword} style={{ marginTop: 20 }}>
              <div className="field">
                <label htmlFor="newPasswordInput">{t("account.setPasswordLabel")}</label>
                <PasswordInput
                  id="newPasswordInput"
                  minLength={6}
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder={t("auth.passwordPlaceholder")}
                />
                <p className="hint">{t("account.setPasswordHint")}</p>
              </div>
              <button type="submit" className="btn btn-line btn-block" disabled={savingPassword || newPassword.length < 6}>
                {savingPassword ? t("common.saving") : t("account.savePassword")}
              </button>
            </form>
            <button type="button" className="btn btn-line btn-block" style={{ marginTop: 12 }} onClick={handleSignOut}>
              {t("common.signOut")}
            </button>

            {(myListings.length > 0 || myTaxi.length > 0) && (
              <>
                <h1 style={{ marginTop: 32 }}>{t("account.myListings")}</h1>
                <div className="admin-list">
                  {myListings.map((l) => (
                    <div className="admin-row" key={l.id}>
                      <div className="admin-row-info">
                        <div className="admin-row-title">
                          <Link href={`/listing/${l.id}`}>{l.title}</Link>
                          {l.fee_status === "pending" && (
                            <span className="admin-flag off">{t("account.feePending")}</span>
                          )}
                        </div>
                        <div className="admin-row-sub">
                          {formatPrice(l.price, l.is_free)} &middot; {l.location}
                        </div>
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
                  {myTaxi.map((svc) => (
                    <div className="admin-row" key={svc.id}>
                      <div className="admin-row-info">
                        <div className="admin-row-title">
                          <Link href={`/taxi/${svc.id}`}>{svc.driver_name}</Link>
                          {svc.fee_status === "pending" && (
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
                  ))}
                </div>
              </>
            )}
          </div>
        </section>
      </main>
    </>
  );
}
