import Link from "next/link";
import Header from "@/components/Header";
import Icon from "@/components/Icon";
import BackButton from "@/components/BackButton";
import FeeBanner from "@/components/FeeBanner";
import DismissibleCallout from "@/components/DismissibleCallout";
import TaxiPhotoSlider from "@/components/TaxiPhotoSlider";
import T from "@/components/T";
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
              <T k="taxi.notFound" />{" "}
              <Link href="/taxi" style={{ color: "var(--brand)", fontWeight: 700 }}>
                <T k="taxi.backToTaxi" />
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
            <Link href="/"><T k="taxi.home" /></Link>
            <span>/</span>
            <Link href="/taxi"><T k="taxi.title" /></Link>
            <span>/</span>
            <span className="current">{service.driver_name}</span>
          </div>
          <div className="detail-layout">
            <div>
              <TaxiPhotoSlider
                photos={
                  service.photos && service.photos.length > 0
                    ? service.photos
                    : service.photo_url
                      ? [service.photo_url]
                      : []
                }
                alt={`${service.vehicle_make} ${service.vehicle_model}`}
              />
              <p className="section-label"><T k="taxi.aboutService" /></p>
              <p className="desc-text">{service.notes || <T k="taxi.noNotes" />}</p>
              <DismissibleCallout>
                <T k="taxi.confirmFareCallout" />
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
                    <T k="taxi.postedAgo" vars={{ time: timeAgo(service.created_at) }} />
                  </span>
                </div>
                <div className="fee-box" style={{ marginBottom: 14 }}>
                  <div className="fee-label">
                    <Icon name="Shield" size={15} />
                    <T k="taxi.confirmRide" />
                  </div>
                  <div className="fee-number-row">
                    <span className="mono">{service.plate}</span>
                  </div>
                </div>
                <div className="fee-box">
                  <div className="fee-label">
                    <Icon name="Phone" size={15} />
                    <T k="taxi.contact" />
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
                      <T k="taxi.editListing" />
                    </Link>
                    <RemoveListingButton
                      table="taxi_services"
                      id={service.id}
                      redirectTo="/account"
                      labelKey="taxi.removeThisListing"
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
