"use client";

import { useEffect, useState } from "react";
import Icon from "./Icon";
import { createClient } from "@/lib/supabase/client";
import { getSiteSettings } from "@/lib/data";

// Site-wide privacy switch, flipped from Admin -> Maintenance. Lives in the
// root layout (mounted once per visit, above every page) so it can blur
// every photo and bio/description no matter where someone is in the app —
// including the admin's own screen while doing maintenance work, so
// nothing a user posted is visible on screen during that time.
//
// Applies the blur by toggling a class on <body> rather than passing state
// down through every page, since the whole point is that it has to reach
// every image and every bio/description everywhere, including ones this
// component knows nothing about. Subscribes to live changes on the
// settings row so flipping the toggle takes effect immediately in any
// other open tab/device, not just after a reload.
export default function PrivacyBlurGate() {
  const [active, setActive] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    getSiteSettings(supabase).then((s) => {
      if (!cancelled) setActive(Boolean(s.privacy_blur));
    });

    const channel = supabase
      .channel("settings-privacy-blur")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "settings", filter: "id=eq.1" },
        (payload) => {
          setActive(Boolean((payload.new as { privacy_blur?: boolean }).privacy_blur));
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    document.body.classList.toggle("privacy-blur", active);
    return () => {
      document.body.classList.remove("privacy-blur");
    };
  }, [active]);

  if (!active) return null;

  return (
    <div className="privacy-blur-banner">
      <Icon name="EyeOff" size={16} />
      <span>Privacy blur is on — photos and bios are hidden site-wide.</span>
    </div>
  );
}
