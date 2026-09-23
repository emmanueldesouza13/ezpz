"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getSiteSettings } from "@/lib/data";
import Icon from "./Icon";

const REGIONS = Array.from({ length: 10 }, (_, i) => `Region ${i + 1}`);
const DEFAULT_REGION_LABEL = "Georgetown, Guyana";

export default function Header() {
  const [email, setEmail] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState("/logo.png");
  const [region, setRegion] = useState(DEFAULT_REGION_LABEL);
  const [regionOpen, setRegionOpen] = useState(false);
  const regionRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const supabase = createClient();
  const router = useRouter();

  // Reflect whatever region (if any) is already in the URL — read manually
  // instead of via useSearchParams() so pages that render Header can stay
  // statically prerendered.
  useEffect(() => {
    try {
      const r = new URLSearchParams(window.location.search).get("region");
      if (r && REGIONS.includes(r)) setRegion(r);
    } catch {
      // ignore — just fall back to the default label
    }
  }, []);

  // Picking a region always sends the buyer to the browse feed filtered to
  // it, whatever page the header happens to be on; picking "All regions"
  // clears the filter. Other active filters (search, category, price) are
  // preserved.
  function selectRegion(r: string | null) {
    setRegion(r ?? DEFAULT_REGION_LABEL);
    setRegionOpen(false);
    let params: URLSearchParams;
    try {
      params = new URLSearchParams(window.location.search);
    } catch {
      params = new URLSearchParams();
    }
    if (r) params.set("region", r);
    else params.delete("region");
    const qs = params.toString();
    router.push(qs ? `/?${qs}` : "/");
  }

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user?.email ?? null);
    });
    getSiteSettings(supabase).then((s) => setLogoUrl(s.logo_url));
    return () => sub.subscription.unsubscribe();
  }, [supabase]);

  // Publish the header's real rendered height as a CSS var so the quick-nav
  // row below it can stick right underneath, however many lines the header
  // wraps to (logo/location/search/button reflow differently by viewport).
  useEffect(() => {
    const el = headerRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const setVar = () => {
      document.documentElement.style.setProperty("--header-h", `${el.offsetHeight}px`);
    };
    setVar();
    const observer = new ResizeObserver(setVar);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (regionRef.current && !regionRef.current.contains(e.target as Node)) setRegionOpen(false);
    }
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  return (
    <header className="site-header" ref={headerRef}>
      <div className="wrap header-row">
        <Link href="/" className="logo brand-face">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoUrl} alt="EzPz" className="logo-img" />
        </Link>
        <div className="locale-filter" ref={regionRef}>
          <button type="button" className="locale" onClick={() => setRegionOpen((v) => !v)}>
            <Icon name="MapPin" size={15} />
            {region}
          </button>
          {regionOpen && (
            <div className="distance-menu region-menu">
              <p className="distance-menu-label">Choose a region</p>
              <button
                type="button"
                className={`distance-menu-item${region === DEFAULT_REGION_LABEL ? " active" : ""}`}
                onClick={() => selectRegion(null)}
              >
                All regions
              </button>
              {REGIONS.map((r) => (
                <button
                  type="button"
                  key={r}
                  className={`distance-menu-item${region === r ? " active" : ""}`}
                  onClick={() => selectRegion(r)}
                >
                  {r}
                </button>
              ))}
            </div>
          )}
        </div>
        <form
          className="search-form"
          action="/"
          onSubmit={(e) => {
            const input = (e.currentTarget.elements.namedItem("q") as HTMLInputElement);
            if (!input.value.trim()) e.preventDefault();
          }}
        >
          <Icon name="Search" size={17} style={{ flexShrink: 0, color: "var(--ink-faint)" }} />
          <input
            name="q"
            type="text"
            placeholder="Search"
            autoComplete="off"
          />
        </form>
        {email && (
          <Link href="/post" className="btn btn-accent">
            <Icon name="Plus" size={15} strokeWidth={2.4} />
            Post a listing
          </Link>
        )}
        {!email && (
          <Link href="/sign-in" className="btn btn-line header-account">
            Sign in
          </Link>
        )}
      </div>
    </header>
  );
}
