"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Icon from "./Icon";
import { createClient } from "@/lib/supabase/client";
import { getSiteSettings } from "@/lib/data";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function Footer() {
  const [logoUrl, setLogoUrl] = useState("/logo.png");
  const supabase = createClient();
  const { t } = useLanguage();

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
          <p className="footer-blurb">{t("footer.blurb")}</p>
        </div>
        <div>
          <h3>{t("footer.trustSafety")}</h3>
          <ul>
            <li><Link href="/safety#safety-tips">{t("footer.safetyTips")}</Link></li>
            <li><Link href="/safety#report-listing">{t("footer.reportListing")}</Link></li>
            <li><Link href="/safety#community-guidelines">{t("footer.communityGuidelines")}</Link></li>
          </ul>
        </div>
      </div>
      <div className="footer-bottom">
        <div className="wrap">
          <span>&copy; {new Date().getFullYear()} EzPz. {t("footer.rights")}</span>
          <span>
            <Icon name="ShieldCheck" size={13} />
            {t("footer.tagline")}
          </span>
        </div>
      </div>
    </footer>
  );
}
