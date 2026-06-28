// Social-share URL builders for the score report's 「分享成績」 panel.
//
// Pure string helpers (no DOM) so they're unit-testable; the ShareButtons
// component handles the side effects (clipboard, window.open, navigator.share).
//
// Platform notes:
//   - Facebook: sharer.php no longer prefills post text (the `quote` param was
//     dropped), so we open it with just the URL (OG card) and copy the result
//     text to the clipboard for the user to paste.
//   - Threads: the intent endpoint DOES prefill text.
//   - LINE: the msg/text deep link prefills a message (text incl. the URL).

export const SHARE_URL = "https://jabiko.pages.dev/";

/** Result message + the site URL on its own line (used for clipboard / text intents). */
export function composeMessage(text: string, url: string = SHARE_URL): string {
  return `${text}\n${url}`;
}

/** Threads intent post with the message prefilled. */
export function threadsShareUrl(message: string): string {
  return `https://www.threads.net/intent/post?text=${encodeURIComponent(message)}`;
}

/** LINE message deep link carrying the message (text includes the URL). */
export function lineShareUrl(message: string): string {
  return `https://line.me/R/msg/text/?${encodeURIComponent(message)}`;
}

/** Facebook share dialog for the URL (post text is copied to the clipboard separately). */
export function facebookShareUrl(url: string = SHARE_URL): string {
  return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
}
