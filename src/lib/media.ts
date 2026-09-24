// Shared caps + upload helpers for listing/taxi media (photos + short work
// videos). Kept in one place so every posting surface — the post page, the
// edit page, the profile/listing edit modal, taxi post/edit, and the admin
// listing editor — enforces the same limits the same way.
import type { SupabaseClient } from "@supabase/supabase-js";
import { MAX_VIDEO_SECONDS, MAX_VIDEO_MB, readVideoDuration } from "./video";

export const MAX_LISTING_PHOTOS = 10;
export const MAX_LISTING_VIDEOS = 10;
export const MAX_PHOTO_MB = 8;

export { MAX_VIDEO_SECONDS, MAX_VIDEO_MB };

type UploadResult = { url: string | null; error: string | null };

// Uploads one photo to the shared "listings" storage bucket under the
// owner's folder, returning its public URL. Validates type/size first so a
// bad file never reaches storage.
export async function uploadListingPhoto(
  supabase: SupabaseClient,
  ownerId: string,
  file: File,
  pathPrefix = ""
): Promise<UploadResult> {
  if (!file.type.startsWith("image/")) return { url: null, error: `${file.name} isn't an image — skipped` };
  if (file.size > MAX_PHOTO_MB * 1024 * 1024) {
    return { url: null, error: `${file.name} is too large — ${MAX_PHOTO_MB}MB max` };
  }
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${ownerId}/${pathPrefix}${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error: upErr } = await supabase.storage
    .from("listings")
    .upload(path, file, { upsert: false, cacheControl: "3600" });
  if (upErr) return { url: null, error: `Couldn't upload ${file.name} — ${upErr.message}` };
  const { data: pub } = supabase.storage.from("listings").getPublicUrl(path);
  return { url: pub.publicUrl, error: null };
}

// Uploads one short clip, checking type/size/duration before it ever
// touches storage — same rules as before, just usable per-file now that a
// listing can carry several.
export async function uploadListingVideo(
  supabase: SupabaseClient,
  ownerId: string,
  file: File
): Promise<UploadResult> {
  if (!file.type.startsWith("video/")) return { url: null, error: `${file.name} isn't a video file` };
  if (file.size > MAX_VIDEO_MB * 1024 * 1024) {
    return { url: null, error: `${file.name} is too large — ${MAX_VIDEO_MB}MB max` };
  }
  try {
    const duration = await readVideoDuration(file);
    if (duration > MAX_VIDEO_SECONDS + 1) {
      return { url: null, error: `${file.name}: keep it to ${MAX_VIDEO_SECONDS} seconds or less` };
    }
  } catch {
    return { url: null, error: `Couldn't read ${file.name} — try another file` };
  }
  const ext = file.name.split(".").pop()?.toLowerCase() || "mp4";
  const path = `${ownerId}/video-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error: upErr } = await supabase.storage
    .from("listings")
    .upload(path, file, { upsert: false, cacheControl: "3600" });
  if (upErr) return { url: null, error: `Couldn't upload ${file.name} — ${upErr.message}` };
  const { data: pub } = supabase.storage.from("listings").getPublicUrl(path);
  return { url: pub.publicUrl, error: null };
}
