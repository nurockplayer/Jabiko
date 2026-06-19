// Decorative wafuu spot illustrations.
//
// Hand-authored line-art SVGs used to warm up otherwise bare screens
// (empty states, completion screens, panel headers). Deliberately NOT
// functional iconography -- they carry no state, are aria-hidden, and
// never gate interaction.
//
// Theme-aware by construction:
//   - line work uses `currentColor` (the .spot-illustration wrapper sets
//     color: var(--ink), so lines are ink on light paper / cream on dark
//     walnut)
//   - accent fills use the brand vars (--matcha / --vermilion / --gold),
//     which already define light + dark values
//   - "paper" fills use --paper so a shape's interior matches whatever
//     surface it sits on
// => every illustration reads correctly in both themes with zero extra
// CSS. Each is a few hundred bytes and inlines into the bundle.
//
// JSX prop order matters: spread {...stroke} FIRST, then any explicit
// fill / stroke overrides AFTER, so the explicit value wins (and TS
// doesn't flag an overwritten prop).

type SpotProps = {
  /** Rendered width/height in px (square viewBox). Default per component. */
  size?: number;
  className?: string;
};

function svgProps(size: number, className?: string) {
  return {
    width: size,
    height: size,
    viewBox: "0 0 100 100",
    className: className ? `spot-illustration ${className}` : "spot-illustration",
    role: "img" as const,
    "aria-hidden": true,
    xmlns: "http://www.w3.org/2000/svg"
  };
}

const stroke = {
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const
};

/** Daruma with one eye painted in -- the Japanese "goal achieved" motif.
 *  Used on completion screens. */
export function DarumaSpot({ size = 76, className }: SpotProps) {
  return (
    <svg {...svgProps(size, className)}>
      <path
        {...stroke}
        d="M50 14 C30 14 23 40 25 56 C27 78 42 90 50 90 C58 90 73 78 75 56 C77 40 70 14 50 14 Z"
        fill="var(--vermilion)"
      />
      <ellipse {...stroke} cx="50" cy="48" rx="20" ry="23" fill="var(--paper)" />
      <circle cx="42" cy="46" r="4" fill="currentColor" />
      <circle cx="58" cy="46" r="4" fill="none" stroke="currentColor" strokeWidth="2" />
      <path {...stroke} d="M43 62 Q50 67 57 62" fill="none" />
    </svg>
  );
}

/** Cup of tea with rising steam -- "rest / nothing due" motif. */
export function TeaCupSpot({ size = 64, className }: SpotProps) {
  return (
    <svg {...svgProps(size, className)}>
      <path {...stroke} d="M36 16 Q30 24 36 32" stroke="var(--matcha)" fill="none" />
      <path {...stroke} d="M50 12 Q44 20 50 28" stroke="var(--matcha)" fill="none" />
      <path {...stroke} d="M64 16 Q58 24 64 32" stroke="var(--matcha)" fill="none" />
      <path
        {...stroke}
        d="M28 44 L72 44 L65 80 Q63 86 57 86 L43 86 Q37 86 35 80 Z"
        fill="var(--paper)"
      />
      <path {...stroke} d="M34 51 H66" stroke="var(--matcha)" strokeWidth="5" fill="none" />
      <path {...stroke} d="M72 52 Q88 54 84 68 Q82 76 70 76" fill="none" />
      <path {...stroke} d="M24 92 H76" strokeWidth="3" fill="none" />
    </svg>
  );
}

/** Sheet of paper with a folded corner and a few written lines --
 *  "notes / not built yet" motif for empty content panels. */
export function PaperNoteSpot({ size = 64, className }: SpotProps) {
  return (
    <svg {...svgProps(size, className)}>
      <path {...stroke} d="M28 16 L66 16 L82 32 L82 88 L28 88 Z" fill="var(--paper)" />
      <path {...stroke} d="M66 16 L66 32 L82 32 Z" fill="var(--paper-deep)" />
      <path {...stroke} d="M38 46 H64" stroke="var(--matcha)" strokeWidth="3" fill="none" />
      <path {...stroke} d="M38 58 H72" strokeWidth="3" fill="none" />
      <path {...stroke} d="M38 70 H72" strokeWidth="3" fill="none" />
    </svg>
  );
}

/** Stack of three books -- "study chapters / question bank" motif. */
export function BooksSpot({ size = 56, className }: SpotProps) {
  return (
    <svg {...svgProps(size, className)}>
      <rect {...stroke} x="20" y="60" width="60" height="14" rx="3" fill="var(--matcha)" />
      <rect {...stroke} x="25" y="44" width="54" height="14" rx="3" fill="var(--gold)" />
      <rect {...stroke} x="31" y="28" width="48" height="14" rx="3" fill="var(--paper)" />
      <path {...stroke} d="M41 28 V42" fill="none" />
    </svg>
  );
}

/** Brush pen with an ink drop -- "reference / writing" motif. */
export function BrushSpot({ size = 56, className }: SpotProps) {
  return (
    <svg {...svgProps(size, className)}>
      <path {...stroke} d="M24 26 L62 64" stroke="var(--gold)" strokeWidth="9" fill="none" />
      <path {...stroke} d="M62 64 L82 84" strokeWidth="6" fill="none" />
      <circle cx="85" cy="87" r="4" fill="var(--vermilion)" />
      <path {...stroke} d="M22 80 Q40 70 56 78" stroke="var(--matcha)" strokeWidth="3" fill="none" />
    </svg>
  );
}
