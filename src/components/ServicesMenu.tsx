"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import Icon from "./Icon";
import type { Category } from "@/lib/types";

export default function ServicesMenu({
  categories,
  active,
}: {
  categories: Category[];
  active?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  return (
    <div className="services-menu" ref={ref}>
      <button
        type="button"
        className={`chip${!active ? " active" : ""}`}
        onClick={() => setOpen((v) => !v)}
      >
        <Icon name="LayoutGrid" />
        Services
        <Icon name="ChevronDown" size={14} />
      </button>
      {open && (
        <div className="services-dropdown">
          <Link
            href="/"
            className={`services-dropdown-item${!active ? " active" : ""}`}
            onClick={() => setOpen(false)}
          >
            <Icon name="LayoutGrid" />
            All services
          </Link>
          {categories.map((c) => (
            <Link
              key={c.slug}
              href={`/?category=${c.slug}`}
              className={`services-dropdown-item${active === c.slug ? " active" : ""}`}
              onClick={() => setOpen(false)}
            >
              <Icon name={c.icon} />
              {c.name}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
