"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { translations, LANGS, type Lang } from "./translations";

const STORAGE_KEY = "ezpz_lang";

type Vars = Record<string, string | number>;

type LanguageContextValue = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  // Plain lookup: t("header.signIn"). With vars, replaces {name} tokens in
  // the resolved string: t("browse.matching", { q: "plumber" }). If vars
  // includes a numeric "count", tries a plural-suffixed key first
  // (path + "_one" when count === 1, else path + "_other") before falling
  // back to the bare path.
  t: (path: string, vars?: Vars) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

function lookup(path: string, lang: Lang): string | undefined {
  const parts = path.split(".");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let node: any = translations[lang];
  for (const part of parts) {
    if (node == null) return undefined;
    node = node[part];
  }
  return typeof node === "string" ? node : undefined;
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved && LANGS.some((l) => l.code === saved)) setLangState(saved as Lang);
    } catch {
      // ignore — storage unavailable, just stay on the default
    }
  }, []);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore — nothing to persist to
    }
  }, []);

  const t = useCallback(
    (path: string, vars?: Vars) => {
      let resolvedPath = path;
      if (vars && typeof vars.count === "number") {
        const pluralPath = `${path}_${vars.count === 1 ? "one" : "other"}`;
        if (lookup(pluralPath, lang) ?? lookup(pluralPath, "en")) resolvedPath = pluralPath;
      }
      let str = lookup(resolvedPath, lang) ?? lookup(resolvedPath, "en") ?? resolvedPath;
      if (vars) {
        for (const [key, value] of Object.entries(vars)) {
          str = str.replaceAll(`{${key}}`, String(value));
        }
      }
      return str;
    },
    [lang]
  );

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    // Renders that mount outside the provider (shouldn't happen once it
    // wraps the root layout) just get English text back instead of crashing.
    return {
      lang: "en",
      setLang: () => {},
      t: (path: string, vars?: Vars) => {
        let str = lookup(path, "en") ?? path;
        if (vars) for (const [k, v] of Object.entries(vars)) str = str.replaceAll(`{${k}}`, String(v));
        return str;
      },
    };
  }
  return ctx;
}
