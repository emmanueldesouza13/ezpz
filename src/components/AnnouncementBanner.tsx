"use client";

import { useEffect, useState } from "react";
import Icon from "./Icon";
import { createClient } from "@/lib/supabase/client";
import { getSiteSettings } from "@/lib/data";
import { useLanguage } from "@/lib/i18n/LanguageContext";

// A site-wide broadcast bar, set from Admin → Broadcast. Lives in the root
// layout (mounted once per visit, above every page) so it shows up no
// matter where someone is in the app. Each dismiss is remembered against
// that specific announcement's timestamp, so closing it doesn't hide a
// *later* broadcast — only re-shown when the admin sends a new one.
const DISMISS_KEY = "ezpz_announcement_dismissed";

export default function AnnouncementBanner() {
  const { t } = useLanguage();
  const [message, setMessage] = useState<string | null>(null);
  const [stampKey, setStampKey] = useState<string>("");
  const [dismissed, setDismissed] = useState(true); // default hidden until we know

  useEffect(() => {
    const supabase = createClient();

    function check() {
      getSiteSettings(supabase).then((s) => {
        const text = s.announcement?.trim() || null;
        const key = s.announcement_updated_at || text || "";
        setMessage(text);
        setStampKey(key);
        if (!text) return;
        try {
          setDismissed(localStorage.getItem(DISMISS_KEY) === key);
        } catch {
          setDismissed(false);
        }
      });
    }

    check(); // on mount

    // This banner lives in the root layout, which only mounts once per
    // full page load — a browser tab or the home-screen PWA left open
    // across a client-side navigation never re-runs the effect above, so
    // an account that was already signed in before the admin sent a new
    // broadcast would otherwise never see it until it happened to reload.
    // Re-check whenever the tab regains focus/visibility, and as a
    // fallback every couple of minutes, so an already-open account picks
    // up a new (or cleared) broadcast on its own.
    function onVisible() {
      if (document.visibilityState === "visible") check();
    }
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", check);
    const interval = setInterval(check, 120_000);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", check);
      clearInterval(interval);
    };
  }, []);

  if (!message || dismissed) return null;

  function handleDismiss() {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY, stampKey);
    } catch {
      // ignore — nothing to persist to, it'll just show again next visit
    }
  }

  return (
    <div className="announcement-bar">
      <Icon name="Megaphone" size={16} />
      <span>{message}</span>
      <button
        type="button"
        className="announcement-close"
        aria-label={t("auth.dismiss")}
        onClick={handleDismiss}
      >
        <Icon name="X" size={14} />
      </button>
    </div>
  );
}
