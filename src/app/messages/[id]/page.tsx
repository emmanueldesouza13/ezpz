"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { use as usePromise } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Icon from "@/components/Icon";
import { createClient } from "@/lib/supabase/client";
import { getMessages, sendMessage } from "@/lib/data";
import type { Conversation, Message } from "@/lib/types";
import { fmtChatTime } from "@/lib/format";

export default function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = usePromise(params);
  const supabase = createClient();
  const router = useRouter();

  const [userId, setUserId] = useState<string | null>(null);
  const [convo, setConvo] = useState<Conversation | null | undefined>(undefined);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

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
      if (c) setMessages(await getMessages(supabase, id));
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
              Conversation not found.{" "}
              <Link href="/messages" style={{ color: "var(--brand)", fontWeight: 700 }}>
                Back to messages
              </Link>
            </div>
          </section>
        </main>
        <Footer />
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
              <div className="avatar-wrap">
                <div
                  className="avatar"
                  style={{ width: 34, height: 34, fontSize: "0.85rem", background: other?.avatar_color }}
                >
                  {other?.display_name?.charAt(0) ?? "?"}
                </div>
                {other?.available && <span className="avail-dot" style={{ width: 9, height: 9 }} />}
              </div>
              <div>
                <div className="chat-head-name">{other?.display_name ?? "User"}</div>
                <div className="chat-head-listing">{convo.listing?.title}</div>
              </div>
            </div>
            <div className="chat-scroll" ref={scrollRef}>
              {messages.map((m) => (
                <div className={`bubble-row ${m.sender_id === userId ? "me" : "them"}`} key={m.id}>
                  <div>
                    <div className="bubble">{m.body}</div>
                    <div className="bubble-time">{fmtChatTime(m.created_at)}</div>
                  </div>
                </div>
              ))}
            </div>
            <form className="chat-input-row" onSubmit={handleSend}>
              <textarea
                rows={1}
                placeholder="Write a message…"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend(e);
                  }
                }}
              />
              <button type="submit" className="chat-send" aria-label="Send" disabled={sending}>
                <Icon name="Send" />
              </button>
            </form>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
