import type { SupabaseClient } from "@supabase/supabase-js";
import type { Category, Listing, Profile, Conversation, Message, Settings, TaxiService, Review, VerificationRequest } from "./types";
import { REGION_TOWNS } from "./guyana";

// Thin query helpers shared by server and browser components — pass either
// createClient() from lib/supabase/server or lib/supabase/client.

const DEFAULT_LOGO_URL = "/logo.png";

// Applies a free-text search across several ilike-matched columns, word by
// word: each word must match SOME field (so "Jeep Wrangler" still finds a
// row where "Jeep" is only in vehicle_make and "Wrangler" is only in
// vehicle_model), but every word has to match somewhere on the row for it
// to count as a hit. Supabase-js ANDs together multiple .or() calls, which
// gives us that "every word, any field" behavior for free.
function applyWordSearch<T>(
  query: T,
  term: string,
  fields: string[]
): T {
  // Commas/parens have special meaning in PostgREST's .or() filter syntax,
  // so strip them from the raw search term before building it.
  const safe = term.replace(/[,()]/g, "");
  const words = safe.split(/\s+/).filter(Boolean);
  let q = query;
  for (const word of words) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    q = (q as any).or(fields.map((f) => `${f}.ilike.%${word}%`).join(","));
  }
  return q;
}

export async function getSiteSettings(supabase: SupabaseClient): Promise<Settings> {
  const { data } = await supabase.from("settings").select("*").eq("id", 1).maybeSingle();
  return (
    (data as Settings) || {
      id: 1,
      logo_url: DEFAULT_LOGO_URL,
      platform_mmg_number: null,
      listing_fee: 2000,
      taxi_mmg_number: null,
      taxi_fee: 5000,
      verification_fee: 2000,
      updated_at: "",
    }
  );
}

export async function getTaxiServices(
  supabase: SupabaseClient,
  q?: string | null
): Promise<TaxiService[]> {
  let query = supabase
    .from("taxi_services")
    .select("*")
    .eq("status", "active")
    .order("created_at", { ascending: false });

  const term = q?.trim();
  if (term) {
    query = applyWordSearch(query, term, [
      "driver_name",
      "vehicle_make",
      "vehicle_model",
      "plate",
      "service_area",
    ]);
  }

  const { data, error } = await query;
  if (error) {
    console.error("getTaxiServices error", error);
    return [];
  }
  return (data as TaxiService[]) || [];
}

export async function getMyTaxiServices(
  supabase: SupabaseClient,
  ownerId: string
): Promise<TaxiService[]> {
  const { data, error } = await supabase
    .from("taxi_services")
    .select("*")
    .eq("owner_id", ownerId)
    .neq("status", "removed")
    .order("created_at", { ascending: false });
  if (error) {
    console.error("getMyTaxiServices error", error);
    return [];
  }
  return (data as TaxiService[]) || [];
}

export async function getTaxiServiceById(
  supabase: SupabaseClient,
  id: string
): Promise<TaxiService | null> {
  const { data } = await supabase.from("taxi_services").select("*").eq("id", id).maybeSingle();
  return (data as TaxiService) || null;
}

export async function getCategories(supabase: SupabaseClient): Promise<Category[]> {
  const { data } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order", { ascending: true });
  return (data as Category[]) || [];
}

export async function getListings(
  supabase: SupabaseClient,
  opts: {
    category?: string | null;
    q?: string | null;
    minPrice?: number | null;
    maxPrice?: number | null;
    region?: string | null;
  } = {}
): Promise<Listing[]> {
  let query = supabase
    .from("listings")
    .select("*, seller:profiles(*)")
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (opts.category) query = query.eq("category", opts.category);
  if (opts.q) {
    const term = opts.q.trim();
    if (term) {
      query = applyWordSearch(query, term, ["title", "location", "description"]);
    }
  }
  if (opts.minPrice != null) query = query.gte("price", opts.minPrice);
  if (opts.maxPrice != null) query = query.lte("price", opts.maxPrice);
  if (opts.region) {
    const towns = REGION_TOWNS[opts.region] ?? [];
    query =
      towns.length > 0
        ? query.or(towns.map((t) => `location.ilike.%${t}%`).join(","))
        : query.eq("location", "__no_listings_match_this_region__");
  }

  const { data, error } = await query;
  if (error) {
    console.error("getListings error", error);
    return [];
  }
  return (data as Listing[]) || [];
}

export async function getMyListings(
  supabase: SupabaseClient,
  sellerId: string
): Promise<Listing[]> {
  const { data, error } = await supabase
    .from("listings")
    .select("*, seller:profiles(*)")
    .eq("seller_id", sellerId)
    .neq("status", "removed")
    .order("created_at", { ascending: false });
  if (error) {
    console.error("getMyListings error", error);
    return [];
  }
  return (data as Listing[]) || [];
}

export async function getSellerActiveListings(
  supabase: SupabaseClient,
  sellerId: string
): Promise<Listing[]> {
  const { data, error } = await supabase
    .from("listings")
    .select("*")
    .eq("seller_id", sellerId)
    .eq("status", "active")
    .order("created_at", { ascending: false });
  if (error) {
    console.error("getSellerActiveListings error", error);
    return [];
  }
  return (data as Listing[]) || [];
}

export async function getSellerTaxiServices(
  supabase: SupabaseClient,
  ownerId: string
): Promise<TaxiService[]> {
  const { data, error } = await supabase
    .from("taxi_services")
    .select("*")
    .eq("owner_id", ownerId)
    .eq("status", "active")
    .order("created_at", { ascending: false });
  if (error) {
    console.error("getSellerTaxiServices error", error);
    return [];
  }
  return (data as TaxiService[]) || [];
}

