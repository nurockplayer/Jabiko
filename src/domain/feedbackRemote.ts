import type { SupabaseClient } from "@supabase/supabase-js";

// Anonymous feedback submit (#218 follow-up). Thin wrapper over the Supabase
// `feedback` table -- a write-only suggestion box (anon may INSERT, nobody may
// SELECT via the API; see supabase/migrations/0002_create_feedback.sql).
// No login required, so feedback can be fully anonymous.

export type FeedbackCategory = "wish" | "bug" | "other";

export interface FeedbackInput {
  category: FeedbackCategory;
  message: string;
  contact?: string;
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
    contact: contact ? contact.slice(0, CONTACT_MAX) : null
  });

  if (error) {
    throw error;
  }
}
