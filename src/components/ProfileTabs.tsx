"use client";

import { useState } from "react";
import Link from "next/link";
import Icon from "./Icon";
import ReviewsPanel from "./ReviewsPanel";
import ScheduleEditor from "./ScheduleEditor";
import AdminTools, { type Tab as AdminTab } from "./AdminTools";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import type { Profile } from "@/lib/types";

// The profile-level counterpart to listing/[id]/DetailTabs — same tab-bar
// look, but scoped to the seller rather than one listing (no About tab,
// since there's no single listing's category/location/description here).
//
// This component only ever renders the signed-in user's own account
// page, so isOwner is effectively always true here — it's still checked
// alongside is_admin (rather than is_admin alone) as a safety net in
// case that ever changes. The admin viewing their own profile gets
// "Maintenance" and "Screening" in place of "Schedule", and loses
// "Reviews" entirely — the admin account doesn't list anything, so
// there's nothing to review; it's just a reach-out point for people to
// message with concerns.
//
// Maintenance vs. Screening is a split of the same AdminTools component
// by which tabs it shows: Maintenance keeps site content & config
// (listings, taxi, sellers, categories, branding, broadcast), Screening
// holds the trust & safety / money tools (verification, reports,
// payouts) — kept separate from the site-wide privacy-blur/shut-down
// controls, which only render once, inside Maintenance.
const MAINTENANCE_TABS: AdminTab[] = ["listings", "taxi", "sellers", "categories", "branding", "broadcast"];
const SCREENING_TABS: AdminTab[] = ["verification", "reports", "payouts"];

type TabKey = "reviews" | "schedule" | "maintenance" | "screening";

export default function ProfileTabs({
  profile,
  isOwner,
}: {
  profile: Profile;
  isOwner: boolean;
}) {
  const showMaintenance = isOwner && profile.is_admin;
  // Same as the standalone seller-profile tabs: a Buyer account has
  // nothing to be reviewed on, so it doesn't get a Reviews tab either.
  const isBuyer = profile.account_type === "buyer";
  const { t } = useLanguage();
  const [tab, setTab] = useState<TabKey>(showMaintenance ? "maintenance" : isBuyer ? "schedule" : "reviews");

  const tabs: { key: TabKey; label: string; icon: string }[] = showMaintenance
    ? [
        { key: "maintenance", label: "Maintenance", icon: "Wrench" },
        { key: "screening", label: t("account.tabScreening"), icon: "ShieldCheck" },
      ]
    : [
        ...(isBuyer ? [] : [{ key: "reviews" as const, label: t("listing.tabReviews"), icon: "Star" }]),
        { key: "schedule", label: t("listing.tabSchedule"), icon: "Calendar" },
        { key: "screening", label: t("account.tabScreening"), icon: "ShieldCheck" },
      ];

  return (
    <div style={{ marginTop: 8 }}>
      <div className="tab-bar" role="tablist" aria-label="Profile details">
        {tabs.map((tabDef) => (
          <button
            key={tabDef.key}
            type="button"
            role="tab"
            aria-selected={tab === tabDef.key}
            className={`tab-btn${tab === tabDef.key ? " active" : ""}`}
            onClick={() => setTab(tabDef.key)}
          >
            <Icon name={tabDef.icon} />
            {tabDef.label}
          </button>
        ))}
      </div>

      <div className="tab-panel">
        {tab === "reviews" && !showMaintenance && (
          <ReviewsPanel
            sellerId={profile.id}
            initialRating={profile.rating ?? 0}
            initialCount={profile.rating_count ?? 0}
          />
        )}

        {tab === "schedule" && !showMaintenance && (
          <ScheduleEditor
            sellerId={profile.id}
            isOwner={isOwner}
            schedule={profile.schedule}
            available={profile.available}
            responseRate={profile.response_rate ?? 90}
          />
        )}

        {tab === "maintenance" && showMaintenance && <AdminTools tabs={MAINTENANCE_TABS} />}

        {tab === "screening" && showMaintenance && <AdminTools tabs={SCREENING_TABS} showSiteControls={false} />}

        {tab === "screening" && !showMaintenance && (
          <>
            <div className="tab-fact-row">
              <div className="tab-fact">
                <strong>{t("account.identityLabel")}</strong>
                {profile.verified ? t("account.verifiedOnEzpz") : t("account.notYetVerified")}
              </div>
              <div className="tab-fact">
                <strong>{t("account.memberSince")}</strong>
                {new Date(profile.created_at).getFullYear()}
              </div>
            </div>
            {!profile.verified && (
              <div className="tab-empty">
                {t("account.screeningPrefix")}{" "}
                <Link href="/safety" style={{ color: "var(--brand)", fontWeight: 700 }}>
                  {t("account.screeningLinkText")}
                </Link>
                .
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
