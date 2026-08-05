import { describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  deleteRemoteAttempts,
  fetchRemoteAttempts,
  planLoginSync,
  pushAttempts
} from "./attemptRemote";
import { attemptKey } from "./attemptSync";
import type { Attempt } from "./types";

// --- test fixtures ---------------------------------------------------------

function makeAttempt(overrides: Partial<Attempt> = {}): Attempt {
  return {
    vocabularyId: "kaku",
    targetForm: "te",
    prompt: "書く",
    expectedAnswers: ["書いて"],
    submittedAnswer: "書いて",
    isCorrect: true,
    timestamp: 1000,
    responseTimeMs: 500,
    ...overrides
  };
}

// --- minimal typed fake SupabaseClient -------------------------------------
//
// Only the slice of the SDK surface that attemptRemote touches is modelled:
// fetch does `.from(table).select(cols).eq(col, val)` (the eq() result is the
// awaited query), push does `.from(table).upsert(rows, opts)`. We capture the
// arguments so the tests can assert on them, and cast the fake to
// SupabaseClient at the boundary (the cast is the one unavoidable `as`, kept
// off the public test surface via a typed builder).

interface SelectCall {
  table: string;
  columns: string;
  eqColumn: string;
  eqValue: string;
}

interface UpsertCall {
  table: string;
  rows: Array<{ id: string; user_id: string; payload: Attempt }>;
  options: { onConflict?: string; ignoreDuplicates?: boolean } | undefined;
}

interface DeleteCall {
  table: string;
  eqColumn: string;
  eqValue: string;
}

interface QueryResult {
  data: Array<{ payload: Attempt }> | null;
  error: Error | null;
}

function makeFakeClient(opts: {
  rows?: Array<{ payload: Attempt }>;
  selectError?: Error;
  upsertError?: Error;
  deleteError?: Error;
}) {
  const selectCalls: SelectCall[] = [];
  const upsertCalls: UpsertCall[] = [];
  const deleteCalls: DeleteCall[] = [];

  const client = {
    from(table: string) {
      return {
        select(columns: string) {
          return {
            // fetch paginates: .eq(...).order(...).range(from, to). The eq()
            // result is a chainable builder whose range() resolves a page.
            eq(eqColumn: string, eqValue: string) {
              selectCalls.push({ table, columns, eqColumn, eqValue });
              const builder = {
                order() {
                  return builder;
                },
                range(from: number, to: number): Promise<QueryResult> {
                  if (opts.selectError) {
                    return Promise.resolve({ data: null, error: opts.selectError });
                  }
                  return Promise.resolve({ data: (opts.rows ?? []).slice(from, to + 1), error: null });
                }
              };
              return builder;
            }
          };
        },
        upsert(
          rows: UpsertCall["rows"],
          options: UpsertCall["options"]
        ): Promise<{ error: Error | null }> {
          upsertCalls.push({ table, rows, options });
          return Promise.resolve({ error: opts.upsertError ?? null });
        },
        delete(): {
          eq(eqColumn: string, eqValue: string): Promise<{ error: Error | null }>;
        } {
          return {
            eq(eqColumn: string, eqValue: string): Promise<{ error: Error | null }> {
              deleteCalls.push({ table, eqColumn, eqValue });
              return Promise.resolve({ error: opts.deleteError ?? null });
            }
          };
        }
      };
    }
  };

  return {
    client: client as unknown as SupabaseClient,
    selectCalls,
    upsertCalls,
    deleteCalls
  };
}

// --- fetchRemoteAttempts ---------------------------------------------------

describe("fetchRemoteAttempts", () => {
  it("returns [] when client is null (no SDK fetch)", async () => {
    await expect(fetchRemoteAttempts(null, "user-1")).resolves.toEqual([]);
  });

  it("queries attempts.payload eq user_id and maps payloads to Attempts", async () => {
    const a = makeAttempt({ timestamp: 1 });
    const b = makeAttempt({ timestamp: 2, submittedAnswer: "書きて", isCorrect: false });
    const { client, selectCalls } = makeFakeClient({
      rows: [{ payload: a }, { payload: b }]
    });

    const result = await fetchRemoteAttempts(client, "user-42");

    expect(selectCalls).toEqual([
      { table: "attempts", columns: "payload", eqColumn: "user_id", eqValue: "user-42" }
    ]);
    expect(result).toEqual([a, b]);
  });

  it("throws when the query returns an error", async () => {
    const { client } = makeFakeClient({ selectError: new Error("boom") });
    await expect(fetchRemoteAttempts(client, "user-1")).rejects.toThrow("boom");
  });

  it("paginates past the PostgREST 1000-row cap (fetches every page)", async () => {
    const rows = Array.from({ length: 1500 }, (_, i) => ({ payload: makeAttempt({ timestamp: i }) }));
    const { client, selectCalls } = makeFakeClient({ rows });

    const result = await fetchRemoteAttempts(client, "user-1");

    expect(result).toHaveLength(1500);
    // more than one page was fetched (1000 + 500), so the 1000 cap can't truncate.
    expect(selectCalls.length).toBeGreaterThanOrEqual(2);
  });
});

