import { describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { fetchRemoteAttempts, planLoginSync, pushAttempts } from "./attemptRemote";
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

interface QueryResult {
  data: Array<{ payload: Attempt }> | null;
  error: Error | null;
}

function makeFakeClient(opts: {
  rows?: Array<{ payload: Attempt }>;
  selectError?: Error;
  upsertError?: Error;
}) {
  const selectCalls: SelectCall[] = [];
  const upsertCalls: UpsertCall[] = [];

  const client = {
    from(table: string) {
      return {
        select(columns: string) {
          return {
            eq(eqColumn: string, eqValue: string): Promise<QueryResult> {
              selectCalls.push({ table, columns, eqColumn, eqValue });
              return Promise.resolve(
                opts.selectError
                  ? { data: null, error: opts.selectError }
                  : { data: opts.rows ?? [], error: null }
              );
            }
          };
        },
        upsert(
          rows: UpsertCall["rows"],
          options: UpsertCall["options"]
        ): Promise<{ error: Error | null }> {
          upsertCalls.push({ table, rows, options });
          return Promise.resolve({ error: opts.upsertError ?? null });
        }
      };
    }
  };

  return {
    client: client as unknown as SupabaseClient,
    selectCalls,
    upsertCalls
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
