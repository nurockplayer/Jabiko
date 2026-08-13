// ops/analytics — shared CLI helpers (flag parsing, GA4 discovery, repo checks).

import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { listAccounts, listProperties, listDataStreams } from "../ga4.mjs";

/**
 * Normalize a boolean flag value. Accepts boolean true/false and the literal
 * strings "true"/"false"; anything else FAILS CLOSED (throws) rather than
 * guessing — a safety flag must never be silently inverted by a typo.
 * `undefined`/`null` (flag absent) mean false.
 */
export function normalizeBooleanFlag(value, name) {
  if (value === true || value === "true") return true;
  if (value === false || value === "false") return false;
  if (value === undefined || value === null) return false;
  throw new Error(
    `Invalid boolean value for ${name}: ${JSON.stringify(value)} (expected true or false)`
  );
}

/**
 * Minimal `--flag value` / `--flag` / `--flag=value` parser.
 *
 * Flags listed in `booleans` are normalized centrally: bare `--flag` and
 * `--flag=true` mean true, `--flag=false` means false, and any other `=value`
 * throws (fail closed). This prevents a `--flag=<typo>` from silently
 * inverting a safety flag like --dry-run or --yes-remove-gtag.
 */
export function parseFlags(argv, { booleans = [] } = {}) {
  const boolSet = new Set(booleans);
  const out = {};
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (!a.startsWith("--")) continue;
    const eq = a.indexOf("=");
    const name = eq === -1 ? a.slice(2) : a.slice(2, eq);
    if (boolSet.has(name)) {
      if (eq === -1) {
        out[name] = true;
      } else {
        out[name] = normalizeBooleanFlag(a.slice(eq + 1), `--${name}`);
      }
    } else if (eq !== -1) {
      out[name] = a.slice(eq + 1);
    } else if (i + 1 < argv.length && !argv[i + 1].startsWith("--")) {
      out[name] = argv[i + 1];
      i += 1;
    } else {
      out[name] = true;
    }
  }
  return out;
}

/**
 * Return the flag names in `parsed` that are not in `allowed`. CLI entries use
 * this to REJECT unknown options before doing any work, so a typo like
 * `--dryrun=true` on a safety flag fails closed instead of being silently
 * dropped (which would let a dry run become a real mutation).
 */
export function unknownFlags(parsed, allowed) {
  const allowedSet = new Set(allowed);
  return Object.keys(parsed).filter((name) => !allowedSet.has(name));
}

/**
 * Select the unique production web stream for a GA4 property. A production web
 * stream is a WEB_DATA_STREAM whose webStreamData.defaultUri hostname is exactly
 * jabiko.app (or www.jabiko.app) — not a staging/test subdomain. Returns null
 * when a unique production stream cannot be identified — fail closed rather
 * than picking the first WEB_DATA_STREAM.
 */
export function selectProductionWebStream(streams = []) {
  const production = streams.filter(
    (s) =>
      s.type === "WEB_DATA_STREAM" &&
      isJabikoProductionHost(s.webStreamData?.defaultUri ?? "")
  );
  return production.length === 1 ? production[0] : null;
}

function isJabikoProductionHost(uri) {
  const host = String(uri).replace(/^https?:\/\//i, "").split(/[/?#]/)[0];
  return host === "jabiko.app" || host === "www.jabiko.app";
}

/**
 * Discover the Jabiko GA4 production property and its web-stream Measurement ID.
 *
 * The production property is NOT prefiltered by displayName or a property URL:
 * generic names like "Production" must work. Every visible property's data
 * streams are inspected and candidates are the properties with a unique
 * WEB_DATA_STREAM whose defaultUri hostname is jabiko.app (or www.jabiko.app).
 *
 * If `measurementId` is supplied it is used to disambiguate: candidates are
 * filtered to those whose stream Measurement ID matches, so a supplied ID that
 * picks out one property resolves it before any ambiguity gate. Zero or
 * multiple matches fail closed (property is null).
 *
 * Returns { property, candidates, measurementId }.
 */
export async function discoverGa4({ token, measurementId }) {
  const accounts = await listAccounts({ token });
  const candidates = [];
  for (const acc of accounts) {
    const props = await listProperties({ token, account: acc.name });
    for (const p of props) {
      const streams = await listDataStreams({ token, property: p.name });
      const web = selectProductionWebStream(streams);
      if (web) candidates.push({ account: acc.name, ...p, stream: web });
    }
  }
  let matches = candidates;
  if (measurementId) {
    matches = candidates.filter(
      (c) => c.stream?.webStreamData?.measurementId === measurementId
    );
  }
  if (matches.length !== 1) {
    return { property: null, candidates, measurementId: null };
  }
  const property = matches[0];
  return {
    property,
    candidates,
    // GA4 Admin v1beta DataStream: the web Measurement ID lives under
    // webStreamData.measurementId (there is no top-level measurementId).
    measurementId: property.stream?.webStreamData?.measurementId ?? null
  };
}

/**
 * Cheap read-only repo checks for the analytics contract. Returns blocking
 * findings only; empty means the checkout is consistent with #745.
 */
export async function repoStaticChecks({ repoRoot }) {
  const findings = [];
  const read = async (rel) => {
    try {
      return await readFile(join(repoRoot, rel), "utf8");
    } catch {
      return "";
    }
  };
  const [indexHtml, analyticsTs] = await Promise.all([
    read("index.html"),
    read("src/lib/analytics.ts")
  ]);
  if (/gtag\.js|googletagmanager|google-analytics/i.test(indexHtml)) {
    findings.push({
      severity: "blocking",
      code: "GTAG_IN_INDEX_HTML",
      message: "index.html loads a gtag/GTM snippet — #745 forbids a second analytics client."
    });
  }
  if (!analyticsTs.includes("promo_click")) {
    findings.push({
      severity: "blocking",
      code: "PROMO_CLICK_MISSING",
      message: "src/lib/analytics.ts has no promo_click event; is #756 merged into this checkout?"
    });
  }
  if (!analyticsTs.includes("page_view")) {
    findings.push({
      severity: "blocking",
      code: "PAGE_VIEW_MISSING",
      message: "src/lib/analytics.ts has no page_view event."
    });
  }
  return findings;
}
