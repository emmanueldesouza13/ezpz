// Free, no-API-key message translation for chat, backed by MyMemory
// (https://mymemory.translated.net) — a free translation API that doesn't
// need a signup or API key, at the cost of a modest ~5,000-word/day/visitor
// limit and no built-in source-language detection.
//
// Because MyMemory needs an explicit "source|target" language pair, and we
// don't record what language a chat message was typed in, this guesses the
// source from the text itself: distinctive scripts (Chinese, Hindi, Korean,
// Japanese, Thai) and Vietnamese's diacritics are detected directly, common
// Spanish accents/punctuation are checked next, and anything else falls
// back to English — a reasonable default for this app's primary language.
// Tagalog and Indonesian, written in plain Latin script with no diacritics
// of their own, can't be distinguished from English this way, so a message
// in one of those will be assumed English; MyMemory will typically just
// return the text unchanged in that case rather than mistranslate it.

import type { Lang } from "./i18n/translations";

const SCRIPT_PATTERNS: { lang: Lang; pattern: RegExp }[] = [
  { lang: "ko", pattern: /[가-힯]/ }, // Hangul
  { lang: "ja", pattern: /[぀-ヿ]/ }, // Hiragana/Katakana (checked before Han so ja wins over zh)
  { lang: "zh", pattern: /[一-鿿]/ }, // Han
  { lang: "hi", pattern: /[ऀ-ॿ]/ }, // Devanagari
  { lang: "th", pattern: /[฀-๿]/ }, // Thai
  { lang: "vi", pattern: /[ăâđêôơưĂÂĐÊÔƠƯ]|[Ạ-ỹ]/ }, // Vietnamese-only diacritics
  { lang: "es", pattern: /[ñÑ¿¡]|[áéíóúÁÉÍÓÚ]/ },
];

export function guessMessageLang(text: string): Lang {
  for (const { lang, pattern } of SCRIPT_PATTERNS) {
    if (pattern.test(text)) return lang;
  }
  return "en";
}

export type TranslateResult =
  | { ok: true; translated: string; sourceGuess: Lang }
  | { ok: false; error: string };

// MyMemory's free tier occasionally embeds a warning INSIDE a 200 response
// instead of a real translation once a visitor's daily word quota is used
// up, so a successful-looking response still needs a content check.
const QUOTA_MARKERS = ["MYMEMORY WARNING", "YOU USED ALL AVAILABLE FREE TRANSLATIONS"];

export async function translateText(text: string, target: Lang): Promise<TranslateResult> {
  const sourceGuess = guessMessageLang(text);
  if (sourceGuess === target) {
    return { ok: true, translated: text, sourceGuess };
  }

  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${sourceGuess}|${target}`;

  let res: Response;
  try {
    res = await fetch(url, { signal: AbortSignal.timeout(8000) });
  } catch {
    return { ok: false, error: "network" };
  }
  if (!res.ok) {
    return { ok: false, error: "network" };
  }

  let data: unknown;
  try {
    data = await res.json();
  } catch {
    return { ok: false, error: "parse" };
  }

  const translated = (data as { responseData?: { translatedText?: string } })?.responseData?.translatedText;
  if (typeof translated !== "string" || !translated) {
    return { ok: false, error: "empty" };
  }
  if (QUOTA_MARKERS.some((marker) => translated.toUpperCase().includes(marker))) {
    return { ok: false, error: "quota" };
  }

  return { ok: true, translated, sourceGuess };
}
