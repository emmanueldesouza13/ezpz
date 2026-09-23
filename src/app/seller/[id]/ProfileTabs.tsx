"use client";

import { useState } from "react";
import Link from "next/link";
import Icon from "@/components/Icon";
import ReviewsPanel from "@/components/ReviewsPanel";
import ScheduleEditor from "@/components/ScheduleEditor";
import ListingCard from "@/components/ListingCard";
import type { Profile, Listing, TaxiService } from "@/lib/types";

const TABS = [
  { key: "about", label: "About", icon: "Info" },
  { key: "reviews", label: "Reviews", icon: "Star" },
  { key: "schedule", label: "Schedule", icon: "Calendar" },
  { key: "listings", label: "Listings", icon: "LayoutGrid" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default function ProfileTabs({
  seller,
  isOwner,
  listings,
  taxiServices,
}: {
  seller: Profile;
  isOwner: boolean;
  listings: Listing[];
  taxiServices: TaxiService[];
}) {
  const [tab, setTab] = useState<TabKey>("about");
  const hasListings = listings.length > 0 || taxiServices.length > 0;

  return (
    <div>
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
        {tab === "about" && (
          <>
            {seller.location && (
              <div className="tab-fact-row">
                <div className="tab-fact">
                  <strong>Location</strong>
                  {seller.location}
                </div>
              </div>
            )}
            {seller.bio ? (
              <>
                <p className="section-label">About</p>
                <p className="desc-text">{seller.bio}</p>
              </>
            ) : (
              <div className="tab-empty">
                {isOwner ? "You haven't added a bio yet." : "This seller hasn't added a bio yet."}
              </div>
            )}
          </>
        )}

        {tab === "reviews" && (
          <ReviewsPanel
            sellerId={seller.id}
            initialRating={seller.rating ?? 5}
            initialCount={seller.rating_count ?? 0}
          />
        )}

        {tab === "schedule" && (
          <ScheduleEditor
            sellerId={seller.id}
            isOwner={isOwner}
            schedule={seller.schedule}
            available={seller.available}
            responseRate={seller.response_rate ?? 90}
          />
        )}

        {tab === "listings" && (
          <>
            {listings.length > 0 && (
              <div className="listing-grid">
                {listings.map((l) => (
                  <ListingCard listing={{ ...l, seller }} key={l.id} />
                ))}
              </div>
            )}
            {taxiServices.length > 0 && (
              <div className="region-scroll" style={{ marginTop: listings.length > 0 ? 18 : 0 }}>
                {taxiServices.map((s) => (
                  <Link href={`/taxi/${s.id}`} key={s.id} className="region-card">
                    <div className="region-card-photo">
                      {s.photo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={s.photo_url} alt={`${s.vehicle_make} ${s.vehicle_model}`} />
                      ) : (
                        <Icon name="Car" />
                      )}
                    </div>
                    <div className="region-card-title">
                      {s.vehicle_make} {s.vehicle_model}
                    </div>
                    <div className="region-card-sub">
                      {s.driver_name} &middot; {s.plate}
                    </div>
                  </Link>
                ))}
              </div>
            )}
            {!hasListings && <div className="tab-empty">No active listings yet.</div>}
          </>
        )}
      </div>
    </div>
  );
}
