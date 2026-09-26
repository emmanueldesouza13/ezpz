"use client";

import { useState } from "react";
import Link from "next/link";
import Icon from "@/components/Icon";
import ReviewsPanel from "@/components/ReviewsPanel";
import ScheduleEditor from "@/components/ScheduleEditor";
import ListingCard from "@/components/ListingCard";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import type { Profile, Listing, TaxiService } from "@/lib/types";

const TABS = [
  { key: "about", labelKey: "listing.tabAbout", icon: "Info" },
  { key: "reviews", labelKey: "listing.tabReviews", icon: "Star" },
  { key: "schedule", labelKey: "listing.tabSchedule", icon: "Calendar" },
  { key: "listings", labelKey: "seller.tabListings", icon: "LayoutGrid" },
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
  const { t } = useLanguage();
  // Buyer accounts don't offer any service, so there's nothing to rate or
  // review — drop that tab for them instead of showing an empty one.
  const tabs = seller.account_type === "buyer" ? TABS.filter((tabDef) => tabDef.key !== "reviews") : TABS;

  return (
    <div>
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
            {t(tabDef.labelKey)}
          </button>
        ))}
      </div>

      <div className="tab-panel">
        {tab === "about" && (
          <>
            {seller.location && (
              <div className="tab-fact-row">
                <div className="tab-fact">
                  <strong>{t("listing.location")}</strong>
                  {seller.location}
                </div>
              </div>
            )}
            {seller.bio ? (
              <>
                <p className="section-label">{t("listing.tabAbout")}</p>
                <p className="desc-text">{seller.bio}</p>
              </>
            ) : (
              <div className="tab-empty">
                {isOwner ? t("seller.noBioOwner") : t("seller.noBioOther")}
              </div>
            )}
          </>
        )}

        {tab === "reviews" && (
          <ReviewsPanel
            sellerId={seller.id}
            initialRating={seller.rating ?? 0}
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
            {!hasListings && <div className="tab-empty">{t("seller.noActiveListings")}</div>}
          </>
        )}
      </div>
    </div>
  );
}
