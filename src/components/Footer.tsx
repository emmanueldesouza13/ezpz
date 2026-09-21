"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Icon from "./Icon";
import { createClient } from "@/lib/supabase/client";
import { getSiteSettings } from "@/lib/data";

export default function Footer() {
  const [logoUrl, setLogoUrl] = useState("/logo.png");
  const supabase = createClient();

  useEffect(() => {
    getSiteSettings(supabase).then((s) => setLogoUrl(s.logo_url));
  }, [supabase]);

  return (
    <footer className="site-footer">
      <div className="wrap footer-grid">
        <div>
          <Link href="/" className="logo brand-face" style={{ fontSize: "1rem" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logoUrl} alt="EzPz" className="logo-img" style={{ height: 30 }} />
          </Link>
          <p className="footer-blurb">Local services across Guyana, booked the easy way.</p>
        </div>
        <div>
          <h3>Trust &amp; Safety</h3>
          <ul>
            <li><Link href="/safety">Safety tips</Link></li>
            <li><Link href="/safety">Report a listing</Link></li>
            <li><Link href="/safety">Community guidelines</Link></li>
          </ul>
        </div>
      </div>
      <div className="footer-bottom">
        <div className="wrap">
          <span>&copy; {new Date().getFullYear()} EzPz. All rights reserved.</span>
          <span>
            <Icon name="ShieldCheck" size={13} />
            Verified sellers &middot; In-app messaging &middot; Direct MMG payments
          </span>
        </div>
      </div>
    </footer>
  );
}
