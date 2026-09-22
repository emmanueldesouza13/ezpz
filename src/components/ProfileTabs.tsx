"use client";

import { useState } from "react";
import Link from "next/link";
import Icon from "./Icon";
import ReviewsPanel from "./ReviewsPanel";
import ScheduleEditor from "./ScheduleEditor";
import type { Profile } from "@/lib/types";

// The profile-level counterpart to listing/[id]/DetailTabs — same tab-bar
// look, but scoped to the seller rather than one listing (no About tab,
// since there's no single listing's category/location/description here).
const TABS = [
  { key: "reviews", label: "Reviews", icon: "Star" },
  { key: "schedule", label: "Schedule", icon: "Calendar" },
  { key: "screening", label: "Screening", icon: "ShieldCheck" },
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

  return (
    <div style={{ marginTop: 8 }}>
      <div className="tab-bar" role="tablist" aria-label="Profile details">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={tab === t.key}
            className={`tab-btn${tab === t.key ? " active" : ""}`}
            onClick={() => setTab(t.key)}
          >
            <Icon name={t.icon} />
            {t.label}
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
                <strong>Identity</strong>
                {profile.verified ? "Verified on EzPz" : "Not yet verified"}
              </div>
              <div className="tab-fact">
                <strong>Member since</strong>
                {new Date(profile.created_at).getFullYear()}
              </div>
            </div>
            <div className="tab-empty">
              EzPz doesn&#39;t run formal background checks yet. Meet in public places and read
              our{" "}
              <Link href="/safety" style={{ color: "var(--brand)", fontWeight: 700 }}>
                safety tips
              </Link>
              .
            </div>
          </>
        )}
      </div>
    </div>
  );
}
