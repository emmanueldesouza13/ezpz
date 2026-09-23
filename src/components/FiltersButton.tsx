"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "./Icon";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import type { Category } from "@/lib/types";

export default function FiltersButton({
  categories,
  current,
}: {
  categories: Category[];
  current: { category?: string; q?: string; minPrice?: string; maxPrice?: string; region?: string };
}) {
  const router = useRouter();
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [keywords, setKeywords] = useState(current.q ?? "");
  const [category, setCategory] = useState(current.category ?? "");
  const [minPrice, setMinPrice] = useState(current.minPrice ?? "");
  const [maxPrice, setMaxPrice] = useState(current.maxPrice ?? "");

  function apply() {
    const params = new URLSearchParams();
    if (keywords.trim()) params.set("q", keywords.trim());
    if (category) params.set("category", category);
    if (minPrice) params.set("minPrice", minPrice);
    if (maxPrice) params.set("maxPrice", maxPrice);
    if (current.region) params.set("region", current.region);
    setOpen(false);
    router.push(params.toString() ? `/?${params.toString()}` : "/");
  }

  function clearAll() {
    setKeywords("");
    setCategory("");
    setMinPrice("");
    setMaxPrice("");
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
              <label>{t("filters.hourlyRate")}</label>
              <div className="price-row">
                <div className="field" style={{ marginBottom: 0 }}>
                  <input
                    className="control"
                    type="number"
                    min="0"
                    placeholder={t("filters.min")}
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                  />
                </div>
                <div className="field" style={{ marginBottom: 0 }}>
                  <input
                    className="control"
                    type="number"
                    min="0"
                    placeholder={t("filters.max")}
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                  />
                </div>
              </div>
            </div>

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
