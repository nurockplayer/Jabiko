# Google AdSense operator runbook

## Current completion state: Mode B

The provider boundary is implemented, but the Focus Break production placement
is disabled. As of 2026-08-20, the repository, Issue #772, and available live
evidence do not establish an approved AdSense account/site, account-supplied
publisher and ad-unit IDs, a deployed Google-certified CMP, an account-supplied
seller record, or a positive production placement review. None of those facts
may be inferred or replaced with sample values.

A read-only production check on 2026-08-20 found no AdSense tag in the served
home HTML. `https://jabiko.app/ads.txt` returned status 200 with the SPA's HTML
shell, not a seller record; that is not valid Mode A evidence. This change makes
the missing-file case a plain-text 404. A future real `public/ads.txt` will pass
through at the root only after the operator adds the account-supplied record.

The current Focus Break is primarily a timer, a completed-session summary, and
controls for continuing or ending a Pomodoro cycle. Google's current inventory
value policy prohibits Google-served ads on screens without or with low-value
publisher content and on screens used for alerts, navigation, or other
behavioural purposes. The available evidence therefore does not positively
establish that this surface is eligible. `VITE_ADSENSE_FOCUS_BREAK_POLICY_ELIGIBLE`
must remain `false` until a current review reaches and records the opposite
conclusion. Do not move the placement to another surface under Issue #772.

Official sources reviewed on 2026-08-20:

