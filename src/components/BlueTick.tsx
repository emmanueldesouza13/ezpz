// The classic "verified" checkmark badge — shown next to a seller's name
// wherever it appears, so buyers can spot a confirmed account at a glance.
// The EzPz admin account gets the same badge in red instead of blue, so it
// reads as "official EzPz account" rather than "verified seller" — pass
// `admin` wherever the profile being shown is profile.is_admin.
export default function BlueTick({
  size = 14,
  className,
  admin = false,
}: {
  size?: number;
  className?: string;
  admin?: boolean;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      className={`blue-tick${admin ? " blue-tick-admin" : ""}${className ? ` ${className}` : ""}`}
      role="img"
      aria-label={admin ? "EzPz admin" : "Verified"}
    >
      <circle cx="10" cy="10" r="10" fill={admin ? "#f4212e" : "#1d9bf0"} />
      <path
        d="M5.3 10.3l3 3 6-6.6"
        stroke="#fff"
        strokeWidth="2.1"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}
