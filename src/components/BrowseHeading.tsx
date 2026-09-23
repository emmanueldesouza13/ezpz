"use client";

import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function BrowseHeading({
  categoryName,
  count,
  query,
  region,
}: {
  categoryName?: string | null;
  count: number;
  query?: string | null;
  region?: string | null;
}) {
  const { t } = useLanguage();
  const title = categoryName || t("browse.nearby");
  const sub =
    t("browse.listingCount", { count }) +
    (query ? " " + t("browse.matching", { q: query }) : "") +
    (region ? " " + t("browse.inRegion", { region }) : " " + t("browse.acrossGuyana"));

  return (
    <div>
      <h1>{title}</h1>
      <p>{sub}</p>
    </div>
  );
}
