// ジャビ子 as a character (#861, D-26): the same figure as the JabikoMark
// brand tile, without the badge and with a face that changes with the
// moment -- happy after 正解, a squeezed "oops" with a sweat drop after a
// miss, thinking after a reveal, cheering on the completion card. The parts
// are split into groups (jump / spin / head / each hat page) so
// learning-loop.css can animate them independently; without motion the
// face alone carries the mood. Purely decorative: the verdict text next to
// it is what assistive tech reads.
import type { BuddyEnergy, BuddyMood } from "../domain/buddyReaction";

const NAVY = "#28385a";
const CREAM = "#fdf6ea";
const CORAL = "#f0a49c";

function Face({ mood }: { mood: BuddyMood }) {
  if (mood === "oops") {
    return (
      <g className="buddy-face-oops" fill="none" stroke={NAVY} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M23.5 35.5 28 38l-4.5 2.5" />
        <path d="M40.5 35.5 36 38l4.5 2.5" />
        <path d="M27.5 45.5q2.25-2 4.5 0t4.5 0" />
      </g>
    );
  }
  if (mood === "thinking") {
    return (
      <g className="buddy-face-thinking">
        <circle cx="27.4" cy="36.6" r="2.6" fill={NAVY} />
        <circle cx="39.4" cy="36.6" r="2.6" fill={NAVY} />
        <path d="M29 45.2q3 1.2 6-.6" fill="none" stroke={NAVY} strokeWidth="2.4" strokeLinecap="round" />
      </g>
    );
  }
  return (
    <g className="buddy-face-happy">
      <path d="M23 39.5q3-4.5 6 0M35 39.5q3-4.5 6 0" fill="none" stroke={NAVY} strokeWidth="2.6" strokeLinecap="round" />
      <path d="M26.5 43h11q-1 6.5-5.5 6.5T26.5 43Z" fill={NAVY} />
      <path d="M29.2 47.4q2.8-1.8 5.6 0q-1.1 1.6-2.8 1.6t-2.8-1.6Z" fill={CORAL} />
    </g>
  );
}

export function JabikoBuddy({
  mood,
  energy = 1,
  className
}: {
  mood: BuddyMood;
  energy?: BuddyEnergy;
  className?: string;
}) {
  return (
    <svg
      className={className ? `jabiko-buddy ${className}` : "jabiko-buddy"}
      data-mood={mood}
      data-energy={energy}
      viewBox="4 4 56 58"
      aria-hidden="true"
      focusable="false"
    >
      <ellipse className="buddy-shadow" cx="32" cy="59" rx="13" ry="2.2" fill={NAVY} opacity="0.16" />
      <g className="buddy-jump">
        <g className="buddy-spin">
          {/* shoulders */}
          <path d="M16 54c2-6 9-9 16-9s14 3 16 9v4H16Z" fill={CORAL} stroke={NAVY} strokeWidth="3" strokeLinejoin="round" />
          <g className="buddy-head">
            {/* ears */}
            <rect x="8.5" y="31" width="8" height="13" rx="4" fill={CORAL} stroke={NAVY} strokeWidth="3" />
            <rect x="47.5" y="31" width="8" height="13" rx="4" fill={CORAL} stroke={NAVY} strokeWidth="3" />
            {/* head */}
            <rect x="14" y="24" width="36" height="29" rx="14" fill={CREAM} stroke={NAVY} strokeWidth="3" />
            {/* book hat: each page hinges on the spine so it can flap */}
            <g className="buddy-page-left">
              <path d="M32 12C26 9 19 9.5 15 11v10c4-1.5 11-2 17 1.5Z" fill={CREAM} stroke={NAVY} strokeWidth="2.6" strokeLinejoin="round" />
              <rect x="18.5" y="13.5" width="9" height="5.6" rx="0.8" fill="none" stroke={CORAL} strokeWidth="1.3" />
              <path d="M21.5 13.5v5.6M24.5 13.5v5.6M18.5 16.3h9" stroke={CORAL} strokeWidth="1.1" />
            </g>
            <g className="buddy-page-right">
              <path d="M32 12c6-3 13-2.5 17-1v10c-4-1.5-11-2-17 1.5Z" fill={CREAM} stroke={NAVY} strokeWidth="2.6" strokeLinejoin="round" />
              <path d="M36 14.6h9.5M36 16.8h9.5M36 19h7" stroke={CORAL} strokeWidth="1.5" strokeLinecap="round" />
            </g>
            {/* cheeks */}
            <circle className="buddy-cheek" cx="21.5" cy="42.5" r="3.2" fill={CORAL} />
            <circle className="buddy-cheek" cx="42.5" cy="42.5" r="3.2" fill={CORAL} />
            <Face mood={mood} />
          </g>
        </g>
      </g>
      {mood === "oops" ? (
        <path className="buddy-sweat" d="M52 22q2.6 3.6 2.6 5.4a2.6 2.6 0 0 1-5.2 0q0-1.8 2.6-5.4Z" fill="#8fc6e8" stroke={NAVY} strokeWidth="1.2" />
      ) : null}
    </svg>
  );
}
