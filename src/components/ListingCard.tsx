import Link from "next/link";
import { Listing } from "@/lib/types";
import { formatPrice, isPhotoUrl } from "@/lib/format";
import Icon from "./Icon";

export default function ListingCard({
  listing,
  categoryName,
}: {
  listing: Listing;
  categoryName?: string;
}) {
  const seller = listing.seller;
  const photo = listing.images[0];
  const photoCount = listing.images.filter(isPhotoUrl).length;
  const showPrice = !listing.is_free && listing.price > 0;

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
        {photoCount > 0 && (
          <span className="listing-card-photo-count">
            <Icon name="Image" />
            {photoCount}
          </span>
        )}
        {listing.featured && (
          <span className="listing-card-featured">
            <Icon name="Sparkle" />
            Featured
          </span>
        )}
        {showPrice && (
          <span className="listing-card-seal">
            <Icon name="Gem" />
            {formatPrice(listing.price, listing.is_free)}
          </span>
        )}
      </div>
      <div className="listing-card-body">
        <p className="listing-card-title">{listing.title}</p>
        <div className="listing-card-meta">
          <span className="listing-card-meta-line">
            <Icon name="MapPin" />
            {listing.location}
          </span>
          {seller?.available && <span className="listing-card-avail-dot" title="Available now" />}
        </div>
        {seller?.verified && (
          <div className="verified-line listing-card-verified">
            <Icon name="BadgeCheck" />
            Verified
          </div>
        )}
      </div>
    </Link>
  );
}
