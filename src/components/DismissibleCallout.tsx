"use client";

import { useState } from "react";
import Icon from "./Icon";

export default function DismissibleCallout({ children }: { children: React.ReactNode }) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <div className="callout">
      <Icon name="Shield" />
      <span>{children}</span>
      <button
        type="button"
        className="callout-close"
        aria-label="Dismiss"
        onClick={() => setDismissed(true)}
      >
        <Icon name="X" size={14} />
      </button>
    </div>
  );
}
