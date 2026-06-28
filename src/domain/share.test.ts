import { describe, it, expect } from "vitest";
import {
  SHARE_URL,
  composeMessage,
  threadsShareUrl,
  lineShareUrl,
  facebookShareUrl
} from "./share";

describe("share", () => {
  it("appends the site URL to the message on its own line", () => {
    expect(composeMessage("やった！")).toBe(`やった！\n${SHARE_URL}`);
  });

  it("lets the URL be overridden", () => {
    expect(composeMessage("hi", "https://x.test/")).toBe("hi\nhttps://x.test/");
  });

  it("builds a Threads intent URL with the message URL-encoded", () => {
    const msg = composeMessage("正答率 80%");
    const u = threadsShareUrl(msg);
    expect(u.startsWith("https://www.threads.net/intent/post?text=")).toBe(true);
    expect(u).toContain(encodeURIComponent(msg));
    expect(u).not.toMatch(/\s/); // no raw whitespace
  });

  it("builds a LINE share deep link carrying the message", () => {
    const msg = composeMessage("テスト");
    const u = lineShareUrl(msg);
    expect(u.startsWith("https://line.me/R/msg/text/?")).toBe(true);
    expect(u).toContain(encodeURIComponent(msg));
  });

  it("builds a Facebook sharer URL pointing at the site (text is copied separately)", () => {
    const u = facebookShareUrl();
    expect(u.startsWith("https://www.facebook.com/sharer/sharer.php?u=")).toBe(true);
    expect(u).toContain(encodeURIComponent(SHARE_URL));
  });

  it("Facebook sharer accepts a custom url", () => {
    expect(facebookShareUrl("https://x.test/")).toContain(encodeURIComponent("https://x.test/"));
  });
});
