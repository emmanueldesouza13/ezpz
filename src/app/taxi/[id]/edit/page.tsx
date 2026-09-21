"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BackButton from "@/components/BackButton";
import { createClient } from "@/lib/supabase/client";
import { toast } from "@/lib/toast";

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
  const [serviceArea, setServiceArea] = useState("");
  const [phone, setPhone] = useState("");
  const [mmg, setMmg] = useState("");
  const [notes, setNotes] = useState("");
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
      setPhone(service.phone);
      setMmg(service.mmg_number);
      setNotes(service.notes || "");
      setChecking(false);
    })();
  }, [supabase, router, id]);

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
        <Footer />
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
                    <label htmlFor="areaInput">Service area</label>
                    <input
                      className="control"
                      id="areaInput"
                      required
                      value={serviceArea}
                      onChange={(e) => setServiceArea(e.target.value)}
                    />
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

                  <button type="submit" className="btn btn-accent btn-block" disabled={submitting}>
                    {submitting ? "Saving…" : "Save changes"}
                  </button>
                </form>
              </>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
