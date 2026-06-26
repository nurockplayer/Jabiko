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
    expect(captured).toEqual({ category: "wish", message: "想要夜間模式", contact: "a@b.c" });
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
