import { BadgeCheck } from "lucide-react";

export default function VerifiedBadge({ size = 13 }: { size?: number }) {
  return (
    <span className="inline-flex items-center gap-1 text-[var(--brand)] font-medium">
      <BadgeCheck size={size} className="fill-[var(--brand-tint)]" />
      Verified
    </span>
  );
}
