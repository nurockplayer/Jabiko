// Pure smoke-verification logic (#745): attribution of GA4 Realtime rows to a
// single guided session, latest-snapshot semantics (never accumulate across
// polls), and the pass/fail + early-exit conditions. Extracted from the smoke
// CLI so each regression is unit-testable without network or credentials.

export const PLACEMENT_ACTION = {
  "home-airbnb": "airbnb",
  "home-video": "video",
  "home-video-airbnb": "airbnb",
  "stay-d-hero-airbnb": "airbnb",
  "stay-d-video": "video",
  "stay-d-video-airbnb": "airbnb",
  "stay-d-final-airbnb": "airbnb"
};

export const REQUIRED_PLACEMENTS = Object.keys(PLACEMENT_ACTION);

/**
 * Attribute the LATEST realtime snapshot to a single guided session.
 *
 * - `baselineSessions` are sessions that already existed before the guided
 *   interaction; they are excluded entirely (session isolation).
 * - The guided session is the new session with the most promo_click
 *   placements, then the most page views — the operator's tab is the one doing
 *   promo clicks.
 * - Reading the same snapshot twice yields identical counts: this function
 *   computes from the snapshot passed in, it never accumulates across calls.
 *
 * @returns {{ guidedSession: string|null, newSessions: number, pageViews: number,
 *            stayDViews: number, placements: Map<string, object> }}
 */
export function computeSmokeState({ rows = [], baselineSessions = new Set() }) {
  const sessions = new Map();
  for (const row of rows) {
    const sid = row.sessionId;
    if (!sid || baselineSessions.has(sid)) continue;
    let s = sessions.get(sid);
    if (!s) {
      s = { pageViews: 0, stayDViews: 0, placements: new Map() };
      sessions.set(sid, s);
    }
    const n = Number(row.eventCount ?? 1) || 1;
    if (row.eventName === "page_view") {
      s.pageViews += n;
      if (row.pagePath === "/stay-d") s.stayDViews += n;
    } else if (row.eventName === "promo_click" && row["customEvent:placement"]) {
      s.placements.set(row["customEvent:placement"], {
        action: row["customEvent:action"],
        promoId: row["customEvent:promoId"],
        locale: row["customEvent:locale"]
      });
    }
  }

  let guidedSession = null;
  let bestScore = -1;
  for (const [sid, s] of sessions) {
    const score = s.placements.size * 1000 + s.pageViews;
    if (score > bestScore) {
      bestScore = score;
      guidedSession = sid;
    }
  }
  const g = guidedSession ? sessions.get(guidedSession) : null;
  return {
    guidedSession,
    newSessions: sessions.size,
    pageViews: g?.pageViews ?? 0,
    stayDViews: g?.stayDViews ?? 0,
    placements: g?.placements ?? new Map()
  };
}

/**
 * Verify a guided-session state. Returns { ok, failures } where failures is a
 * list of human-readable violations. A missing Home page view (pageViews < 2)
 * and a missing /stay-d page view (when pagePath is readable) are failures,
 * so callers must map `!ok` to a non-zero exit code.
 */
export function verifySmokeState({
  pageViews,
  stayDViews,
  placements = new Map(),
  useRichDims = true
}) {
  const failures = [];
  for (const placement of REQUIRED_PLACEMENTS) {
    const seen = placements.get(placement);
    const expectedAction = PLACEMENT_ACTION[placement];
    if (!seen) {
      failures.push(`missing promo_click for ${placement}`);
      continue;
    }
    if (seen.action !== expectedAction) {
      failures.push(`placement ${placement}: action=${seen.action ?? "?"}, expected ${expectedAction}`);
    }
    if (seen.promoId !== "stay-d") {
      failures.push(`placement ${placement}: promoId=${seen.promoId ?? "?"}, expected stay-d`);
    }
    if (!seen.locale) {
      failures.push(`placement ${placement}: missing locale`);
    }
  }
  if (pageViews < 2) {
    failures.push(`Home page view missing: ${pageViews} page_view in the guided session (expected ≥ 2)`);
  }
  if (useRichDims && stayDViews < 1) {
    failures.push(`/stay-d page view missing: ${stayDViews} page_view on /stay-d (expected ≥ 1)`);
  }
  return { ok: failures.length === 0, failures };
}

/** Early-exit condition for the Realtime watch loop. */
export function smokeTargetReached({
  pageViews,
  stayDViews,
  placements = new Map(),
  useRichDims = true
}) {
  if (pageViews < 2) return false;
  if (useRichDims && stayDViews < 1) return false;
  return REQUIRED_PLACEMENTS.every((p) => placements.has(p));
}
