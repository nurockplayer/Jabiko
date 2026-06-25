// Jabiko mascot — 合格ちゃん, a matcha-green daruma (the Japanese
// pass-your-exam talisman). Used as the brand mark in the app heading and the
// practice side-panel lockup. Inline SVG so it stays crisp at any size; the
// brand palette is hardcoded because the mark must read identically in light
// and dark mode (it is not a theme-tinted UI element). Refined from the
// generated concept: friendly raised brows (not a frown), unified dark-matcha
// features for contrast, and no tiny details that vanish at ~28px.
export function JabikoMark({ className, title = "Jabiko" }: { className?: string; title?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={title}
    >
      <path
        d="M32 7c12 0 19 11 19 26 0 13-7 23-19 23S13 46 13 33C13 18 20 7 32 7Z"
        fill="#647c5c"
        stroke="#4f6549"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path
        d="M32 48c8 0 13.5-4.2 13.5-4.2C45 51 39 56 32 56s-13-5-13.5-12.2C18.5 43.8 24 48 32 48Z"
        fill="#4f6549"
      />
      <ellipse cx="32" cy="31" rx="14.5" ry="13" fill="#fdfdf7" stroke="#4f6549" strokeWidth="2.5" />
      <path d="M22 24q4-2.5 8 0" fill="none" stroke="#4f6549" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M34 24q4-2.5 8 0" fill="none" stroke="#4f6549" strokeWidth="2.6" strokeLinecap="round" />
      <circle cx="26" cy="31" r="3.1" fill="#4f6549" />
      <circle cx="38" cy="31" r="3.1" fill="#4f6549" />
      <path d="M27 38q5 4 10 0" fill="none" stroke="#4f6549" strokeWidth="2.6" strokeLinecap="round" />
    </svg>
  );
}
