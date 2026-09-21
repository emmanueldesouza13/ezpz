"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BackButton from "@/components/BackButton";
import Icon from "@/components/Icon";
import { createClient } from "@/lib/supabase/client";
import { getCategories } from "@/lib/data";
import { GRADIENTS, type Category } from "@/lib/types";
import { isPhotoUrl } from "@/lib/format";
import { toast } from "@/lib/toast";

const MAX_PHOTOS = 6;

export default function EditListingPage() {
  const supabase = createClient();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [checking, setChecking] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [isFree, setIsFree] = useState(false);
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [swatch, setSwatch] = useState(0);
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        router.push(`/sign-in?next=/listing/${id}/edit`);
        return;
      }

      const [{ data: listing }, { data: profile }, cats] = await Promise.all([
        supabase.from("listings").select("*").eq("id", id).maybeSingle(),
        supabase.from("profiles").select("is_admin").eq("id", userData.user.id).maybeSingle(),
        getCategories(supabase),
      ]);
      setCategories(cats);

      if (!listing) {
        setNotFound(true);
        setChecking(false);
        return;
      }
      const isOwner = listing.seller_id === userData.user.id;
      const isAdmin = profile?.is_admin ?? false;
      if (!isOwner && !isAdmin) {
        setNotFound(true);
        setChecking(false);
        return;
      }

      setTitle(listing.title);
      setCategory(listing.category);
      setPrice(listing.is_free ? "" : String(listing.price));
      setIsFree(listing.is_free);
      setLocation(listing.location);
      setDescription(listing.description);
      const uploaded: string[] = (listing.images || []).filter(isPhotoUrl);
      setPhotos(uploaded);
      if (uploaded.length === 0) {
        const gi = GRADIENTS.indexOf(listing.images?.[0]);
        setSwatch(gi >= 0 ? gi : 0);
      }
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !location.trim() || !description.trim()) {
      toast("Fill in all required fields");
      return;
    }
    setSubmitting(true);
    const { data, error } = await supabase
      .from("listings")
      .update({
        title: title.trim(),
        description: description.trim(),
        price: isFree ? 0 : Number(price) || 0,
        is_free: isFree,
        category,
        location: location.trim(),
        images: photos.length > 0 ? photos : [GRADIENTS[swatch]],
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
    setTimeout(() => router.push(`/listing/${id}`), 700);
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
                <h1>Edit listing</h1>
                <p className="lede">Update the details below and save your changes.</p>
                <form onSubmit={handleSubmit}>
                  <div className="field">
                    <label>Photos</label>
                    <div className="swatch-picker">
                      {photos.map((url, i) => (
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
                        Snap a photo or pick one from your phone — up to {MAX_PHOTOS}.
                      </p>
                    ) : (
                      <p className="hint">The first photo is used as the main listing photo.</p>
                    )}
                  </div>

                  <div className="field">
                    <label htmlFor="titleInput">Name</label>
                    <input
                      className="control"
                      id="titleInput"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </div>

                  <div className="field">
                    <label htmlFor="categorySelect">Category</label>
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
                      <label htmlFor="priceInput">Price</label>
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
                      List as free
                    </label>
                  </div>

                  <div className="field">
                    <label htmlFor="locationInput">Location</label>
                    <input
                      className="control"
                      id="locationInput"
                      required
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                    />
                  </div>

                  <div className="field">
                    <label htmlFor="descInput">Description</label>
                    <textarea
                      className="control"
                      id="descInput"
                      required
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
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
