"use client";

import type { ElementType } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";

// A tiny bridge for translating a single string inside a server component's
// tree, without converting the whole page to a client component. Usage:
// <T k="browse.noneYet" /> or <T k="taxi.results" vars={{ count }} as="p" />
export default function T({
  k,
  vars,
  as: As = "span",
  className,
}: {
  k: string;
  vars?: Record<string, string | number>;
  as?: ElementType;
  className?: string;
}) {
  const { t } = useLanguage();
  return <As className={className}>{t(k, vars)}</As>;
}
