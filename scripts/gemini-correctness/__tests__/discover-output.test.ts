// @ts-expect-error -- plain .mjs module, no types
import { describe, expect, it } from "vitest";
// @ts-expect-error -- plain .mjs module, no types
import { redactForOutput } from "../discover.mjs";

describe("discover output redaction", () => {
  it("deep-redacts the exact API key even when it is not AIza-shaped", () => {
    const apiKey = "test-nonstandard-secret-key";
    const result = redactForOutput({
      valid: false,
      error: `request failed with ${apiKey}`,
      result: {
        title: `finding echoed ${apiKey}`,
        nested: [`artifact ${apiKey}`]
      }
    }, [apiKey]);

    expect(JSON.stringify(result)).not.toContain(apiKey);
    expect(JSON.stringify(result)).toContain("REDACTED_KEY");
  });
});
