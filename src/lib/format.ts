// listing.images entries are either an uploaded photo's public URL or a
// preset CSS gradient string (the old placeholder scheme). This tells them apart.
export function isPhotoUrl(v: string): boolean {
  return v.startsWith("http://") || v.startsWith("https://");
}

export function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diffMs = Math.max(0, now - then);
  const mins = Math.floor(diffMs / 60000);
  if (mins < 60) return mins <= 1 ? "just now" : `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

export function fmtChatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

// Strips digits as someone types a listing description, so phone numbers
// and other numeric contact info can't be slipped in to route buyers around
// in-app messaging. Covers typing and pasting alike, since both go through
// the same onChange.
export function stripDigits(value: string): string {
  return value.replace(/[0-9]/g, "");
}
