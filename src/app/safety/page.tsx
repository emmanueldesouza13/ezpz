"use client";

import Header from "@/components/Header";
import Icon from "@/components/Icon";
import BackButton from "@/components/BackButton";
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
  return (
    <>
      <Header />
      <main>
        <section className="wrap">
          <div className="safety-wrap">
            <BackButton />
            <h1>{t("safety.title")}</h1>
            <p className="lede">{t("safety.lede")}</p>
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
        </section>
      </main>
    </>
  );
}
