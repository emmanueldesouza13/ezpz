"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import Icon from "@/components/Icon";
import BackButton from "@/components/BackButton";
import { createClient } from "@/lib/supabase/client";
import { getSiteSettings } from "@/lib/data";
import type { Settings } from "@/lib/types";
import { useLanguage } from "@/lib/i18n/LanguageContext";

const TIPS = [
  { key: "scope", icon: "Shield" },
  { key: "meet", icon: "MapPin" },
  { key: "inApp", icon: "MessageCircle" },
  { key: "inspect", icon: "Users" },
  { key: "verified", icon: "Shield" },
  { key: "mmg", icon: "Wallet" },
];

export default function SafetyPage() {
  const { t } = useLanguage();
  const supabase = createClient();
  const [settings, setSettings] = useState<Settings | null>(null);

  useEffect(() => {
    getSiteSettings(supabase).then(setSettings);
  }, [supabase]);

  // Admin-edited text (from the settings table) wins when it's set; every
  // section otherwise falls back to the built-in translated copy.
  const tipsLede = settings?.safety_tips_text?.trim() || t("safety.lede");
  const reportBody = settings?.report_listing_text?.trim() || t("safety.reportListing.body");
  const guidelinesBody = settings?.community_guidelines_text?.trim() || t("safety.communityGuidelines.body");

  return (
    <>
      <Header />
      <main>
        <section className="wrap">
          <div className="safety-wrap">
            <BackButton />

            <div id="safety-tips">
              <h1>{t("safety.title")}</h1>
              <p className="lede">{tipsLede}</p>
              {TIPS.map((tip) => (
                <div className="card tip-card" key={tip.key}>
                  <div className="tip-icon">
                    <Icon name={tip.icon} />
                  </div>
                  <div>
                    <h2>{t(`safety.tips.${tip.key}.title`)}</h2>
                    <p>{t(`safety.tips.${tip.key}.body`)}</p>
                  </div>
                </div>
              ))}
            </div>

            <div id="report-listing" style={{ marginTop: 36, scrollMarginTop: 80 }}>
              <h1>{t("safety.reportListing.title")}</h1>
              {reportBody.split("\n\n").map((para, i) => (
                <p className="lede" key={i}>{para}</p>
              ))}
            </div>

            <div id="community-guidelines" style={{ marginTop: 36, scrollMarginTop: 80 }}>
              <h1>{t("safety.communityGuidelines.title")}</h1>
              {guidelinesBody.split("\n\n").map((para, i) => (
                <p className="lede" key={i}>{para}</p>
              ))}
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
