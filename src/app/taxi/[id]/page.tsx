import Link from "next/link";
import Header from "@/components/Header";
import Icon from "@/components/Icon";
import BackButton from "@/components/BackButton";
import FeeBanner from "@/components/FeeBanner";
import DismissibleCallout from "@/components/DismissibleCallout";
import { createClient } from "@/lib/supabase/server";
import { getTaxiServiceById, getSiteSettings, getProfile } from "@/lib/data";
import { timeAgo } from "@/lib/format";
import RemoveListingButton from "@/components/RemoveListingButton";

export default async function TaxiServiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const [service, settings, { data: userData }] = await Promise.all([
    getTaxiServiceById(supabase, id),
    getSiteSettings(supabase),
    supabase.auth.getUser(),
  ]);

  if (!service) {
    return (
      <>
        <Header />
        <main>
          <section className="wrap">
            <div className="empty-state">
              Taxi service not found.{" "}
              <Link href="/taxi" style={{ color: "var(--brand)", fontWeight: 700 }}>
                Back to taxi &amp; rides
              </Link>
            </div>
          </section>
        </main>
      </>
    );
  }

  const viewerProfile = userData.user ? await getProfile(supabase, userData.user.id) : null;
  const isOwner = userData.user?.id === service.owner_id;
  const isAdmin = viewerProfile?.is_admin ?? false;
  const feePending = service.fee_status === "pending";

  return (
    <>
      <Header />
      <main>
        <section className="wrap">
          <BackButton />
          {feePending && (isOwner || isAdmin) && (
            <FeeBanner mmg={settings.taxi_mmg_number} fee={settings.taxi_fee} />
          )}
          <div className="crumbs">
            <Link href="/">Home</Link>
            <span>/</span>
            <Link href="/taxi">Taxi &amp; rides</Link>
            <span>/</span>
            <span className="current">{service.driver_name}</span>
          </div>
          <div className="detail-layout">
            <div>
              {service.photo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={service.photo_url}
                  alt={`${service.vehicle_make} ${service.vehicle_model}`}
                  className="hero-photo"
                  style={{ objectFit: "cover", display: "block" }}
                />
              ) : (
                <div className="hero-photo" style={{ background: "linear-gradient(135deg,#2f8f6b,#134a38)" }}></div>
              )}
              <p className="section-label">About this service</p>
              <p className="desc-text">{service.notes || "No additional notes from this driver."}</p>
              <DismissibleCallout>
                Confirm the fare and pickup details before you ride, and never wire money or pay
                outside the app up front. <Link href="/safety">More safety tips</Link>
              </DismissibleCallout>
            </div>
            <div>
              <div className="seller-panel">
                <h2>{service.driver_name}</h2>
                <div className="meta-row">
                  <span>
                    <Icon name="MapPin" />
                    {service.service_area}
                  </span>
                  <span>
                    <Icon name="Clock" />
                    {timeAgo(service.created_at)}
                  </span>
                </div>
                <div className="fee-box" style={{ marginBottom: 14 }}>
                  <div className="fee-label">
                    <Icon name="Shield" size={15} />
                    Confirm this is your ride
                  </div>
                  <div className="fee-number-row">
                    <span className="mono">{service.plate}</span>
                  </div>
                </div>
                <div className="fee-box">
                  <div className="fee-label">
                    <Icon name="Phone" size={15} />
                    Contact
                  </div>
                  <div className="fee-number-row">
                    <span className="mono">{service.phone}</span>
                  </div>
                </div>
                {(isOwner || isAdmin) && (
                  <>
                    <Link
                      href={`/taxi/${service.id}/edit`}
                      className="btn btn-line btn-block"
                      style={{ marginBottom: 10 }}
                    >
                      <Icon name="Pencil" />
                      Edit listing
                    </Link>
                    <RemoveListingButton
                      table="taxi_services"
                      id={service.id}
                      redirectTo="/account"
                      label="Remove this listing"
                    />
                  </>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
