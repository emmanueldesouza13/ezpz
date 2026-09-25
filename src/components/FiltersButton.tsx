"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "./Icon";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import type { Category } from "@/lib/types";

// Same "Region 1".."Region 10" values the header's location picker uses
// (and the only shape REGION_TOWNS in lib/guyana.ts matches against) —
// listings only ever carry a free-text town, not real coordinates, so this
// is standing in for actual distance.
const REGIONS = Array.from({ length: 10 }, (_, i) => `Region ${i + 1}`);

const RATING_OPTIONS = [3, 4, 4.5];

export default function FiltersButton({
  categories,
  current,
}: {
  categories: Category[];
  current: { category?: string; q?: string; region?: string; verified?: boolean; minRating?: number | null };
}) {
  const router = useRouter();
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [keywords, setKeywords] = useState(current.q ?? "");
  const [category, setCategory] = useState(current.category ?? "");
  const [region, setRegion] = useState(current.region ?? "");
  const [verifiedOnly, setVerifiedOnly] = useState(current.verified ?? false);
  const [minRating, setMinRating] = useState(current.minRating ? String(current.minRating) : "");

  function apply() {
    const params = new URLSearchParams();
    if (keywords.trim()) params.set("q", keywords.trim());
    if (category) params.set("category", category);
    if (region) params.set("region", region);
    if (verifiedOnly) params.set("verified", "1");
    if (minRating) params.set("minRating", minRating);
    setOpen(false);
    router.push(params.toString() ? `/?${params.toString()}` : "/");
  }

  function clearAll() {
    setKeywords("");
    setCategory("");
    setRegion("");
    setVerifiedOnly(false);
    setMinRating("");
    setOpen(false);
    router.push("/");
  }

  return (
    <>
      <button className="btn btn-line" type="button" onClick={() => setOpen(true)}>
        <Icon name="SlidersHorizontal" size={14} />
        {t("filters.filters")}
      </button>
      {open && (
        <div
          className="modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div className="modal-card">
            <button type="button" className="modal-close" onClick={() => setOpen(false)}>
              <Icon name="X" />
            </button>
            <h2>{t("filters.filters")}</h2>

            <div className="field">
              <label htmlFor="f-keywords">{t("filters.keywords")}</label>
              <input
                className="control"
                id="f-keywords"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
              />
            </div>

            <div className="field">
              <label htmlFor="f-region">{t("filters.region")}</label>
              <select
                className="control"
                id="f-region"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
              >
                <option value="">{t("header.allRegions")}</option>
                {REGIONS.map((r) => (
                  <option value={r} key={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label htmlFor="f-rating">{t("filters.minRating")}</label>
              <select
                className="control"
                id="f-rating"
                value={minRating}
                onChange={(e) => setMinRating(e.target.value)}
              >
                <option value="">{t("filters.anyRating")}</option>
                {RATING_OPTIONS.map((r) => (
                  <option value={r} key={r}>
                    {t("filters.ratingAndUp", { rating: r })}
                  </option>
                ))}
              </select>
            </div>

            <label className="check-inline" style={{ marginBottom: 16 }}>
              <input
                type="checkbox"
                checked={verifiedOnly}
                onChange={(e) => setVerifiedOnly(e.target.checked)}
              />
              {t("filters.verifiedOnly")}
            </label>

            <div className="modal-actions">
              <button type="button" className="btn btn-line" onClick={clearAll}>
                {t("filters.clear")}
              </button>
              <button type="button" className="btn btn-accent" onClick={apply}>
                {t("filters.apply")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
