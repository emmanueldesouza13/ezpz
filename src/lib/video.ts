// Shared rules + helper for the short work-sample video sellers can attach
// to a listing (post page + edit-listing section). Kept separate from the
// multi-photo upload since a video is a single slot with its own checks.
export const MAX_VIDEO_SECONDS = 15;
export const MAX_VIDEO_MB = 20;

// Reads a video file's duration in the browser without uploading it first,
// so we can reject anything over the cap before spending storage/bandwidth.
export function readVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const el = document.createElement("video");
    el.preload = "metadata";
    el.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve(el.duration);
    };
    el.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Couldn't read that video"));
    };
    el.src = url;
  });
}
