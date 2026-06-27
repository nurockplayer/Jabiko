// Jabiko mascot — ジャビ子, a friendly helper-robot wearing an open
// conjugation-table book as a hat. Used as the brand mark in the app heading
// and the practice side-panel lockup. Inline SVG so it stays crisp at any
// size; the brand palette is hardcoded (navy / cream / coral) because the mark
// must read identically in light and dark mode -- it is not a theme-tinted UI
// element. The mascot sits on a cream rounded badge so its navy outline keeps
// contrast on dark backgrounds too. The same artwork is mirrored in
// public/icon.svg (favicon / PWA icons). Bold shapes only, survives ~28px.
const NAVY = "#28385a";
const CREAM = "#fdf6ea";
const CORAL = "#f0a49c";

export function JabikoMark({ className, title = "Jabiko" }: { className?: string; title?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={title}
    >
      {/* cream badge so the navy-outlined mascot reads on any background */}
      <rect x="2" y="2" width="60" height="60" rx="16" fill={CREAM} stroke={NAVY} strokeWidth="2.5" />
      <g transform="translate(6.4 5) scale(0.8)">
        {/* shoulders */}
        <path
          d="M16 54c2-6 9-9 16-9s14 3 16 9v4H16Z"
          fill={CORAL}
          stroke={NAVY}
          strokeWidth="3"
          strokeLinejoin="round"
        />
        {/* ears */}
        <rect x="8.5" y="31" width="8" height="13" rx="4" fill={CORAL} stroke={NAVY} strokeWidth="3" />
        <rect x="47.5" y="31" width="8" height="13" rx="4" fill={CORAL} stroke={NAVY} strokeWidth="3" />
        {/* head */}
        <rect x="14" y="24" width="36" height="29" rx="14" fill={CREAM} stroke={NAVY} strokeWidth="3" />
        {/* book hat: two pages meeting at a centre spine, open-book dip */}
        <path
          d="M32 12C26 9 19 9.5 15 11v10c4-1.5 11-2 17 1.5Z"
          fill={CREAM}
          stroke={NAVY}
          strokeWidth="2.6"
          strokeLinejoin="round"
        />
        <path
          d="M32 12c6-3 13-2.5 17-1v10c-4-1.5-11-2-17 1.5Z"
          fill={CREAM}
          stroke={NAVY}
          strokeWidth="2.6"
          strokeLinejoin="round"
        />
        {/* left page: conjugation grid */}
        <rect x="18.5" y="13.5" width="9" height="5.6" rx="0.8" fill="none" stroke={CORAL} strokeWidth="1.3" />
        <path d="M21.5 13.5v5.6M24.5 13.5v5.6M18.5 16.3h9" stroke={CORAL} strokeWidth="1.1" />
        {/* right page: lines */}
        <path d="M36 14.6h9.5M36 16.8h9.5M36 19h7" stroke={CORAL} strokeWidth="1.5" strokeLinecap="round" />
        {/* cheeks */}
        <circle cx="22" cy="42" r="3" fill={CORAL} />
        <circle cx="42" cy="42" r="3" fill={CORAL} />
        {/* eyes + smile */}
        <circle cx="26" cy="38" r="3" fill={NAVY} />
        <circle cx="38" cy="38" r="3" fill={NAVY} />
        <path d="M27.5 43q4.5 4 9 0" fill="none" stroke={NAVY} strokeWidth="2.6" strokeLinecap="round" />
      </g>
    </svg>
  );
}