export async function getListingById(
  supabase: SupabaseClient,
  id: string
): Promise<Listing | null> {
  const { data } = await supabase
    .from("listings")
    .select("*, seller:profiles(*)")
    .eq("id", id)
    .maybeSingle();
  return (data as Listing) || null;
}

export async function getProfile(
  supabase: SupabaseClient,
  id: string
): Promise<Profile | null> {
  const { data } = await supabase.from("profiles").select("*").eq("id", id).maybeSingle();
  return (data as Profile) || null;
}

export async function getReviews(
  supabase: SupabaseClient,
  sellerId: string
): Promise<Review[]> {
  const { data, error } = await supabase
    .from("reviews")
    .select("*, reviewer:profiles!reviews_reviewer_id_fkey(*)")
    .eq("seller_id", sellerId)
    .order("created_at", { ascending: false });
  if (error) {
    console.error("getReviews error", error);
    return [];
  }
  return (data as Review[]) || [];
}

export async function getMyConversations(
  supabase: SupabaseClient,
  userId: string
): Promise<Conversation[]> {
  const { data } = await supabase
    .from("conversations")
    .select("*, listing:listings(*), buyer:profiles!conversations_buyer_id_fkey(*), seller:profiles!conversations_seller_id_fkey(*)")
    // Skip conversations the viewer deleted from their own inbox (the other
    // side's copy is unaffected — deleting is one-sided).
    .or(
      `and(buyer_id.eq.${userId},hidden_for_buyer.eq.false),and(seller_id.eq.${userId},hidden_for_seller.eq.false)`
    )
    .order("created_at", { ascending: false });
  return (data as Conversation[]) || [];
}

// Hides a conversation from the caller's own inbox only — the other
// participant still sees it and can still message. Backed by a
// SECURITY DEFINER RPC so a participant can flip their own hidden flag
// without being able to touch anything else on the row.
export async function hideConversationForMe(
  supabase: SupabaseClient,
  conversationId: string
): Promise<boolean> {
  const { error } = await supabase.rpc("hide_conversation_for_me", {
    p_conversation_id: conversationId,
  });
  if (error) {
    console.error("hideConversationForMe error", error);
    return false;
  }
  return true;
}

// Hides the conversation for the caller AND blocks the other participant —
// blocked users can't start a new conversation or send messages to each
// other in either direction from this point on.
export async function blockConversationPartner(
  supabase: SupabaseClient,
  conversationId: string
): Promise<boolean> {
  const { error } = await supabase.rpc("block_conversation_partner", {
    p_conversation_id: conversationId,
  });
  if (error) {
    console.error("blockConversationPartner error", error);
    return false;
  }
  return true;
}

export async function getOrCreateConversation(
  supabase: SupabaseClient,
  listingId: string,
  buyerId: string,
  sellerId: string
): Promise<Conversation | null> {
  const { data: existing } = await supabase
    .from("conversations")
    .select("*")
    .eq("listing_id", listingId)
    .eq("buyer_id", buyerId)
    .maybeSingle();
  if (existing) {
    // Messaging again after deleting the chat should bring it back into
    // the buyer's inbox instead of leaving it hidden with new messages
    // silently piling up in it.
    if (existing.hidden_for_buyer) {
      await supabase
        .from("conversations")
        .update({ hidden_for_buyer: false })
        .eq("id", existing.id);
    }
    return existing as Conversation;
  }

  const { data, error } = await supabase
    .from("conversations")
    .insert({ listing_id: listingId, buyer_id: buyerId, seller_id: sellerId })
    .select("*")
    .single();
  if (error) {
    console.error("getOrCreateConversation error", error);
    return null;
  }
  return data as Conversation;
}

// Powers the red dot on the Messages nav icon — true if any conversation
// has a message from the other participant the caller hasn't read yet.
export async function getHasUnreadMessages(supabase: SupabaseClient): Promise<boolean> {
  const { data, error } = await supabase.rpc("has_unread_messages");
  if (error) {
    console.error("getHasUnreadMessages error", error);
    return false;
  }
  return Boolean(data);
}

// Marks the caller's side of a conversation as read "now" — clears the
// unread badge for it. Safe to call liberally (opening the thread,
// receiving a message while it's open).
export async function markConversationRead(
  supabase: SupabaseClient,
  conversationId: string
): Promise<void> {
  const { error } = await supabase.rpc("mark_conversation_read", {
    p_conversation_id: conversationId,
  });
  if (error) console.error("markConversationRead error", error);
}

export async function getMyVerificationRequest(
  supabase: SupabaseClient,
  userId: string
): Promise<VerificationRequest | null> {
  const { data } = await supabase
    .from("verification_requests")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  return (data as VerificationRequest) || null;
}

export async function getMessages(
  supabase: SupabaseClient,
  conversationId: string
): Promise<Message[]> {
  const { data } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });
  return (data as Message[]) || [];
}

export async function sendMessage(
  supabase: SupabaseClient,
  conversationId: string,
  senderId: string,
  body: string
): Promise<Message | null> {
  const { data, error } = await supabase
    .from("messages")
    .insert({ conversation_id: conversationId, sender_id: senderId, body })
    .select("*")
    .single();
  if (error) {
    console.error("sendMessage error", error);
    return null;
  }
  // A new message should always surface in both inboxes — otherwise, if
  // either side had previously deleted this chat, it stays hidden for them
  // while new messages keep quietly arriving underneath.
  await supabase
    .from("conversations")
    .update({ hidden_for_buyer: false, hidden_for_seller: false })
    .eq("id", conversationId);
  return data as Message;
}
