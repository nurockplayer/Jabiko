// Jabiko mascot — ジャビ子, a friendly helper-robot wearing an open
// conjugation-table book as a hat. Used as the brand mark in the app heading
// and the practice side-panel lockup. Inline SVG so it stays crisp at any
// size; the brand palette is hardcoded (navy / cream / coral) because the mark
// must read identically in light and dark mode -- it is not a theme-tinted UI
// element. The mascot sits on a cream rounded badge so its navy outline keeps
// contrast on dark backgrounds too. Kept to bold shapes that survive at ~28px.
const NAVY = "#28385a";
const CREAM = "#fbf4e7";
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
      <rect x="2" y="2" width="60" height="60" rx="15" fill={CREAM} stroke={NAVY} strokeWidth="2.5" />
      <g transform="translate(6.4 5) scale(0.8)">
        {/* shoulders / body */}
        <path
          d="M16 52c4-5 9-7 16-7s12 2 16 7v8H16Z"
          fill={CORAL}
          stroke={NAVY}
          strokeWidth="3"
          strokeLinejoin="round"
        />
        {/* ears */}
        <rect x="8" y="30" width="9" height="15" rx="4.5" fill={CORAL} stroke={NAVY} strokeWidth="3" />
        <rect x="47" y="30" width="9" height="15" rx="4.5" fill={CORAL} stroke={NAVY} strokeWidth="3" />
        {/* head */}
        <rect x="15" y="24" width="34" height="28" rx="12" fill={CREAM} stroke={NAVY} strokeWidth="3" />
        {/* book hat: two pages meeting at a centre spine */}
        <path
          d="M32 11C27 8.5 22 8.5 18 10v13c4-1.5 9-1.5 14 1Z"
          fill={CREAM}
          stroke={NAVY}
          strokeWidth="2.6"
          strokeLinejoin="round"
        />
        <path
          d="M32 11c5-2.5 10-2.5 14-1v13c-4-1.5-9-1.5-14 1Z"
          fill={CREAM}
          stroke={NAVY}
          strokeWidth="2.6"
          strokeLinejoin="round"
        />
        {/* left page: conjugation grid */}
        <rect x="21.5" y="13.5" width="6.5" height="6" rx="1" fill="none" stroke={CORAL} strokeWidth="1.6" />
        <path d="M24.75 13.5v6M21.5 16.5h6.5" stroke={CORAL} strokeWidth="1.4" />
        {/* right page: lines */}
        <path
          d="M35.5 15h7M35.5 17.6h7M35.5 20.2h5"
          stroke={CORAL}
          strokeWidth="1.6"
          strokeLinecap="round"
        />
        {/* cheeks */}
        <circle cx="22.5" cy="41" r="3" fill={CORAL} />
        <circle cx="41.5" cy="41" r="3" fill={CORAL} />
        {/* eyes + smile */}
        <circle cx="26" cy="37" r="2.8" fill={NAVY} />
        <circle cx="38" cy="37" r="2.8" fill={NAVY} />
        <path d="M28 42.5q4 3.5 8 0" fill="none" stroke={NAVY} strokeWidth="2.6" strokeLinecap="round" />
      </g>
    </svg>
  );
}
