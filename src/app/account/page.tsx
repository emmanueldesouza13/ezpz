"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BackButton from "@/components/BackButton";
import Icon from "@/components/Icon";
import RemoveListingButton from "@/components/RemoveListingButton";
import EditProfileModal from "@/components/EditProfileModal";
import { createClient } from "@/lib/supabase/client";
import { getMyListings, getMyTaxiServices } from "@/lib/data";
import { formatPrice } from "@/lib/format";
import type { Listing, Profile, TaxiService } from "@/lib/types";
import { toast } from "@/lib/toast";

export default function AccountPage() {
  const supabase = createClient();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
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
      setEmail(data.user.email ?? "");
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
            <BackButton />
            <h1>Your account</h1>
            <p className="lede">{email}{profile?.verified ? " · Verified seller" : ""}</p>

            {profile && (
              <div className="profile-id" style={{ marginBottom: 20 }}>
                <EditProfileModal profile={profile} onSaved={setProfile} />
                <div className="profile-name-row">
                  <h2>{profile.display_name}</h2>
                  {profile.verified && <Icon name="BadgeCheck" />}
                </div>
                {profile.location && (
                  <p className="profile-location-row">
                    <Icon name="MapPin" />
                    {profile.location}
                  </p>
                )}
                {profile.bio && <p className="profile-bio">{profile.bio}</p>}
                <div className="profile-badge-row">
                  {profile.available && (
                    <span className="profile-badge good">
                      <Icon name="CircleDot" />
                      Available now
                    </span>
                  )}
                </div>
                <p className="hint" style={{ marginTop: 8 }}>
                  This is what buyers see on your listings — name, avatar, location, bio, and availability.
                </p>
              </div>
            )}

            <form onSubmit={handleSaveMmg}>
              <div className="field">
                <label htmlFor="mmgInput">MMG number</label>
                <input className="control" id="mmgInput" value={mmg} onChange={(e) => setMmg(e.target.value)} placeholder="e.g. 642-1187" />
                <p className="hint">Used on any listing you post, so buyers can pay you directly.</p>
              </div>
              <button type="submit" className="btn btn-accent btn-block" disabled={saving}>
                {saving ? "Saving…" : "Save changes"}
              </button>
            </form>
            <form onSubmit={handleSetPassword} style={{ marginTop: 20 }}>
              <div className="field">
                <label htmlFor="newPasswordInput">Set a password</label>
                <input
                  className="control"
                  id="newPasswordInput"
                  type="password"
                  minLength={6}
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                />
                <p className="hint">So you can sign in with your email and password instead of an email link.</p>
              </div>
              <button type="submit" className="btn btn-line btn-block" disabled={savingPassword || newPassword.length < 6}>
                {savingPassword ? "Saving…" : "Save password"}
              </button>
            </form>
            <button type="button" className="btn btn-line btn-block" style={{ marginTop: 12 }} onClick={handleSignOut}>
              Sign out
            </button>

            {(myListings.length > 0 || myTaxi.length > 0) && (
              <>
                <h1 style={{ marginTop: 32 }}>My listings</h1>
                <div className="admin-list">
                  {myListings.map((l) => (
                    <div className="admin-row" key={l.id}>
                      <div className="admin-row-info">
                        <div className="admin-row-title">
                          <Link href={`/listing/${l.id}`}>{l.title}</Link>
                          {l.fee_status === "pending" && (
                            <span className="admin-flag off">Fee pending</span>
                          )}
                        </div>
                        <div className="admin-row-sub">
                          {formatPrice(l.price, l.is_free)} &middot; {l.location}
                        </div>
                      </div>
                      <div className="admin-row-actions">
                        <Link href={`/listing/${l.id}/edit`} className="admin-btn">
                          Edit
                        </Link>
                        <RemoveListingButton
                          table="listings"
                          id={l.id}
                          label="Remove"
                          variant="row"
                          onRemoved={() => setMyListings((cur) => cur.filter((x) => x.id !== l.id))}
                        />
                      </div>
                    </div>
                  ))}
                  {myTaxi.map((t) => (
                    <div className="admin-row" key={t.id}>
                      <div className="admin-row-info">
                        <div className="admin-row-title">
                          <Link href={`/taxi/${t.id}`}>{t.driver_name}</Link>
                          {t.fee_status === "pending" && (
                            <span className="admin-flag off">Fee pending</span>
                          )}
                        </div>
                        <div className="admin-row-sub">
                          {t.vehicle_make} {t.vehicle_model} &middot; {t.service_area}
                        </div>
                      </div>
                      <div className="admin-row-actions">
                        <Link href={`/taxi/${t.id}/edit`} className="admin-btn">
                          Edit
                        </Link>
                        <RemoveListingButton
                          table="taxi_services"
                          id={t.id}
                          label="Remove"
                          variant="row"
                          onRemoved={() => setMyTaxi((cur) => cur.filter((x) => x.id !== t.id))}
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
      <Footer />
    </>
  );
}
