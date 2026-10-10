/**
 * Contained hero illustration (inline SVG).
 * Explicit width/height, never full-bleed (design rule: no oversized images).
 */
export default function HeroArt() {
  return (
    <svg
      className="lp-hero__svg"
      width="360"
      height="280"
      viewBox="0 0 360 280"
      role="img"
      aria-label="رسم توضيحي لمبنى المدرسة والطلاب"
    >
      <rect x="0" y="0" width="360" height="280" fill="#eff6ff" />

      {/* School building */}
      <rect x="70" y="90" width="220" height="140" fill="#ffffff" stroke="#2563eb" strokeWidth="2" />
      <path d="M60 90 180 30l120 60H60Z" fill="#2563eb" />
      <rect x="96" y="118" width="34" height="34" fill="#2563eb" opacity="0.25" />
      <rect x="230" y="118" width="34" height="34" fill="#2563eb" opacity="0.25" />
      <rect x="96" y="168" width="34" height="34" fill="#2563eb" opacity="0.25" />
      <rect x="230" y="168" width="34" height="34" fill="#2563eb" opacity="0.25" />
      <rect x="158" y="170" width="44" height="60" fill="#0b0f19" />

      {/* Flag */}
      <path d="M180 30V0" stroke="#0b0f19" strokeWidth="2" />
      <path d="M180 2h42l-8 10 8 10h-42V2Z" fill="#2563eb" />

      {/* Ground */}
      <rect x="40" y="230" width="280" height="6" fill="#0b0f19" opacity="0.35" />

      {/* Students */}
      <circle cx="70" cy="196" r="12" fill="#2563eb" />
      <rect x="58" y="210" width="24" height="42" fill="#1d4ed8" />
      <circle cx="110" cy="204" r="10" fill="#0b0f19" />
      <rect x="100" y="216" width="20" height="36" fill="#2563eb" />
      <circle cx="300" cy="198" r="12" fill="#2563eb" />
      <rect x="288" y="212" width="24" height="40" fill="#1d4ed8" />
    </svg>
  )
}
