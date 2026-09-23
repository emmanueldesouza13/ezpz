"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Icon from "./Icon";
import { toast } from "@/lib/toast";
import { useLanguage } from "@/lib/i18n/LanguageContext";

// Lets a seller (or admin) soft-delete their own listing/taxi service —
// sets status to "removed" so it disappears from Browse but stays in the
// database. RLS already scopes update/delete to the owner or an admin.
export default function RemoveListingButton({
  table,
  id,
  label,
  labelKey,
  redirectTo,
  onRemoved,
  variant = "block",
}: {
  table: "listings" | "taxi_services";
  id: string;
  // Literal, already-translated text — use this from a client component.
  label?: string;
  // A translation key, resolved here — use this from a server component,
  // which can't call the translation hook itself.
  labelKey?: string;
  redirectTo?: string;
  onRemoved?: () => void;
  variant?: "block" | "row";
}) {
  const supabase = createClient();
  const router = useRouter();
  const { t } = useLanguage();
  const [confirming, setConfirming] = useState(false);
  const [removing, setRemoving] = useState(false);

  async function handleClick() {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    setRemoving(true);
    const { data, error } = await supabase
      .from(table)
      .update({ status: "removed" })
      .eq("id", id)
      .select();
    setRemoving(false);
    if (error) {
      toast("Couldn't remove — " + error.message);
      setConfirming(false);
      return;
    }
    if (!data || data.length === 0) {
      toast("Couldn't remove — no permission, or it's already gone");
      setConfirming(false);
      return;
    }
    toast("Removed");
    if (onRemoved) onRemoved();
    if (redirectTo) {
      router.push(redirectTo);
      router.refresh();
    }
  }

  const className =
    variant === "row"
      ? `admin-btn danger${confirming ? " confirming" : ""}`
      : `btn btn-line btn-block${confirming ? " confirming-danger" : ""}`;

  return (
    <button
      type="button"
      className={className}
      style={variant === "block" && confirming ? { color: "#c0392b", borderColor: "#c0392b" } : undefined}
      onClick={handleClick}
      disabled={removing}
    >
      <Icon name="Trash2" />
      {removing
        ? t("common.removing")
        : confirming
        ? t("common.tapAgainConfirm")
        : label ?? (labelKey ? t(labelKey) : t("common.removeListing"))}
    </button>
  );
}
