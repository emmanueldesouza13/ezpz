"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import BackButton from "@/components/BackButton";
import Icon from "@/components/Icon";
import { createClient } from "@/lib/supabase/client";
import { getCategories, getOccupyingListing } from "@/lib/data";
import { GRADIENTS, type Category } from "@/lib/types";
import { toast } from "@/lib/toast";
import {
  MAX_LISTING_PHOTOS,
  MAX_LISTING_VIDEOS,
  MAX_VIDEO_SECONDS,
  MAX_VIDEO_MB,
  uploadListingPhoto,
  uploadListingVideo,
} from "@/lib/media";
import { stripDigits } from "@/lib/format";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function PostPage() {
  const supabase = createClient();
  const router = useRouter();
  const { t } = useLanguage();

  const [checkingAuth, setCheckingAuth] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [displayName, setDisplayName] = useState("");
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [swatch, setSwatch] = useState(0);
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [videos, setVideos] = useState<string[]>([]);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function handlePhotoFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (files.length === 0) return;
    const room = MAX_LISTING_PHOTOS - photos.length;
    if (room <= 0) { toast(`You can add up to ${MAX_LISTING_PHOTOS} photos`); return; }
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) { router.push("/sign-in?next=/post"); return; }
    setUploadingPhoto(true);
    const uploaded: string[] = [];
    for (const file of files.slice(0, room)) {
      const result = await uploadListingPhoto(supabase, user.id, file);
      if (!result.url) { toast(result.error ?? "Upload failed"); continue; }
      uploaded.push(result.url);
    }
    setUploadingPhoto(false);
    if (uploaded.length > 0) setPhotos((p) => [...p, ...uploaded]);
  }

  function removePhoto(i: number) {
    setPhotos((p) => p.filter((_, idx) => idx !== i));
  }

  async function handleVideoFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (files.length === 0) return;
    const room = MAX_LISTING_VIDEOS - videos.length;
    if (room <= 0) { toast(`You can add up to ${MAX_LISTING_VIDEOS} videos`); return; }
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) { router.push("/sign-in?next=/post"); return; }
    setUploadingVideo(true);
    const uploaded: string[] = [];
    for (const file of files.slice(0, room)) {
      const result = await uploadListingVideo(supabase, user.id, file);
      if (!result.url) { toast(result.error ?? "Upload failed"); continue; }
      uploaded.push(result.url);
    }
    setUploadingVideo(false);
    if (uploaded.length > 0) setVideos((v) => [...v, ...uploaded]);
  }

  function removeVideo(i: number) {
    setVideos((v) => v.filter((_, idx) => idx !== i));
  }

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        router.push("/sign-in?next=/post");
        return;
      }
      const occupying = await getOccupyingListing(supabase, data.user.id);
      if (occupying) {
        toast(t("post.alreadyHaveListing"));
        router.push("/account");
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", data.user.id)
        .maybeSingle();
      setDisplayName(profile?.display_name ?? "");
      setCheckingAuth(false);
      const cats = await getCategories(supabase);
      setCategories(cats);
      if (cats[0]) setCategory(cats[0].slug);
    })();
  }, [supabase, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!location.trim() || !description.trim()) {
      toast("Fill in all required fields");
      return;
    }
    setSubmitting(true);
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) {
      router.push("/sign-in?next=/post");
      return;
    }

    const { data: listing, error } = await supabase
      .from("listings")
      .insert({
        seller_id: user.id,
        // The listing's own "name" is just the seller's account name —
        // there's no separate title to type, so buyers see one
        // consistent name whether they're looking at the listing or
        // messaging the seller directly.
        title: displayName.trim() || t("listing.sellerFallback"),
        description: description.trim(),
        category,
        location: location.trim(),
        images: photos.length > 0 ? photos : [GRADIENTS[swatch]],
        videos,
        // Listings are free to post — never hidden behind a fee, unlike
        // taxi sign-ups and blue-tick verification.
        fee_status: "waived",
      })
      .select("id")
      .single();

    setSubmitting(false);
    if (error || !listing) {
      toast(error?.message || "Something went wrong — try again");
      return;
    }
    setDone(true);
    setTimeout(() => router.push(`/listing/${listing.id}`), 900);
  }

  if (checkingAuth) return null;

  return (
    <>
      <Header />
      <main>
        <section className="wrap">
          <div className="post-wrap">
            <BackButton />
            {done ? (
              <div className="empty-state">
                {t("post.doneMessage")}
              </div>
            ) : (
              <>
                <h1>{t("post.title")}</h1>
                <p className="lede">
                  {t("post.lede")}
                </p>
                <form onSubmit={handleSubmit}>
                  <div className="field">
                    <label>{t("post.photosLabel")}</label>
                    <div className="swatch-picker">
                      {photos.map((url, i) => (
                        <div className="photo-tile" key={url}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={url} alt={`Photo ${i + 1}`} />
                          <button
                            type="button"
                            className="photo-tile-remove"
                            aria-label={t("post.removePhoto")}
                            onClick={() => removePhoto(i)}
                          >
                            <Icon name="X" />
                          </button>
                        </div>
                      ))}
                      {photos.length < MAX_LISTING_PHOTOS && (
                        <label className="photo-add" style={{ cursor: uploadingPhoto ? "wait" : "pointer" }}>
                          <Icon name={uploadingPhoto ? "Loader2" : "Camera"} className={uploadingPhoto ? "spin" : undefined} />
                          {uploadingPhoto ? t("post.uploading") : t("post.addPhoto")}
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handlePhotoFiles}
                            disabled={uploadingPhoto}
                          />
                        </label>
                      )}
                    </div>
                    {photos.length === 0 ? (
                      <p className="hint">
                        {t("post.photosHintEmpty", { max: MAX_LISTING_PHOTOS })}
                      </p>
                    ) : (
                      <p className="hint">
                        {t("post.photosHintSome")}
                      </p>
                    )}
                  </div>

                  <div className="field">
                    <label>{t("post.videoLabel")}</label>
                    <div className="swatch-picker">
                      {videos.map((url, i) => (
                        <div className="video-tile video-grid-tile" key={url}>
                          <video src={url} playsInline muted />
                          <button
                            type="button"
                            className="photo-tile-remove"
                            aria-label={t("post.removeVideo")}
                            onClick={() => removeVideo(i)}
                          >
                            <Icon name="X" />
                          </button>
                        </div>
                      ))}
                      {videos.length < MAX_LISTING_VIDEOS && (
                        <label className="photo-add" style={{ cursor: uploadingVideo ? "wait" : "pointer" }}>
                          <Icon name={uploadingVideo ? "Loader2" : "Video"} className={uploadingVideo ? "spin" : undefined} />
                          {uploadingVideo ? t("post.uploading") : t("post.addVideo")}
                          <input
                            type="file"
                            accept="video/*"
                            multiple
                            onChange={handleVideoFiles}
                            disabled={uploadingVideo}
                          />
                        </label>
                      )}
                    </div>
                    <p className="hint">
                      {t("post.videoHint", { max: MAX_LISTING_VIDEOS, seconds: MAX_VIDEO_SECONDS, mb: MAX_VIDEO_MB })}
                    </p>
                  </div>

                  <div className="field">
                    <label htmlFor="categorySelect">{t("post.categoryLabel")}</label>
                    <select
                      className="control"
                      id="categorySelect"
                      required
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                    >
                      {categories.map((c) => (
                        <option value={c.slug} key={c.slug}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="field">
                    <label htmlFor="locationInput">{t("post.locationLabel")}</label>
                    <input
                      className="control"
                      id="locationInput"
                      required
                      placeholder={t("post.locationPlaceholder")}
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                    />
                  </div>

                  <div className="field">
                    <label htmlFor="descInput">{t("post.descriptionLabel")}</label>
                    <textarea
                      className="control"
                      id="descInput"
                      required
                      placeholder={t("post.descriptionPlaceholder")}
                      value={description}
                      onChange={(e) => setDescription(stripDigits(e.target.value))}
                    />
                    <p className="hint">
                      {t("post.descriptionHint")}
                    </p>
                  </div>

                  <div className="fee-note">
                    <Icon name="Wallet" size={14} />
                    {t("post.feeNote")}
                  </div>

                  <button type="submit" className="btn btn-accent btn-block" disabled={submitting || uploadingPhoto || uploadingVideo}>
                    {submitting ? t("post.publishing") : t("post.publish")}
                  </button>
                </form>
              </>
            )}
          </div>
        </section>
      </main>
    </>
  );
}
