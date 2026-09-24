"use client";

import Icon from "./Icon";
import { isPhotoUrl } from "@/lib/format";
import { useLanguage } from "@/lib/i18n/LanguageContext";

// Side-by-side photos/videos panel for a seller's media, shown on the
// listing detail page right below the seller card. Pooled across all of
// that seller's active listings, not just the one being viewed — since the
// browse grid only shows one card per seller, this is where the rest of
// their work (other listings' photos and videos) surfaces. Photos sit on
// the left, videos on the right, both visible at once instead of behind a
// toggle.
export default function ListingMedia({
  images,
  videos,
}: {
  images: string[];
  videos: string[];
}) {
  const photos = images.filter(isPhotoUrl);
  const { t } = useLanguage();

  if (photos.length === 0 && videos.length === 0) return null;

  return (
    <div className="media-section">
      <div className="media-columns">
        <div className="media-column">
          <p className="media-column-label">
            <Icon name="Grid3x3" />
            {t("listingMedia.photos")}
          </p>
          {photos.length > 0 ? (
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
          )}
        </div>

        <div className="media-column">
          <p className="media-column-label">
            <Icon name="Video" />
            {t("listingMedia.videos")}
          </p>
          {videos.length > 0 ? (
            <div className="media-videos-list">
              {videos.map((url) => (
                <div className="media-video-item" key={url}>
                  <video src={url} controls playsInline />
                </div>
              ))}
            </div>
          ) : (
            <p className="media-empty">{t("listingMedia.noVideo")}</p>
          )}
        </div>
      </div>
    </div>
  );
}
