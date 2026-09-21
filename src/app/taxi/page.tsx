import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CategoryNav from "@/components/CategoryNav";
import Icon from "@/components/Icon";
import { createClient } from "@/lib/supabase/server";
import { getTaxiServices } from "@/lib/data";

export default async function TaxiPage() {
  const supabase = await createClient();
  const services = await getTaxiServices(supabase);

  return (
    <>
      <Header />
      <CategoryNav />
      <main>
        <section className="wrap">
          <div className="browse-head">
            <div>
              <h1>Taxi &amp; rides</h1>
              <p>
                {services.length} taxi service{services.length === 1 ? "" : "s"} across Guyana
              </p>
            </div>
            <Link href="/taxi/post" className="btn btn-accent">
              <Icon name="Plus" size={15} strokeWidth={2.4} />
              Sign up as a taxi service
            </Link>
          </div>

          <div className="admin-list">
            {services.map((s) => (
              <Link href={`/taxi/${s.id}`} key={s.id} className="admin-row" style={{ textDecoration: "none" }}>
                <div
                  className="admin-swatch"
                  style={{
                    background: "var(--surface-2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--accent)",
                  }}
                >
                  <Icon name="Car" />
                </div>
                <div className="admin-row-info">
                  <div className="admin-row-title">
                    {s.driver_name}
                    <span className="admin-flag on">{s.plate}</span>
                  </div>
                  <div className="admin-row-sub">
                    {s.vehicle_make} {s.vehicle_model} &middot; {s.service_area}
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {services.length === 0 && (
            <div className="empty-state">
              No taxi services listed yet — be the first to sign up.
            </div>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
