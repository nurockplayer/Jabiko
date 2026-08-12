// Pure smoke-verification logic tests: session isolation, no snapshot
// accumulation, and exit-status conditions.
import test from "node:test";
import assert from "node:assert/strict";
import {
  PLACEMENT_ACTION,
  computeSmokeState,
  verifySmokeState,
  smokeTargetReached
} from "../src/smokelogic.mjs";

const PLACEMENTS = Object.keys(PLACEMENT_ACTION);

function row(eventName, sessionId, overrides = {}) {
  return {
    eventName,
    sessionId,
    pagePath: "/",
    eventCount: 1,
    "customEvent:promoId": undefined,
    "customEvent:action": undefined,
    "customEvent:placement": undefined,
    "customEvent:locale": undefined,
    ...overrides
  };
}

function pageView(sessionId, pagePath = "/") {
  return row("page_view", sessionId, { pagePath });
}

function promo(sessionId, placement, action) {
  return row("promo_click", sessionId, {
    "customEvent:promoId": "stay-d",
    "customEvent:action": action,
    "customEvent:placement": placement,
    "customEvent:locale": "zh-Hant"
  });
}

/** A full guided sequence for one session. */
function guidedRows(sessionId, { pageViews = true, stayD = true } = {}) {
  const rows = [];
  if (pageViews) {
    rows.push(pageView(sessionId, "/"));
    if (stayD) rows.push(pageView(sessionId, "/stay-d"));
  }
  for (const placement of PLACEMENTS) {
    rows.push(promo(sessionId, placement, PLACEMENT_ACTION[placement]));
  }
  return rows;
}

test("PLACEMENT_ACTION covers exactly the seven frozen placements with correct action semantics", () => {
  assert.deepEqual(Object.keys(PLACEMENT_ACTION).sort(), PLACEMENTS.slice().sort());
  assert.equal(PLACEMENT_ACTION["home-airbnb"], "airbnb");
  assert.equal(PLACEMENT_ACTION["home-video"], "video");
  assert.equal(PLACEMENT_ACTION["home-video-airbnb"], "airbnb");
  assert.equal(PLACEMENT_ACTION["stay-d-hero-airbnb"], "airbnb");
  assert.equal(PLACEMENT_ACTION["stay-d-video"], "video");
  assert.equal(PLACEMENT_ACTION["stay-d-video-airbnb"], "airbnb");
  assert.equal(PLACEMENT_ACTION["stay-d-final-airbnb"], "airbnb");
});

// --- computeSmokeState (session isolation + no accumulation) ---

test("computeSmokeState ignores baseline (pre-existing) sessions entirely", () => {
  const baseline = new Set(["old-session"]);
  const rows = [
    ...guidedRows("old-session"), // all 7 placements + 2 page views — must be excluded
    ...guidedRows("smoke-session")
  ];
  const state = computeSmokeState({ rows, baselineSessions: baseline });
  assert.equal(state.guidedSession, "smoke-session");
  assert.equal(state.pageViews, 2);
  assert.equal(state.stayDViews, 1);
  assert.equal(state.placements.size, 7);
});

test("computeSmokeState reads the LATEST snapshot only (no accumulation across polls)", () => {
  const rows = guidedRows("smoke-session");
  const first = computeSmokeState({ rows, baselineSessions: new Set() });
  const second = computeSmokeState({ rows, baselineSessions: new Set() }); // same snapshot, second poll
  assert.equal(first.pageViews, second.pageViews);
  assert.equal(first.pageViews, 2, "same snapshot never doubles the count");
  assert.equal(first.stayDViews, 1);
  assert.equal(first.placements.size, 7);
});

test("computeSmokeState with no new session yields zeros and no guided session", () => {
  const state = computeSmokeState({ rows: [], baselineSessions: new Set(["a"]) });
  assert.equal(state.guidedSession, null);
  assert.equal(state.pageViews, 0);
  assert.equal(state.stayDViews, 0);
  assert.equal(state.placements.size, 0);
});

