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
  responseRate,
  mmg,
}: {
  listingId: string;
  sellerId: string;
  responseRate: number;
  mmg: string | null;
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

  function handleCopy() {
    if (!mmg) return;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(mmg).then(
        () => toast("MMG number copied — " + mmg),
        () => toast("MMG number: " + mmg)
      );
    } else {
      toast("MMG number: " + mmg);
    }
  }

  return (
    <>
      <button type="button" className="btn btn-brand btn-block" onClick={handleMessage}>
        <Icon name="MessageCircle" />
        Message seller
      </button>
      <p className="msg-note">
        Responds to about {responseRate}% of messages. Contact stays inside EzPz — no phone
        number shared until you choose to share it.
      </p>
      <div className="mmg-box">
        <div className="mmg-label">
          <Icon name="Wallet" />
          Pay via MMG
        </div>
        {mmg ? (
          <>
            <div className="mmg-number-row">
              <span className="mmg-number mono">{mmg}</span>
              <button type="button" className="mmg-copy" onClick={handleCopy}>
                <Icon name="Copy" />
                Copy
              </button>
            </div>
            <p className="mmg-caption">
              Send payment directly to this number once the work is confirmed. EzPz never holds
              or processes the money.
            </p>
          </>
        ) : (
          <p className="mmg-caption">
            This seller hasn&#39;t added an MMG number yet — ask for one in the chat before you
            send any payment.
          </p>
        )}
      </div>
    </>
  );
}
