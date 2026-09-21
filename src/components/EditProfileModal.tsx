"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Icon from "./Icon";
import { toast } from "@/lib/toast";
import { isPhotoUrl } from "@/lib/format";
import { GRADIENTS, type Profile, type Listing, type Category } from "@/lib/types";

const AVATAR_COLORS = [
  "#a72c53",
  "#cc9d4e",
  "#6b3fa0",
  "#2f8f6b",
  "#c9713f",
  "#1f6f8b",
  "#8a2f4f",
  "#3a1626",
];

const MAX_PHOTOS = 6;

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
  const [open, setOpen] = useState(false);

  // profile fields
  const [name, setName] = useState(profile.display_name);
  const [color, setColor] = useState(profile.avatar_color);
  const [location, setLocation] = useState(profile.location ?? "");
  const [bio, setBio] = useState(profile.bio ?? "");
  const [available, setAvailable] = useState(profile.available);

  // listing fields
  const [lTitle, setLTitle] = useState("");
  const [lCategory, setLCategory] = useState("");
  const [lPrice, setLPrice] = useState("");
  const [lIsFree, setLIsFree] = useState(false);
  const [lLocation, setLLocation] = useState("");
  const [lDescription, setLDescription] = useState("");
  const [lSwatch, setLSwatch] = useState(0);
  const [lPhotos, setLPhotos] = useState<string[]>([]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const [saving, setSaving] = useState(false);

  function openModal() {
    setName(profile.display_name);
    setColor(profile.avatar_color);
    setLocation(profile.location ?? "");
    setBio(profile.bio ?? "");
    setAvailable(profile.available);

    if (listing) {
      setLTitle(listing.title);
      setLCategory(listing.category);
      setLPrice(listing.is_free ? "" : String(listing.price));
      setLIsFree(listing.is_free);
      setLLocation(listing.location);
      setLDescription(listing.description);
      const uploaded: string[] = (listing.images || []).filter(isPhotoUrl);
      setLPhotos(uploaded);
      if (uploaded.length === 0) {
        const gi = GRADIENTS.indexOf(listing.images?.[0]);
        setLSwatch(gi >= 0 ? gi : 0);
      }
    }

    setOpen(true);
  }

  async function handlePhotoFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (files.length === 0) return;
    const room = MAX_PHOTOS - lPhotos.length;
    if (room <= 0) {
      toast(`You can add up to ${MAX_PHOTOS} photos`);
      return;
    }
    setUploadingPhoto(true);
    const uploaded: string[] = [];
    for (const file of files.slice(0, room)) {
      if (!file.type.startsWith("image/")) {
        toast(`${file.name} isn't an image — skipped`);
        continue;
      }
      if (file.size > 8 * 1024 * 1024) {
        toast(`${file.name} is too large — 8MB max`);
        continue;
      }
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${profile.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("listings")
        .upload(path, file, { upsert: false, cacheControl: "3600" });
      if (upErr) {
        toast(`Couldn't upload ${file.name} — ${upErr.message}`);
        continue;
      }
      const { data: pub } = supabase.storage.from("listings").getPublicUrl(path);
      uploaded.push(pub.publicUrl);
    }
    setUploadingPhoto(false);
    if (uploaded.length > 0) setLPhotos((p) => [...p, ...uploaded]);
  }

  function removePhoto(i: number) {
    setLPhotos((p) => p.filter((_, idx) => idx !== i));
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
      location: location.trim() || null,
      bio: bio.trim() || null,
      available,
    };

    const profileTask = supabase.from("profiles").update(profileUpdates).eq("id", profile.id);
    const listingTask = listing
      ? supabase
          .from("listings")
          .update({
            title: lTitle.trim(),
            description: lDescription.trim(),
            price: lIsFree ? 0 : Number(lPrice) || 0,
            is_free: lIsFree,
            category: lCategory,
            location: lLocation.trim(),
            images: lPhotos.length > 0 ? lPhotos : [GRADIENTS[lSwatch]],
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
      <button type="button" className="profile-edit-btn" onClick={openModal}>
        <Icon name="Pencil" />
        Edit profile
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
            <h2>Edit profile</h2>
            <form onSubmit={handleSave}>
              <div className="field">
                <label htmlFor="ep-name">Display name</label>
                <input
                  className="control"
                  id="ep-name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="field">
                <label>Avatar color</label>
                <div className="swatch-row">
                  {AVATAR_COLORS.map((c) => (
                    <button
                      type="button"
                      key={c}
                      className={`swatch${color === c ? " active" : ""}`}
                      style={{ background: c }}
                      aria-label={c}
                      onClick={() => setColor(c)}
                    />
                  ))}
                </div>
              </div>

              <div className="field">
                <label htmlFor="ep-location">Location</label>
                <input
                  className="control"
                  id="ep-location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Linden"
                />
              </div>

              <div className="field" style={{ marginBottom: 14 }}>
                <label htmlFor="ep-bio">About / bio</label>
                <textarea
                  className="control"
                  id="ep-bio"
                  maxLength={400}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell buyers a bit about you and your work"
                />
                <p className="hint">{bio.length}/400</p>
              </div>

              <div className="avail-toggle-row" style={{ marginBottom: listing ? 0 : 22 }}>
                <div className="avail-toggle-text">
                  <p>Available to work</p>
                  <p>Shows a green dot on your profile.</p>
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

              {listing && (
                <>
                  <h3 className="modal-section-title">Listing details</h3>

                  <div className="field">
                    <label>Photos</label>
                    <div className="swatch-picker">
                      {lPhotos.map((url, i) => (
                        <div className="photo-tile" key={url}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={url} alt={`Photo ${i + 1}`} />
                          <button
                            type="button"
                            className="photo-tile-remove"
                            aria-label="Remove photo"
                            onClick={() => removePhoto(i)}
                          >
                            <Icon name="X" />
                          </button>
                        </div>
                      ))}
                      {lPhotos.length < MAX_PHOTOS && (
                        <label className="photo-add" style={{ cursor: uploadingPhoto ? "wait" : "pointer" }}>
                          <Icon name={uploadingPhoto ? "Loader2" : "Camera"} className={uploadingPhoto ? "spin" : undefined} />
                          {uploadingPhoto ? "Uploading…" : "Add photo"}
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
                      <p className="hint">Snap a photo or pick one from your phone — up to {MAX_PHOTOS}.</p>
                    ) : (
                      <p className="hint">The first photo is used as the main listing photo.</p>
                    )}
                  </div>

                  <div className="field">
                    <label htmlFor="ep-l-title">Name</label>
                    <input
                      className="control"
                      id="ep-l-title"
                      required
                      value={lTitle}
                      onChange={(e) => setLTitle(e.target.value)}
                    />
                  </div>

                  <div className="field">
                    <label htmlFor="ep-l-category">Category</label>
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

                  <div className="price-row" style={{ marginBottom: 20 }}>
                    <div className="field">
                      <label htmlFor="ep-l-price">Price</label>
                      <div className="price-input">
                        <span>GY$</span>
                        <input
                          className="control"
                          id="ep-l-price"
                          type="number"
                          min="0"
                          placeholder="0"
                          disabled={lIsFree}
                          value={lPrice}
                          onChange={(e) => setLPrice(e.target.value)}
                        />
                      </div>
                    </div>
                    <label className="check-row">
                      <input
                        type="checkbox"
                        checked={lIsFree}
                        onChange={(e) => setLIsFree(e.target.checked)}
                      />
                      List as free
                    </label>
                  </div>

                  <div className="field">
                    <label htmlFor="ep-l-location">Listing location</label>
                    <input
                      className="control"
                      id="ep-l-location"
                      required
                      value={lLocation}
                      onChange={(e) => setLLocation(e.target.value)}
                    />
                  </div>

                  <div className="field" style={{ marginBottom: 22 }}>
                    <label htmlFor="ep-l-description">Description</label>
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
                  Cancel
                </button>
                <button type="submit" className="btn btn-accent" disabled={saving || uploadingPhoto}>
                  {saving ? "Saving…" : "Save changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
