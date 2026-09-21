"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BackButton from "@/components/BackButton";
import Icon from "@/components/Icon";
import FeeBanner from "@/components/FeeBanner";
import { createClient } from "@/lib/supabase/client";
import { getMyListings, getMyTaxiServices, getSiteSettings } from "@/lib/data";
import type { Listing, TaxiService, Settings } from "@/lib/types";
import { toast } from "@/lib/toast";

export default function PaymentsPage() {
  const supabase = createClient();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [mmg, setMmg] = useState<string | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [myListings, setMyListings] = useState<Listing[]>([]);
  const [myTaxi, setMyTaxi] = useState<TaxiService[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) { router.push("/sign-in?next=/payments"); return; }
      const [{ data: profile }, s, listings, taxi] = await Promise.all([
        supabase.from("profiles").select("mmg_number").eq("id", data.user.id).maybeSingle(),
        getSiteSettings(supabase),
        getMyListings(supabase, data.user.id),
        getMyTaxiServices(supabase, data.user.id),
      ]);
      setMmg(profile?.mmg_number ?? null);
      setSettings(s);
      setMyListings(listings);
      setMyTaxi(taxi);
      setLoading(false);
    })();
  }, [supabase, router]);

  function handleCopy(number: string) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(number).then(
        () => toast("MMG number copied — " + number),
        () => toast("MMG number: " + number)
      );
    } else {
      toast("MMG number: " + number);
    }
  }

  if (loading) return null;

  const pendingListings = myListings.filter((l) => l.fee_status === "pending");
  const pendingTaxi = myTaxi.filter((t) => t.fee_status === "pending");
  const allPaidUp = pendingListings.length === 0 && pendingTaxi.length === 0;

  return (
    <>
      <Header />
      <main>
        <section className="wrap">
          <div className="post-wrap">
            <BackButton />
            <h1>Payments</h1>
            <p className="lede">
              EzPz never holds your money. Buyers and sellers pay each other directly by MMG —
              here&#39;s everything about the money side of your account.
            </p>

            <h2 style={{ marginTop: 24 }}>Your payout number</h2>
            {mmg ? (
              <div className="fee-box standalone">
                <div className="fee-label">
                  <Icon name="Wallet" size={15} />
                  Buyers pay you at this MMG number
                </div>
                <div className="fee-number-row">
                  <span className="mono">{mmg}</span>
                  <button type="button" className="fee-copy" onClick={() => handleCopy(mmg)}>
                    <Icon name="Copy" size={13} />
                    Copy
                  </button>
                </div>
                <p className="fee-caption">
                  This is shown on every listing you post.{" "}
                  <Link href="/account" style={{ color: "var(--brand)", fontWeight: 700 }}>
                    Change it in your account
                  </Link>
                  .
                </p>
              </div>
            ) : (
              <div className="fee-box standalone">
                <p className="fee-caption">
                  You haven&#39;t added an MMG number yet, so buyers have no way to pay you.{" "}
                  <Link href="/account" style={{ color: "var(--brand)", fontWeight: 700 }}>
                    Add one in your account
                  </Link>
                  .
                </p>
              </div>
            )}

            <h2 style={{ marginTop: 28 }}>Fees you owe</h2>
            {allPaidUp ? (
              <div className="empty-state">You&#39;re all paid up — no activation fees pending.</div>
            ) : (
              <>
                {pendingListings.map((l) => (
                  <div key={l.id} style={{ marginBottom: 14 }}>
                    <p className="admin-row-title" style={{ marginBottom: 6 }}>
                      <Link href={`/listing/${l.id}`}>{l.title}</Link>
                    </p>
                    <FeeBanner
                      mmg={settings?.platform_mmg_number ?? null}
                      fee={settings?.listing_fee ?? 2000}
                    />
                  </div>
                ))}
                {pendingTaxi.map((t) => (
                  <div key={t.id} style={{ marginBottom: 14 }}>
                    <p className="admin-row-title" style={{ marginBottom: 6 }}>
                      <Link href={`/taxi/${t.id}`}>{t.driver_name}</Link>
                    </p>
                    <FeeBanner
                      mmg={settings?.taxi_mmg_number ?? null}
                      fee={settings?.taxi_fee ?? 5000}
                    />
                  </div>
                ))}
              </>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
