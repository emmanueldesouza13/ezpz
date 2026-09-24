"use client";

import { useEffect } from "react";

// Remembers the current route in localStorage — unlike NavDepthTracker's
// sessionStorage nav-depth counter, this has to survive the app being
// fully closed and relaunched. The PWA's start_url is always "/" (see
// manifest.ts), so without this, reopening the home-screen icon (or the
// site in general) always lands back on the browse feed no matter what
// page was open when it was closed. The inline script in layout.tsx's
// <head> reads this key on load and, if the current path is "/" but the
// last-visited path was something else, sends the visitor straight there.
//
// Patches history.pushState/replaceState (same technique as
// NavDepthTracker, and for the same reason) rather than
// usePathname()/useSearchParams(), so pages that render this from the
// root layout can stay statically prerendered — see Header.tsx's own
// note on avoiding useSearchParams for that reason.
export const LAST_PATH_KEY = "ezpz_last_path";

function currentPath() {
  return window.location.pathname + window.location.search;
}

export default function LastPathTracker() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    function record() {
      try {
        localStorage.setItem(LAST_PATH_KEY, currentPath());
      } catch {
        // ignore — storage unavailable, resuming just won't work this visit
      }
    }

    record(); // capture wherever this load landed, not just future navigations

    const w = window as unknown as { __ezpzLastPathPatched?: boolean };
    if (w.__ezpzLastPathPatched) return; // don't double-patch (StrictMode/HMR)
    w.__ezpzLastPathPatched = true;

    const originalPush = window.history.pushState.bind(window.history);
    window.history.pushState = function patchedPushState(...args) {
      const result = originalPush(...(args as Parameters<History["pushState"]>));
      record();
      return result;
    } as History["pushState"];

    const originalReplace = window.history.replaceState.bind(window.history);
    window.history.replaceState = function patchedReplaceState(...args) {
      const result = originalReplace(...(args as Parameters<History["replaceState"]>));
      record();
      return result;
    } as History["replaceState"];

    window.addEventListener("popstate", record);
    return () => window.removeEventListener("popstate", record);
  }, []);

  return null;
}
