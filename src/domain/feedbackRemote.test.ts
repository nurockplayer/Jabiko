import { describe, expect, it, vi } from "vitest";
import { submitFeedback } from "./feedbackRemote";

function fakeClient(insert: (row: unknown) => { error: unknown }) {
  return {
    from: (table: string) => {
      expect(table).toBe("feedback");
      return { insert: (row: unknown) => Promise.resolve(insert(row)) };
    }
  } as unknown as Parameters<typeof submitFeedback>[0];
}

// Row type: submitFeedback builds the row as Record<string, unknown>, and the
// fake below hands that straight back to the test's `captured` for assertions.
type CapturedRow = Record<string, unknown>;

describe("submitFeedback", () => {
  it("inserts a trimmed, capped row and resolves on success", async () => {
    let captured!: CapturedRow;
    const client = fakeClient((row) => {
      captured = row as CapturedRow;
      return { error: null };
    });
    await submitFeedback(client, { category: "wish", message: "  想要夜間模式  ", contact: " a@b.c " });
    expect(captured).toEqual({
      category: "wish",
      message: "想要夜間模式",
      contact: "a@b.c",
      wants_reply: false
    });
  });

  it("sends wants_reply=true when the user opts in (#468)", async () => {
    let captured!: CapturedRow;
    const client = fakeClient((row) => {
      captured = row as CapturedRow;
      return { error: null };
    });
    await submitFeedback(client, { category: "wish", message: "回我一下", wantsReply: true });
    expect(captured.wants_reply).toBe(true);
  });

  it("never sends client-controlled account columns — the DB fills them from the JWT (#468)", async () => {
    // The signed-in account (auth_user_id / account_email / provider) is captured
    // server-side via column DEFAULTs so a client can't spoof it, and the optional
    // `contact` is never auto-filled with the account email.
    let captured!: CapturedRow;
    const client = fakeClient((row) => {
      captured = row as CapturedRow;
      return { error: null };
    });
    await submitFeedback(client, { category: "bug", message: "壞了", wantsReply: true });
    expect(captured).not.toHaveProperty("auth_user_id");
    expect(captured).not.toHaveProperty("account_email");
    expect(captured).not.toHaveProperty("account_provider");
    expect(captured.contact).toBeNull();
  });

  it("stores null contact when blank", async () => {
    let captured!: CapturedRow;
    const client = fakeClient((row) => {
      captured = row as CapturedRow;
      return { error: null };
    });
    await submitFeedback(client, { category: "bug", message: "壞了", contact: "   " });
    expect(captured.contact).toBeNull();
  });

  it("attaches the diagnostics blob in its own column when supplied (#654)", async () => {
    let captured!: CapturedRow;
    const client = fakeClient((row) => {
      captured = row as CapturedRow;
      return { error: null };
    });
    const diagnostics = { route: "/challenge", browser: "Chrome", os: "Windows", furigana: true } as never;
    await submitFeedback(client, { category: "bug", message: "排版亂掉", diagnostics });
    expect(captured.diagnostics).toEqual(diagnostics);
  });

  it("omits the diagnostics key entirely when none is supplied (back-compat with old rows)", async () => {
    let captured!: CapturedRow;
    const client = fakeClient((row) => {
      captured = row as CapturedRow;
      return { error: null };
    });
    await submitFeedback(client, { category: "wish", message: "想要夜間模式" });
    expect(captured).not.toHaveProperty("diagnostics");
  });

  it("retries WITHOUT diagnostics if the column isn't migrated yet, so feedback never breaks (#654)", async () => {
    const rows: CapturedRow[] = [];
    let call = 0;
    const client = fakeClient((row) => {
      rows.push({ ...(row as CapturedRow) });
      call += 1;
      // First insert (with diagnostics) fails as if the column is missing;
      // the retry without diagnostics succeeds.
      return { error: call === 1 ? new Error("column \"diagnostics\" does not exist") : null };
    });
    await submitFeedback(client, {
      category: "bug",
      message: "壞了",
      diagnostics: { route: "/challenge" } as never
    });
    expect(call).toBe(2);
    expect(rows[0]).toHaveProperty("diagnostics");
    expect(rows[1]).not.toHaveProperty("diagnostics");
  });

  it("throws 'empty' on a blank message without touching the client", async () => {
    const insert = vi.fn();
    const client = fakeClient(insert as never);
    await expect(submitFeedback(client, { category: "other", message: "   " })).rejects.toThrow("empty");
    expect(insert).not.toHaveBeenCalled();
  });

  it("throws 'unconfigured' on a null client", async () => {
    await expect(submitFeedback(null, { category: "wish", message: "hi" })).rejects.toThrow("unconfigured");
  });

  it("propagates a Supabase error (e.g. table not migrated)", async () => {
    const client = fakeClient(() => ({ error: new Error("relation does not exist") }));
    await expect(submitFeedback(client, { category: "bug", message: "x" })).rejects.toThrow("relation");
  });
});
