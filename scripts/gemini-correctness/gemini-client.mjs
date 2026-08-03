// =============================================================================
// gemini-client.mjs — Gemini REST API client for correctness discovery
// =============================================================================
//
// A thin, focused adapter around the Gemini REST API (no official SDK).  It
// provides a `discover()` method that sends a prompt and returns a validated
// finding or no-finding result.
//
// Key design decisions:
//   - Uses the same REST endpoint / auth pattern as ai-translate-content.mjs
//     (query-param API key, responseMimeType: application/json).
//   - No shell access, no network beyond the Gemini API.
//   - API key is passed via constructor and NEVER included in log/error/artifact
//     output.  Error messages truncate response bodies and redact the key from
//     any URL references.
//   - Built-in timeout (AbortController), finite retries with exponential
//     backoff, and machine-readable status codes for quota/5xx/invalid.
//   - Tests use a fake fetchFn so no real API call is ever made.
// =============================================================================

import { validateFinding } from "./finding-schema.mjs";

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------
const DEFAULT_TIMEOUT_MS = 30_000;
const DEFAULT_MAX_RETRIES = 2;
const DEFAULT_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";

// HTTP status codes that are considered retryable
const RETRYABLE_STATUSES = [429, 500, 502, 503, 504];

// ---------------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------------
function isFinitePositiveInt(value) {
  return typeof value === "number" && Number.isFinite(value) && Number.isInteger(value);
}

function validateClientOptions(options) {
  if ("timeoutMs" in options) {
    if (!isFinitePositiveInt(options.timeoutMs) || options.timeoutMs < 1) {
      throw new Error(`timeoutMs must be a positive integer >= 1; got ${JSON.stringify(options.timeoutMs)}`);
    }
  }
  if ("maxRetries" in options) {
    if (!isFinitePositiveInt(options.maxRetries) || options.maxRetries < 0) {
      throw new Error(`maxRetries must be a non-negative integer; got ${JSON.stringify(options.maxRetries)}`);
    }
  }
}

