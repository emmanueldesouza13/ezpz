"use client";

import { useEffect, useState } from "react";
import Icon from "./Icon";

const STORAGE_KEY = "ezpz_age_verified";

export default function AgeGate({ children }: { children: React.ReactNode }) {
  const [verified, setVerified] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY) === "1") setVerified(true);
    } catch {
      // ignore — storage unavailable, just fall back to asking again
    }
    setChecked(true);
  }, []);

  function handleVerify() {
    setVerified(true);
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // ignore — nothing to persist to
    }
  }

  // Avoid a flash of the gate while we check whether this browser already verified.
  if (!checked) return null;

  if (!verified) {
    return (
      <div className="age-gate">
        <div className="age-gate-card">
          <div className="icon-circle">
            <Icon name="ShieldAlert" size={26} />
          </div>
          <h1>18+ Only</h1>
          <p>
            This website is restricted to users who are 18 years of age or
            older. Please verify your age to continue.
          </p>
          <button
            type="button"
            className="btn btn-accent btn-block"
            onClick={handleVerify}
          >
            Verify Age — I am 18 or older
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
