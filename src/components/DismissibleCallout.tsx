"use client";

import { useState } from "react";
import Icon from "./Icon";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function DismissibleCallout({ children }: { children: React.ReactNode }) {
  const [dismissed, setDismissed] = useState(false);
  const { t } = useLanguage();
  if (dismissed) return null;

  return (
    <div className="callout">
      <Icon name="Shield" />
      <span>{children}</span>
      <button
        type="button"
        className="callout-close"
        aria-label={t("auth.dismiss")}
        onClick={() => setDismissed(true)}
      >
        <Icon name="X" size={14} />
      </button>
    </div>
  );
}
