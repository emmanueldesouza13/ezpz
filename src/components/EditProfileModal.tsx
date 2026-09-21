"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Icon from "./Icon";
import { toast } from "@/lib/toast";
import type { Profile } from "@/lib/types";

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

export default function EditProfileModal({
  profile,
  onSaved,
}: {
  profile: Profile;
  onSaved?: (updated: Profile) => void;
}) {
  const supabase = createClient();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(profile.display_name);
  const [color, setColor] = useState(profile.avatar_color);
  const [location, setLocation] = useState(profile.location ?? "");
  const [bio, setBio] = useState(profile.bio ?? "");
  const [available, setAvailable] = useState(profile.available);
  const [saving, setSaving] = useState(false);

  function openModal() {
    setName(profile.display_name);
    setColor(profile.avatar_color);
    setLocation(profile.location ?? "");
    setBio(profile.bio ?? "");
    setAvailable(profile.available);
    setOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const updates = {
      display_name: name.trim() || profile.display_name,
      avatar_color: color,
      location: location.trim() || null,
      bio: bio.trim() || null,
      available,
    };
    const { error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", profile.id);
    setSaving(false);
    if (error) {
      toast("Couldn't save — try again");
      return;
    }
    toast("Profile updated");
    setOpen(false);
    if (onSaved) onSaved({ ...profile, ...updates });
    else router.refresh();
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

              <div className="avail-toggle-row" style={{ marginBottom: 22 }}>
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

              <div className="modal-actions">
                <button type="button" className="btn btn-line" onClick={() => setOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-accent" disabled={saving}>
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