- [Google-served ads on screens without publisher-content](https://support.google.com/publisherpolicies/answer/11112688?hl=en)
- [Ad placement policies](https://support.google.com/adsense/answer/1346295?hl=en)
- [Google consent management requirements for the EEA, UK, and Switzerland](https://support.google.com/adsense/answer/13554116?hl=en)
- [Publisher integration with the IAB Europe TCF](https://support.google.com/adsense/answer/9804260?hl=en)
- [About European regulations messages](https://support.google.com/adsense/answer/10961068?hl=en)
- [Create a responsive display ad unit](https://support.google.com/adsense/answer/6002575?hl=en)
- [Ads.txt guide](https://support.google.com/adsense/answer/12171612?hl=en)

This review is an implementation decision, not legal advice or a claim of
policy approval. Google notes that CMP certification does not itself establish
compliance with the TCF or applicable privacy law.

## Fail-closed runtime contract

The only allowlisted placement identifier is `focus-break`. Application callers
cannot provide an arbitrary slot, label, URL, script, or HTML fragment.

Every condition below must pass before Jabiko creates an ad unit or requests the
AdSense script:

1. Vite reports a production build. Development and tests are always disabled.
2. The browser is on the exact canonical host `jabiko.app`. Cloudflare preview
   hosts remain disabled even if they accidentally inherit production variables.
3. `VITE_ADSENSE_ENABLED` is exactly `true`.
4. `VITE_ADSENSE_FOCUS_BREAK_POLICY_ELIGIBLE` is exactly `true`.
5. The account-supplied publisher and Focus Break slot IDs are present and
   match the formats emitted by AdSense.
6. The rendered Break contains a real completed-session summary with at least
   one local answer recorded through the practice engine during that Focus
   cycle. Remote-history sync and pre-existing totals cannot satisfy this gate;
   a timer-only or zero-local-answer Break is not context-eligible.
7. An operator-installed Google-certified CMP exposes the standard IAB TCF API.
   The callback must succeed and either report that GDPR does not apply, or
   reach a ready state with a non-empty TC string and Purpose 1 consent. Missing,
   failed, incomplete, or timed-out signals withhold the ad request.

The script loader is idempotent per document. A blocked, failed, timed-out, or
explicitly unfilled unit is removed without affecting Skip break, Start next
round, End Focus Mode, navigation, learning state, or offline functionality.
No external ad resource is part of the PWA precache, and no learning flow waits
for an ad.

Jabiko does not implement ad-click tracking or duplicate Google's ad interaction
telemetry. The existing Zaraz/GA4 application analytics contract is unchanged.

## Production variables

Configure these only in the Cloudflare Pages production environment after all
activation gates below pass. Keep them absent or at the Mode B values in local,
test, preview, and unapproved production environments.

| Variable | Mode B | Mode A source |
| --- | --- | --- |
| `VITE_ADSENSE_ENABLED` | `false` | Set to `true` only for approved production activation |
| `VITE_ADSENSE_FOCUS_BREAK_POLICY_ELIGIBLE` | `false` | Recorded current policy review |
| `VITE_ADSENSE_PUBLISHER_ID` | empty | Exact publisher ID copied from the approved account |
| `VITE_ADSENSE_FOCUS_BREAK_SLOT` | empty | Exact manually controlled responsive display-unit ID copied from the approved account |

These are public ad-tag identifiers, not secrets, but they still must never be
invented. Account credentials and consent administration credentials must not
enter Vite variables or the repository.

## Mode A activation checklist

All items are required. A missing item keeps Mode B in force.

1. Obtain objective AdSense account and `jabiko.app` site approval.
2. Create one manually controlled responsive display unit. Keep Auto ads,
   anchors, vignettes, side rails, ad intents, and interstitial-style formats
   disabled.
3. Repeat the official-policy review against the exact rendered Focus Break.
   Record the date, reviewer, source links, screenshots, viewport checks, and a
   positive rationale showing substantive publisher content is primary and the
   ad is secondary and separated from every action. Uncertainty is a failed
   gate.
4. Select and deploy a Google-certified web CMP that supports IAB TCF v2.3,
   the current required version at the review date. Google's publisher
   integration documentation says not to call
   the ad tag without Purpose 1 consent. Verify the CMP's regional message,
   vendor disclosures, consent withdrawal/control path, and top-level
   `__tcfapi` signal in EEA, UK, Switzerland, and non-applicable test cases.
   Do not build a Jabiko-specific CMP.
5. Update all three launched Privacy Policy translations and the effective date
   before every Mode A activation: remove the current "disabled" statement and
   accurately describe the selected CMP, vendors, ad-serving mode, and data
   handling. Rerun the legal-content tests. Obtain any legal review the operator
   considers necessary; do not describe the code gates as legal compliance.
6. In AdSense, copy the exact authorized-seller line for the real account into
   `public/ads.txt`. Do not adapt a documentation example. Build, then verify
   `dist/ads.txt` contains only the intended account-supplied record.
7. Set the four production variables from the approved account and recorded
   review. Preview variables must stay absent/disabled.
8. Run `pnpm verify:full` and `git diff --check`, deploy, then complete the
   production checks below. A failed check requires disabling
   `VITE_ADSENSE_ENABLED` or rolling back the deployment.

## Production verification

Use a clean browser profile and preserve screenshots/network exports as PR or
handoff evidence. Verify all of the following on the exact deployed commit:

- `/ads.txt` returns status 200, `text/plain`, and the exact account-supplied
  seller record. Under Mode B it must return the middleware's plain-text 404,
  never the SPA HTML shell or a placeholder record.
- Local development, tests, Cloudflare preview, unconfigured production, and a
  missing/failed consent signal make no request to
  `pagead2.googlesyndication.com`.
- Focus, Challenge, mock exams, weak-point review, result controls, legal pages,
  and Stay.D contain no AdSense unit or ad-driven interruption.
- Only the allowlisted, context-eligible Focus Break can initialize one manual
  responsive unit, after the CMP signal permits it.
- Skip break, Start next round, End Focus Mode, and navigation remain available
  before, during, and after successful, blocked, failed, and unfilled ad loads.
- The ad is clearly labelled, secondary to publisher content, separated from
  controls at desktop and mobile sizes, and causes no content/control overlap.
- Offline/PWA learning remains usable with Google requests blocked.

Useful read-only checks after an authorized Mode A deployment:

```bash
curl --fail --silent --show-error --dump-header - https://jabiko.app/ads.txt
```

Do not mark Mode A complete from configuration or a successful build alone.
Account approval, policy eligibility, CMP behaviour, seller authorization, and
production network/UI evidence are separate gates.
