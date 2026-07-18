// @ts-expect-error -- plain .mjs module, no types
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
// @ts-expect-error -- plain .mjs module, no types
import { createGeminiClient } from "../gemini-client.mjs";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function mockFetchSuccess(body) {
  return vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: () =>
      Promise.resolve({
        candidates: [{ content: { parts: [{ text: JSON.stringify(body) }] } }]
      })
  });
}

function mockFetchError(status, statusText, body) {
  return vi.fn().mockResolvedValue({
    ok: false,
    status,
    statusText,
    text: () => Promise.resolve(body || statusText)
  });
}

function mockFetchMalformed(invalidJson) {
  return vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: () => Promise.resolve(invalidJson)
  });
}

describe("createGeminiClient", () => {
  let originalFetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("returns a client with discover method", () => {
    const client = createGeminiClient({ apiKey: "test-key", model: "gemini-2.0-flash", fetchFn: originalFetch });
    expect(client).toHaveProperty("discover");
    expect(typeof client.discover).toBe("function");
  });

  it("throws if apiKey is missing or empty", () => {
    // These should throw regardless of env var
    expect(() => createGeminiClient({ apiKey: "", fetchFn: originalFetch })).toThrow();
    expect(() => createGeminiClient({ apiKey: null, fetchFn: originalFetch })).toThrow();
    expect(() => createGeminiClient({ apiKey: false, fetchFn: originalFetch })).toThrow();
    // When no apiKey is passed at all, the client falls back to
    // process.env.GEMINI_API_KEY if set — only throws when env is also empty.
    const saved = process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEY;
    try {
      expect(() => createGeminiClient({ fetchFn: originalFetch })).toThrow();
    } finally {
      process.env.GEMINI_API_KEY = saved;
    }
  });

  it("throws on invalid timeoutMs", () => {
    expect(() => createGeminiClient({ apiKey: "sk-test", model: "gemini-2.0-flash", timeoutMs: 0, fetchFn: originalFetch })).toThrow();
    expect(() => createGeminiClient({ apiKey: "sk-test", model: "gemini-2.0-flash", timeoutMs: -1, fetchFn: originalFetch })).toThrow();
    expect(() => createGeminiClient({ apiKey: "sk-test", model: "gemini-2.0-flash", timeoutMs: 1.5, fetchFn: originalFetch })).toThrow();
    expect(() => createGeminiClient({ apiKey: "sk-test", model: "gemini-2.0-flash", timeoutMs: NaN, fetchFn: originalFetch })).toThrow();
    expect(() => createGeminiClient({ apiKey: "sk-test", model: "gemini-2.0-flash", timeoutMs: Infinity, fetchFn: originalFetch })).toThrow();
  });

  it("throws on invalid maxRetries", () => {
    expect(() => createGeminiClient({ apiKey: "sk-test", model: "gemini-2.0-flash", maxRetries: -1, fetchFn: originalFetch })).toThrow();
    expect(() => createGeminiClient({ apiKey: "sk-test", model: "gemini-2.0-flash", maxRetries: 1.5, fetchFn: originalFetch })).toThrow();
    expect(() => createGeminiClient({ apiKey: "sk-test", model: "gemini-2.0-flash", maxRetries: NaN, fetchFn: originalFetch })).toThrow();
    expect(() => createGeminiClient({ apiKey: "sk-test", model: "gemini-2.0-flash", maxRetries: Infinity, fetchFn: originalFetch })).toThrow();
  });

  it("accepts timeoutMs=1 and maxRetries=0 as valid edge cases", () => {
    expect(() => createGeminiClient({ apiKey: "sk-test", model: "gemini-2.0-flash", timeoutMs: 1, maxRetries: 0, fetchFn: originalFetch })).not.toThrow();
  });

  it("throws if model is missing", () => {
    expect(() => createGeminiClient({ apiKey: "sk-test", fetchFn: originalFetch })).toThrow();
    expect(() => createGeminiClient({ apiKey: "sk-test", model: "", fetchFn: originalFetch })).toThrow();
  });

  it("sends the correct request body", async () => {
    const fetch = mockFetchSuccess({ status: "no-finding", reason: "all good" });
    globalThis.fetch = fetch;
    const client = createGeminiClient({ apiKey: "sk-test", model: "gemini-2.0-flash", fetchFn: fetch });
    await client.discover({ prompt: "test prompt" });

    const callUrl = fetch.mock.calls[0][0];
    const callBody = JSON.parse(fetch.mock.calls[0][1].body);

    expect(callUrl).toContain("sk-test");
    expect(callBody.contents[0].parts[0].text).toBe("test prompt");
    expect(callBody.generationConfig.responseMimeType).toBe("application/json");
    expect(callBody.generationConfig.temperature).toBe(0);
  });

  it("returns validated result on success", async () => {
    globalThis.fetch = mockFetchSuccess({
      schemaVersion: 1,
      status: "finding",
      title: "bug",
      confidence: 0.95,
      category: "logic-error",
      evidence: [
        {
          file: "src/domain/example.ts",
          startLine: 10,
          endLine: 20,
          reason: "bug explanation"
        }
      ],
      expectedBehavior: "should work",
      actualBehavior: "broken",
      reproduction: {
        testFile: "src/domain/example.regression.test.ts",
        testName: "test"
      },
      productionFiles: ["src/domain/example.ts"],
      risk: "low"
    });
    const client = createGeminiClient({ apiKey: "sk-test", model: "gemini-2.0-flash", fetchFn: globalThis.fetch });
    const result = await client.discover({ prompt: "test" });
    expect(result.valid).toBe(true);
    expect(result.result?.status).toBe("finding");
  });

  it("returns invalid result for low-confidence finding", async () => {
    globalThis.fetch = mockFetchSuccess({
      schemaVersion: 1,
      schemaVersion: 1,
      status: "finding",
      title: "maybe bug",
      confidence: 0.3,
      category: "logic-error",
      evidence: [
        {
          file: "src/domain/example.ts",
          startLine: 1,
          endLine: 2,
          reason: "vague"
        }
      ],
      expectedBehavior: "x",
      actualBehavior: "y",
      reproduction: {
        testFile: "src/domain/example.regression.test.ts",
        testName: "test"
      },
      productionFiles: ["src/domain/example.ts"],
      risk: "low"
    });
    const client = createGeminiClient({ apiKey: "sk-test", model: "gemini-2.0-flash", fetchFn: globalThis.fetch });
    const result = await client.discover({ prompt: "test" });
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/confidence|threshold/i);
  });

  it("returns invalid result for non-JSON response", async () => {
    globalThis.fetch = mockFetchSuccess("not valid json at all");
    const client = createGeminiClient({ apiKey: "sk-test", model: "gemini-2.0-flash", fetchFn: globalThis.fetch });
    const result = await client.discover({ prompt: "test" });
    expect(result.valid).toBe(false);
  });

  it("returns error result for HTTP error (5xx)", async () => {
    globalThis.fetch = mockFetchError(500, "Internal Server Error", "server oops");
    const client = createGeminiClient({ apiKey: "sk-test", model: "gemini-2.0-flash", fetchFn: globalThis.fetch });
    const result = await client.discover({ prompt: "test" });
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/500|server/i);
  });

  it("returns error result for HTTP 429 (quota)", async () => {
    globalThis.fetch = mockFetchError(429, "Too Many Requests", "quota exceeded");
    const client = createGeminiClient({ apiKey: "sk-test", model: "gemini-2.0-flash", fetchFn: globalThis.fetch });
    const result = await client.discover({ prompt: "test" });
    expect(result.valid).toBe(false);
    expect(result.status).toBe("rate-limited");
  });

  it("retries on transient failure", async () => {
    const failThenSucceed = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: "Server Error",
        text: () => Promise.resolve("oops")
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            candidates: [
              { content: { parts: [{ text: JSON.stringify({ schemaVersion: 1, status: "no-finding", reason: "ok after retry" }) }] } }
            ]
          })
      });
    globalThis.fetch = failThenSucceed;
    const client = createGeminiClient({ apiKey: "sk-test", model: "gemini-2.0-flash", maxRetries: 1, fetchFn: failThenSucceed });
    const result = await client.discover({ prompt: "test" });
    expect(result.valid).toBe(true);
    expect(failThenSucceed).toHaveBeenCalledTimes(2);
  });

  it("returns error after exhausting retries", async () => {
    const alwaysFail = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      statusText: "Service Unavailable",
      text: () => Promise.resolve("down")
    });
    globalThis.fetch = alwaysFail;
    const client = createGeminiClient({ apiKey: "sk-test", model: "gemini-2.0-flash", maxRetries: 2, fetchFn: alwaysFail });
    const result = await client.discover({ prompt: "test" });
    expect(result.valid).toBe(false);
    expect(alwaysFail).toHaveBeenCalledTimes(3); // initial + 2 retries
  });

  it("respects request timeout", async () => {
    // A fetch that doesn't respond within the timeout — the first call blocks
    // forever; with a 50ms timeout and 30s test timeout, it should abort fast.
    // (The retry also hits the same never-resolving fetch, so the whole thing
    // should complete within a few hundred ms.)
    let signalRef = null;
    const neverResolve = vi.fn().mockImplementation((url, opts) => {
      signalRef = opts?.signal || null;
      return new Promise((resolve, reject) => {
        // When aborted, reject with AbortError
        if (opts?.signal) {
          opts.signal.onabort = () => reject(new DOMException("aborted", "AbortError"));
        }
      });
    });
    globalThis.fetch = neverResolve;
    const client = createGeminiClient({ apiKey: "sk-test", model: "gemini-2.0-flash", timeoutMs: 100, maxRetries: 0, fetchFn: neverResolve });
    const result = await client.discover({ prompt: "test" });
    expect(result.valid).toBe(false);
    expect(result.error).toBeTruthy();
    // The signal should have been set (AbortController was passed)
    expect(signalRef).toBeTruthy();
    expect(signalRef?.aborted).toBe(true);
  }, 10000);

  it("handles malformed response (missing candidates)", async () => {
    globalThis.fetch = mockFetchMalformed({});
    const client = createGeminiClient({ apiKey: "sk-test", model: "gemini-2.0-flash", fetchFn: globalThis.fetch });
    const result = await client.discover({ prompt: "test" });
    expect(result.valid).toBe(false);
  });

  it("handles empty candidates array", async () => {
    globalThis.fetch = mockFetchMalformed({ candidates: [] });
    const client = createGeminiClient({ apiKey: "sk-test", model: "gemini-2.0-flash", fetchFn: globalThis.fetch });
    const result = await client.discover({ prompt: "test" });
    expect(result.valid).toBe(false);
  });

  it("handles fetch rejection (network error)", async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error("fetch failed"));
    const client = createGeminiClient({ apiKey: "sk-test", model: "gemini-2.0-flash", fetchFn: globalThis.fetch });
    const result = await client.discover({ prompt: "test" });
    expect(result.valid).toBe(false);
  });
});
