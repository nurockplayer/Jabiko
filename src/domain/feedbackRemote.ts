import type { SupabaseClient } from "@supabase/supabase-js";
import type { FeedbackDiagnostics } from "./diagnostics";

// Anonymous feedback submit (#218 follow-up). Thin wrapper over the Supabase
// `feedback` table -- a write-only suggestion box (anon may INSERT, nobody may
// SELECT via the API; see supabase/migrations/0002_create_feedback.sql).
// No login required, so feedback can be fully anonymous.
//
// Signed-in account capture (#468): when the submitter is logged in, the row
// records WHO sent it -- but the client never sends that. The account columns
// (auth_user_id / account_email / account_provider) are filled server-side by
// column DEFAULTs that read the request's JWT (auth.uid() / auth.jwt()), so a
// client can neither spoof another account nor omit its own. Anonymous users
// have no JWT, so those columns stay null. The optional `contact` field is
// untouched -- it is NEVER auto-filled with the account email; the user types
// it (or leaves it blank) as before. See migration 0003_feedback_account.sql.

export type FeedbackCategory = "wish" | "bug" | "other";

export interface FeedbackInput {
  category: FeedbackCategory;
  message: string;
  contact?: string;
  /** The user ticked "I'd like a reply" (#468). Defaults to false. */
  wantsReply?: boolean;
  /**
   * Anonymous reproducibility environment (#654). Content-free by
   * construction (see collectDiagnostics). Stored in its own `diagnostics`
   * column, never mixed into the message. Omitted for per-question reports
   * (they already carry the question id in the message).
   */
  diagnostics?: FeedbackDiagnostics;
}

export const FEEDBACK_MAX = 4000;
export const CONTACT_MAX = 200;

// Insert one feedback row. Throws on an empty message ("empty"), an
// unconfigured client ("unconfigured"), or a Supabase error (e.g. the table
// not migrated yet) -- the caller surfaces these as a friendly retry / fallback.
export async function submitFeedback(
  client: SupabaseClient | null,
  input: FeedbackInput
): Promise<void> {
  const message = input.message.trim();
  if (!message) {
    throw new Error("empty");
  }
  if (!client) {
    throw new Error("unconfigured");
  }

  const contact = input.contact?.trim();
  const row: Record<string, unknown> = {
    category: input.category,
    message: message.slice(0, FEEDBACK_MAX),
    contact: contact ? contact.slice(0, CONTACT_MAX) : null,
    wants_reply: input.wantsReply ?? false
    // NB: auth_user_id / account_email / account_provider are intentionally
    // NOT set here -- the DB DEFAULTs fill them from the JWT (migration 0003).
  };
  // Only attach diagnostics when present, so per-question reports and older
  // callers keep the exact legacy row shape (and rows predate the column).
  if (input.diagnostics) {
    row.diagnostics = input.diagnostics;
  }

  let { error } = await client.from("feedback").insert(row);
  // Deploy-safety: the `diagnostics` column (migration 0004) may not be applied
  // yet. If the insert failed AND we sent diagnostics, retry once without it so
  // feedback never breaks during a migration lag (#654). A genuine error (bad
  // policy, network, etc.) recurs on the retry and is surfaced as before.
  if (error && input.diagnostics) {
    delete row.diagnostics;
    ({ error } = await client.from("feedback").insert(row));
  }

  if (error) {
    throw error;
  }
}
