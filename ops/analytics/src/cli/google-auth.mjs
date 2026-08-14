// ops/analytics bin/google-auth — inspect or set up Google GA4 access.
// Never prints tokens.

import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { resolveGoogleCredential, redact } from "../creds.mjs";
import { googleTokenFromEnv, listAccounts } from "../ga4.mjs";
import * as report from "../report.mjs";

const SECRETS_DIR = fileURLToPath(new URL("../../.secrets", import.meta.url));
const OPS_DIR = fileURLToPath(new URL("../..", import.meta.url));

report.section("Google GA4 credential check");

const credential = resolveGoogleCredential();
if (!credential) {
  report.warn("No Google credential configured.");
  report.bullet("Choose one of:");
  report.bullet("  A) Service account (best for automation):");
  report.bullet("     - Google Cloud Console → IAM → Service Accounts → Create (e.g. jabiko-ops).");
  report.bullet("     - Google Analytics Admin → Property → Access management → add the SA email as Viewer (read) / Editor (apply).");
  report.bullet("     - Create a JSON key and save it to:");
  report.bullet(`       ${join(SECRETS_DIR, "gcp-service-account.json")}  (or export GOOGLE_APPLICATION_CREDENTIALS=…)`);
  report.bullet("  B) Your own Google account (gcloud):");
  report.bullet(`     - docker compose -f ${join(OPS_DIR, "docker-compose.yml")} run --rm gcloud`);
  report.bullet("     - the ADC credentials land in a docker volume the scripts also look at.");
  report.bullet("  C) One-shot access token for a single run:");
  report.bullet("     - export GA4_ACCESS_TOKEN=$(… via any OAuth tool …)");
  report.bullet(`   Scopes needed: cloud-platform, analytics.readonly (plan/smoke), analytics.edit (apply).`);
  report.printGate("GOOGLE_OAUTH");
  process.exitCode = 1;
} else {
  report.bullet(`credential source: ${credential.type}`);
  if (credential.type === "service-account") {
    report.bullet(`client_email: ${credential.clientEmail}`);
  } else if (credential.type === "user-oauth") {
    report.bullet(`client_id: ${redact(credential.clientId)}`);
  }
  const token = await googleTokenFromEnv();
  if (!token) {
    report.err("Credential file present but a token could not be minted (expired or malformed).");
    report.printGate("GOOGLE_OAUTH");
    process.exitCode = 1;
  } else {
    try {
      const accounts = await listAccounts({ token });
      report.ok(`token works — ${accounts.length} GA4 account(s) visible.`);
      for (const a of accounts) report.bullet(`${a.displayName ?? a.name}`);
    } catch (e) {
      report.err(`token minted but the Admin API rejected it: ${e.message}`);
      report.printGate("GOOGLE_OAUTH", "The credential has no access to any GA4 account/property.");
      process.exitCode = 1;
    }
  }
}
