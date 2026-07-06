import type { SupabaseClient } from "@supabase/supabase-js";

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
  const { error } = await client.from("feedback").insert({
    category: input.category,
    message: message.slice(0, FEEDBACK_MAX),
    contact: contact ? contact.slice(0, CONTACT_MAX) : null,
    wants_reply: input.wantsReply ?? false
    // NB: auth_user_id / account_email / account_provider are intentionally
    // NOT set here -- the DB DEFAULTs fill them from the JWT (migration 0003).
  });

  if (error) {
    throw error;
  }
}
