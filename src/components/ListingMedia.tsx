"use client";

import { useState } from "react";
import Icon from "./Icon";
import { isPhotoUrl } from "@/lib/format";

// Instagram-style Photos/Videos toggle + grid for a listing's media,
// shown on the listing detail page right below the seller card.
export default function ListingMedia({
  images,
  videoUrl,
}: {
  images: string[];
  videoUrl: string | null;
}) {
  const photos = images.filter(isPhotoUrl);
  const hasVideo = Boolean(videoUrl);

  const [tab, setTab] = useState<"photos" | "videos">(photos.length > 0 ? "photos" : "videos");

  if (photos.length === 0 && !hasVideo) return null;

  return (
    <div className="media-section">
      <div className="media-toggle" role="tablist" aria-label="Listing media">
        <button
          type="button"
          role="tab"
          aria-selected={tab === "photos"}
          className={`media-toggle-btn${tab === "photos" ? " active" : ""}`}
          onClick={() => setTab("photos")}
        >
          <Icon name="Grid3x3" />
          Photos
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "videos"}
          className={`media-toggle-btn${tab === "videos" ? " active" : ""}`}
          onClick={() => setTab("videos")}
        >
          <Icon name="Video" />
          Videos
        </button>
      </div>

      {tab === "photos" && (
        photos.length > 0 ? (
          <div className="media-grid">
            {photos.map((url, i) => (
              <div className="media-grid-item" key={url}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={`Photo ${i + 1}`} />
              </div>
            ))}
          </div>
        ) : (
          <p className="media-empty">No photos yet.</p>
        )
      )}

      {tab === "videos" && (
        hasVideo ? (
          <div className="media-grid">
            <div className="media-grid-item media-grid-item-video">
              <video src={videoUrl!} controls playsInline />
            </div>
          </div>
        ) : (
          <p className="media-empty">No video yet.</p>
        )
      )}
    </div>
  );
}
