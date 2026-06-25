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

/** Inkstone (硯) with a brush dipping in -- "kanji / writing" motif.
 *  Used on the kanji-reading reference header. */
export function InkstoneSpot({ size = 60, className }: SpotProps) {
  return (
    <svg {...svgProps(size, className)}>
      <path {...stroke} d="M18 54 Q18 46 27 46 L73 46 Q82 46 82 54 L82 76 Q82 84 73 84 L27 84 Q18 84 18 76 Z" fill="var(--paper-deep)" />
      <path {...stroke} d="M28 56 L70 56 Q74 56 73 60 L70 73 Q69 76 65 76 L35 76 Q31 76 30 73 L27 60 Q26 56 28 56 Z" fill="var(--paper)" />
      <path {...stroke} d="M37 62 H63" stroke="var(--matcha)" strokeWidth="3" fill="none" />
      <path d="M50 67 Q54 71 50 74 Q46 71 50 67 Z" fill="currentColor" />
      <path {...stroke} d="M30 14 L52 36" stroke="var(--gold)" strokeWidth="8" fill="none" />
      <path {...stroke} d="M52 36 L62 46" strokeWidth="5" fill="none" />
    </svg>
  );
}

/** Magnifying glass over a half-written kanji card -- "search / no match"
 *  motif for the kanji lookup empty state. */
export function MagnifierKanjiSpot({ size = 60, className }: SpotProps) {
  return (
    <svg {...svgProps(size, className)}>
      <rect {...stroke} x="20" y="18" width="44" height="48" rx="4" fill="var(--paper)" />
      <path {...stroke} d="M32 32 H52" stroke="var(--matcha)" strokeWidth="3" fill="none" />
      <path {...stroke} d="M42 30 V50" strokeWidth="3" fill="none" />
      <circle {...stroke} cx="60" cy="60" r="17" fill="var(--paper-deep)" />
      <path {...stroke} d="M72 72 L86 86" strokeWidth="5" fill="none" />
    </svg>
  );
}

/** Two-leaf sprout rising from a pot -- "learning / growth" motif.
 *  Used on the learn dashboard header. */
export function SproutSpot({ size = 60, className }: SpotProps) {
  return (
    <svg {...svgProps(size, className)}>
      <path {...stroke} d="M22 74 Q50 66 78 74 L72 84 Q50 88 28 84 Z" fill="var(--paper-deep)" />
      <path {...stroke} d="M50 74 V42" fill="none" />
      <path {...stroke} d="M50 54 C40 52 26 44 22 30 C36 26 48 34 50 48 Z" fill="var(--paper)" />
      <path {...stroke} d="M50 46 C60 42 74 32 80 18 C64 16 50 26 50 40 Z" fill="var(--paper)" />
      <path {...stroke} d="M50 50 Q40 45 30 36" stroke="var(--matcha)" strokeWidth="2" fill="none" />
      <path {...stroke} d="M50 42 Q62 37 71 27" stroke="var(--matcha)" strokeWidth="2" fill="none" />
    </svg>
  );
}

/** Paper lantern (提灯) -- wafuu evening / festival ambience. */
export function LanternSpot({ size = 60, className }: SpotProps) {
  return (
    <svg {...svgProps(size, className)}>
      <path {...stroke} d="M50 8 L50 18" fill="none" />
      <rect {...stroke} x="36" y="18" width="28" height="8" rx="2" fill="var(--paper-deep)" />
      <path {...stroke} d="M40 26 C24 36 24 64 40 74 L60 74 C76 64 76 36 60 26 Z" fill="var(--paper)" />
      <path {...stroke} d="M28 38 H72" fill="none" />
      <path {...stroke} d="M24.5 50 H75.5" fill="none" />
      <path {...stroke} d="M28 62 H72" fill="none" />
      <circle {...stroke} cx="50" cy="50" r="5" fill="var(--vermilion)" />
      <rect {...stroke} x="36" y="74" width="28" height="8" rx="2" fill="var(--paper-deep)" />
      <path {...stroke} d="M44 82 V88 M56 82 V88" strokeWidth="3" fill="none" />
    </svg>
  );
}

/** Omamori (合格御守) -- a pass-the-exam talisman. Good-luck / celebration motif. */
export function OmamoriSpot({ size = 60, className }: SpotProps) {
  return (
    <svg {...svgProps(size, className)}>
      <path {...stroke} d="M50 18 L50 30" fill="none" />
      <path {...stroke} d="M42 24 Q50 14 58 24 Q63 30 56 31 L44 31 Q37 30 42 24 Z" fill="var(--gold)" />
      <path {...stroke} d="M34 34 Q50 26 66 34 L72 78 Q72 86 64 86 L36 86 Q28 86 28 78 Z" fill="var(--vermilion)" />
      <path {...stroke} d="M31 44 L69 44" fill="none" />
      <path d="M44 58 L56 58" stroke="var(--gold)" strokeWidth="5" strokeLinecap="round" fill="none" />
      <path d="M50 54 L50 70" stroke="var(--gold)" strokeWidth="5" strokeLinecap="round" fill="none" />
      <path {...stroke} d="M44 86 L42 94 M56 86 L58 94 M50 86 L50 95" strokeWidth="3" fill="none" />
    </svg>
  );
}

/** Torii gate (鳥居) -- a wafuu gateway / landmark motif. */
export function ToriiSpot({ size = 60, className }: SpotProps) {
  return (
    <svg {...svgProps(size, className)}>
      <path {...stroke} d="M16 26 Q50 18 84 26 L84 32 Q50 25 16 32 Z" fill="var(--vermilion)" />
      <path {...stroke} d="M22 44 L78 44 L78 52 L22 52 Z" fill="var(--paper)" />
      <path {...stroke} d="M30 32 L30 86" strokeWidth="5" fill="none" />
      <path {...stroke} d="M70 32 L70 86" strokeWidth="5" fill="none" />
      <path d="M50 44 L50 52" stroke="var(--vermilion)" strokeWidth="3" strokeLinecap="round" fill="none" />
    </svg>
  );
}
