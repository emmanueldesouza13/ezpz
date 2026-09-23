"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Avatar from "./Avatar";
import Icon from "./Icon";
import { toast } from "@/lib/toast";
import { createClient } from "@/lib/supabase/client";
import { hideConversationForMe, blockConversationPartner } from "@/lib/data";
import type { Conversation, Message } from "@/lib/types";
import { fmtChatTime } from "@/lib/format";
import { useLanguage } from "@/lib/i18n/LanguageContext";

// One row in the messages inbox: the conversation link, plus a 3-dot menu
// with "Delete chat" (hides it from this inbox only) and "Block person"
// (hides it and blocks messaging in both directions). Each option needs a
// second tap to confirm — matching the tap-to-confirm pattern used for
// destructive actions elsewhere in the app instead of a native dialog.
export default function ConversationRow({
  conversation,
  userId,
  last,
  onRemoved,
}: {
  conversation: Conversation;
  userId: string | null;
  last?: Message;
  onRemoved: (id: string) => void;
}) {
  const supabase = createClient();
  const { t } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirming, setConfirming] = useState<"delete" | "block" | null>(null);
  const [busy, setBusy] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top?: number; bottom?: number; right: number } | null>(
    null
  );
  const menuRef = useRef<HTMLDivElement>(null);
  const menuBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
        setConfirming(null);
      }
    }
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  // The conversation list sits in a card with `overflow: hidden` (for its
  // rounded corners), which silently clips an absolutely-positioned dropdown
  // that opens downward off the last row. Position the dropdown relative to
  // the viewport instead, and flip it to open upward when there isn't room
  // below, so it's never cut off no matter which row it's on.
  function toggleMenu() {
    if (!menuOpen) {
      const btn = menuBtnRef.current;
      if (btn) {
        const rect = btn.getBoundingClientRect();
        const dropdownHeight = 108; // ~2 menu items
        const right = window.innerWidth - rect.right;
        if (window.innerHeight - rect.bottom < dropdownHeight + 12) {
          setMenuPos({ bottom: window.innerHeight - rect.top + 4, right });
        } else {
          setMenuPos({ top: rect.bottom + 4, right });
        }
      }
    }
    setMenuOpen((v) => !v);
    setConfirming(null);
  }

  const isBuyer = conversation.buyer_id === userId;
  const other = isBuyer ? conversation.seller : conversation.buyer;

  async function handleDelete() {
    if (confirming !== "delete") {
      setConfirming("delete");
      return;
    }
    setBusy(true);
    const ok = await hideConversationForMe(supabase, conversation.id);
    setBusy(false);
    setMenuOpen(false);
    setConfirming(null);
    if (ok) {
      toast("Chat deleted");
      onRemoved(conversation.id);
    } else {
      toast("Couldn't delete chat — try again");
    }
  }

  async function handleBlock() {
    if (confirming !== "block") {
      setConfirming("block");
      return;
    }
    setBusy(true);
    const ok = await blockConversationPartner(supabase, conversation.id);
    setBusy(false);
    setMenuOpen(false);
    setConfirming(null);
    if (ok) {
      toast(`Blocked ${other?.display_name ?? "this person"}`);
      onRemoved(conversation.id);
    } else {
      toast("Couldn't block — try again");
    }
  }

  return (
    <div className="convo-row">
      <Link href={`/messages/${conversation.id}`} className="convo-row-link">
        <div className="avatar-wrap">
          <Avatar
            url={other?.avatar_url}
            color={other?.avatar_color}
            name={other?.display_name}
            className="avatar"
          />
        </div>
        <div className="convo-text">
          <div className="convo-top">
            <span className="convo-name">{other?.display_name ?? t("messages.userFallback")}</span>
            <span className="convo-time">{last ? fmtChatTime(last.created_at) : ""}</span>
          </div>
          <p className="convo-listing">{conversation.listing?.title}</p>
          <p className="convo-snippet">{last?.body ?? t("messages.sayHello")}</p>
        </div>
      </Link>
      <div className="convo-menu" ref={menuRef}>
        <button
          type="button"
          className="convo-menu-btn"
          aria-label={t("messages.chatOptions")}
          ref={menuBtnRef}
          onClick={toggleMenu}
        >
          <Icon name="MoreVertical" size={17} />
        </button>
        {menuOpen && menuPos && (
          <div
            className="distance-menu convo-menu-dropdown"
            style={{
              top: menuPos.top,
              bottom: menuPos.bottom,
              right: menuPos.right,
            }}
          >
            <button
              type="button"
              className="distance-menu-item"
              disabled={busy}
              onClick={handleDelete}
            >
              <Icon name="Trash2" size={15} />
              {confirming === "delete" ? t("common.tapAgainConfirm") : t("messages.deleteChat")}
            </button>
            <button
              type="button"
              className="distance-menu-item danger"
              disabled={busy}
              onClick={handleBlock}
            >
              <Icon name="Ban" size={15} />
              {confirming === "block" ? t("common.tapAgainConfirm") : t("messages.blockPerson")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
