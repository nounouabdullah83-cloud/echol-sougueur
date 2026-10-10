/**
 * School logo mark — inline SVG so no oversized image can be introduced.
 * Sized explicitly via width/height props (design rule: no oversized images).
 */
export default function Logo({ size = 42 }) {
  return (
    <svg
      className="lp-logo"
      width={size}
      height={size}
      viewBox="0 0 48 48"
      role="img"
      aria-label="شعار المدرسة"
    >
      <rect width="48" height="48" fill="#2563eb" />
      <path d="M24 11 5 19.5 24 28l19-8.5L24 11Z" fill="#ffffff" />
      <path
        d="M13 24v8.2c0 3.1 4.9 5.3 11 5.3s11-2.2 11-5.3V24l-11 4.9L13 24Z"
        fill="#ffffff"
        opacity="0.85"
      />
      <path d="M40.5 20.5v9.5" stroke="#ffffff" strokeWidth="2" />
      <circle cx="40.5" cy="32.5" r="2.4" fill="#ffffff" />
    </svg>
  )
}
