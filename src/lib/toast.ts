export function toast(msg: string) {
  if (typeof window !== "undefined" && window.__ezpzToast) window.__ezpzToast(msg);
}
