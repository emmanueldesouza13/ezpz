"use client";

import Icon from "@/components/Icon";
import { useLanguage } from "@/lib/i18n/LanguageContext";

// What everyone except the admin sees while Admin -> Maintenance has the
// "Shut down site" switch on. Middleware (src/middleware.ts) is what
// actually enforces this — it rewrites every non-allowlisted request to
// this route before the real page ever renders, so this component itself
// doesn't need to check anything.
export default function MaintenancePage() {
  const { t } = useLanguage();

  return (
    <div className="age-gate">
      <div className="age-gate-card">
        <div className="icon-circle">
          <Icon name="Wrench" size={26} />
        </div>
        <h1>{t("maintenance.title")}</h1>
        <p>{t("maintenance.body")}</p>
      </div>
    </div>
  );
}
