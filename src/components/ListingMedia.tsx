"use client";

import { useState } from "react";
import Icon from "./Icon";
import { isPhotoUrl } from "@/lib/format";
import { useLanguage } from "@/lib/i18n/LanguageContext";

// Instagram-style Photos/Videos toggle + grid for a seller's media, shown on
// the listing detail page right below the seller card. Pooled across all of
// that seller's active listings, not just the one being viewed — since the
// browse grid only shows one card per seller, this is where the rest of
// their work (other listings' photos and videos) surfaces.
export default function ListingMedia({
  images,
  videos,
}: {
  images: string[];
  videos: string[];
}) {
  const photos = images.filter(isPhotoUrl);
  const { t } = useLanguage();

  const [tab, setTab] = useState<"photos" | "videos">(photos.length > 0 ? "photos" : "videos");

  if (photos.length === 0 && videos.length === 0) return null;

  return (
    <div className="media-section">
      <div className="media-toggle" role="tablist" aria-label={t("listingMedia.label")}>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "photos"}
          className={`media-toggle-btn${tab === "photos" ? " active" : ""}`}
          onClick={() => setTab("photos")}
        >
          <Icon name="Grid3x3" />
          {t("listingMedia.photos")}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "videos"}
          className={`media-toggle-btn${tab === "videos" ? " active" : ""}`}
          onClick={() => setTab("videos")}
        >
          <Icon name="Video" />
          {t("listingMedia.videos")}
        </button>
      </div>

      {tab === "photos" && (
        photos.length > 0 ? (
          <div className="media-grid">
            {photos.map((url, i) => (
              <div className="media-grid-item" key={url}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={t("editProfile.photoAlt", { n: i + 1 })} />
              </div>
            ))}
          </div>
        ) : (
          <p className="media-empty">{t("listingMedia.noPhotos")}</p>
        )
      )}

      {tab === "videos" && (
        videos.length > 0 ? (
          <div className="media-grid">
            {videos.map((url) => (
              <div className="media-grid-item media-grid-item-video" key={url}>
                <video src={url} controls playsInline />
              </div>
            ))}
          </div>
        ) : (
          <p className="media-empty">{t("listingMedia.noVideo")}</p>
        )
      )}
    </div>
  );
}
