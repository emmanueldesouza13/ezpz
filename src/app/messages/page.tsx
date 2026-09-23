"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import BackButton from "@/components/BackButton";
import ConversationRow from "@/components/ConversationRow";
import { createClient } from "@/lib/supabase/client";
import { getMyConversations } from "@/lib/data";
import type { Conversation, Message } from "@/lib/types";

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
                {sorted.map((c) => (
                  <ConversationRow
                    key={c.id}
                    conversation={c}
                    userId={userId}
                    last={lastByConvo[c.id]}
                    onRemoved={(id) => setConvos((prev) => prev.filter((cv) => cv.id !== id))}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
    </>
  );
}
