"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import BackButton from "@/components/BackButton";
import Icon from "@/components/Icon";
import { createClient } from "@/lib/supabase/client";
import { getSiteSettings, getOccupyingListing } from "@/lib/data";
import { toast } from "@/lib/toast";
import { GUYANA_REGIONS, OTHER_REGION_VALUE } from "@/lib/guyana";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { MAX_LISTING_PHOTOS, uploadListingPhoto } from "@/lib/media";

export default function TaxiPostPage() {
  const supabase = createClient();
  const router = useRouter();
  const { t } = useLanguage();

  const [checkingAuth, setCheckingAuth] = useState(true);
  const [driverName, setDriverName] = useState("");
  const [vehicleMake, setVehicleMake] = useState("");
  const [vehicleModel, setVehicleModel] = useState("");
  const [plate, setPlate] = useState("");
  const [regionChoice, setRegionChoice] = useState("");
  const [serviceArea, setServiceArea] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [fee, setFee] = useState(5000);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        router.push("/sign-in?next=/taxi/post");
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name, account_type, is_admin")
        .eq("id", data.user.id)
        .maybeSingle();
      if (profile && !profile.is_admin && profile.account_type === "buyer") {
        toast(t("post.buyersCantPost"));
        router.push("/account");
        return;
      }
      const occupying = await getOccupyingListing(supabase, data.user.id);
      if (occupying) {
        toast(t("post.alreadyHaveListing"));
        router.push("/account");
        return;
      }
      setCheckingAuth(false);

      if (profile?.display_name) setDriverName(profile.display_name);

      const settings = await getSiteSettings(supabase);
      setFee(settings.taxi_fee);
    })();
  }, [supabase, router]);

  async function handlePhotoFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (files.length === 0) return;
    const room = MAX_LISTING_PHOTOS - photos.length;
    if (room <= 0) { toast(`You can add up to ${MAX_LISTING_PHOTOS} photos`); return; }
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) { router.push("/sign-in?next=/taxi/post"); return; }
    setUploadingPhoto(true);
    const uploaded: string[] = [];
    for (const file of files.slice(0, room)) {
      const result = await uploadListingPhoto(supabase, user.id, file, "taxi-");
      if (!result.url) { toast(result.error ?? "Upload failed"); continue; }
      uploaded.push(result.url);
    }
    setUploadingPhoto(false);
    if (uploaded.length > 0) setPhotos((p) => [...p, ...uploaded]);
  }

  function removePhoto(i: number) {
    setPhotos((p) => p.filter((_, idx) => idx !== i));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (
      !driverName.trim() ||
      !vehicleMake.trim() ||
      !vehicleModel.trim() ||
      !plate.trim() ||
      !serviceArea.trim() ||
      !phone.trim()
    ) {
      toast("Fill in all required fields");
      return;
    }
    setSubmitting(true);
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) {
      router.push("/sign-in?next=/taxi/post");
      return;
    }

    const { data: service, error } = await supabase
      .from("taxi_services")
      .insert({
        owner_id: user.id,
        driver_name: driverName.trim(),
        vehicle_make: vehicleMake.trim(),
        vehicle_model: vehicleModel.trim(),
        plate: plate.trim(),
        service_area: serviceArea.trim(),
        phone: phone.trim(),
        notes: notes.trim(),
        photo_url: photos[0] ?? null,
        photos,
      })
      .select("id")
      .single();

    setSubmitting(false);
    if (error || !service) {
      toast(error?.message || "Something went wrong — try again");
      return;
    }
    setDone(true);
    setTimeout(() => router.push(`/taxi/${service.id}`), 900);
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
                {t("taxi.doneMessage", { fee: fee.toLocaleString() })}
              </div>
            ) : (
              <>
                <h1>{t("taxi.signUp")}</h1>
                <p className="lede">
                  {t("taxi.lede")}
                </p>
                <form onSubmit={handleSubmit}>
                  <div className="field">
                    <label>{t("taxi.vehiclePhotosLabel")}</label>
                    <div className="swatch-picker">
                      {photos.map((url, i) => (
                        <div className="photo-tile" key={url}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={url} alt={`Vehicle photo ${i + 1}`} />
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
                        {t("taxi.vehiclePhotosHintEmpty", { max: MAX_LISTING_PHOTOS })}
                      </p>
                    ) : (
                      <p className="hint">{t("taxi.vehiclePhotosHintSome")}</p>
                    )}
                  </div>

                  <div className="field">
                    <label htmlFor="driverNameInput">{t("taxi.driverNameLabel")}</label>
                    <input
                      className="control"
                      id="driverNameInput"
                      required
                      placeholder={t("taxi.driverNamePlaceholder")}
                      value={driverName}
                      onChange={(e) => setDriverName(e.target.value)}
                    />
                  </div>

                  <div className="price-row" style={{ marginBottom: 20 }}>
                    <div className="field">
                      <label htmlFor="vehicleMakeInput">{t("taxi.vehicleMakeLabel")}</label>
                      <input
                        className="control"
                        id="vehicleMakeInput"
                        required
                        placeholder="e.g. Toyota"
                        value={vehicleMake}
                        onChange={(e) => setVehicleMake(e.target.value)}
                      />
                    </div>
                    <div className="field">
                      <label htmlFor="vehicleModelInput">{t("taxi.vehicleModelLabel")}</label>
                      <input
                        className="control"
                        id="vehicleModelInput"
                        required
                        placeholder="e.g. Allion"
                        value={vehicleModel}
                        onChange={(e) => setVehicleModel(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="field">
                    <label htmlFor="plateInput">{t("taxi.plateLabel")}</label>
                    <input
                      className="control"
                      id="plateInput"
                      required
                      placeholder="e.g. PZZ 1234"
                      value={plate}
                      onChange={(e) => setPlate(e.target.value)}
                    />
                    <p className="hint">
                      {t("taxi.plateHint")}
                    </p>
                  </div>

                  <div className="field">
                    <label htmlFor="areaSelect">{t("taxi.areaLabel")}</label>
                    <select
                      className="control"
                      id="areaSelect"
                      required
                      value={regionChoice}
                      onChange={(e) => {
                        const v = e.target.value;
                        setRegionChoice(v);
                        if (v !== OTHER_REGION_VALUE) setServiceArea(v);
                        else setServiceArea("");
                      }}
                    >
                      <option value="" disabled>
                        {t("taxi.chooseRegion")}
                      </option>
                      {GUYANA_REGIONS.map((r) => (
                        <option value={r} key={r}>
                          {r}
                        </option>
                      ))}
                      <option value={OTHER_REGION_VALUE}>{t("taxi.otherTypeIn")}</option>
                    </select>
                    {regionChoice === OTHER_REGION_VALUE && (
                      <input
                        className="control"
                        style={{ marginTop: 8 }}
                        required
                        autoFocus
                        placeholder={t("taxi.otherPlaceholder")}
                        value={serviceArea}
                        onChange={(e) => setServiceArea(e.target.value)}
                      />
                    )}
                  </div>

                  <div className="field">
                    <label htmlFor="phoneInput">{t("taxi.phoneLabel")}</label>
                    <input
                      className="control"
                      id="phoneInput"
                      required
                      inputMode="tel"
                      placeholder="e.g. 642-1187"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>

                  <div className="field">
                    <label htmlFor="notesInput">{t("taxi.notesLabel")}</label>
                    <textarea
                      className="control"
                      id="notesInput"
                      placeholder={t("taxi.notesPlaceholder")}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>

                  <div className="fee-note">
                    <Icon name="Wallet" size={14} />
                    {t("taxi.feeNote", { fee: fee.toLocaleString() })}
                  </div>

                  <button type="submit" className="btn btn-accent btn-block" disabled={submitting || uploadingPhoto}>
                    {submitting ? t("post.publishing") : t("taxi.publish")}
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
