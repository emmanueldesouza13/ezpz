"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { use as usePromise } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Icon from "@/components/Icon";
import Avatar from "@/components/Avatar";
import { createClient } from "@/lib/supabase/client";
import { getMessages, sendMessage, markConversationRead } from "@/lib/data";
import type { Conversation, Message } from "@/lib/types";
import { fmtChatTime } from "@/lib/format";
import { toast } from "@/lib/toast";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import type { Lang } from "@/lib/i18n/translations";

export default function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = usePromise(params);
  const supabase = createClient();
  const router = useRouter();
  const { t, lang } = useLanguage();

  const [userId, setUserId] = useState<string | null>(null);
  const [convo, setConvo] = useState<Conversation | null | undefined>(undefined);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Per-message translation state, keyed by "<messageId>::<lang>" rather
  // than just the message id — a translation is only ever valid for the
  // app language it was fetched in, and folding that language into the key
  // means switching languages mid-chat naturally starts fresh (the old
  // entries are just dead keys) instead of needing an effect to clear the
  // cache on every language change. Fetched translations are cached here so
  // re-tapping "Translate" on the same message never calls the API again,
  // both to stay well under MyMemory's free daily word quota and so
  // switching back and forth feels instant after the first tap.
  const [translated, setTranslated] = useState<Record<string, string>>({});
  const [showingTranslation, setShowingTranslation] = useState<Record<string, boolean>>({});
  const [translating, setTranslating] = useState<Record<string, boolean>>({});
  const [translateFailed, setTranslateFailed] = useState<Record<string, boolean>>({});

  async function handleTranslate(m: Message) {
    const key = `${m.id}::${lang}`;
    if (showingTranslation[key]) {
      // Already translated and showing it — a second tap just flips back
      // to the original text rather than re-fetching.
      setShowingTranslation((prev) => ({ ...prev, [key]: false }));
      return;
    }
    if (translated[key]) {
      setShowingTranslation((prev) => ({ ...prev, [key]: true }));
      return;
    }
    setTranslating((prev) => ({ ...prev, [key]: true }));
    setTranslateFailed((prev) => ({ ...prev, [key]: false }));
    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: m.body, target: lang as Lang }),
      });
      const data = await res.json();
      if (data.ok) {
        setTranslated((prev) => ({ ...prev, [key]: data.translated }));
        setShowingTranslation((prev) => ({ ...prev, [key]: true }));
      } else {
        setTranslateFailed((prev) => ({ ...prev, [key]: true }));
      }
    } catch {
      setTranslateFailed((prev) => ({ ...prev, [key]: true }));
    } finally {
      setTranslating((prev) => ({ ...prev, [key]: false }));
    }
  }

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        router.push(`/sign-in?next=/messages/${id}`);
        return;
      }
      setUserId(data.user.id);

      const { data: c } = await supabase
        .from("conversations")
        .select("*, listing:listings(*), buyer:profiles!conversations_buyer_id_fkey(*), seller:profiles!conversations_seller_id_fkey(*)")
        .eq("id", id)
        .maybeSingle();
      setConvo((c as Conversation) ?? null);
      if (c) {
        setMessages(await getMessages(supabase, id));
        markConversationRead(supabase, id);
      }
    })();
  }, [supabase, router, id]);

  useEffect(() => {
    const channel = supabase
      .channel(`messages-${id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${id}` },
        (payload) => {
          setMessages((prev) =>
            prev.some((m) => m.id === (payload.new as Message).id)
              ? prev
              : [...prev, payload.new as Message]
          );
          // The thread is open and visibly receiving this message right
          // now, so it counts as read immediately — keeps the nav badge
          // from lighting up for a chat the user is actively looking at.
          markConversationRead(supabase, id);
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, id]);

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || !userId) return;
    setSending(true);
    const msg = await sendMessage(supabase, id, userId, text);
    setSending(false);
    if (msg) {
      setInput("");
      setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
    } else {
      toast("Message couldn't be sent — you may be blocked in this chat");
    }
  }

  if (convo === undefined) return null;
  if (convo === null) {
    return (
      <>
        <Header />
        <main>
          <section className="wrap">
            <div className="inbox-empty">
              {t("messages.notFound")}{" "}
              <Link href="/messages" style={{ color: "var(--brand)", fontWeight: 700 }}>
                {t("messages.backToMessages")}
              </Link>
            </div>
          </section>
        </main>
      </>
    );
  }

  const isBuyer = convo.buyer_id === userId;
  const other = isBuyer ? convo.seller : convo.buyer;

  return (
    <>
      <Header />
      <main>
        <section className="wrap">
          <div className="chat-wrap">
            <div className="chat-head">
              <Link href="/messages" className="chat-back">
                <Icon name="ArrowLeft" />
              </Link>
              {other ? (
                <Link href={`/seller/${other.id}`} className="chat-head-profile-link">
                  <div className="avatar-wrap">
                    <Avatar
                      url={other.avatar_url}
                      color={other.avatar_color}
                      name={other.display_name}
                      className="avatar"
                      style={{ width: 34, height: 34, fontSize: "0.85rem" }}
                    />
                  </div>
                  <div>
                    <div className="chat-head-name">{other.display_name ?? "User"}</div>
                    <div className="chat-head-listing">{convo.listing?.title}</div>
                  </div>
                </Link>
              ) : (
                <div>
                  <div className="chat-head-name">User</div>
                  <div className="chat-head-listing">{convo.listing?.title}</div>
                </div>
              )}
            </div>
            <div className="chat-scroll" ref={scrollRef}>
              {messages.map((m) => {
                const key = `${m.id}::${lang}`;
                const isShowingTranslation = showingTranslation[key];
                return (
                  <div className={`bubble-row ${m.sender_id === userId ? "me" : "them"}`} key={m.id}>
                    <div>
                      <div className="bubble">{isShowingTranslation ? translated[key] : m.body}</div>
                      <div className="bubble-meta">
                        <span className="bubble-time">{fmtChatTime(m.created_at)}</span>
                        <button
                          type="button"
                          className="bubble-translate-btn"
                          onClick={() => handleTranslate(m)}
                          disabled={translating[key]}
                        >
                          {translating[key]
                            ? t("messages.translating")
                            : isShowingTranslation
                              ? t("messages.showOriginal")
                              : t("messages.translate")}
                        </button>
                        {translateFailed[key] && (
                          <span className="bubble-translate-error">{t("messages.translateError")}</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <form className="chat-input-row" onSubmit={handleSend}>
              <textarea
                rows={1}
                placeholder={t("messages.writePlaceholder")}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend(e);
                  }
                }}
              />
              <button type="submit" className="chat-send" aria-label={t("messages.send")} disabled={sending}>
                <Icon name="Send" />
              </button>
            </form>
          </div>
        </section>
      </main>
    </>
  );
}
