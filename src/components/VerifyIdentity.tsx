"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Icon from "./Icon";
import FeeBanner from "./FeeBanner";
import { toast } from "@/lib/toast";
import { getSiteSettings } from "@/lib/data";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import type { Profile, Settings, VerificationRequest } from "@/lib/types";

const MAX_MB = 8;

export default function VerifyIdentity({ profile }: { profile: Profile }) {
  const supabase = createClient();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [request, setRequest] = useState<VerificationRequest | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [open, setOpen] = useState(false);
  const [selfiePath, setSelfiePath] = useState<string | null>(null);
  const [idCardPath, setIdCardPath] = useState<string | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  const [idPreview, setIdPreview] = useState<string | null>(null);
  const [uploadingSelfie, setUploadingSelfie] = useState(false);
  const [uploadingId, setUploadingId] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      const [{ data }, s] = await Promise.all([
        supabase
          .from("verification_requests")
          .select("*")
          .eq("user_id", profile.id)
          .maybeSingle(),
        getSiteSettings(supabase),
      ]);
      const row = (data as VerificationRequest) ?? null;
      setRequest(row);
      setSelfiePath(row?.selfie_path ?? null);
      setIdCardPath(row?.id_card_path ?? null);
      setSettings(s);
      setLoading(false);
    })();
  }, [supabase, profile.id]);

  function setPreview(kind: "selfie" | "id", url: string | null) {
    const setter = kind === "selfie" ? setSelfiePreview : setIdPreview;
    setter((prev) => {
      if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
      return url;
    });
  }

  async function loadPreview(path: string | null, kind: "selfie" | "id") {
    if (!path) {
      setPreview(kind, null);
      return;
    }
    const { data, error } = await supabase.storage.from("verification").createSignedUrl(path, 300);
    if (error || !data?.signedUrl) return;
    setPreview(kind, data.signedUrl);
  }

  function openModal() {
    const sPath = request?.selfie_path ?? null;
    const iPath = request?.id_card_path ?? null;
    setSelfiePath(sPath);
    setIdCardPath(iPath);
    setPreview("selfie", null);
    setPreview("id", null);
    setOpen(true);
    loadPreview(sPath, "selfie");
    loadPreview(iPath, "id");
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
    if (file.type.startsWith("image/")) setPreview("selfie", URL.createObjectURL(file));
    setUploadingSelfie(true);
    const path = await uploadDoc(file, "selfie");
    setUploadingSelfie(false);
    if (path) {
      setSelfiePath(path);
    } else {
      loadPreview(selfiePath, "selfie");
    }
  }

  async function handleIdFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.type.startsWith("image/")) setPreview("id", URL.createObjectURL(file));
    setUploadingId(true);
    const path = await uploadDoc(file, "id");
    setUploadingId(false);
    if (path) {
      setIdCardPath(path);
    } else {
      loadPreview(idCardPath, "id");
    }
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
    const row = data as VerificationRequest;
    setRequest(row);
    toast(
      row.fee_status === "pending"
        ? `Submitted — pay the GY$${fee.toLocaleString()} fee to finish getting your blue tick`
        : "Verification submitted — we'll review it soon"
    );
    setOpen(false);
  }

  if (loading) return null;

  if (profile.verified) {
    return (
      <div className="verify-card verify-approved">
        <Icon name="ShieldCheck" />
        <div className="verify-card-info">
          <p className="verify-title">{t("verify.verifiedTitle")}</p>
          <p className="verify-sub">{t("verify.verifiedSub")}</p>
        </div>
      </div>
    );
  }

  const status = request?.status;
  const fee = settings?.verification_fee ?? 2000;
  const mmg = settings?.platform_mmg_number ?? null;
  const feeUnpaid = !!request && request.fee_status === "pending";

  return (
    <>
      <div
        className={`verify-card${status === "rejected" ? " verify-rejected" : ""}${status === "pending" ? " verify-pending" : ""}`}
      >
        {status === "pending" ? (
          <span className="verify-icon-badge">
            <Icon name="Clock" />
          </span>
        ) : (
          <Icon name={status === "rejected" ? "ShieldAlert" : "Shield"} />
        )}
        <div className="verify-card-info">
          <p className="verify-title">
            {status === "pending"
              ? t("verify.submittedTitle")
              : status === "rejected"
              ? t("verify.rejectedTitle")
              : t("verify.getBlueTick")}
          </p>
          <p className="verify-sub">
            {status === "pending"
              ? feeUnpaid
                ? t("verify.reviewingFeeUnpaid")
                : t("verify.reviewing")
              : status === "rejected"
              ? request?.rejection_reason || t("verify.rejectedDefault")
              : t("verify.uploadPrompt", { fee: fee.toLocaleString() })}
          </p>
        </div>
        {status !== "pending" && (
          <button type="button" className="btn btn-line" onClick={openModal}>
            {request ? t("verify.resubmit") : t("verify.verifyBtn")}
          </button>
        )}
      </div>

      {status === "pending" && (
        <div className="verify-progress">
          <div className="verify-progress-steps">
            <div className="verify-step verify-step-done">
              <span className="verify-step-dot">
                <Icon name="Check" size={10} />
              </span>
              {t("verify.stepSubmitted")}
            </div>
            <div className="verify-step verify-step-active">
              <span className="verify-step-dot">
                <span className="verify-step-pulse" />
              </span>
              {t("verify.stepReviewing")}
            </div>
            <div className="verify-step">
              <span className="verify-step-dot" />
              {t("verify.stepVerified")}
            </div>
          </div>
        </div>
      )}

      {feeUnpaid && (
        <FeeBanner
          mmg={mmg}
          fee={fee}
          label={t("fees.blueTickLabel")}
          caption={t("fees.blueTickCaption", { fee: fee.toLocaleString() })}
          noMmgCaption={t("fees.blueTickNoMmgCaption", { fee: fee.toLocaleString() })}
        />
      )}

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
            <h2>{t("verify.modalTitle")}</h2>
            <p className="hint" style={{ marginBottom: 12 }}>
              {t("verify.modalHint")}
            </p>
            {feeUnpaid && (
              <div style={{ marginBottom: 16 }}>
                <FeeBanner
                  mmg={mmg}
                  fee={fee}
                  label={t("fees.blueTickLabel")}
                  caption={t("fees.blueTickCaption", { fee: fee.toLocaleString() })}
                  noMmgCaption={t("fees.blueTickNoMmgCaption", { fee: fee.toLocaleString() })}
                />
              </div>
            )}
            <form onSubmit={handleSubmit}>
              <div className="field">
                <label>{t("verify.selfieLabel")}</label>
                {selfiePath && selfiePreview ? (
                  <div className="verify-photo-preview">
                    <img src={selfiePreview} alt={t("verify.selfiePreviewAlt")} />
                    <div className="verify-photo-actions">
                      <label
                        className="btn btn-line btn-block"
                        style={{ cursor: uploadingSelfie ? "wait" : "pointer", display: "inline-flex" }}
                      >
                        <Icon
                          name={uploadingSelfie ? "Loader2" : "RotateCcw"}
                          className={uploadingSelfie ? "spin" : undefined}
                        />
                        {uploadingSelfie ? t("post.uploading") : t("verify.retakePhoto")}
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
                  </div>
                ) : (
                  <label
                    className="btn btn-line"
                    style={{ cursor: uploadingSelfie ? "wait" : "pointer", display: "inline-flex" }}
                  >
                    <Icon
                      name={uploadingSelfie ? "Loader2" : "Camera"}
                      className={uploadingSelfie ? "spin" : undefined}
                    />
                    {uploadingSelfie ? t("post.uploading") : t("verify.selfieAdd")}
                    <input
                      type="file"
                      accept="image/*"
                      capture="user"
                      onChange={handleSelfieFile}
                      disabled={uploadingSelfie}
                      style={{ display: "none" }}
                    />
                  </label>
                )}
              </div>

              <div className="field" style={{ marginBottom: 20 }}>
                <label>{t("verify.idLabel")}</label>
                {idCardPath && idPreview ? (
                  <div className="verify-photo-preview">
                    <img src={idPreview} alt={t("verify.idPreviewAlt")} />
                    <div className="verify-photo-actions">
                      <label
                        className="btn btn-line btn-block"
                        style={{ cursor: uploadingId ? "wait" : "pointer", display: "inline-flex" }}
                      >
                        <Icon name={uploadingId ? "Loader2" : "RotateCcw"} className={uploadingId ? "spin" : undefined} />
                        {uploadingId ? t("post.uploading") : t("verify.retakePhoto")}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleIdFile}
                          disabled={uploadingId}
                          style={{ display: "none" }}
                        />
                      </label>
                    </div>
                  </div>
                ) : (
                  <label
                    className="btn btn-line"
                    style={{ cursor: uploadingId ? "wait" : "pointer", display: "inline-flex" }}
                  >
                    <Icon name={uploadingId ? "Loader2" : "IdCard"} className={uploadingId ? "spin" : undefined} />
                    {uploadingId ? t("post.uploading") : t("verify.idAdd")}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleIdFile}
                      disabled={uploadingId}
                      style={{ display: "none" }}
                    />
                  </label>
                )}
                <p className="hint">{t("verify.idHint")}</p>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-line" onClick={() => setOpen(false)}>
                  {t("common.cancel")}
                </button>
                <button
                  type="submit"
                  className="btn btn-accent"
                  disabled={submitting || uploadingSelfie || uploadingId || (!selfiePath && !idCardPath)}
                >
                  {submitting ? t("verify.submitting") : t("verify.submit")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
