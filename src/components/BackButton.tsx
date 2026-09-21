"use client";

import { useRouter } from "next/navigation";
import Icon from "./Icon";

export default function BackButton({ fallback = "/" }: { fallback?: string }) {
  const router = useRouter();

  return (
    <button
      type="button"
      className="page-back"
      onClick={() => {
        if (typeof window !== "undefined" && window.history.length > 1) {
          router.back();
        } else {
          router.push(fallback);
        }
      }}
    >
      <Icon name="ArrowLeft" size={16} />
      Back
    </button>
  );
}
