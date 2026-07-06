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

describe("submitFeedback", () => {
  it("inserts a trimmed, capped row and resolves on success", async () => {
    let captured: any;
    const client = fakeClient((row) => {
      captured = row;
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
    let captured: any;
    const client = fakeClient((row) => {
      captured = row;
      return { error: null };
    });
    await submitFeedback(client, { category: "wish", message: "回我一下", wantsReply: true });
    expect(captured.wants_reply).toBe(true);
  });

  it("never sends client-controlled account columns — the DB fills them from the JWT (#468)", async () => {
    // The signed-in account (auth_user_id / account_email / provider) is captured
    // server-side via column DEFAULTs so a client can't spoof it, and the optional
    // `contact` is never auto-filled with the account email.
    let captured: any;
    const client = fakeClient((row) => {
      captured = row;
      return { error: null };
    });
    await submitFeedback(client, { category: "bug", message: "壞了", wantsReply: true });
    expect(captured).not.toHaveProperty("auth_user_id");
    expect(captured).not.toHaveProperty("account_email");
    expect(captured).not.toHaveProperty("account_provider");
    expect(captured.contact).toBeNull();
  });

  it("stores null contact when blank", async () => {
    let captured: any;
    const client = fakeClient((row) => {
      captured = row;
      return { error: null };
    });
    await submitFeedback(client, { category: "bug", message: "壞了", contact: "   " });
    expect(captured.contact).toBeNull();
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
