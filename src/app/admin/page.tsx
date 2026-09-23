"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Icon from "@/components/Icon";
import BackButton from "@/components/BackButton";
import { createClient } from "@/lib/supabase/client";
import {
  GRADIENTS,
  type Category,
  type Listing,
  type Profile,
  type Report,
  type Settings,
  type TaxiService,
  type VerificationRequest,
} from "@/lib/types";
import { formatPrice, isPhotoUrl } from "@/lib/format";
import { toast } from "@/lib/toast";
import { getSiteSettings } from "@/lib/data";

type Tab = "listings" | "taxi" | "sellers" | "verification" | "reports" | "categories" | "branding" | "payouts";

const MAX_PHOTOS = 6;

const CATEGORY_ICONS = [
  "Briefcase", "Wrench", "Home", "Car", "Dumbbell", "MapPin", "Star", "Shield", "Clock", "MessageCircle",
  "Sparkles", "Trees", "Truck", "Zap", "Droplet", "PaintRoller", "GraduationCap", "Scissors",
  "PartyPopper", "PawPrint", "Laptop", "Hammer", "Camera",
];

export default function AdminPage() {
  const supabase = createClient();
  const [phase, setPhase] = useState<"checking" | "signedout" | "forbidden" | "ready">("checking");
  const [tab, setTab] = useState<Tab>("listings");
  const [listings, setListings] = useState<Listing[]>([]);
  const [taxiServices, setTaxiServices] = useState<TaxiService[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [verifications, setVerifications] = useState<VerificationRequest[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [editListing, setEditListing] = useState<Listing | null | "new">(null);
  const [editTaxi, setEditTaxi] = useState<TaxiService | null | "new">(null);
  const [editSeller, setEditSeller] = useState<Profile | null>(null);
  const [editCategory, setEditCategory] = useState<Category | null | "new">(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState("/logo.png");
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [settings, setSettings] = useState<Settings | null>(null);

  const loadAll = useCallback(async () => {
    const [{ data: l }, { data: t }, { data: p }, { data: v }, { data: r }, { data: c }, st] = await Promise.all([
      supabase.from("listings").select("*, seller:profiles(*)").order("created_at", { ascending: false }),
      supabase.from("taxi_services").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase
        .from("verification_requests")
        .select("*, user:profiles!verification_requests_user_id_fkey(*)")
        .order("submitted_at", { ascending: false }),
      supabase
        .from("reports")
        .select("*, listing:listings(*), reporter:profiles(*)")
        .order("created_at", { ascending: false }),
      supabase.from("categories").select("*").order("sort_order", { ascending: true }),
      getSiteSettings(supabase),
    ]);
    setListings((l as Listing[]) || []);
    setTaxiServices((t as TaxiService[]) || []);
    setProfiles((p as Profile[]) || []);
    setVerifications((v as VerificationRequest[]) || []);
    setReports((r as Report[]) || []);
    setCategories((c as Category[]) || []);
    setLogoUrl(st.logo_url);
    setSettings(st);
  }, [supabase]);

  async function setReportStatus(r: Report, status: "open" | "resolved" | "dismissed") {
    const { data, error } = await supabase.from("reports").update({ status }).eq("id", r.id).select();
    if (error) { toast("Couldn't update — " + error.message); return; }
    if (!data || data.length === 0) { toast("Couldn't update — no permission or it's gone"); return; }
    toast(
      status === "resolved" ? "Report marked resolved" : status === "dismissed" ? "Report dismissed" : "Report reopened"
    );
    loadAll();
  }

  async function deleteReportForever(r: Report) {
    const { data, error } = await supabase.from("reports").delete().eq("id", r.id).select();
    if (error) { toast("Couldn't delete — " + error.message); return; }
    if (!data || data.length === 0) { toast("Couldn't delete — no permission or it's already gone"); return; }
    toast("Report deleted");
    loadAll();
  }

  async function viewVerificationDoc(path: string) {
    const { data, error } = await supabase.storage.from("verification").createSignedUrl(path, 300);
    if (error || !data?.signedUrl) {
      toast("Couldn't open that file — " + (error?.message ?? "try again"));
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  }

  async function approveVerification(v: VerificationRequest) {
    const { data: userData } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from("verification_requests")
      .update({
        status: "approved",
        reviewed_at: new Date().toISOString(),
        reviewed_by: userData.user?.id ?? null,
        rejection_reason: null,
      })
      .eq("id", v.id)
      .select();
    if (error) { toast("Couldn't approve — " + error.message); return; }
    if (!data || data.length === 0) { toast("Couldn't approve — no permission or it's gone"); return; }
    toast(`${v.user?.display_name ?? "Seller"} is now verified`);
    loadAll();
  }

  async function rejectVerification(v: VerificationRequest) {
    const reason = window.prompt("Reason for rejecting (shown to the seller):", v.rejection_reason ?? "");
    if (reason === null) return;
    const { data: userData } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from("verification_requests")
      .update({
        status: "rejected",
        reviewed_at: new Date().toISOString(),
        reviewed_by: userData.user?.id ?? null,
        rejection_reason: reason.trim() || "Please resubmit a clearer photo.",
      })
      .eq("id", v.id)
      .select();
    if (error) { toast("Couldn't reject — " + error.message); return; }
    if (!data || data.length === 0) { toast("Couldn't reject — no permission or it's gone"); return; }
    toast("Verification rejected");
    loadAll();
  }

  function nextFeeStatus(s: "pending" | "paid" | "waived"): "pending" | "paid" | "waived" {
    return s === "pending" ? "paid" : s === "paid" ? "waived" : "pending";
  }

  async function setListingFeeStatus(l: Listing, next: "pending" | "paid" | "waived") {
    const { data, error } = await supabase
      .from("listings")
      .update({ fee_status: next, fee_paid_at: next === "paid" ? new Date().toISOString() : null })
      .eq("id", l.id)
      .select();
    if (error) { toast("Couldn't update fee status — " + error.message); return; }
    if (!data || data.length === 0) { toast("Couldn't update — no permission or the listing is gone"); return; }
    toast(
      next === "paid"
        ? "Fee marked paid — listing is now live"
        : next === "waived"
        ? "Fee waived — listing is now live"
        : "Fee marked pending — hidden from browse"
    );
    loadAll();
  }

  async function setTaxiFeeStatus(t: TaxiService, next: "pending" | "paid" | "waived") {
    const { data, error } = await supabase
      .from("taxi_services")
      .update({ fee_status: next, fee_paid_at: next === "paid" ? new Date().toISOString() : null })
      .eq("id", t.id)
      .select();
    if (error) { toast("Couldn't update fee status — " + error.message); return; }
    if (!data || data.length === 0) { toast("Couldn't update — no permission or the service is gone"); return; }
    toast(
      next === "paid"
        ? "Fee marked paid — taxi service is now live"
        : next === "waived"
        ? "Fee waived — taxi service is now live"
        : "Fee marked pending — hidden"
    );
    loadAll();
  }

  async function toggleTaxiStatus(t: TaxiService) {
    const next = t.status === "active" ? "removed" : "active";
    const { data, error } = await supabase.from("taxi_services").update({ status: next }).eq("id", t.id).select();
    if (error) { toast("Couldn't update — " + error.message); return; }
    if (!data || data.length === 0) { toast("Couldn't update — no permission or the service is gone"); return; }
    toast(next === "removed" ? "Taxi service removed" : "Taxi service restored");
    loadAll();
  }

  async function deleteListingForever(l: Listing) {
    const { data, error } = await supabase.from("listings").delete().eq("id", l.id).select();
    if (error) { toast("Couldn't delete — " + error.message); return; }
    if (!data || data.length === 0) { toast("Couldn't delete — no permission or it's already gone"); return; }
    toast("Listing permanently deleted");
    loadAll();
  }

  async function deleteTaxiForever(t: TaxiService) {
    const { data, error } = await supabase.from("taxi_services").delete().eq("id", t.id).select();
    if (error) { toast("Couldn't delete — " + error.message); return; }
    if (!data || data.length === 0) { toast("Couldn't delete — no permission or it's already gone"); return; }
    toast("Taxi service permanently deleted");
    loadAll();
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast("Please choose an image file"); return; }
    if (file.size > 5 * 1024 * 1024) { toast("Image is too large — 5MB max"); return; }
    setUploadingLogo(true);
    const ext = file.name.split(".").pop()?.toLowerCase() || "png";
    const path = `logo-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("assets")
      .upload(path, file, { upsert: true, cacheControl: "3600" });
    if (upErr) {
      setUploadingLogo(false);
      toast("Upload failed — " + upErr.message);
      return;
    }
    const { data: pub } = supabase.storage.from("assets").getPublicUrl(path);
    const { data: dbData, error: dbErr } = await supabase
      .from("settings")
      .update({ logo_url: pub.publicUrl, updated_at: new Date().toISOString() })
      .eq("id", 1)
      .select();
    setUploadingLogo(false);
    if (dbErr) {
      toast("Uploaded, but couldn't save it as the site logo — " + dbErr.message);
      return;
    }
    if (!dbData || dbData.length === 0) {
      toast("Uploaded, but couldn't save it as the site logo — no permission to update settings");
      return;
    }
    setLogoUrl(pub.publicUrl);
    toast("Logo updated — it's live across the site now");
  }

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) { setPhase("signedout"); return; }
      const { data: profile } = await supabase
        .from("profiles").select("is_admin").eq("id", data.user.id).maybeSingle();
      if (!profile?.is_admin) { setPhase("forbidden"); return; }
      await loadAll();
      setPhase("ready");
    })();
  }, [supabase, loadAll]);

  async function toggleListingStatus(l: Listing) {
    const next = l.status === "active" ? "removed" : "active";
    const { data, error } = await supabase.from("listings").update({ status: next }).eq("id", l.id).select();
    if (error) { toast("Couldn't update — " + error.message); return; }
    if (!data || data.length === 0) { toast("Couldn't update — no permission or the listing is gone"); return; }
    toast(next === "removed" ? "Listing removed" : "Listing restored");
    loadAll();
  }

  async function toggleFeatured(l: Listing) {
    const { data, error } = await supabase.from("listings").update({ featured: !l.featured }).eq("id", l.id).select();
    if (error) { toast("Couldn't update — " + error.message); return; }
    if (!data || data.length === 0) { toast("Couldn't update — no permission or the listing is gone"); return; }
    loadAll();
  }

  async function deleteCategory(c: Category) {
    const usedBy = listings.filter((l) => l.category === c.slug && l.status === "active").length;
    if (usedBy > 0) { toast(`Can't delete — ${usedBy} listing${usedBy === 1 ? "" : "s"} use this category`); return; }
    if (categories.length <= 1) { toast("You need at least one category"); return; }
    const { data, error } = await supabase.from("categories").delete().eq("slug", c.slug).select();
    if (error) { toast("Couldn't delete — " + error.message); return; }
    if (!data || data.length === 0) { toast("Couldn't delete — no permission or it's already gone"); return; }
    toast("Category deleted");
    loadAll();
  }

  if (phase === "checking") return null;

  if (phase === "signedout" || phase === "forbidden") {
    return (
      <>
        <Header />
        <main>
          <section className="wrap">
            <div className="admin-login-wrap">
              <BackButton />
              <div className="icon-circle"><Icon name="Lock" /></div>
              <h1>Admin</h1>
              <p>
                {phase === "signedout"
                  ? "Sign in with your EzPz account to continue."
                  : "This account doesn't have admin access."}
              </p>
              {phase === "signedout" && (
                <a className="btn btn-accent btn-block" href="/sign-in?next=/admin">Sign in</a>
              )}
            </div>
          </section>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main>
        <section className="wrap">
          <div className="admin-wrap">
            <BackButton />
            <div className="admin-topbar">
              <h1>Admin</h1>
            </div>
            <p className="admin-note">
              Changes here write straight to the live database and show up across the site right
              away.
            </p>
            <div className="admin-tabs">
              {(["listings", "taxi", "sellers", "verification", "reports", "categories", "branding", "payouts"] as Tab[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  className={`admin-tab${tab === t ? " active" : ""}`}
                  onClick={() => setTab(t)}
                >
                  {t === "listings"
                    ? "Listings"
                    : t === "taxi"
                    ? "Taxi"
                    : t === "sellers"
                    ? "Sellers"
                    : t === "verification"
                    ? `Verification${verifications.filter((v) => v.status === "pending").length > 0 ? ` (${verifications.filter((v) => v.status === "pending").length})` : ""}`
                    : t === "reports"
                    ? `Reports${reports.filter((r) => r.status === "open").length > 0 ? ` (${reports.filter((r) => r.status === "open").length})` : ""}`
                    : t === "categories"
                    ? "Categories"
                    : t === "branding"
                    ? "Branding"
                    : "Payouts"}
                </button>
              ))}
            </div>

            {tab === "payouts" && <PayoutsPanel settings={settings} onSaved={loadAll} />}

            {tab === "branding" && (
              <div className="admin-row" style={{ alignItems: "flex-start", flexWrap: "wrap" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={logoUrl}
                  alt="Current site logo"
                  style={{
                    height: 64,
                    width: "auto",
                    maxWidth: 160,
                    objectFit: "contain",
                    background: "var(--surface-2)",
                    borderRadius: 10,
                    padding: 8,
                    flexShrink: 0,
                  }}
                />
                <div className="admin-row-info">
                  <div className="admin-row-title">Site logo</div>
                  <div className="admin-row-sub">
                    Shown in the header and footer across the whole site. PNG, JPG, or SVG — 5MB max.
                  </div>
                  <label
                    className="btn btn-line"
                    style={{ marginTop: 10, display: "inline-flex", cursor: "pointer" }}
                  >
                    <Icon name="Upload" size={14} />
                    {uploadingLogo ? "Uploading…" : "Upload new logo"}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      disabled={uploadingLogo}
                      style={{ display: "none" }}
                    />
                  </label>
                </div>
              </div>
            )}

            {tab === "categories" && (
              <div className="admin-toolbar">
                <span />
                <button type="button" className="btn btn-accent" onClick={() => setEditCategory("new")}>
                  <Icon name="Plus" />
                  Add category
                </button>
              </div>
            )}

            {tab === "taxi" && (
              <div className="admin-toolbar">
                <span />
                <button type="button" className="btn btn-accent" onClick={() => setEditTaxi("new")}>
                  <Icon name="Plus" />
                  Add taxi service
                </button>
              </div>
            )}

            <div className="admin-list">
              {tab === "listings" &&
                (listings.length === 0 ? (
                  <div className="admin-empty">No listings yet.</div>
                ) : (
                  listings.map((l) => (
                    <div className="admin-row" key={l.id}>
                      <div className="admin-swatch" style={{ background: l.images[0] }} />
                      <div className="admin-row-info">
                        <div className="admin-row-title">
                          {l.title}
                          {l.featured && <span className="admin-flag on">Featured</span>}
                          {l.fee_status !== "pending" ? (
                            <span className="admin-flag on">Fee {l.fee_status}</span>
                          ) : (
                            <span className="admin-flag off">Fee pending</span>
                          )}
                          {l.status !== "active" && <span className="admin-flag off">{l.status}</span>}
                        </div>
                        <div className="admin-row-sub">
                          {formatPrice(l.price, l.is_free)} &middot; {l.location} &middot;{" "}
                          {l.seller?.display_name ?? "Unknown"}
                        </div>
                      </div>
                      <div className="admin-row-actions">
                        <button type="button" className="admin-btn" onClick={() => setListingFeeStatus(l, nextFeeStatus(l.fee_status))}>
                          <Icon name="Wallet" />
                          {l.fee_status === "pending" ? "Mark fee paid" : l.fee_status === "paid" ? "Mark fee waived" : "Mark fee pending"}
                        </button>
                        <button type="button" className="admin-btn" onClick={() => toggleFeatured(l)}>
                          <Icon name="Star" />
                          {l.featured ? "Unfeature" : "Feature"}
                        </button>
                        <button type="button" className="admin-btn" onClick={() => setEditListing(l)}>
                          <Icon name="Pencil" />
                          Edit
                        </button>
                        <button
                          type="button"
                          className="admin-btn danger"
                          onClick={() => toggleListingStatus(l)}
                        >
                          <Icon name="Trash2" />
                          {l.status === "active" ? "Remove" : "Restore"}
                        </button>
                        <button
                          type="button"
                          className={`admin-btn danger${confirmingId === `listing:${l.id}` ? " confirming" : ""}`}
                          onClick={() => {
                            const key = `listing:${l.id}`;
                            if (confirmingId !== key) {
                              setConfirmingId(key);
                              setTimeout(() => setConfirmingId((cur) => (cur === key ? null : cur)), 3000);
                              return;
                            }
                            setConfirmingId(null);
                            deleteListingForever(l);
                          }}
                        >
                          <Icon name="X" />
                          {confirmingId === `listing:${l.id}` ? "Confirm delete?" : "Delete forever"}
                        </button>
                      </div>
                    </div>
                  ))
                ))}

              {tab === "taxi" &&
                (taxiServices.length === 0 ? (
                  <div className="admin-empty">No taxi services yet.</div>
                ) : (
                  taxiServices.map((t) => (
                    <div className="admin-row" key={t.id}>
                      <div
                        className="admin-swatch"
                        style={{
                          background: "var(--surface-2)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "var(--accent)",
                        }}
                      >
                        <Icon name="Car" />
                      </div>
                      <div className="admin-row-info">
                        <div className="admin-row-title">
                          {t.driver_name}
                          {t.fee_status !== "pending" ? (
                            <span className="admin-flag on">Fee {t.fee_status}</span>
                          ) : (
                            <span className="admin-flag off">Fee pending</span>
                          )}
                          {t.status !== "active" && <span className="admin-flag off">{t.status}</span>}
                        </div>
                        <div className="admin-row-sub">
                          {t.vehicle_make} {t.vehicle_model} &middot; Plate {t.plate} &middot;{" "}
                          {t.service_area} &middot; MMG {t.mmg_number}
                        </div>
                      </div>
                      <div className="admin-row-actions">
                        <button type="button" className="admin-btn" onClick={() => setTaxiFeeStatus(t, nextFeeStatus(t.fee_status))}>
                          <Icon name="Wallet" />
                          {t.fee_status === "pending" ? "Mark fee paid" : t.fee_status === "paid" ? "Mark fee waived" : "Mark fee pending"}
                        </button>
                        <button type="button" className="admin-btn" onClick={() => setEditTaxi(t)}>
                          <Icon name="Pencil" />
                          Edit
                        </button>
                        <button
                          type="button"
                          className="admin-btn danger"
                          onClick={() => toggleTaxiStatus(t)}
                        >
                          <Icon name="Trash2" />
                          {t.status === "active" ? "Remove" : "Restore"}
                        </button>
                        <button
                          type="button"
                          className={`admin-btn danger${confirmingId === `taxi:${t.id}` ? " confirming" : ""}`}
                          onClick={() => {
                            const key = `taxi:${t.id}`;
                            if (confirmingId !== key) {
                              setConfirmingId(key);
                              setTimeout(() => setConfirmingId((cur) => (cur === key ? null : cur)), 3000);
                              return;
                            }
                            setConfirmingId(null);
                            deleteTaxiForever(t);
                          }}
                        >
                          <Icon name="X" />
                          {confirmingId === `taxi:${t.id}` ? "Confirm delete?" : "Delete forever"}
                        </button>
                      </div>
                    </div>
                  ))
                ))}

              {tab === "sellers" &&
                (profiles.length === 0 ? (
                  <div className="admin-empty">No sellers yet.</div>
                ) : (
                  profiles.map((p) => (
                    <div className="admin-row" key={p.id}>
                      <div className="admin-swatch" style={{ background: p.avatar_color }} />
                      <div className="admin-row-info">
                        <div className="admin-row-title">
                          {p.display_name}
                          {p.verified ? (
                            <span className="admin-flag on">Verified</span>
                          ) : (
                            <span className="admin-flag off">Unverified</span>
                          )}
                          {p.is_admin && <span className="admin-flag on">Admin</span>}
                        </div>
                        <div className="admin-row-sub">
                          {p.rating.toFixed(1)} ({p.rating_count}) &middot;{" "}
                          {p.mmg_number ? `MMG ${p.mmg_number}` : "No MMG number"}
                        </div>
                      </div>
                      <div className="admin-row-actions">
                        <button type="button" className="admin-btn" onClick={() => setEditSeller(p)}>
                          <Icon name="Pencil" />
                          Edit
                        </button>
                      </div>
                    </div>
                  ))
                ))}

              {tab === "verification" &&
                (verifications.length === 0 ? (
                  <div className="admin-empty">No verification requests yet.</div>
                ) : (
                  verifications.map((v) => (
                    <div className="admin-row" key={v.id}>
                      <div
                        className="admin-swatch"
                        style={{
                          background: v.user?.avatar_color || "var(--surface-2)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#fff",
                        }}
                      >
                        <Icon name="ShieldQuestion" />
                      </div>
                      <div className="admin-row-info">
                        <div className="admin-row-title">
                          {v.user?.display_name ?? "Unknown seller"}
                          {v.status === "pending" && <span className="admin-flag off">Pending</span>}
                          {v.status === "approved" && <span className="admin-flag on">Approved</span>}
                          {v.status === "rejected" && <span className="admin-flag off">Rejected</span>}
                        </div>
                        <div className="admin-row-sub">
                          Submitted {new Date(v.submitted_at).toLocaleDateString()}
                          {v.status === "rejected" && v.rejection_reason ? ` · ${v.rejection_reason}` : ""}
                        </div>
                      </div>
                      <div className="admin-row-actions">
                        {v.selfie_path && (
                          <button type="button" className="admin-btn" onClick={() => viewVerificationDoc(v.selfie_path!)}>
                            <Icon name="Camera" />
                            Selfie
                          </button>
                        )}
                        {v.id_card_path && (
                          <button type="button" className="admin-btn" onClick={() => viewVerificationDoc(v.id_card_path!)}>
                            <Icon name="IdCard" />
                            ID card
                          </button>
                        )}
                        {v.status !== "approved" && (
                          <button type="button" className="admin-btn" onClick={() => approveVerification(v)}>
                            <Icon name="ShieldCheck" />
                            Approve
                          </button>
                        )}
                        {v.status !== "rejected" && (
                          <button type="button" className="admin-btn danger" onClick={() => rejectVerification(v)}>
                            <Icon name="ShieldX" />
                            Reject
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                ))}

              {tab === "reports" &&
                (reports.length === 0 ? (
                  <div className="admin-empty">No reports yet.</div>
                ) : (
                  reports.map((r) => (
                    <div className="admin-row" key={r.id}>
                      <div
                        className="admin-swatch"
                        style={{
                          background: "var(--surface-2)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "var(--bad)",
                        }}
                      >
                        <Icon name="Flag" />
                      </div>
                      <div className="admin-row-info">
                        <div className="admin-row-title">
                          {r.listing?.title ?? "Listing removed"}
                          {r.status === "open" && <span className="admin-flag off">Open</span>}
                          {r.status === "resolved" && <span className="admin-flag on">Resolved</span>}
                          {r.status === "dismissed" && <span className="admin-flag off">Dismissed</span>}
                        </div>
                        <div className="admin-row-sub">
                          {r.reason} &middot; {r.reporter?.display_name ?? "Anonymous"} &middot;{" "}
                          {new Date(r.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="admin-row-actions">
                        {r.listing_id && (
                          <Link href={`/listing/${r.listing_id}`} target="_blank" className="admin-btn">
                            <Icon name="ExternalLink" />
                            View
                          </Link>
                        )}
                        {r.status !== "resolved" && (
                          <button type="button" className="admin-btn" onClick={() => setReportStatus(r, "resolved")}>
                            <Icon name="Check" />
                            Resolve
                          </button>
                        )}
                        {r.status !== "dismissed" && (
                          <button type="button" className="admin-btn" onClick={() => setReportStatus(r, "dismissed")}>
                            <Icon name="EyeOff" />
                            Dismiss
                          </button>
                        )}
                        <button
                          type="button"
                          className={`admin-btn danger${confirmingId === `report:${r.id}` ? " confirming" : ""}`}
                          onClick={() => {
                            const key = `report:${r.id}`;
                            if (confirmingId !== key) {
                              setConfirmingId(key);
                              setTimeout(() => setConfirmingId((cur) => (cur === key ? null : cur)), 3000);
                              return;
                            }
                            setConfirmingId(null);
                            deleteReportForever(r);
                          }}
                        >
                          <Icon name="X" />
                          {confirmingId === `report:${r.id}` ? "Confirm delete?" : "Delete"}
                        </button>
                      </div>
                    </div>
                  ))
                ))}

              {tab === "categories" &&
                (categories.length === 0 ? (
                  <div className="admin-empty">No categories yet.</div>
                ) : (
                  categories.map((c) => (
                    <div className="admin-row" key={c.slug}>
                      <div
                        className="admin-swatch"
                        style={{
                          background: "var(--surface-2)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "var(--accent)",
                        }}
                      >
                        <Icon name={c.icon} />
                      </div>
                      <div className="admin-row-info">
                        <div className="admin-row-title">{c.name}</div>
                        <div className="admin-row-sub">/{c.slug}</div>
                      </div>
                      <div className="admin-row-actions">
                        <button type="button" className="admin-btn" onClick={() => setEditCategory(c)}>
                          <Icon name="Pencil" />
                          Edit
                        </button>
                        <button
                          type="button"
                          className={`admin-btn danger${confirmingId === `cat:${c.slug}` ? " confirming" : ""}`}
                          onClick={() => {
                            const key = `cat:${c.slug}`;
                            if (confirmingId !== key) {
                              setConfirmingId(key);
                              setTimeout(() => setConfirmingId((cur) => (cur === key ? null : cur)), 3000);
                              return;
                            }
                            setConfirmingId(null);
                            deleteCategory(c);
                          }}
                        >
                          <Icon name="Trash2" />
                          {confirmingId === `cat:${c.slug}` ? "Confirm?" : "Delete"}
                        </button>
                      </div>
                    </div>
                  ))
                ))}
            </div>
          </div>
        </section>
      </main>

      {editListing && (
        <ListingModal
          listing={editListing === "new" ? null : editListing}
          categories={categories}
          onClose={() => setEditListing(null)}
          onSaved={() => { setEditListing(null); loadAll(); }}
        />
      )}
      {editTaxi && (
        <TaxiModal
          service={editTaxi === "new" ? null : editTaxi}
          onClose={() => setEditTaxi(null)}
          onSaved={() => { setEditTaxi(null); loadAll(); }}
        />
      )}
      {editSeller && (
        <SellerModal
          profile={editSeller}
          onClose={() => setEditSeller(null)}
          onSaved={() => { setEditSeller(null); loadAll(); }}
        />
      )}
      {editCategory && (
        <CategoryModal
          category={editCategory === "new" ? null : editCategory}
          onClose={() => setEditCategory(null)}
          onSaved={() => { setEditCategory(null); loadAll(); }}
        />
      )}
    </>
  );
}

function PayoutsPanel({ settings, onSaved }: { settings: Settings | null; onSaved: () => void }) {
  const supabase = createClient();
  const [mmg, setMmg] = useState(settings?.platform_mmg_number ?? "");
  const [fee, setFee] = useState(String(settings?.listing_fee ?? 2000));
  const [taxiMmg, setTaxiMmg] = useState(settings?.taxi_mmg_number ?? "");
  const [taxiFee, setTaxiFee] = useState(String(settings?.taxi_fee ?? 5000));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setMmg(settings?.platform_mmg_number ?? "");
    setFee(String(settings?.listing_fee ?? 2000));
    setTaxiMmg(settings?.taxi_mmg_number ?? "");
    setTaxiFee(String(settings?.taxi_fee ?? 5000));
  }, [settings]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const { data, error } = await supabase
      .from("settings")
      .update({
        platform_mmg_number: mmg.trim() || null,
        listing_fee: Number(fee) || 0,
        taxi_mmg_number: taxiMmg.trim() || null,
        taxi_fee: Number(taxiFee) || 0,
        updated_at: new Date().toISOString(),
      })
      .eq("id", 1)
      .select();
    setSaving(false);
    if (error) { toast("Couldn't save — " + error.message); return; }
    if (!data || data.length === 0) { toast("Couldn't save — no permission to update settings"); return; }
    toast("Payout settings saved");
    onSaved();
  }

  return (
    <div className="admin-row" style={{ alignItems: "flex-start", flexWrap: "wrap" }}>
      <div className="admin-row-info" style={{ flex: "1 1 320px" }}>
        <div className="admin-row-title">Activation fees</div>
        <div className="admin-row-sub">
          Every new listing or taxi sign-up is hidden until its fee is paid to the matching MMG
          number below and you mark it paid in the Listings/Taxi tabs. Nothing here charges anyone
          automatically — sellers and drivers pay you directly, same as buyers pay sellers.
        </div>
        <form onSubmit={handleSubmit} style={{ marginTop: 14, maxWidth: 360 }}>
          <div className="field">
            <label htmlFor="platformMmgInput">Listings — your MMG number</label>
            <input
              className="control"
              id="platformMmgInput"
              placeholder="e.g. 642-1187"
              value={mmg}
              onChange={(e) => setMmg(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="feeInput">Fee per listing (GY$)</label>
            <input
              className="control"
              id="feeInput"
              type="number"
              min="0"
              value={fee}
              onChange={(e) => setFee(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="taxiMmgInput">Taxi sign-ups — your MMG number</label>
            <input
              className="control"
              id="taxiMmgInput"
              placeholder="e.g. 642-1187"
              value={taxiMmg}
              onChange={(e) => setTaxiMmg(e.target.value)}
            />
            <p className="hint">Can be the same number as above, or a different wallet.</p>
          </div>
          <div className="field">
            <label htmlFor="taxiFeeInput">Fee per taxi sign-up (GY$)</label>
            <input
              className="control"
              id="taxiFeeInput"
              type="number"
              min="0"
              value={taxiFee}
              onChange={(e) => setTaxiFee(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-accent" disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </button>
        </form>
      </div>
    </div>
  );
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      className="modal-backdrop"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="modal-card">
        <button type="button" className="modal-close" onClick={onClose}><Icon name="X" /></button>
        <h2>{title}</h2>
        {children}
      </div>
    </div>
  );
}

function ListingModal({
  listing, categories, onClose, onSaved,
}: { listing: Listing | null; categories: Category[]; onClose: () => void; onSaved: () => void }) {
  const supabase = createClient();
  const [title, setTitle] = useState(listing?.title ?? "");
  const [category, setCategory] = useState(listing?.category ?? categories[0]?.slug ?? "");
  const [price, setPrice] = useState(listing ? String(listing.price) : "");
  const [isFree, setIsFree] = useState(listing?.is_free ?? false);
  const [location, setLocation] = useState(listing?.location ?? "");
  const [featured, setFeatured] = useState(listing?.featured ?? false);
  const [description, setDescription] = useState(listing?.description ?? "");
  const [swatch, setSwatch] = useState(() => {
    const idx = listing ? GRADIENTS.indexOf(listing.images[0]) : 0;
    return idx >= 0 ? idx : 0;
  });
  const [photos, setPhotos] = useState<string[]>(() => (listing ? listing.images.filter(isPhotoUrl) : []));
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handlePhotoFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (files.length === 0) return;
    const room = MAX_PHOTOS - photos.length;
    if (room <= 0) { toast(`You can add up to ${MAX_PHOTOS} photos`); return; }
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) { toast("Sign in again to upload photos"); return; }
    setUploadingPhoto(true);
    const uploaded: string[] = [];
    for (const file of files.slice(0, room)) {
      if (!file.type.startsWith("image/")) { toast(`${file.name} isn't an image — skipped`); continue; }
      if (file.size > 8 * 1024 * 1024) { toast(`${file.name} is too large — 8MB max`); continue; }
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("listings")
        .upload(path, file, { upsert: false, cacheControl: "3600" });
      if (upErr) { toast(`Couldn't upload ${file.name} — ${upErr.message}`); continue; }
      const { data: pub } = supabase.storage.from("listings").getPublicUrl(path);
      uploaded.push(pub.publicUrl);
    }
    setUploadingPhoto(false);
    if (uploaded.length > 0) setPhotos((p) => [...p, ...uploaded]);
  }

  function removePhoto(i: number) {
    setPhotos((p) => p.filter((_, idx) => idx !== i));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !location.trim() || !description.trim()) {
      toast("Fill in all required fields");
      return;
    }
    setSaving(true);
    const vals = {
      title: title.trim(), category, price: isFree ? 0 : Number(price) || 0,
      is_free: isFree, location: location.trim(), featured, description: description.trim(),
      images: photos.length > 0 ? photos : [GRADIENTS[swatch]],
    };
    const { data, error } = listing
      ? await supabase.from("listings").update(vals).eq("id", listing.id).select()
      : await supabase.from("listings").insert({ ...vals, seller_id: (await supabase.auth.getUser()).data.user?.id }).select();
    setSaving(false);
    if (error) { toast("Couldn't save — " + error.message); return; }
    if (!data || data.length === 0) { toast("Couldn't save — no permission or the listing is gone"); return; }
    toast(listing ? "Listing updated" : "Listing added");
    onSaved();
  }

  return (
    <Modal title={listing ? "Edit listing" : "Add listing"} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label>Title</label>
          <input className="control" required value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="field">
          <label>Category</label>
          <select className="control" value={category} onChange={(e) => setCategory(e.target.value)}>
            {categories.map((c) => <option value={c.slug} key={c.slug}>{c.name}</option>)}
          </select>
        </div>
        <div className="price-row" style={{ marginBottom: 20 }}>
          <div className="field">
            <label>Price</label>
            <div className="price-input">
              <span>GY$</span>
              <input className="control" type="number" min="0" disabled={isFree} value={price} onChange={(e) => setPrice(e.target.value)} />
            </div>
          </div>
          <label className="check-row">
            <input type="checkbox" checked={isFree} onChange={(e) => setIsFree(e.target.checked)} />
            List as free
          </label>
        </div>
        <div className="field">
          <label>Location</label>
          <input className="control" required value={location} onChange={(e) => setLocation(e.target.value)} />
        </div>
        <div className="field">
          <label>Photos</label>
          <div className="swatch-picker">
            {photos.map((url, i) => (
              <div className="photo-tile" key={url}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={`Photo ${i + 1}`} />
                <button
                  type="button"
                  className="photo-tile-remove"
                  aria-label="Remove photo"
                  onClick={() => removePhoto(i)}
                >
                  <Icon name="X" />
                </button>
              </div>
            ))}
            {photos.length < MAX_PHOTOS && (
              <label className="photo-add" style={{ cursor: uploadingPhoto ? "wait" : "pointer" }}>
                <Icon name={uploadingPhoto ? "Loader2" : "Camera"} className={uploadingPhoto ? "spin" : undefined} />
                {uploadingPhoto ? "Uploading…" : "Add photo"}
                <input type="file" accept="image/*" multiple onChange={handlePhotoFiles} disabled={uploadingPhoto} />
              </label>
            )}
          </div>
          {photos.length === 0 ? (
            <>
              <p className="hint">Upload real photos, or pick a placeholder color below.</p>
              <div className="swatch-picker" style={{ marginTop: 10 }}>
                {GRADIENTS.map((g, i) => (
                  <button type="button" key={i} className={`swatch-btn${swatch === i ? " selected" : ""}`}
                    style={{ background: g }} onClick={() => setSwatch(i)} />
                ))}
              </div>
            </>
          ) : (
            <p className="hint">The first photo is used as the main listing photo.</p>
          )}
        </div>
        <label className="check-inline" style={{ marginBottom: 16 }}>
          <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} />
          Featured listing
        </label>
        <div className="field">
          <label>Description</label>
          <textarea className="control" required value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div className="modal-actions">
          <button type="submit" className="btn btn-accent" disabled={saving}>
            {saving ? "Saving…" : listing ? "Save changes" : "Add listing"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function SellerModal({
  profile, onClose, onSaved,
}: { profile: Profile; onClose: () => void; onSaved: () => void }) {
  const supabase = createClient();
  const [name, setName] = useState(profile.display_name);
  const [avatarColor, setAvatarColor] = useState(profile.avatar_color);
  const [verified, setVerified] = useState(profile.verified);
  const [isAdmin, setIsAdmin] = useState(profile.is_admin);
  const [mmg, setMmg] = useState(profile.mmg_number ?? "");
  const [rating, setRating] = useState(String(profile.rating));
  const [ratingCount, setRatingCount] = useState(String(profile.rating_count));
  const [responseRate, setResponseRate] = useState(String(profile.response_rate));
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const { data, error } = await supabase.from("profiles").update({
      display_name: name.trim(), avatar_color: avatarColor.trim() || profile.avatar_color,
      verified, is_admin: isAdmin, mmg_number: mmg.trim() || null,
      rating: Number(rating) || 0, rating_count: Number(ratingCount) || 0,
      response_rate: Number(responseRate) || 0,
    }).eq("id", profile.id).select();
    setSaving(false);
    if (error) { toast("Couldn't save — " + error.message); return; }
    if (!data || data.length === 0) { toast("Couldn't save — no permission or the seller is gone"); return; }
    toast("Seller updated");
    onSaved();
  }

  return (
    <Modal title="Edit seller" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label>Name</label>
          <input className="control" required value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="field">
          <label>Avatar color</label>
          <input className="control" value={avatarColor} onChange={(e) => setAvatarColor(e.target.value)} placeholder="#a72c53" />
        </div>
        <label className="check-inline"><input type="checkbox" checked={verified} onChange={(e) => setVerified(e.target.checked)} /> Verified seller</label>
        <label className="check-inline" style={{ marginBottom: 16 }}><input type="checkbox" checked={isAdmin} onChange={(e) => setIsAdmin(e.target.checked)} /> Admin access</label>
        <div className="field">
          <label>MMG number</label>
          <input className="control" value={mmg} onChange={(e) => setMmg(e.target.value)} placeholder="e.g. 642-1187" />
        </div>
        <div className="price-row" style={{ marginBottom: 20 }}>
          <div className="field"><label>Rating</label><input className="control" type="number" min="0" max="5" step="0.1" value={rating} onChange={(e) => setRating(e.target.value)} /></div>
          <div className="field"><label>Rating count</label><input className="control" type="number" min="0" value={ratingCount} onChange={(e) => setRatingCount(e.target.value)} /></div>
        </div>
        <div className="field">
          <label>Response rate %</label>
          <input className="control" type="number" min="0" max="100" value={responseRate} onChange={(e) => setResponseRate(e.target.value)} />
        </div>
        <div className="modal-actions">
          <button type="submit" className="btn btn-accent" disabled={saving}>{saving ? "Saving…" : "Save changes"}</button>
        </div>
      </form>
    </Modal>
  );
}

function TaxiModal({
  service, onClose, onSaved,
}: { service: TaxiService | null; onClose: () => void; onSaved: () => void }) {
  const supabase = createClient();
  const [driverName, setDriverName] = useState(service?.driver_name ?? "");
  const [vehicleMake, setVehicleMake] = useState(service?.vehicle_make ?? "");
  const [vehicleModel, setVehicleModel] = useState(service?.vehicle_model ?? "");
  const [plate, setPlate] = useState(service?.plate ?? "");
  const [serviceArea, setServiceArea] = useState(service?.service_area ?? "");
  const [phone, setPhone] = useState(service?.phone ?? "");
  const [mmg, setMmg] = useState(service?.mmg_number ?? "");
  const [notes, setNotes] = useState(service?.notes ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (
      !driverName.trim() ||
      !vehicleMake.trim() ||
      !vehicleModel.trim() ||
      !plate.trim() ||
      !serviceArea.trim() ||
      !phone.trim() ||
      !mmg.trim()
    ) {
      toast("Fill in all required fields");
      return;
    }
    setSaving(true);
    const vals = {
      driver_name: driverName.trim(),
      vehicle_make: vehicleMake.trim(),
      vehicle_model: vehicleModel.trim(),
      plate: plate.trim(),
      service_area: serviceArea.trim(),
      phone: phone.trim(),
      mmg_number: mmg.trim(),
      notes: notes.trim(),
    };
    const { data, error } = service
      ? await supabase.from("taxi_services").update(vals).eq("id", service.id).select()
      : await supabase.from("taxi_services").insert({ ...vals, owner_id: (await supabase.auth.getUser()).data.user?.id }).select();
    setSaving(false);
    if (error) { toast("Couldn't save — " + error.message); return; }
    if (!data || data.length === 0) { toast("Couldn't save — no permission or the service is gone"); return; }
    toast(service ? "Taxi service updated" : "Taxi service added");
    onSaved();
  }

  return (
    <Modal title={service ? "Edit taxi service" : "Add taxi service"} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label>Driver / business name</label>
          <input className="control" required value={driverName} onChange={(e) => setDriverName(e.target.value)} />
        </div>
        <div className="price-row" style={{ marginBottom: 20 }}>
          <div className="field">
            <label>Vehicle make</label>
            <input className="control" required value={vehicleMake} onChange={(e) => setVehicleMake(e.target.value)} />
          </div>
          <div className="field">
            <label>Vehicle model</label>
            <input className="control" required value={vehicleModel} onChange={(e) => setVehicleModel(e.target.value)} />
          </div>
        </div>
        <div className="field">
          <label>License plate</label>
          <input className="control" required value={plate} onChange={(e) => setPlate(e.target.value)} />
        </div>
        <div className="field">
          <label>Service area</label>
          <input className="control" required value={serviceArea} onChange={(e) => setServiceArea(e.target.value)} />
        </div>
        <div className="field">
          <label>Phone number</label>
          <input className="control" required value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <div className="field">
          <label>MMG number</label>
          <input className="control" required value={mmg} onChange={(e) => setMmg(e.target.value)} placeholder="e.g. 642-1187" />
        </div>
        <div className="field">
          <label>Notes</label>
          <textarea className="control" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
        <div className="modal-actions">
          <button type="submit" className="btn btn-accent" disabled={saving}>
            {saving ? "Saving…" : service ? "Save changes" : "Add taxi service"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function CategoryModal({
  category, onClose, onSaved,
}: { category: Category | null; onClose: () => void; onSaved: () => void }) {
  const supabase = createClient();
  const [name, setName] = useState(category?.name ?? "");
  const [slug, setSlug] = useState(category?.slug ?? "");
  const [icon, setIcon] = useState(category?.icon ?? CATEGORY_ICONS[0]);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const finalSlug = category ? category.slug : slug.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    if (!name.trim() || !finalSlug) { toast("Fill in all fields"); return; }
    setSaving(true);
    const { data, error } = category
      ? await supabase.from("categories").update({ name: name.trim(), icon }).eq("slug", category.slug).select()
      : await supabase.from("categories").insert({ slug: finalSlug, name: name.trim(), icon, sort_order: 99 }).select();
    setSaving(false);
    if (error) { toast(error.message.includes("duplicate") ? "That slug already exists" : "Couldn't save — " + error.message); return; }
    if (!data || data.length === 0) { toast("Couldn't save — you may need to sign in again"); return; }
    toast(category ? "Category updated" : "Category added");
    onSaved();
  }

  return (
    <Modal title={category ? "Edit category" : "Add category"} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label>Name</label>
          <input className="control" required value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="field">
          <label>Slug</label>
          <input className="control" required readOnly={!!category} value={category ? category.slug : slug} onChange={(e) => setSlug(e.target.value)} />
          <p className="hint">{category ? "Slug can't be changed once created." : "Lowercase, no spaces — e.g. home-repair"}</p>
        </div>
        <div className="field">
          <label>Icon</label>
          <select className="control" value={icon} onChange={(e) => setIcon(e.target.value)}>
            {CATEGORY_ICONS.map((ic) => <option value={ic} key={ic}>{ic}</option>)}
          </select>
        </div>
        <div className="modal-actions">
          <button type="submit" className="btn btn-accent" disabled={saving}>{saving ? "Saving…" : category ? "Save changes" : "Add category"}</button>
        </div>
      </form>
    </Modal>
  );
}
