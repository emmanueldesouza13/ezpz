"use client";

import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function TaxiHeading({ count, query }: { count: number; query?: string | null }) {
  const { t } = useLanguage();
  return (
    <div>
      <h1>{t("taxi.title")}</h1>
      {query && <p>{count} {t("taxi.matching", { q: query })}</p>}
    </div>
  );
}
