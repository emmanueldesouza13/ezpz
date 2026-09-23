"use client";

import Link from "next/link";
import Icon from "./Icon";
import { useLanguage } from "@/lib/i18n/LanguageContext";

// Split out from CategoryNav (a server component) purely so these
// aria-labels can be translated — the icons themselves carry no visible
// text either way.
export default function IconNavRow({ hasUnread }: { hasUnread: boolean }) {
  const { t } = useLanguage();

  return (
    <nav className="icon-nav-row" aria-label="Quick navigation">
      <Link href="/" className="icon-nav-btn" aria-label={t("nav.home")}>
        <Icon name="Home" size={18} />
      </Link>
      <Link href="/payments" className="icon-nav-btn" aria-label={t("nav.payments")}>
        <Icon name="Wallet" size={18} />
      </Link>
      <Link
        href="/messages"
        className="icon-nav-btn"
        aria-label={hasUnread ? t("nav.messagesUnread") : t("nav.messages")}
      >
        <Icon name="MessageCircle" size={18} />
        {hasUnread && <span className="icon-nav-badge" />}
      </Link>
      <Link href="/taxi" className="icon-nav-btn" aria-label={t("nav.taxi")}>
        <Icon name="Car" size={18} />
      </Link>
      <Link href="/account" className="icon-nav-btn" aria-label={t("nav.profile")}>
        <Icon name="CircleUserRound" size={18} />
      </Link>
    </nav>
  );
}
