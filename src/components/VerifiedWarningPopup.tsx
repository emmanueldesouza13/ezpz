"use client";

import { useEffect, useState } from "react";
import Icon from "./Icon";
import { useLanguage } from "@/lib/i18n/LanguageContext";

// Shows once per browser session (resets when the tab/browser is closed and
// reopened) — a friendly nudge, not a hard gate.
const SESSION_KEY = "ezpz_verify_warn_shown";
const MAX_SHOWS = 1;
const DELAY_MS = 4500; // give the age gate room to close first, so the two don't feel stacked

export default function VerifiedWarningPopup() {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let shown = 0;
    try {
      shown = Number(sessionStorage.getItem(SESSION_KEY) || "0");
    } catch {
      return; // storage unavailable — just skip it
    }
    if (shown >= MAX_SHOWS) return;
    const timer = setTimeout(() => setOpen(true), DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  function dismiss() {
    setOpen(false);
    try {
      const shown = Number(sessionStorage.getItem(SESSION_KEY) || "0");
      sessionStorage.setItem(SESSION_KEY, String(shown + 1));
    } catch {
      // ignore — nothing to persist to
    }
  }

  if (!open) return null;

  return (
    <div
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) dismiss();
      }}
    >
      <div className="modal-card warn-popup-card">
        <button type="button" className="modal-close" onClick={dismiss} aria-label={t("auth.dismiss")}>
          <Icon name="X" />
        </button>
        <WinkMascot />
        <h2>{t("verifiedWarning.title")}</h2>
        <p className="warn-popup-text">{t("verifiedWarning.body")}</p>
        <button type="button" className="btn btn-accent btn-block" onClick={dismiss}>
          {t("verifiedWarning.gotIt")}
        </button>
      </div>
    </div>
  );
}

function WinkMascot() {
  return (
    <svg
      className="warn-mascot"
      width="76"
      height="76"
      viewBox="0 0 100 100"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="warnFace" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--accent)" />
          <stop offset="1" stopColor="var(--accent-deep)" />
        </linearGradient>
      </defs>
      {/* head */}
      <circle cx="50" cy="50" r="46" fill="url(#warnFace)" />
      {/* cheeks */}
      <ellipse cx="24" cy="60" rx="7" ry="4.5" fill="#fff" opacity="0.18" />
      <ellipse cx="76" cy="60" rx="7" ry="4.5" fill="#fff" opacity="0.18" />
      {/* open eye (viewer's left) with a little highlight */}
      <ellipse cx="34" cy="44" rx="7" ry="8.5" fill="#1c1409" />
      <circle cx="36.5" cy="41" r="2.1" fill="#fff" />
      {/* raised eyebrow over the open eye */}
      <path d="M25 29c4-4 12-4.5 17-1.5" stroke="#1c1409" strokeWidth="3.2" strokeLinecap="round" fill="none" />
      {/* winking eye (viewer's right) — closed, confident curve + lashes */}
      <path d="M60 45c4 4.5 12 4.5 16 0" stroke="#1c1409" strokeWidth="3.4" strokeLinecap="round" fill="none" />
      <path
        d="M78 40l3-3M81 44.5l3.5-1.3M76 36.5l2-3.6"
        stroke="#1c1409"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      {/* smug smirk */}
      <path d="M32 66c8 9 26 10.5 37 1" stroke="#1c1409" strokeWidth="3.6" strokeLinecap="round" fill="none" />
      {/* twinkle */}
      <path
        className="warn-mascot-sparkle"
        d="M85 22l1.8 4.6L91 28l-4.2 1.6L85 34l-1.6-4.4L79 28l4.4-1.4z"
        fill="#fff"
      />
    </svg>
  );
}
