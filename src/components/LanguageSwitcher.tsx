"use client";

import { useLanguage } from "@/lib/i18n/LanguageContext";
import { LANGS } from "@/lib/i18n/translations";

// A two-button toggle: whichever language isn't active is always visible as
// the way back, so switching to Spanish and switching back to English are
// both always just one tap away — no menu to dig through.
export default function LanguageSwitcher({ className }: { className?: string }) {
  const { lang, setLang, t } = useLanguage();

  return (
    <div className={`lang-switcher${className ? ` ${className}` : ""}`} role="group" aria-label={t("language.label")}>
      {LANGS.map((l) => (
        <button
          key={l.code}
          type="button"
          className={`lang-switcher-btn${lang === l.code ? " active" : ""}`}
          onClick={() => setLang(l.code)}
          aria-pressed={lang === l.code}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}
