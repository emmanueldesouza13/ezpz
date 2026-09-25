"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon from "./Icon";
import { useLanguage } from "@/lib/i18n/LanguageContext";

// Split out from CategoryNav (a server component) purely so these
// aria-labels can be translated — the icons themselves carry no visible
// text either way.
export default function IconNavRow({
  hasUnread,
}: {
  hasUnread: boolean;
}) {
  const { t } = useLanguage();
  const pathname = usePathname();

  // Highlights whichever tab the person is currently in, the way a real
  // app's tab bar does — "/" only matches the home page itself so it
  // doesn't light up for every other route.
  const cls = (active: boolean) => `icon-nav-btn${active ? " active" : ""}`;

  return (
    <nav className="icon-nav-row" aria-label="Quick navigation">
      <Link href="/" className={cls(pathname === "/")} aria-label={t("nav.home")}>
        <Icon name="Home" size={18} />
        <span className="icon-nav-label">{t("nav.homeLabel")}</span>
      </Link>
      <Link href="/taxi" className={cls(pathname.startsWith("/taxi"))} aria-label={t("nav.taxi")}>
        <Icon name="Car" size={18} />
        <span className="icon-nav-label">{t("nav.taxiLabel")}</span>
      </Link>
      <Link
        href="/messages"
        className={cls(pathname.startsWith("/messages"))}
        aria-label={hasUnread ? t("nav.messagesUnread") : t("nav.messages")}
      >
        <Icon name="MessageCircle" size={18} />
        {hasUnread && <span className="icon-nav-badge" />}
        <span className="icon-nav-label">{t("nav.chatLabel")}</span>
      </Link>
      <Link
        href="/account"
        className={cls(pathname.startsWith("/account"))}
        aria-label={t("nav.profile")}
      >
        <Icon name="CircleUserRound" size={18} />
        <span className="icon-nav-label">{t("nav.profileLabel")}</span>
      </Link>
    </nav>
  );
}
