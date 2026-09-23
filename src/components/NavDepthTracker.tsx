"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

// BackButton used to decide whether it was safe to call router.back() by
// checking window.history.length > 1 — but that count includes entries the
// browser adds on its own (redirects, a fresh tab's baseline, an in-app
// browser's own history), not just pages this app actually navigated
// through. That's why "Back" sometimes did nothing or bounced somewhere
// odd: history.length said there was something to go back to when there
// wasn't really an EzPz page behind the current one.
//
// This component is mounted once, at the root, and counts real client-side
// route changes into sessionStorage as they happen. BackButton then trusts
// that count instead of history.length — it's scoped to this browser tab
// and reflects only navigation this app actually performed.
export const NAV_DEPTH_KEY = "ezpz_nav_depth";

export default function NavDepthTracker() {
  const pathname = usePathname();
  const prevPathname = useRef<string | null>(null);

  useEffect(() => {
    if (prevPathname.current !== null && prevPathname.current !== pathname) {
      try {
        const depth = Number(sessionStorage.getItem(NAV_DEPTH_KEY) || "0");
        sessionStorage.setItem(NAV_DEPTH_KEY, String(depth + 1));
      } catch {
        // ignore — storage unavailable, BackButton just falls back more often
      }
    }
    prevPathname.current = pathname;
  }, [pathname]);

  return null;
}