// ---------------------------------------------------------------------------
// Redact the API key from a string (safe to log/artifact)
// ---------------------------------------------------------------------------
function redactApiKey(text, replacement) {
  if (!text || !replacement) return text || "";
  const rep = replacement;
  // Redact the key when it appears after "key=" in a URL
  const urlKeyRe = new RegExp(`key=${escapeRegex(rep)}(?:&|$|\\s)`, "g");
  let result = text.replace(urlKeyRe, "key=REDACTED ");
  // Also redact bare occurrences of the key itself (e.g. in error bodies)
  const bareKeyRe = new RegExp(escapeRegex(rep), "g");
  result = result.replace(bareKeyRe, "REDACTED");
  return result;
}

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// ---------------------------------------------------------------------------
// createGeminiClient
// ---------------------------------------------------------------------------
export function createGeminiClient(options = {}) {
  validateClientOptions(options);

  // apiKey lookup order:
  //   1. If explicitly passed (even null/empty), use that value — don't fall back.
  //   2. If omitted (undefined), fall back to env var.
  const hasExplicitKey = "apiKey" in options;
  const apiKey = hasExplicitKey ? options.apiKey : process.env.GEMINI_API_KEY;
  if (!apiKey || typeof apiKey !== "string" || apiKey.trim() === "") {
    throw new Error(
      "GEMINI_API_KEY is required (pass `apiKey` or set the GEMINI_API_KEY env var)"
    );
  }

  const model = options.model;
  if (!model || typeof model !== "string" || model.trim() === "") {
    throw new Error(
      "model is required (pass `model` option or `--model` CLI arg; see prompt-builder.mjs for DEFAULT_MODEL)"
    );
  }
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const maxRetries = options.maxRetries ?? DEFAULT_MAX_RETRIES;
  const baseUrl = options.baseUrl ?? DEFAULT_BASE_URL;
  const fetchFn = options.fetchFn ?? globalThis.fetch;

  // Build the request URL once; the key is in the query param, so we
  // NEVER log `url` directly — only the model name and a redacted URL.
  const requestUrl = `${baseUrl}/${model}:generateContent?key=${apiKey}`;

  // ---------------------------------------------------------------------------
  // coreApiCall — single attempt with timeout
  // ---------------------------------------------------------------------------
  async function coreApiCall(prompt) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetchFn(requestUrl, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0,
            responseMimeType: "application/json"
          }
        }),
        signal: controller.signal
      });

      if (!res.ok) {
        const body = await res.text().catch(() => "");
        // Never include the raw body in error output — redact API key
        const safeBody = redactApiKey(body || res.statusText, apiKey).slice(0, 200);
        const status = res.status === 429 ? "rate-limited" : "api-error";
        return {
          ok: false,
          status,
          error: `Gemini HTTP ${res.status}: ${safeBody}`,
          httpStatus: res.status
        };
      }

      let data;
      try {
        data = await res.json();
      } catch {
        return {
          ok: false,
          status: "invalid-response",
          error: "Gemini returned a response body that was not valid JSON"
        };
      }
      const text =
        data?.candidates?.[0]?.content?.parts
          ?.map((p) => p.text)
          .join("") ?? "";
      if (!text) {
        return { ok: false, status: "invalid-response", error: "Gemini returned empty response (no candidates or no text)" };
      }

      return { ok: true, text };
    } catch (err) {
      if (err.name === "AbortError") {
        return { ok: false, status: "timeout", error: `Gemini request timed out after ${timeoutMs}ms` };
      }
      // Redact any potential key references in error messages
      const safeMessage = redactApiKey(err.message || String(err), apiKey);
      return { ok: false, status: "network-error", error: `Gemini request failed: ${safeMessage}` };
    } finally {
      clearTimeout(timer);
    }
  }

  // ---------------------------------------------------------------------------
  // generateJson — shared retry loop + strict JSON transport
  // ---------------------------------------------------------------------------
  async function generateJson({ prompt } = {}) {
    if (!prompt || typeof prompt !== "string") {
      return { valid: false, error: "prompt is required" };
    }

    let lastError = null;

    // Retry loop (initial attempt + maxRetries retries)
    const totalAttempts = maxRetries + 1;

    for (let attempt = 0; attempt < totalAttempts; attempt++) {
      if (attempt > 0) {
        // Exponential backoff: 1s, 2s, 4s... (base 1s, doubled each retry)
        const backoffMs = Math.min(1000 * Math.pow(2, attempt - 1), 30_000);
        await new Promise((r) => setTimeout(r, backoffMs));
      }

      const apiResult = await coreApiCall(prompt);

      if (!apiResult.ok) {
        lastError = apiResult;

        // Timeout and network errors are retryable
        if (apiResult.status === "network-error" || apiResult.status === "timeout") {
          continue;
        }
        if (apiResult.status === "api-error" && apiResult.httpStatus && !RETRYABLE_STATUSES.includes(apiResult.httpStatus)) {
          // Non-retryable HTTP error (e.g. 400, 401, 403)
          break;
        }
        // 429 / 5xx: continue retrying
        continue;
      }

      // Parse JSON from the raw text
      let parsed;
      try {
        parsed = JSON.parse(apiResult.text);
      } catch {
        lastError = { ok: false, status: "invalid-response", error: "Gemini returned non-JSON response" };
        continue; // retry on parse failure (transient formatting issue)
      }

      return { valid: true, result: parsed };
    }

    // All attempts exhausted or non-retryable error
    const status = lastError?.status ?? "unknown";
    const error = lastError?.error ?? "Unknown error";

    return { valid: false, error, status };
  }

  // ---------------------------------------------------------------------------
  // discover — discovery-specific schema validation over the shared transport
  // ---------------------------------------------------------------------------
  async function discover({ prompt, validationOptions } = {}) {
    const generated = await generateJson({ prompt });
    if (!generated.valid) return generated;

    let validation;
    try {
      validation = validateFinding(generated.result, validationOptions ?? {});
    } catch {
      return {
        valid: false,
        status: "invalid-response",
        error: "Schema validator threw unexpectedly"
      };
    }
    if (validation.valid) return validation;
    return {
      valid: false,
      status: "invalid-response",
      error: `Schema validation failed: ${redactApiKey(validation.error || "", apiKey)}`
    };
  }

  return { discover, generateJson };
}
