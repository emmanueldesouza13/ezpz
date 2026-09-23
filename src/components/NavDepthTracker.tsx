"use client";

import { useEffect } from "react";

// BackButton needs to know "is there really an EzPz page behind this one in
// this browser tab?" before it calls router.back() — window.history.length
// can't answer that (it counts entries the browser adds on its own too),
// and watching the URL's pathname alone undercounts: a navigation that only
// changes the query string (like picking a region filter on "/") doesn't
// change the pathname, so it was going uncounted and Back would wrongly
// fall back to home instead of actually going back.
//
// Fix: patch history.pushState itself, once, at the root. Every client-side
// navigation Next.js performs — path change or query-only — calls the real
// pushState under the hood, so this reliably counts all of them into
// sessionStorage. BackButton trusts that count instead.
export const NAV_DEPTH_KEY = "ezpz_nav_depth";

export default function NavDepthTracker() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const w = window as unknown as { __ezpzPushPatched?: boolean };
    if (w.__ezpzPushPatched) return; // don't double-patch (StrictMode/HMR)
    w.__ezpzPushPatched = true;

    const originalPush = window.history.pushState.bind(window.history);
    window.history.pushState = function patchedPushState(...args) {
      try {
        const depth = Number(sessionStorage.getItem(NAV_DEPTH_KEY) || "0");
        sessionStorage.setItem(NAV_DEPTH_KEY, String(depth + 1));
      } catch {
        // ignore — storage unavailable, BackButton just falls back more often
      }
      return originalPush(...(args as Parameters<History["pushState"]>));
    } as History["pushState"];
  }, []);

  return null;
}
