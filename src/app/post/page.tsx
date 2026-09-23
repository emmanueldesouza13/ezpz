"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import BackButton from "@/components/BackButton";
import Icon from "@/components/Icon";
import { createClient } from "@/lib/supabase/client";
import { getCategories, getSiteSettings } from "@/lib/data";
import { GRADIENTS, type Category } from "@/lib/types";
import { toast } from "@/lib/toast";
import { MAX_VIDEO_SECONDS, MAX_VIDEO_MB, readVideoDuration } from "@/lib/video";
import { stripDigits } from "@/lib/format";
import { useLanguage } from "@/lib/i18n/LanguageContext";

const MAX_PHOTOS = 6;

export default function PostPage() {
  const supabase = createClient();
  const router = useRouter();
  const { t } = useLanguage();

  const [checkingAuth, setCheckingAuth] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [isFree, setIsFree] = useState(false);
  const [location, setLocation] = useState("");
  const [mmg, setMmg] = useState("");
  const [description, setDescription] = useState("");
  const [swatch, setSwatch] = useState(0);
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [fee, setFee] = useState(2000);

  async function handlePhotoFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (files.length === 0) return;
    const room = MAX_PHOTOS - photos.length;
    if (room <= 0) { toast(`You can add up to ${MAX_PHOTOS} photos`); return; }
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) { router.push("/sign-in?next=/post"); return; }
    setUploadingPhoto(true);
    const uploaded: string[] = [];
    for (const file of files.slice(0, room)) {
      if (!file.type.startsWith("image/")) { toast(`${file.name} isn't an image — skipped`); continue; }
      if (file.size > 8 * 1024 * 1024) { toast(`${file.name} is too large — 8MB max`); continue; }
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("listings")
        .upload(path, file, { upsert: false, cacheControl: "3600" });
      if (upErr) { toast(`Couldn't upload ${file.name} — ${upErr.message}`); continue; }
      const { data: pub } = supabase.storage.from("listings").getPublicUrl(path);
      uploaded.push(pub.publicUrl);
    }
    setUploadingPhoto(false);
    if (uploaded.length > 0) setPhotos((p) => [...p, ...uploaded]);
  }

  function removePhoto(i: number) {
    setPhotos((p) => p.filter((_, idx) => idx !== i));
  }

  async function handleVideoFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("video/")) { toast("That's not a video file"); return; }
    if (file.size > MAX_VIDEO_MB * 1024 * 1024) {
      toast(`That video is too large — ${MAX_VIDEO_MB}MB max`);
      return;
    }
    try {
      const duration = await readVideoDuration(file);
      if (duration > MAX_VIDEO_SECONDS + 1) {
        toast(`Keep it to ${MAX_VIDEO_SECONDS} seconds or less`);
        return;
      }
    } catch {
      toast("Couldn't read that video — try another file");
      return;
    }
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) { router.push("/sign-in?next=/post"); return; }
    setUploadingVideo(true);
    const ext = file.name.split(".").pop()?.toLowerCase() || "mp4";
    const path = `${user.id}/video-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("listings")
      .upload(path, file, { upsert: false, cacheControl: "3600" });
    setUploadingVideo(false);
    if (upErr) { toast(`Couldn't upload video — ${upErr.message}`); return; }
    const { data: pub } = supabase.storage.from("listings").getPublicUrl(path);
    setVideoUrl(pub.publicUrl);
  }

  function removeVideo() {
    setVideoUrl(null);
  }

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        router.push("/sign-in?next=/post");
        return;
      }
      setCheckingAuth(false);
      const cats = await getCategories(supabase);
      setCategories(cats);
      if (cats[0]) setCategory(cats[0].slug);

      const { data: profile } = await supabase
        .from("profiles")
        .select("mmg_number")
        .eq("id", data.user.id)
        .maybeSingle();
      if (profile?.mmg_number) setMmg(profile.mmg_number);

      const settings = await getSiteSettings(supabase);
      setFee(settings.listing_fee);
    })();
  }, [supabase, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !location.trim() || !description.trim() || !mmg.trim()) {
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

    await supabase.from("profiles").update({ mmg_number: mmg.trim() }).eq("id", user.id);

    const { data: listing, error } = await supabase
      .from("listings")
      .insert({
        seller_id: user.id,
        title: title.trim(),
        description: description.trim(),
        price: isFree ? 0 : Number(price) || 0,
        is_free: isFree,
        category,
        location: location.trim(),
        images: photos.length > 0 ? photos : [GRADIENTS[swatch]],
        video_url: videoUrl,
      })
      .select("id")
      .single();

    setSubmitting(false);
    if (error || !listing) {
      toast("Something went wrong — try again");
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
                {t("post.doneMessage", { fee: fee.toLocaleString() })}
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
                      {photos.length < MAX_PHOTOS && (
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
                        {t("post.photosHintEmpty", { max: MAX_PHOTOS })}
                      </p>
                    ) : (
                      <p className="hint">
                        {t("post.photosHintSome")}
                      </p>
                    )}
                  </div>

                  <div className="field">
                    <label>{t("post.videoLabel")}</label>
                    {videoUrl ? (
                      <div className="video-tile">
                        <video src={videoUrl} controls playsInline />
                        <button type="button" className="text-btn" onClick={removeVideo}>
                          {t("post.removeVideo")}
                        </button>
                      </div>
                    ) : (
                      <label className="photo-add" style={{ cursor: uploadingVideo ? "wait" : "pointer" }}>
                        <Icon name={uploadingVideo ? "Loader2" : "Video"} className={uploadingVideo ? "spin" : undefined} />
                        {uploadingVideo ? t("post.uploading") : t("post.addVideo")}
                        <input
                          type="file"
                          accept="video/*"
                          onChange={handleVideoFile}
                          disabled={uploadingVideo}
                        />
                      </label>
                    )}
                    <p className="hint">
                      {t("post.videoHint", { seconds: MAX_VIDEO_SECONDS, mb: MAX_VIDEO_MB })}
                    </p>
                  </div>

                  <div className="field">
                    <label htmlFor="titleInput">{t("post.nameLabel")}</label>
                    <input
                      className="control"
                      id="titleInput"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
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

                  <div className="price-row" style={{ marginBottom: 20 }}>
                    <div className="field">
                      <label htmlFor="priceInput">{t("post.priceLabel")}</label>
                      <div className="price-input">
                        <span>GY$</span>
                        <input
                          className="control"
                          id="priceInput"
                          type="number"
                          min="0"
                          placeholder="0"
                          disabled={isFree}
                          value={price}
                          onChange={(e) => setPrice(e.target.value)}
                        />
                      </div>
                    </div>
                    <label className="check-row">
                      <input
                        type="checkbox"
                        checked={isFree}
                        onChange={(e) => setIsFree(e.target.checked)}
                      />
                      {t("post.listAsFree")}
                    </label>
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
                    <label htmlFor="mmgInput">{t("post.mmgLabel")}</label>
                    <input
                      className="control"
                      id="mmgInput"
                      required
                      inputMode="tel"
                      placeholder={t("post.mmgPlaceholder")}
                      value={mmg}
                      onChange={(e) => setMmg(e.target.value)}
                    />
                    <p className="hint">
                      {t("post.mmgHint")}
                    </p>
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
                    {t("post.feeNote", { fee: fee.toLocaleString() })}
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
