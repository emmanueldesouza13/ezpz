"use client";

import { useState } from "react";
import Link from "next/link";
import Icon from "./Icon";
import ReviewsPanel from "./ReviewsPanel";
import ScheduleEditor from "./ScheduleEditor";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import type { Profile } from "@/lib/types";

// The profile-level counterpart to listing/[id]/DetailTabs — same tab-bar
// look, but scoped to the seller rather than one listing (no About tab,
// since there's no single listing's category/location/description here).
const TABS = [
  { key: "reviews", labelKey: "listing.tabReviews", icon: "Star" },
  { key: "schedule", labelKey: "listing.tabSchedule", icon: "Calendar" },
  { key: "screening", labelKey: "account.tabScreening", icon: "ShieldCheck" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default function ProfileTabs({
  profile,
  isOwner,
}: {
  profile: Profile;
  isOwner: boolean;
}) {
  const [tab, setTab] = useState<TabKey>("reviews");
  const { t } = useLanguage();

  return (
    <div style={{ marginTop: 8 }}>
      <div className="tab-bar" role="tablist" aria-label="Profile details">
        {TABS.map((tabDef) => (
          <button
            key={tabDef.key}
            type="button"
            role="tab"
            aria-selected={tab === tabDef.key}
            className={`tab-btn${tab === tabDef.key ? " active" : ""}`}
            onClick={() => setTab(tabDef.key)}
          >
            <Icon name={tabDef.icon} />
            {t(tabDef.labelKey)}
          </button>
        ))}
      </div>

      <div className="tab-panel">
        {tab === "reviews" && (
          <ReviewsPanel
            sellerId={profile.id}
            initialRating={profile.rating ?? 5}
            initialCount={profile.rating_count ?? 0}
          />
        )}

        {tab === "schedule" && (
          <ScheduleEditor
            sellerId={profile.id}
            isOwner={isOwner}
            schedule={profile.schedule}
            available={profile.available}
            responseRate={profile.response_rate ?? 90}
          />
        )}

        {tab === "screening" && (
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
            <div className="tab-empty">
              {t("account.screeningPrefix")}{" "}
              <Link href="/safety" style={{ color: "var(--brand)", fontWeight: 700 }}>
                {t("account.screeningLinkText")}
              </Link>
              .
            </div>
          </>
        )}
      </div>
    </div>
  );
}
