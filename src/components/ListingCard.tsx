"use client";

import Link from "next/link";
import { Listing } from "@/lib/types";
import { isPhotoUrl } from "@/lib/format";
import Icon from "./Icon";
import BlueTick from "./BlueTick";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function ListingCard({
  listing,
  categoryName,
}: {
  listing: Listing;
  categoryName?: string;
}) {
  const { t } = useLanguage();
  const seller = listing.seller;
  const photo = listing.images[0];
  const photoCount = listing.images.filter(isPhotoUrl).length;

  return (
    <Link href={`/listing/${listing.id}`} className="listing-card">
      <div
        className="listing-card-photo"
        style={isPhotoUrl(photo) ? undefined : { background: photo }}
      >
        {isPhotoUrl(photo) && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo} alt={listing.title} className="listing-card-photo-img" />
        )}
        <div className="listing-card-photo-shade" />
        {listing.video_url && (
          <span className="listing-card-video-badge" title="Has a video">
            <Icon name="Play" />
          </span>
        )}
        {photoCount > 0 && (
          <span className="listing-card-photo-count">
            <Icon name="Image" />
            {photoCount}
          </span>
        )}
        {listing.featured && (
          <span className="listing-card-featured">
            <Icon name="Sparkle" />
            {t("browse.featured")}
          </span>
        )}
      </div>
      <div className="listing-card-body">
        {seller?.display_name && (
          <span className="listing-card-meta-line listing-card-seller">
            <Icon name="User" />
            {seller.display_name}
            {seller.verified && <BlueTick size={12} />}
          </span>
        )}
        <div className="listing-card-meta">
          <span className="listing-card-meta-line">
            <Icon name="MapPin" />
            {listing.location}
          </span>
        </div>
      </div>
    </Link>
  );
}
