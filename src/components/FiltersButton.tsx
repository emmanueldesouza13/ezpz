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
  current: { category?: string; q?: string; region?: string; verified?: boolean };
}) {
  const router = useRouter();
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [keywords, setKeywords] = useState(current.q ?? "");
  const [category, setCategory] = useState(current.category ?? "");
  const [verifiedOnly, setVerifiedOnly] = useState(current.verified ?? false);

  function apply() {
    const params = new URLSearchParams();
    if (keywords.trim()) params.set("q", keywords.trim());
    if (category) params.set("category", category);
    if (current.region) params.set("region", current.region);
    if (verifiedOnly) params.set("verified", "1");
    setOpen(false);
    router.push(params.toString() ? `/?${params.toString()}` : "/");
  }

  function clearAll() {
    setKeywords("");
    setCategory("");
    setVerifiedOnly(false);
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
