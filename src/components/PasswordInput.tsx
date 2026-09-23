"use client";

import { useState } from "react";
import Icon from "./Icon";

// A password <input> with a show/hide eye toggle, styled to drop into any
// existing .field the same way a plain <input className="control"> would.
export default function PasswordInput({
  className = "control",
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="password-input-wrap">
      <input {...props} className={className} type={visible ? "text" : "password"} />
      <button
        type="button"
        className="password-toggle"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
      >
        <Icon name={visible ? "EyeOff" : "Eye"} size={17} />
      </button>
    </div>
  );
}
