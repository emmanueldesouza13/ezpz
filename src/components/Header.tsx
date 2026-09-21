"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getSiteSettings } from "@/lib/data";
import Icon from "./Icon";

const REGIONS = Array.from({ length: 10 }, (_, i) => `Region ${i + 1}`);

export default function Header() {
  const [email, setEmail] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState("/logo.png");
  const [region, setRegion] = useState("Georgetown, Guyana");
  const [regionOpen, setRegionOpen] = useState(false);
  const regionRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user?.email ?? null);
    });
    getSiteSettings(supabase).then((s) => setLogoUrl(s.logo_url));
    return () => sub.subscription.unsubscribe();
  }, [supabase]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (regionRef.current && !regionRef.current.contains(e.target as Node)) setRegionOpen(false);
    }
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  return (
    <header className="site-header">
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
              {REGIONS.map((r) => (
                <button
                  type="button"
                  key={r}
                  className={`distance-menu-item${region === r ? " active" : ""}`}
                  onClick={() => {
                    setRegion(r);
                    setRegionOpen(false);
                  }}
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
        {email ? (
          <Link href="/account" className="btn btn-line header-account" title={email}>
            Account
          </Link>
        ) : (
          <Link href="/sign-in" className="btn btn-line header-account">
            Sign in
          </Link>
        )}
      </div>
    </header>
  );
}
