"use client";

import { useEffect, useState } from "react";
import Icon from "./Icon";
import LanguageSwitcher from "./LanguageSwitcher";
import { useLanguage } from "@/lib/i18n/LanguageContext";

// Shows once per browser session (resets whenever someone opens the site in
// a fresh tab or after closing the browser) rather than once ever — normal
// in-site navigation between pages doesn't remount this, so it won't nag
// them page to page, only on a genuinely new visit.
const STORAGE_KEY = "ezpz_age_verified";

export default function AgeGate({ children }: { children: React.ReactNode }) {
  const [verified, setVerified] = useState(false);
  const [checked, setChecked] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    try {
      if (sessionStorage.getItem(STORAGE_KEY) === "1") setVerified(true);
    } catch {
      // ignore — storage unavailable, just fall back to asking again
    }
    setChecked(true);
  }, []);

  function handleVerify() {
    setVerified(true);
    try {
      sessionStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // ignore — nothing to persist to
    }
  }

  // Avoid a flash of the gate while we check whether this browser already verified.
  if (!checked) return null;

  if (!verified) {
    return (
      <div className="age-gate">
        <div className="age-gate-card">
          <LanguageSwitcher className="age-gate-lang" />
          <div className="icon-circle">
            <Icon name="ShieldAlert" size={26} />
          </div>
          <h1>{t("ageGate.title")}</h1>
          <p>{t("ageGate.body")}</p>
          <button
            type="button"
            className="btn btn-accent btn-block"
            onClick={handleVerify}
          >
            {t("ageGate.verify")}
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
