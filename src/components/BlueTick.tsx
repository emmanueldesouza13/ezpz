// The classic "verified" checkmark badge — shown next to a seller's name
// wherever it appears, so buyers can spot a confirmed account at a glance.
export default function BlueTick({
  size = 14,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      className={`blue-tick${className ? ` ${className}` : ""}`}
      role="img"
      aria-label="Verified"
    >
      <circle cx="10" cy="10" r="10" fill="#1d9bf0" />
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
