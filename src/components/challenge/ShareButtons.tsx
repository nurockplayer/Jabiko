import { useState } from "react";
import { AtSign, Facebook, MessageCircle, Share2 } from "lucide-react";
import { copy, type Language } from "../../i18n";
import {
  SHARE_URL,
  composeMessage,
  facebookShareUrl,
  lineShareUrl,
  threadsShareUrl
} from "../../domain/share";

// One-tap share panel (Facebook / Threads / LINE / native sheet) to drive
// word-of-mouth reach. Reused in two places: the 戰報 (share the session
// result) and the home footer (share the site). The caller passes the body
// `text`; this component appends the site URL and wires the platform actions.
export function ShareButtons({
  language,
  text,
  title
}: {
  language: Language;
  /** The share body (without the URL); the URL is appended here. */
  text: string;
  /** Panel heading; defaults to 分享成績. */
  title?: string;
}) {
  const t = copy[language];
  const [copied, setCopied] = useState(false);
  const heading = title ?? t.shareTitle;
  const message = composeMessage(text);

  const flagCopied = () => {
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2500);
  };
  const openWin = (url: string) => window.open(url, "_blank", "noopener,noreferrer");
  const copyText = async () => {
    try {
      await navigator.clipboard?.writeText(message);
      flagCopied();
    } catch {
      // clipboard blocked (insecure context / permissions) — open share anyway
    }
  };

  const onFacebook = async () => {
    // FB sharer can't prefill post text, so copy it for the user to paste.
    await copyText();
    openWin(facebookShareUrl());
  };
  const onThreads = () => openWin(threadsShareUrl(message));
  const onLine = () => openWin(lineShareUrl(message));
  const onOther = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ text, url: SHARE_URL });
        return;
      } catch {
        // user cancelled or share failed — fall through to clipboard
      }
    }
    await copyText();
  };

  return (
    <div className="share-panel" aria-label={heading}>
      <p className="share-title">{heading}</p>
      <div className="share-row">
        <button type="button" className="share-btn" onClick={onFacebook} aria-label="Facebook">
          <Facebook aria-hidden="true" />
        </button>
        <button type="button" className="share-btn" onClick={onThreads} aria-label="Threads">
          <AtSign aria-hidden="true" />
        </button>
        <button type="button" className="share-btn" onClick={onLine} aria-label="LINE">
          <MessageCircle aria-hidden="true" />
        </button>
        <button type="button" className="share-btn" onClick={onOther} aria-label={t.shareOther}>
          <Share2 aria-hidden="true" />
        </button>
      </div>
      {copied ? (
        <span className="share-copied-toast" aria-live="polite">{t.shareCopied}</span>
      ) : null}
    </div>
  );
}
