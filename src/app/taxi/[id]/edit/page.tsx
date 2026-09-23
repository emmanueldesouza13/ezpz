"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Header from "@/components/Header";
import BackButton from "@/components/BackButton";
import Icon from "@/components/Icon";
import { createClient } from "@/lib/supabase/client";
import { toast } from "@/lib/toast";
import { GUYANA_REGIONS, OTHER_REGION_VALUE } from "@/lib/guyana";

const MAX_PHOTOS = 6;

export default function EditTaxiPage() {
  const supabase = createClient();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [checking, setChecking] = useState(true);
  const [notFound, setNotFound] = useState(false);
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

  useEffect(() => {
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        router.push(`/sign-in?next=/taxi/${id}/edit`);
        return;
      }

      const [{ data: service }, { data: profile }] = await Promise.all([
        supabase.from("taxi_services").select("*").eq("id", id).maybeSingle(),
        supabase.from("profiles").select("is_admin").eq("id", userData.user.id).maybeSingle(),
      ]);

      if (!service) {
        setNotFound(true);
        setChecking(false);
        return;
      }
      const isOwner = service.owner_id === userData.user.id;
      const isAdmin = profile?.is_admin ?? false;
      if (!isOwner && !isAdmin) {
        setNotFound(true);
        setChecking(false);
        return;
      }

      setDriverName(service.driver_name);
      setVehicleMake(service.vehicle_make);
      setVehicleModel(service.vehicle_model);
      setPlate(service.plate);
      setServiceArea(service.service_area);
      setRegionChoice(
        GUYANA_REGIONS.includes(service.service_area) ? service.service_area : OTHER_REGION_VALUE
      );
      setPhone(service.phone);
      setMmg(service.mmg_number);
      setNotes(service.notes || "");
      setPhotos(
        Array.isArray(service.photos) && service.photos.length > 0
          ? service.photos
          : service.photo_url
            ? [service.photo_url]
            : []
      );
      setChecking(false);
    })();
  }, [supabase, router, id]);

  async function handlePhotoFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (files.length === 0) return;
    const room = MAX_PHOTOS - photos.length;
    if (room <= 0) { toast(`You can add up to ${MAX_PHOTOS} photos`); return; }
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) return;
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
    const { data, error } = await supabase
      .from("taxi_services")
      .update({
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
      .eq("id", id)
      .select();
    setSubmitting(false);
    if (error) {
      toast("Couldn't save — " + error.message);
      return;
    }
    if (!data || data.length === 0) {
      toast("Couldn't save — no permission, or it's already gone");
      return;
    }
    setDone(true);
    toast("Listing updated");
    setTimeout(() => router.push(`/taxi/${id}`), 700);
  }

  if (checking) return null;

  if (notFound) {
    return (
      <>
        <Header />
        <main>
          <section className="wrap">
            <div className="empty-state">You can&#39;t edit this listing.</div>
          </section>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main>
        <section className="wrap">
          <div className="post-wrap">
            <BackButton />
            {done ? (
              <div className="empty-state">Saved — taking you back to the listing…</div>
            ) : (
              <>
                <h1>Edit taxi service</h1>
                <p className="lede">Update the details below and save your changes.</p>
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
                    {photos.length > 0 && <p className="hint">The first photo is used as the main photo.</p>}
                  </div>

                  <div className="field">
                    <label htmlFor="driverNameInput">Driver / business name</label>
                    <input
                      className="control"
                      id="driverNameInput"
                      required
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
                      value={plate}
                      onChange={(e) => setPlate(e.target.value)}
                    />
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
                      value={mmg}
                      onChange={(e) => setMmg(e.target.value)}
                    />
                  </div>

                  <div className="field">
                    <label htmlFor="notesInput">Notes (optional)</label>
                    <textarea
                      className="control"
                      id="notesInput"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>

                  <button type="submit" className="btn btn-accent btn-block" disabled={submitting || uploadingPhoto}>
                    {submitting ? "Saving…" : "Save changes"}
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
