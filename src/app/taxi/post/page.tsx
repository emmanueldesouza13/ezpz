"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import BackButton from "@/components/BackButton";
import Icon from "@/components/Icon";
import { createClient } from "@/lib/supabase/client";
import { getSiteSettings } from "@/lib/data";
import { toast } from "@/lib/toast";
import { GUYANA_REGIONS, OTHER_REGION_VALUE } from "@/lib/guyana";

const MAX_PHOTOS = 6;

export default function TaxiPostPage() {
  const supabase = createClient();
  const router = useRouter();

  const [checkingAuth, setCheckingAuth] = useState(true);
  const [driverName, setDriverName] = useState("");
  const [vehicleMake, setVehicleMake] = useState("");
  const [vehicleModel, setVehicleModel] = useState("");
  const [plate, setPlate] = useState("");
  const [regionChoice, setRegionChoice] = useState("");
  const [serviceArea, setServiceArea] = useState("");
  const [phone, setPhone] = useState("");
  const [mmg, setMmg] = useState("");
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
      setCheckingAuth(false);

      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name, mmg_number")
        .eq("id", data.user.id)
        .maybeSingle();
      if (profile?.display_name) setDriverName(profile.display_name);
      if (profile?.mmg_number) setMmg(profile.mmg_number);

      const settings = await getSiteSettings(supabase);
      setFee(settings.taxi_fee);
    })();
  }, [supabase, router]);

  async function handlePhotoFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (files.length === 0) return;
    const room = MAX_PHOTOS - photos.length;
    if (room <= 0) { toast(`You can add up to ${MAX_PHOTOS} photos`); return; }
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) { router.push("/sign-in?next=/taxi/post"); return; }
    setUploadingPhoto(true);
    const uploaded: string[] = [];
    for (const file of files.slice(0, room)) {
      if (!file.type.startsWith("image/")) { toast(`${file.name} isn't an image — skipped`); continue; }
      if (file.size > 8 * 1024 * 1024) { toast(`${file.name} is too large — 8MB max`); continue; }
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${user.id}/taxi-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (
      !driverName.trim() ||
      !vehicleMake.trim() ||
      !vehicleModel.trim() ||
      !plate.trim() ||
      !serviceArea.trim() ||
      !phone.trim() ||
      !mmg.trim()
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
        mmg_number: mmg.trim(),
        notes: notes.trim(),
        photo_url: photos[0] ?? null,
        photos,
      })
      .select("id")
      .single();

    setSubmitting(false);
    if (error || !service) {
      toast("Something went wrong — try again");
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
                You&#39;re live! Pay GY${fee.toLocaleString()} via MMG to settle your activation
                fee when you can. Taking you there now…
              </div>
            ) : (
              <>
                <h1>Sign up as a taxi service</h1>
                <p className="lede">
                  List your car/taxi pickup &amp; drop-off service so riders across Guyana can
                  find and contact you directly.
                </p>
                <form onSubmit={handleSubmit}>
                  <div className="field">
                    <label>Vehicle photos</label>
                    <div className="swatch-picker">
                      {photos.map((url, i) => (
                        <div className="photo-tile" key={url}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={url} alt={`Vehicle photo ${i + 1}`} />
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
                      {photos.length < MAX_PHOTOS && (
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
                    {photos.length === 0 ? (
                      <p className="hint">
                        A clear photo of the car helps riders spot you — up to {MAX_PHOTOS}.
                      </p>
                    ) : (
                      <p className="hint">The first photo is used as the main photo.</p>
                    )}
                  </div>

                  <div className="field">
                    <label htmlFor="driverNameInput">Driver / business name</label>
                    <input
                      className="control"
                      id="driverNameInput"
                      required
                      placeholder="e.g. Rico's Taxi Service"
                      value={driverName}
                      onChange={(e) => setDriverName(e.target.value)}
                    />
                  </div>

                  <div className="price-row" style={{ marginBottom: 20 }}>
                    <div className="field">
                      <label htmlFor="vehicleMakeInput">Vehicle make</label>
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
                      <label htmlFor="vehicleModelInput">Vehicle model</label>
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
                    <label htmlFor="plateInput">License plate number</label>
                    <input
                      className="control"
                      id="plateInput"
                      required
                      placeholder="e.g. PZZ 1234"
                      value={plate}
                      onChange={(e) => setPlate(e.target.value)}
                    />
                    <p className="hint">
                      Shown to riders so they can confirm they&#39;re getting in the right car.
                    </p>
                  </div>

                  <div className="field">
                    <label htmlFor="areaSelect">Service area</label>
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
                        Choose a region
                      </option>
                      {GUYANA_REGIONS.map((r) => (
                        <option value={r} key={r}>
                          {r}
                        </option>
                      ))}
                      <option value={OTHER_REGION_VALUE}>Other (type it in)</option>
                    </select>
                    {regionChoice === OTHER_REGION_VALUE && (
                      <input
                        className="control"
                        style={{ marginTop: 8 }}
                        required
                        autoFocus
                        placeholder="e.g. Bartica"
                        value={serviceArea}
                        onChange={(e) => setServiceArea(e.target.value)}
                      />
                    )}
                  </div>

                  <div className="field">
                    <label htmlFor="phoneInput">Phone number</label>
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
                    <label htmlFor="mmgInput">Your MMG number</label>
                    <input
                      className="control"
                      id="mmgInput"
                      required
                      inputMode="tel"
                      placeholder="e.g. 642-1187"
                      value={mmg}
                      onChange={(e) => setMmg(e.target.value)}
                    />
                    <p className="hint">
                      Shown to riders so they can pay you directly. EzPz never holds or processes
                      payments.
                    </p>
                  </div>

                  <div className="field">
                    <label htmlFor="notesInput">Notes (optional)</label>
                    <textarea
                      className="control"
                      id="notesInput"
                      placeholder="Hours, rates, or anything riders should know."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>

                  <div className="fee-note">
                    <Icon name="Wallet" size={14} />
                    Your listing goes live immediately. Signing up costs GY${fee.toLocaleString()}
                    — you&#39;ll get MMG payment instructions after you publish to settle it.
                  </div>

                  <button type="submit" className="btn btn-accent btn-block" disabled={submitting || uploadingPhoto}>
                    {submitting ? "Publishing…" : "Publish sign-up"}
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
