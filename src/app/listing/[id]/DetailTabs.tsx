"use client";

import { useState } from "react";
import Icon from "@/components/Icon";
import ReportButton from "./ReportButton";
import ReviewsPanel from "@/components/ReviewsPanel";
import ScheduleEditor from "@/components/ScheduleEditor";
import { timeAgo } from "@/lib/format";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import type { Listing } from "@/lib/types";

const TABS = [
  { key: "about", labelKey: "listing.tabAbout", icon: "Info" },
  { key: "reviews", labelKey: "listing.tabReviews", icon: "Star" },
  { key: "schedule", labelKey: "listing.tabSchedule", icon: "Calendar" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default function DetailTabs({
  listing,
  categoryName,
  isOwner,
}: {
  listing: Listing;
  categoryName?: string;
  isOwner: boolean;
}) {
  const [tab, setTab] = useState<TabKey>("about");
  const seller = listing.seller;
  const { t } = useLanguage();
  // A seller who's since switched their account to Buyer has nothing to
  // be reviewed on anymore — drop the tab rather than show it empty.
  const tabs = seller?.account_type === "buyer" ? TABS.filter((tabDef) => tabDef.key !== "reviews") : TABS;

  return (
    <div>
      <div className="tab-bar" role="tablist" aria-label="Listing details">
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
            {t(tabDef.labelKey)}
          </button>
        ))}
      </div>

      <div className="tab-panel">
        {tab === "about" && (
          <>
            {seller?.bio && <p className="desc-text" style={{ marginBottom: 18 }}>{seller.bio}</p>}
            <div className="tab-fact-row">
              <div className="tab-fact">
                <strong>{t("listing.location")}</strong>
                {seller?.location || listing.location}
              </div>
              <div className="tab-fact">
                <strong>{t("listing.posted")}</strong>
                {timeAgo(listing.created_at)}
              </div>
            </div>
            <p className="section-label">{t("listing.description")}</p>
            <p className="desc-text">{listing.description}</p>
            <ReportButton listingId={listing.id} />
          </>
        )}

        {tab === "reviews" && seller && (
          <ReviewsPanel
            sellerId={seller.id}
            initialRating={seller.rating ?? 0}
            initialCount={seller.rating_count ?? 0}
          />
        )}

        {tab === "schedule" && seller && (
          <ScheduleEditor
            sellerId={seller.id}
            isOwner={isOwner}
            schedule={seller.schedule}
            available={seller.available}
            responseRate={seller.response_rate ?? 90}
          />
        )}
      </div>
    </div>
  );
}
