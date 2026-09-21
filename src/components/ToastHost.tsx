"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    __ezpzToast?: (msg: string) => void;
  }
}

export default function ToastHost() {
  const ref = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    window.__ezpzToast = (msg: string) => {
      const el = ref.current;
      if (!el) return;
      el.textContent = msg;
      el.classList.add("show");
      clearTimeout(timer.current);
      timer.current = setTimeout(() => el.classList.remove("show"), 2400);
    };
    return () => {
      delete window.__ezpzToast;
    };
  }, []);

  return <div id="toast" ref={ref}></div>;
}
