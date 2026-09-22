"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Icon from "./Icon";
import { toast } from "@/lib/toast";
import type { Profile, VerificationRequest } from "@/lib/types";

const MAX_MB = 8;

export default function VerifyIdentity({ profile }: { profile: Profile }) {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [request, setRequest] = useState<VerificationRequest | null>(null);
  const [open, setOpen] = useState(false);
  const [selfiePath, setSelfiePath] = useState<string | null>(null);
  const [idCardPath, setIdCardPath] = useState<string | null>(null);
  const [uploadingSelfie, setUploadingSelfie] = useState(false);
  const [uploadingId, setUploadingId] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("verification_requests")
        .select("*")
        .eq("user_id", profile.id)
        .maybeSingle();
      const row = (data as VerificationRequest) ?? null;
      setRequest(row);
      setSelfiePath(row?.selfie_path ?? null);
      setIdCardPath(row?.id_card_path ?? null);
      setLoading(false);
    })();
  }, [supabase, profile.id]);

  function openModal() {
    setSelfiePath(request?.selfie_path ?? null);
    setIdCardPath(request?.id_card_path ?? null);
    setOpen(true);
  }

  async function uploadDoc(file: File, kind: "selfie" | "id"): Promise<string | null> {
    if (!file.type.startsWith("image/")) {
      toast(`${file.name} isn't an image`);
      return null;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      toast(`That photo is too large — ${MAX_MB}MB max`);
      return null;
    }
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${profile.id}/${kind}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await supabase.storage
      .from("verification")
      .upload(path, file, { upsert: false, cacheControl: "3600" });
    if (error) {
      toast(`Couldn't upload — ${error.message}`);
      return null;
    }
    return path;
  }

  async function handleSelfieFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploadingSelfie(true);
    const path = await uploadDoc(file, "selfie");
    setUploadingSelfie(false);
    if (path) setSelfiePath(path);
  }

  async function handleIdFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploadingId(true);
    const path = await uploadDoc(file, "id");
    setUploadingId(false);
    if (path) setIdCardPath(path);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selfiePath && !idCardPath) {
      toast("Add a selfie or an ID card photo first");
      return;
    }
    setSubmitting(true);
    const { data, error } = await supabase
      .from("verification_requests")
      .upsert(
        {
          user_id: profile.id,
          selfie_path: selfiePath,
          id_card_path: idCardPath,
          status: "pending",
          submitted_at: new Date().toISOString(),
          reviewed_at: null,
          reviewed_by: null,
          rejection_reason: null,
        },
        { onConflict: "user_id" }
      )
      .select()
      .maybeSingle();
    setSubmitting(false);
    if (error) {
      toast("Couldn't submit — " + error.message);
      return;
    }
    setRequest(data as VerificationRequest);
    toast("Verification submitted — we'll review it soon");
    setOpen(false);
  }

  if (loading) return null;

  if (profile.verified) {
    return (
      <div className="verify-card verify-approved">
        <Icon name="ShieldCheck" />
        <div className="verify-card-info">
          <p className="verify-title">You&apos;re verified</p>
          <p className="verify-sub">Buyers see a Verified badge on your profile and listings.</p>
        </div>
      </div>
    );
  }

  const status = request?.status;

  return (
    <>
      <div className={`verify-card${status === "rejected" ? " verify-rejected" : ""}`}>
        <Icon name={status === "pending" ? "Clock" : status === "rejected" ? "ShieldAlert" : "Shield"} />
        <div className="verify-card-info">
          <p className="verify-title">
            {status === "pending"
              ? "Verification submitted"
              : status === "rejected"
              ? "Verification rejected"
              : "Get verified"}
          </p>
          <p className="verify-sub">
            {status === "pending"
              ? "We're reviewing your selfie or ID. This usually doesn't take long."
              : status === "rejected"
              ? request?.rejection_reason || "Please resubmit a clearer photo."
              : "Upload a selfie or a photo of your ID so buyers know you're really you."}
          </p>
        </div>
        <button type="button" className="btn btn-line" onClick={openModal}>
          {request ? "Resubmit" : "Verify"}
        </button>
      </div>

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
            <h2>Verify your identity</h2>
            <p className="hint" style={{ marginBottom: 16 }}>
              Only EzPz admins can see this — it's never shown to buyers or other sellers.
            </p>
            <form onSubmit={handleSubmit}>
              <div className="field">
                <label>Selfie</label>
                <label
                  className="btn btn-line"
                  style={{ cursor: uploadingSelfie ? "wait" : "pointer", display: "inline-flex" }}
                >
                  <Icon
                    name={uploadingSelfie ? "Loader2" : "Camera"}
                    className={uploadingSelfie ? "spin" : undefined}
                  />
                  {uploadingSelfie ? "Uploading…" : selfiePath ? "Selfie added — replace" : "Take or upload a selfie"}
                  <input
                    type="file"
                    accept="image/*"
                    capture="user"
                    onChange={handleSelfieFile}
                    disabled={uploadingSelfie}
                    style={{ display: "none" }}
                  />
                </label>
              </div>

              <div className="field" style={{ marginBottom: 20 }}>
                <label>ID card</label>
                <label
                  className="btn btn-line"
                  style={{ cursor: uploadingId ? "wait" : "pointer", display: "inline-flex" }}
                >
                  <Icon name={uploadingId ? "Loader2" : "IdCard"} className={uploadingId ? "spin" : undefined} />
                  {uploadingId ? "Uploading…" : idCardPath ? "ID added — replace" : "Upload your ID card"}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleIdFile}
                    disabled={uploadingId}
                    style={{ display: "none" }}
                  />
                </label>
                <p className="hint">Add at least one — a selfie or a photo of a government ID.</p>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-line" onClick={() => setOpen(false)}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-accent"
                  disabled={submitting || uploadingSelfie || uploadingId || (!selfiePath && !idCardPath)}
                >
                  {submitting ? "Submitting…" : "Submit for review"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
