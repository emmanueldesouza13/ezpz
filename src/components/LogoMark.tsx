export default function LogoMark({ size = 20 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 200 200"
      width={size}
      height={size}
      aria-hidden="true"
      style={{ display: "block" }}
    >
      {/* Angel */}
      <g fill="#ffffff">
        <path d="M52,108 C34,100 22,104 14,116 C24,118 32,128 40,126 C36,134 30,140 22,142 C34,148 46,142 52,130 Z" opacity="0.92" />
        <path d="M60,100 C58,100 56,102 56,106 C52,124 50,142 52,160 C58,164 66,166 72,166 C78,166 86,164 92,160 C94,142 92,124 88,106 C88,102 86,100 84,100 C80,108 64,108 60,100 Z" />
        <circle cx="72" cy="84" r="12" />
      </g>
      <ellipse cx="72" cy="64" rx="11" ry="4.5" fill="none" stroke="#ffffff" strokeWidth="3.2" />

      {/* Devil */}
      <g fill="#ffffff">
        <path d="M128,163 C148,160 160,148 156,130 C154,122 148,118 142,118" fill="none" stroke="#ffffff" strokeWidth="4.5" strokeLinecap="round" />
        <path d="M138,113 L152,113 L145,126 Z" />
        <path d="M108,100 C106,100 104,102 104,106 C100,124 98,142 100,160 C106,164 114,166 120,166 C126,166 134,164 140,160 C142,142 140,124 136,106 C136,102 134,100 132,100 C128,108 112,108 108,100 Z" />
        <circle cx="120" cy="84" r="12" />
        <path d="M110,76 L104,62 L116,72 Z" />
        <path d="M130,76 L136,62 L124,72 Z" />
      </g>
    </svg>
  );
}