test("computeSmokeState prefers the new session that has promo placements", () => {
  const rows = [
    pageView("noise-session"),
    promo("noise-session", "home-airbnb", "airbnb"),
    ...guidedRows("smoke-session")
  ];
  const state = computeSmokeState({ rows, baselineSessions: new Set() });
  assert.equal(state.guidedSession, "smoke-session");
});

test("computeSmokeState counts /stay-d page views separately", () => {
  const rows = guidedRows("s1");
  const state = computeSmokeState({ rows, baselineSessions: new Set() });
  assert.equal(state.stayDViews, 1);
});

// --- verifySmokeState (exit conditions) ---

test("verifySmokeState passes a complete guided session", () => {
  const rows = guidedRows("s1");
  const state = computeSmokeState({ rows, baselineSessions: new Set() });
  const v = verifySmokeState({ ...state, useRichDims: true });
  assert.deepEqual(v.failures, []);
  assert.equal(v.ok, true);
});

test("verifySmokeState flags missing Home page view (pageViews < 2)", () => {
  // all placements, but only one page_view
  const rows = [pageView("s1", "/"), ...PLACEMENTS.map((p) => promo("s1", p, PLACEMENT_ACTION[p]))];
  const state = computeSmokeState({ rows, baselineSessions: new Set() });
  const v = verifySmokeState({ ...state, useRichDims: true });
  assert.equal(v.ok, false);
  assert.ok(v.failures.some((f) => /Home page view/.test(f)));
});

test("verifySmokeState flags a missing /stay-d page view when rich dims are available", () => {
  const rows = guidedRows("s1", { stayD: false });
  const state = computeSmokeState({ rows, baselineSessions: new Set() });
  const v = verifySmokeState({ ...state, useRichDims: true });
  assert.equal(v.ok, false);
  assert.ok(v.failures.some((f) => /\/stay-d page view/.test(f)));
});

test("verifySmokeState flags missing placements and wrong actions", () => {
  const rows = [
    pageView("s1", "/"),
    pageView("s1", "/stay-d"),
    promo("s1", "home-airbnb", "video"), // wrong action
    // home-video missing entirely
    ...PLACEMENTS.filter((p) => p !== "home-airbnb" && p !== "home-video").map((p) => promo("s1", p, PLACEMENT_ACTION[p]))
  ];
  const state = computeSmokeState({ rows, baselineSessions: new Set() });
  const v = verifySmokeState({ ...state, useRichDims: true });
  assert.equal(v.ok, false);
  assert.ok(v.failures.some((f) => /home-airbnb/.test(f) && /action/.test(f)));
  assert.ok(v.failures.some((f) => /home-video/.test(f)));
});

test("verifySmokeState in fallback mode does not require the /stay-d pagePath", () => {
  const rows = [pageView("s1", "/"), pageView("s1", "/stay-d"), ...PLACEMENTS.map((p) => promo("s1", p, PLACEMENT_ACTION[p]))];
  const state = computeSmokeState({ rows, baselineSessions: new Set() });
  const v = verifySmokeState({ ...state, useRichDims: false });
  assert.equal(v.ok, true, "fallback still verifies placements and home page views");
});

// --- smokeTargetReached (watch early-exit) ---

test("smokeTargetReached is false until every placement and both page views are present", () => {
  const full = computeSmokeState({ rows: guidedRows("s1"), baselineSessions: new Set() });
  assert.ok(smokeTargetReached({ ...full, useRichDims: true }));
  assert.ok(!smokeTargetReached({ ...full, useRichDims: true, placements: new Map() }));
  assert.ok(!smokeTargetReached({ ...full, useRichDims: true, pageViews: 1 }));
  assert.ok(!smokeTargetReached({ ...full, useRichDims: true, stayDViews: 0 }));
  assert.ok(smokeTargetReached({ ...full, useRichDims: false, stayDViews: 0 }), "fallback ignores stayDViews");
});
