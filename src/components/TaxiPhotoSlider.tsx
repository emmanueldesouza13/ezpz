"use client";

import { useRef, useState } from "react";

// Swipeable photo slider for the taxi detail page hero. Falls back to a
// plain gradient tile (matching the old placeholder) when a service has no
// photos yet, and skips the dots/scroll-snap machinery entirely for the
// common case of just one photo.
export default function TaxiPhotoSlider({
  photos,
  alt,
}: {
  photos: string[];
  alt: string;
}) {
  const [active, setActive] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);

  if (photos.length === 0) {
    return (
      <div
        className="hero-photo"
        style={{ background: "linear-gradient(135deg,#2f8f6b,#134a38)" }}
      />
    );
  }

  function onScroll() {
    const el = trackRef.current;
    if (!el) return;
    const i = Math.round(el.scrollLeft / el.clientWidth);
    setActive(i);
  }

  function goTo(i: number) {
    const el = trackRef.current;
    if (!el) return;
    el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
    setActive(i);
  }

  return (
    <div className="hero-photo">
      <div className="photo-slider-track" ref={trackRef} onScroll={onScroll}>
        {photos.map((url, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={url}
            src={url}
            alt={`${alt} — photo ${i + 1}`}
            className="photo-slider-img"
          />
        ))}
      </div>
      {photos.length > 1 && (
        <div className="photo-slider-dots">
          {photos.map((url, i) => (
            <button
              key={url}
              type="button"
              className={`photo-slider-dot${i === active ? " active" : ""}`}
              aria-label={`Go to photo ${i + 1}`}
              onClick={() => goTo(i)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
