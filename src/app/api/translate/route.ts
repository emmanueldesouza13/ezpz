import { NextResponse } from "next/server";
import { translateText } from "@/lib/translate";
import { LANGS, type Lang } from "@/lib/i18n/translations";

const VALID_LANGS = new Set<string>(LANGS.map((l) => l.code));

// Tiny proxy in front of the free MyMemory translation API — see
// src/lib/translate.ts for why this exists and its trade-offs. Kept
// server-side rather than called directly from the browser so a future key
// or provider swap doesn't need a client change, and so a bad/huge request
// body never reaches MyMemory unchecked.
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }

  const { text, target } = (body as { text?: unknown; target?: unknown }) ?? {};
  if (typeof text !== "string" || !text.trim() || typeof target !== "string" || !VALID_LANGS.has(target)) {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }
  // A chat message is short by nature; cap it so this can't be used to
  // proxy-translate arbitrarily large text through our server.
  if (text.length > 2000) {
    return NextResponse.json({ ok: false, error: "too_long" }, { status: 400 });
  }

  const result = await translateText(text, target as Lang);
  if (!result.ok) {
    return NextResponse.json(result, { status: 502 });
  }
  return NextResponse.json(result);
}
