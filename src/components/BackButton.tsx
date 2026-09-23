"use client";

import { useRouter } from "next/navigation";
import Icon from "./Icon";
import { NAV_DEPTH_KEY } from "./NavDepthTracker";

// Used to check window.history.length > 1 to decide whether router.back()
// was safe — but that count includes history entries the browser adds on
// its own (redirects, a fresh tab's baseline, an in-app browser's quirks),
// not just pages this app navigated through, so "Back" would sometimes do
// nothing or land somewhere odd. NavDepthTracker counts real in-app
// navigations into sessionStorage instead, and this trusts that count: only
// try router.back() if we know there's an EzPz page behind this one.
//
// Belt and suspenders: even with an accurate count, there could be a browser
// context we haven't seen where history.back() still silently no-ops. So
// after asking for it, this checks a moment later whether the page actually
// changed — if not, it self-heals by sending the person to `fallback`
// instead of leaving them stuck on a dead button.
export default function BackButton({ fallback = "/" }: { fallback?: string }) {
  const router = useRouter();

  return (
    <button
      type="button"
      className="page-back"
      onClick={() => {
        let depth = 0;
        try {
          depth = Number(sessionStorage.getItem(NAV_DEPTH_KEY) || "0");
        } catch {
          // storage unavailable — treat it as no in-app history to fall back on
        }
        if (depth > 0) {
          const before = typeof window !== "undefined" ? window.location.href : "";
          router.back();
          setTimeout(() => {
            if (typeof window !== "undefined" && window.location.href === before) {
              router.push(fallback);
            }
          }, 350);
        } else {
          router.push(fallback);
        }
      }}
    >
      <Icon name="ArrowLeft" size={16} />
      Back
    </button>
  );
}
