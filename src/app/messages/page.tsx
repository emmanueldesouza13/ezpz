"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BackButton from "@/components/BackButton";
import Avatar from "@/components/Avatar";
import { createClient } from "@/lib/supabase/client";
import { getMyConversations } from "@/lib/data";
import type { Conversation, Message } from "@/lib/types";
import { fmtChatTime } from "@/lib/format";

export default function MessagesInboxPage() {
  const supabase = createClient();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [convos, setConvos] = useState<Conversation[]>([]);
  const [lastByConvo, setLastByConvo] = useState<Record<string, Message>>({});

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        router.push("/sign-in?next=/messages");
        return;
      }
      setUserId(data.user.id);
      const list = await getMyConversations(supabase, data.user.id);
      setConvos(list);

      if (list.length > 0) {
        const { data: msgs } = await supabase
          .from("messages")
          .select("*")
          .in("conversation_id", list.map((c) => c.id))
          .order("created_at", { ascending: false });
        const map: Record<string, Message> = {};
        (msgs as Message[] | null)?.forEach((m) => {
          if (!map[m.conversation_id]) map[m.conversation_id] = m;
        });
        setLastByConvo(map);
      }
      setLoading(false);
    })();
  }, [supabase, router]);

  const sorted = [...convos].sort((a, b) => {
    const at = lastByConvo[a.id]?.created_at ?? a.created_at;
    const bt = lastByConvo[b.id]?.created_at ?? b.created_at;
    return new Date(bt).getTime() - new Date(at).getTime();
  });

  return (
    <>
      <Header />
      <main>
        <section className="wrap">
          <div className="inbox-wrap">
            <BackButton />
            <h1 style={{ marginBottom: 18 }}>Messages</h1>
            {loading ? null : sorted.length === 0 ? (
              <div className="inbox-empty">
                No conversations yet. Message a seller from any listing to start one.
              </div>
            ) : (
              <div className="card" style={{ overflow: "hidden" }}>
                {sorted.map((c) => {
                  const isBuyer = c.buyer_id === userId;
                  const other = isBuyer ? c.seller : c.buyer;
                  const last = lastByConvo[c.id];
                  return (
                    <Link href={`/messages/${c.id}`} className="convo-row" key={c.id}>
                      <div className="avatar-wrap">
                        <Avatar
                          url={other?.avatar_url}
                          color={other?.avatar_color}
                          name={other?.display_name}
                          className="avatar"
                        />
                        {other?.available && <span className="avail-dot" />}
                      </div>
                      <div className="convo-text">
                        <div className="convo-top">
                          <span className="convo-name">{other?.display_name ?? "User"}</span>
                          <span className="convo-time">
                            {last ? fmtChatTime(last.created_at) : ""}
                          </span>
                        </div>
                        <p className="convo-listing">{c.listing?.title}</p>
                        <p className="convo-snippet">{last?.body ?? "Say hello 👋"}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
