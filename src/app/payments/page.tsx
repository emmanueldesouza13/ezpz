"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import BackButton from "@/components/BackButton";
import FeeBanner from "@/components/FeeBanner";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { createClient } from "@/lib/supabase/client";
import { getMyListings, getMyTaxiServices, getMyVerificationRequest, getSiteSettings } from "@/lib/data";
import type { Listing, TaxiService, Settings, VerificationRequest } from "@/lib/types";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function PaymentsPage() {
  const supabase = createClient();
  const router = useRouter();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [verified, setVerified] = useState(false);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [myListings, setMyListings] = useState<Listing[]>([]);
  const [myTaxi, setMyTaxi] = useState<TaxiService[]>([]);
  const [myVerification, setMyVerification] = useState<VerificationRequest | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) { router.push("/sign-in?next=/payments"); return; }
      const [{ data: profile }, s, listings, taxi, verification] = await Promise.all([
        supabase.from("profiles").select("verified").eq("id", data.user.id).maybeSingle(),
        getSiteSettings(supabase),
        getMyListings(supabase, data.user.id),
        getMyTaxiServices(supabase, data.user.id),
        getMyVerificationRequest(supabase, data.user.id),
      ]);
      setVerified(profile?.verified ?? false);
      setSettings(s);
      setMyListings(listings);
      setMyTaxi(taxi);
      setMyVerification(verification);
      setLoading(false);
    })();
  }, [supabase, router]);

  if (loading) return null;

  const pendingListings = myListings.filter((l) => l.fee_status === "pending");
  const pendingTaxi = myTaxi.filter((t) => t.fee_status === "pending");
  const pendingVerification = !verified && myVerification && myVerification.fee_status === "pending";
  const allPaidUp = pendingListings.length === 0 && pendingTaxi.length === 0 && !pendingVerification;

  return (
    <>
      <main>
        <section className="wrap">
          <div className="post-wrap">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <BackButton />
              <LanguageSwitcher />
            </div>
            <h1>{t("payments.title")}</h1>
            <p className="lede">
              {t("payments.lede")}
            </p>

            <h2 style={{ marginTop: 24 }}>{t("payments.feesYouOwe")}</h2>
            {allPaidUp ? (
              <div className="empty-state">{t("payments.allPaidUp")}</div>
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
                {pendingTaxi.map((svc) => (
                  <div key={svc.id} style={{ marginBottom: 14 }}>
                    <p className="admin-row-title" style={{ marginBottom: 6 }}>
                      <Link href={`/taxi/${svc.id}`}>{svc.driver_name}</Link>
                    </p>
                    <FeeBanner
                      mmg={settings?.taxi_mmg_number ?? null}
                      fee={settings?.taxi_fee ?? 5000}
                    />
                  </div>
                ))}
                {pendingVerification && (
                  <div style={{ marginBottom: 14 }}>
                    <p className="admin-row-title" style={{ marginBottom: 6 }}>
                      <Link href="/account">{t("payments.blueTickLink")}</Link>
                    </p>
                    <FeeBanner
                      mmg={settings?.platform_mmg_number ?? null}
                      fee={settings?.verification_fee ?? 2000}
                      label={t("fees.blueTickLabel")}
                      caption={t("fees.blueTickCaption", { fee: (settings?.verification_fee ?? 2000).toLocaleString() })}
                      noMmgCaption={t("fees.blueTickNoMmgCaption", { fee: (settings?.verification_fee ?? 2000).toLocaleString() })}
                      code={myVerification?.payment_code}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      </main>
    </>
  );
}
