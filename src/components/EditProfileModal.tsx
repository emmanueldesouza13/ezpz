"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Icon from "./Icon";
import Avatar from "./Avatar";
import AvatarCropModal from "./AvatarCropModal";
import { toast } from "@/lib/toast";
import { isPhotoUrl } from "@/lib/format";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { GRADIENTS, type Profile, type Listing, type Category } from "@/lib/types";
import {
  MAX_LISTING_PHOTOS,
  MAX_LISTING_VIDEOS,
  MAX_VIDEO_SECONDS,
  MAX_VIDEO_MB,
  uploadListingPhoto,
  uploadListingVideo,
} from "@/lib/media";

export default function EditProfileModal({
  profile,
  onSaved,
  listing,
  categories,
}: {
  profile: Profile;
  onSaved?: (updated: Profile) => void;
  listing?: Listing;
  categories?: Category[];
}) {
  const supabase = createClient();
  const router = useRouter();
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);

  // profile fields
  const [name, setName] = useState(profile.display_name);
  const [color, setColor] = useState(profile.avatar_color);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(profile.avatar_url);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [cropSource, setCropSource] = useState<Blob | null>(null);
  const [loadingRecrop, setLoadingRecrop] = useState(false);
  const [location, setLocation] = useState(profile.location ?? "");
  const [bio, setBio] = useState(profile.bio ?? "");
  const [available, setAvailable] = useState(profile.available);
  const [accountType, setAccountType] = useState(profile.account_type);

  // listing fields
  const [lTitle, setLTitle] = useState("");
  const [lCategory, setLCategory] = useState("");
  const [lLocation, setLLocation] = useState("");
  const [lDescription, setLDescription] = useState("");
  const [lSwatch, setLSwatch] = useState(0);
  const [lPhotos, setLPhotos] = useState<string[]>([]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [lVideos, setLVideos] = useState<string[]>([]);
  const [uploadingVideo, setUploadingVideo] = useState(false);

  const [saving, setSaving] = useState(false);

  function openModal() {
    setName(profile.display_name);
    setColor(profile.avatar_color);
    setAvatarUrl(profile.avatar_url);
    setLocation(profile.location ?? "");
    setBio(profile.bio ?? "");
    setAvailable(profile.available);
    setAccountType(profile.account_type);

    if (listing) {
      setLTitle(listing.title);
      setLCategory(listing.category);
      setLLocation(listing.location);
      setLDescription(listing.description);
      const uploaded: string[] = (listing.images || []).filter(isPhotoUrl);
      setLPhotos(uploaded);
      if (uploaded.length === 0) {
        const gi = GRADIENTS.indexOf(listing.images?.[0]);
        setLSwatch(gi >= 0 ? gi : 0);
      }
      setLVideos(listing.videos ?? []);
    }

    setOpen(true);
  }

  // Picking a file no longer uploads it straight away — it opens the crop
  // tool first so people can reposition/zoom before it's saved as their
  // avatar.
  function handleAvatarFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast(`${file.name} isn't an image`);
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      toast("That photo is too large — 8MB max");
      return;
    }
    setCropSource(file);
  }

  // Re-open the crop tool on the photo that's already set, so someone can
  // fix the framing without having to re-upload from their camera roll.
  async function handleEditExistingAvatar() {
    if (!avatarUrl) return;
    setLoadingRecrop(true);
    try {
      const res = await fetch(avatarUrl);
      if (!res.ok) throw new Error("fetch failed");
      const blob = await res.blob();
      setCropSource(blob);
    } catch {
      toast("Couldn't load that photo to edit — try uploading it again");
    } finally {
      setLoadingRecrop(false);
    }
  }

  async function handleCroppedAvatar(blob: Blob) {
    setUploadingAvatar(true);
    const path = `${profile.id}/avatar-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
    const { error: upErr } = await supabase.storage
      .from("listings")
      .upload(path, blob, { upsert: false, cacheControl: "3600", contentType: "image/jpeg" });
    setUploadingAvatar(false);
    if (upErr) {
      toast(`Couldn't upload photo — ${upErr.message}`);
      return;
    }
    const { data: pub } = supabase.storage.from("listings").getPublicUrl(path);
    setAvatarUrl(pub.publicUrl);
    setCropSource(null);
  }

  async function handlePhotoFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (files.length === 0) return;
    const room = MAX_LISTING_PHOTOS - lPhotos.length;
    if (room <= 0) {
      toast(`You can add up to ${MAX_LISTING_PHOTOS} photos`);
      return;
    }
    setUploadingPhoto(true);
    const uploaded: string[] = [];
    for (const file of files.slice(0, room)) {
      const result = await uploadListingPhoto(supabase, profile.id, file);
      if (!result.url) { toast(result.error ?? "Upload failed"); continue; }
      uploaded.push(result.url);
    }
    setUploadingPhoto(false);
    if (uploaded.length > 0) setLPhotos((p) => [...p, ...uploaded]);
  }

  function removePhoto(i: number) {
    setLPhotos((p) => p.filter((_, idx) => idx !== i));
  }

  async function handleVideoFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (files.length === 0) return;
    const room = MAX_LISTING_VIDEOS - lVideos.length;
    if (room <= 0) {
      toast(`You can add up to ${MAX_LISTING_VIDEOS} videos`);
      return;
    }
    setUploadingVideo(true);
    const uploaded: string[] = [];
    for (const file of files.slice(0, room)) {
      const result = await uploadListingVideo(supabase, profile.id, file);
      if (!result.url) { toast(result.error ?? "Upload failed"); continue; }
      uploaded.push(result.url);
    }
    setUploadingVideo(false);
    if (uploaded.length > 0) setLVideos((v) => [...v, ...uploaded]);
  }

  function removeVideo(i: number) {
    setLVideos((v) => v.filter((_, idx) => idx !== i));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();

    if (listing && (!lTitle.trim() || !lLocation.trim() || !lDescription.trim())) {
      toast("Fill in all required listing fields");
      return;
    }

    setSaving(true);

    const profileUpdates = {
      display_name: name.trim() || profile.display_name,
      avatar_color: color,
      avatar_url: avatarUrl,
      location: location.trim() || null,
      bio: bio.trim() || null,
      available,
      ...(profile.is_admin ? {} : { account_type: accountType }),
    };

    const profileTask = supabase.from("profiles").update(profileUpdates).eq("id", profile.id);
    const listingTask = listing
      ? supabase
          .from("listings")
          .update({
            title: lTitle.trim(),
            description: lDescription.trim(),
            category: lCategory,
            location: lLocation.trim(),
            images: lPhotos.length > 0 ? lPhotos : [GRADIENTS[lSwatch]],
            videos: lVideos,
          })
          .eq("id", listing.id)
      : null;

    const [profileResult, listingResult] = await Promise.all([
      profileTask,
      listingTask ?? Promise.resolve({ error: null }),
    ]);
    setSaving(false);

    if (profileResult.error || listingResult.error) {
      toast("Couldn't save — try again");
      return;
    }

    toast(listing ? "Profile and listing updated" : "Profile updated");
    setOpen(false);
    if (onSaved) onSaved({ ...profile, ...profileUpdates });
    router.refresh();
  }

  return (
    <>
      <div className="profile-avatar-wrap">
        <Avatar
          url={profile.avatar_url}
          color={profile.avatar_color}
          name={profile.display_name}
          className="profile-avatar"
        />
        <button
          type="button"
          className="avatar-photo-badge"
          onClick={openModal}
          aria-label={t("editProfile.addOrChangePhoto")}
        >
          <Icon name="Camera" />
        </button>
      </div>
      <button type="button" className="profile-edit-btn" onClick={openModal}>
        <Icon name="Pencil" />
        {t("editProfile.editProfile")}
      </button>
      {open && (
        <div
          className="modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div className="modal-card">
            <button type="button" className="modal-close" onClick={() => setOpen(false)}>
              <Icon name="X" />
            </button>
            <h2>{t("editProfile.editProfile")}</h2>
            <form onSubmit={handleSave}>
              <div className="field">
                <label>{t("editProfile.profilePhotoLabel")}</label>
                <div className="avatar-edit-row">
                  <Avatar
                    url={avatarUrl}
                    color={color}
                    name={name}
                    className="profile-avatar"
                    style={{ width: 64, height: 64, fontSize: "1.3rem" }}
                  />
                  <div className="avatar-edit-actions">
                    <label
                      className="btn btn-line"
                      style={{ cursor: uploadingAvatar ? "wait" : "pointer" }}
                    >
                      <Icon name={uploadingAvatar ? "Loader2" : "Camera"} className={uploadingAvatar ? "spin" : undefined} />
                      {uploadingAvatar
                        ? t("post.uploading")
                        : avatarUrl
                          ? t("editProfile.changePhoto")
                          : t("post.addPhoto")}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarFile}
                        disabled={uploadingAvatar}
                        style={{ display: "none" }}
                      />
                    </label>
                    {avatarUrl && (
                      <div style={{ display: "flex", gap: 14 }}>
                        <button
                          type="button"
                          className="text-btn text-btn-neutral"
                          onClick={handleEditExistingAvatar}
                          disabled={loadingRecrop}
                        >
                          {loadingRecrop ? t("editProfile.loading") : t("editProfile.cropReposition")}
                        </button>
                        <button type="button" className="text-btn" onClick={() => setAvatarUrl(null)}>
                          {t("post.removePhoto")}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="field">
                <label htmlFor="ep-name">{t("editProfile.displayNameLabel")}</label>
                <input
                  className="control"
                  id="ep-name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="field">
                <label htmlFor="ep-location">{t("editProfile.locationLabel")}</label>
                <input
                  className="control"
                  id="ep-location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder={t("editProfile.locationPlaceholder")}
                />
              </div>

              <div className="field" style={{ marginBottom: 14 }}>
                <label htmlFor="ep-bio">{t("editProfile.bioLabel")}</label>
                <textarea
                  className="control"
                  id="ep-bio"
                  maxLength={400}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder={t("editProfile.bioPlaceholder")}
                />
                <p className="hint">{bio.length}/400</p>
              </div>

              <div className="avail-toggle-row">
                <div className="avail-toggle-text">
                  <p>{t("editProfile.availableToWork")}</p>
                  <p>{t("editProfile.availableHint")}</p>
                </div>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={available}
                    onChange={(e) => setAvailable(e.target.checked)}
                  />
                  <span className="switch-track" />
                </label>
              </div>

              {!profile.is_admin && (
                <div className="field" style={{ marginBottom: listing ? 0 : 22 }}>
                  <label>{t("editProfile.accountTypeLabel")}</label>
                  <div className="account-type-picker">
                    <button
                      type="button"
                      className={`account-type-option${accountType === "buyer" ? " active" : ""}`}
                      onClick={() => setAccountType("buyer")}
                    >
                      <span className="account-type-name">{t("auth.accountTypeBuyer")}</span>
                    </button>
                    <button
                      type="button"
                      className={`account-type-option${accountType === "seller" ? " active" : ""}`}
                      onClick={() => setAccountType("seller")}
                    >
                      <span className="account-type-name">{t("auth.accountTypeSeller")}</span>
                    </button>
                  </div>
                  <p className="hint">{t("editProfile.accountTypeHint")}</p>
                </div>
              )}

              {listing && (
                <>
                  <h3 className="modal-section-title">{t("editProfile.listingDetails")}</h3>

                  <div className="field">
                    <label>{t("post.photosLabel")}</label>
                    <div className="swatch-picker">
                      {lPhotos.map((url, i) => (
                        <div className="photo-tile" key={url}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={url} alt={t("editProfile.photoAlt", { n: i + 1 })} />
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
                      {lPhotos.length < MAX_LISTING_PHOTOS && (
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
                    {lPhotos.length === 0 ? (
                      <p className="hint">{t("post.photosHintEmpty", { max: MAX_LISTING_PHOTOS })}</p>
                    ) : (
                      <p className="hint">{t("post.photosHintSome")}</p>
                    )}
                  </div>

                  <div className="field">
                    <label>{t("post.videoLabel")}</label>
                    <div className="swatch-picker">
                      {lVideos.map((url, i) => (
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
                      {lVideos.length < MAX_LISTING_VIDEOS && (
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
                    <label htmlFor="ep-l-category">{t("post.categoryLabel")}</label>
                    <select
                      className="control"
                      id="ep-l-category"
                      required
                      value={lCategory}
                      onChange={(e) => setLCategory(e.target.value)}
                    >
                      {(categories ?? []).map((c) => (
                        <option value={c.slug} key={c.slug}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="field">
                    <label htmlFor="ep-l-location">{t("editProfile.listingLocationLabel")}</label>
                    <input
                      className="control"
                      id="ep-l-location"
                      required
                      value={lLocation}
                      onChange={(e) => setLLocation(e.target.value)}
                    />
                  </div>

                  <div className="field" style={{ marginBottom: 22 }}>
                    <label htmlFor="ep-l-description">{t("post.descriptionLabel")}</label>
                    <textarea
                      className="control"
                      id="ep-l-description"
                      required
                      value={lDescription}
                      onChange={(e) => setLDescription(e.target.value)}
                    />
                  </div>
                </>
              )}

              <div className="modal-actions">
                <button type="button" className="btn btn-line" onClick={() => setOpen(false)}>
                  {t("common.cancel")}
                </button>
                <button
                  type="submit"
                  className="btn btn-accent"
                  disabled={saving || uploadingPhoto || uploadingAvatar || uploadingVideo}
                >
                  {saving ? t("common.saving") : t("account.saveChanges")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {cropSource && (
        <AvatarCropModal
          source={cropSource}
          onCancel={() => setCropSource(null)}
          onSave={handleCroppedAvatar}
          saving={uploadingAvatar}
        />
      )}
    </>
  );
}
