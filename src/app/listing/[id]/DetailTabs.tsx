"use client";

import { useState } from "react";
import Icon from "@/components/Icon";
import ReportButton from "./ReportButton";
import ReviewsPanel from "@/components/ReviewsPanel";
import ScheduleEditor from "@/components/ScheduleEditor";
import { timeAgo, formatPrice } from "@/lib/format";
import type { Listing } from "@/lib/types";

const TABS = [
  { key: "about", label: "About", icon: "Info" },
  { key: "reviews", label: "Reviews", icon: "Star" },
  { key: "schedule", label: "Schedule", icon: "Calendar" },
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

  return (
    <div>
      <div className="tab-bar" role="tablist" aria-label="Listing details">
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
        {tab === "about" && (
          <>
            {seller?.bio && <p className="desc-text" style={{ marginBottom: 18 }}>{seller.bio}</p>}
            <div className="tab-fact-row">
              <div className="tab-fact">
                <strong>Rate</strong>
                {formatPrice(listing.price, listing.is_free)}
              </div>
              {categoryName && (
                <div className="tab-fact">
                  <strong>Category</strong>
                  {categoryName}
                </div>
              )}
              <div className="tab-fact">
                <strong>Location</strong>
                {seller?.location || listing.location}
              </div>
              <div className="tab-fact">
                <strong>Posted</strong>
                {timeAgo(listing.created_at)}
              </div>
            </div>
            <p className="section-label">Description</p>
            <p className="desc-text">{listing.description}</p>
            <ReportButton listingId={listing.id} />
          </>
        )}

        {tab === "reviews" && seller && (
          <ReviewsPanel
            sellerId={seller.id}
            initialRating={seller.rating ?? 5}
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
