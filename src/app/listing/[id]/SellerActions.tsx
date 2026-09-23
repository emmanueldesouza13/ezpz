"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getOrCreateConversation } from "@/lib/data";
import Icon from "@/components/Icon";
import { toast } from "@/lib/toast";

export default function SellerActions({
  listingId,
  sellerId,
}: {
  listingId: string;
  sellerId: string;
}) {
  const supabase = createClient();
  const router = useRouter();
  const [userId, setUserId] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, [supabase]);

  async function handleMessage() {
    if (userId === undefined) return;
    if (!userId) {
      router.push(`/sign-in?next=/listing/${listingId}`);
      return;
    }
    if (userId === sellerId) {
      toast("This is your own listing.");
      return;
    }
    const convo = await getOrCreateConversation(supabase, listingId, userId, sellerId);
    if (convo) router.push(`/messages/${convo.id}`);
    else toast("Couldn't start that conversation — try again.");
  }

  return (
    <button type="button" className="btn btn-brand btn-block" onClick={handleMessage}>
      <Icon name="MessageCircle" />
      Message
    </button>
  );
}
