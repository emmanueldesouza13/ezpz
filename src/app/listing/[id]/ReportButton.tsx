"use client";

import Icon from "@/components/Icon";
import { toast } from "@/lib/toast";

export default function ReportButton() {
  return (
    <button
      type="button"
      className="report-link"
      onClick={() => toast("Thanks — our team will review this listing.")}
    >
      <Icon name="Flag" />
      Report this listing
    </button>
  );
}
