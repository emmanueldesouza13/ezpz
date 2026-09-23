"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "./Icon";
import type { Category } from "@/lib/types";

const AVAILABILITY_OPTIONS = ["Any time", "Available today", "This week", "Weekends only"];
const DISTANCE_OPTIONS = [
  "Any distance",
  "Within 5 miles",
  "Within 10 miles",
  "Within 15 miles",
  "Within 20 miles",
  "Within 50 miles",
  "Within 100 miles",
];

export default function FiltersButton({
  categories,
  current,
}: {
  categories: Category[];
  current: { category?: string; q?: string; minPrice?: string; maxPrice?: string; region?: string };
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [keywords, setKeywords] = useState(current.q ?? "");
  const [category, setCategory] = useState(current.category ?? "");
  const [minPrice, setMinPrice] = useState(current.minPrice ?? "");
  const [maxPrice, setMaxPrice] = useState(current.maxPrice ?? "");
  const [availability, setAvailability] = useState(AVAILABILITY_OPTIONS[0]);
  const [distance, setDistance] = useState(DISTANCE_OPTIONS[0]);

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
    setAvailability(AVAILABILITY_OPTIONS[0]);
    setDistance(DISTANCE_OPTIONS[0]);
    setOpen(false);
    router.push("/");
  }

  return (
    <>
      <button className="btn btn-line" type="button" onClick={() => setOpen(true)}>
        <Icon name="SlidersHorizontal" size={14} />
        Filters
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
            <h2>Filters</h2>

            <div className="field">
              <label htmlFor="f-keywords">Keywords</label>
              <input
                className="control"
                id="f-keywords"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
              />
            </div>

            <div className="field">
              <label>Hourly rate (GY$)</label>
              <div className="price-row">
                <div className="field" style={{ marginBottom: 0 }}>
                  <input
                    className="control"
                    type="number"
                    min="0"
                    placeholder="Min"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                  />
                </div>
                <div className="field" style={{ marginBottom: 0 }}>
                  <input
                    className="control"
                    type="number"
                    min="0"
                    placeholder="Max"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="field">
              <label htmlFor="f-availability">Availability</label>
              <select
                className="control"
                id="f-availability"
                value={availability}
                onChange={(e) => setAvailability(e.target.value)}
              >
                {AVAILABILITY_OPTIONS.map((a) => (
                  <option value={a} key={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>

            <div className="field" style={{ marginBottom: 4 }}>
              <label htmlFor="f-distance">Distance</label>
              <select
                className="control"
                id="f-distance"
                value={distance}
                onChange={(e) => setDistance(e.target.value)}
              >
                {DISTANCE_OPTIONS.map((d) => (
                  <option value={d} key={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div className="modal-actions">
              <button type="button" className="btn btn-line" onClick={clearAll}>
                Clear
              </button>
              <button type="button" className="btn btn-accent" onClick={apply}>
                Apply filters
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
