"use client";

import Header from "@/components/Header";
import BackButton from "@/components/BackButton";
import AdminTools from "@/components/AdminTools";

// The standalone /admin route — page chrome (header, back button) around
// the shared AdminTools component. The same tools are also reachable from
// the admin's own account page, under the "Maintenance" tab — see
// ProfileTabs.tsx and AdminTools.tsx.
export default function AdminPage() {
  return (
    <>
      <Header />
      <main>
        <section className="wrap">
          <div className="admin-wrap">
            <BackButton />
            <AdminTools />
          </div>
        </section>
      </main>
    </>
  );
}
