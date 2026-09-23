"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getOrCreateConversation } from "@/lib/data";
import Icon from "@/components/Icon";
import { toast } from "@/lib/toast";
import { useLanguage } from "@/lib/i18n/LanguageContext";

// Same flow as SellerActions' Message button (used on a listing page), but
// for a context — like a standalone profile page — where the listing to
// attach the conversation to isn't the page's own subject. The caller
// always passes one of the seller's own listings, so buyer/seller line up
// correctly with that listing's actual seller_id.
export default function MessageSellerButton({
  listingId,
  sellerId,
  nextPath,
}: {
  listingId: string;
  sellerId: string;
  nextPath: string;
}) {
  const supabase = createClient();
  const router = useRouter();
  const { t } = useLanguage();
  const [userId, setUserId] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, [supabase]);

  async function handleMessage() {
    if (userId === undefined) return;
    if (!userId) {
      router.push(`/sign-in?next=${encodeURIComponent(nextPath)}`);
      return;
    }
    if (userId === sellerId) {
      toast("This is your own profile.");
      return;
    }
    const convo = await getOrCreateConversation(supabase, listingId, userId, sellerId);
    if (convo) router.push(`/messages/${convo.id}`);
    else toast("Couldn't start that conversation — try again.");
  }

  return (
    <button type="button" className="btn btn-brand btn-block" onClick={handleMessage}>
      <Icon name="MessageCircle" />
      {t("listing.message")}
    </button>
  );
}