// --- pushAttempts ----------------------------------------------------------

describe("pushAttempts", () => {
  it("no-ops on null client", async () => {
    await expect(pushAttempts(null, "user-1", [makeAttempt()])).resolves.toBeUndefined();
  });

  it("no-ops on empty attempts (no upsert call)", async () => {
    const { client, upsertCalls } = makeFakeClient({});
    await pushAttempts(client, "user-1", []);
    expect(upsertCalls).toEqual([]);
  });

  it("upserts rows keyed by attemptKey with onConflict + ignoreDuplicates", async () => {
    const a = makeAttempt({ timestamp: 1 });
    const b = makeAttempt({ timestamp: 2 });
    const { client, upsertCalls } = makeFakeClient({});

    await pushAttempts(client, "user-99", [a, b]);

    expect(upsertCalls).toHaveLength(1);
    expect(upsertCalls[0].table).toBe("attempts");
    expect(upsertCalls[0].options).toEqual({ onConflict: "user_id,id", ignoreDuplicates: true });
    expect(upsertCalls[0].rows).toEqual([
      { id: attemptKey(a), user_id: "user-99", payload: a },
      { id: attemptKey(b), user_id: "user-99", payload: b }
    ]);
  });

  it("throws when the upsert returns an error", async () => {
    const { client } = makeFakeClient({ upsertError: new Error("nope") });
    await expect(pushAttempts(client, "user-1", [makeAttempt()])).rejects.toThrow("nope");
  });
});

// --- deleteRemoteAttempts ---------------------------------------------------

describe("deleteRemoteAttempts", () => {
  it("deletes attempts filtered by exactly the captured user id (no other filter)", async () => {
    const { client, deleteCalls } = makeFakeClient({});
    const result = await deleteRemoteAttempts(client, "user-42");
    expect(result).toEqual({ ok: true });
    expect(deleteCalls).toEqual([{ table: "attempts", eqColumn: "user_id", eqValue: "user-42" }]);
  });

  it("sanitizes a Supabase error: no raw message, SQL, env or token leakage", async () => {
    const raw = "permission denied for table attempts (sql: DELETE FROM attempts WHERE user_id='$2'). env: SUPABASE_ANON_KEY=supersecret token=eyJhbGciOiJIUzI1NiJ9";
    const { client } = makeFakeClient({ deleteError: new Error(raw) });
    const result = await deleteRemoteAttempts(client, "user-1");
    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }
    expect(result.message).not.toContain("supersecret");
    expect(result.message).not.toContain("eyJhbGciOiJIUzI1NiJ9");
    expect(result.message).not.toContain("DELETE FROM");
    expect(result.message).not.toContain("SUPABASE_ANON_KEY");
    expect(result.message).not.toContain("$2");
  });
});

// --- planLoginSync (pure) --------------------------------------------------

describe("planLoginSync", () => {
  it("merges local + remote and computes toUpload as local-only attempts", () => {
    const shared = makeAttempt({ timestamp: 1 });
    const localOnly = makeAttempt({ timestamp: 2, submittedAnswer: "local" });
    const remoteOnly = makeAttempt({ timestamp: 3, submittedAnswer: "remote" });

    const local = [shared, localOnly];
    const remote = [shared, remoteOnly];

    const { merged, toUpload } = planLoginSync(local, remote);

    // merged is the full union (3 distinct), sorted by timestamp.
    expect(merged).toEqual([shared, localOnly, remoteOnly]);
    // toUpload = the local record not already in remote.
    expect(toUpload).toEqual([localOnly]);
  });

  it("uploads nothing when every local attempt already exists remotely", () => {
    const a = makeAttempt({ timestamp: 1 });
    const b = makeAttempt({ timestamp: 2, submittedAnswer: "b" });

    const { merged, toUpload } = planLoginSync([a], [a, b]);

    expect(toUpload).toEqual([]);
    expect(merged).toEqual([a, b]);
  });

  it("uploads all local attempts when remote is empty", () => {
    const a = makeAttempt({ timestamp: 1 });
    const b = makeAttempt({ timestamp: 2, submittedAnswer: "b" });

    const { toUpload } = planLoginSync([a, b], []);

    expect(toUpload).toEqual([a, b]);
  });

  it("is idempotent: re-running with merged as local yields no new uploads", () => {
    const local = [makeAttempt({ timestamp: 2, submittedAnswer: "local" })];
    const remote = [makeAttempt({ timestamp: 3, submittedAnswer: "remote" })];

    const first = planLoginSync(local, remote);
    // After the first sync, local store holds `merged`; the remote now also
    // holds everything that was uploaded. Re-running must push nothing new.
    const second = planLoginSync(first.merged, first.merged);

    expect(second.toUpload).toEqual([]);
    expect(second.merged).toEqual(first.merged);
  });
});
