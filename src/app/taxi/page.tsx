import Link from "next/link";
import { redirect } from "next/navigation";
import Header from "@/components/Header";
import CategoryNav from "@/components/CategoryNav";
import Icon from "@/components/Icon";
import { createClient } from "@/lib/supabase/server";
import { getTaxiServices } from "@/lib/data";
import type { TaxiService } from "@/lib/types";

export default async function TaxiPage() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    redirect("/sign-in?next=/taxi");
  }
  const services = await getTaxiServices(supabase);

  // One horizontally-scrolling row per service area (region), like a
  // rental-car browse page grouped by city.
  const byRegion = new Map<string, TaxiService[]>();
  for (const s of services) {
    const key = s.service_area.trim() || "Other areas";
    const list = byRegion.get(key);
    if (list) list.push(s);
    else byRegion.set(key, [s]);
  }
  const regions = Array.from(byRegion.entries()).sort((a, b) => a[0].localeCompare(b[0]));

  return (
    <>
      <Header />
      <CategoryNav />
      <main>
        <section className="wrap">
          <div className="browse-head">
            <div>
              <h1>Taxi &amp; rides</h1>
            </div>
            <Link href="/taxi/post" className="btn btn-accent">
              <Icon name="Plus" size={15} strokeWidth={2.4} />
              Sign up as a taxi service
            </Link>
          </div>

          {regions.map(([region, list]) => (
            <div className="region-row" key={region}>
              <div className="region-row-head">
                <h2>{region}</h2>
                <p>
                  {list.length} taxi service{list.length === 1 ? "" : "s"} in this area
                </p>
              </div>
              <div className="region-scroll">
                {list.map((s) => (
                  <Link href={`/taxi/${s.id}`} key={s.id} className="region-card">
                    <div className="region-card-photo">
                      {s.photo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={s.photo_url} alt={`${s.vehicle_make} ${s.vehicle_model}`} />
                      ) : (
                        <Icon name="Car" />
                      )}
                    </div>
                    <div className="region-card-title">
                      {s.vehicle_make} {s.vehicle_model}
                    </div>
                    <div className="region-card-sub">
                      {s.driver_name} &middot; {s.plate}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}

          {services.length === 0 && (
            <div className="empty-state">
              No taxi services yet — be the first to sign up.
            </div>
          )}
        </section>
      </main>
    </>
  );
}
