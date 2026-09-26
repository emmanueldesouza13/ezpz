"use client";

import { useEffect, useRef, useState } from "react";
import Icon from "./Icon";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { LANGS } from "@/lib/i18n/translations";

// With only English/Spanish this used to be a two-button toggle — the other
// language was always visible as the way back. Ten languages don't fit as
// buttons, so this is now a dropdown (same look as the region picker in
// Header.tsx): current language as a compact trigger, full list of native
// names in a menu.
export default function LanguageSwitcher({ className }: { className?: string }) {
  const { lang, setLang, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = LANGS.find((l) => l.code === lang) ?? LANGS[0];

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  return (
    <div className={`lang-switcher${className ? ` ${className}` : ""}`} ref={ref}>
      <button
        type="button"
        className="lang-switcher-trigger"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t("language.label")}
      >
        <Icon name="Globe" size={14} />
        {current.short}
      </button>
      {open && (
        <div className="distance-menu lang-menu" role="listbox" aria-label={t("language.label")}>
          {LANGS.map((l) => (
            <button
              type="button"
              key={l.code}
              role="option"
              aria-selected={lang === l.code}
              className={`distance-menu-item${lang === l.code ? " active" : ""}`}
              onClick={() => {
                setLang(l.code);
                setOpen(false);
              }}
            >
              {l.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
