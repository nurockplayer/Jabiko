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

// 「分享成績」 panel under the 戰報 (ScoreReport): one-tap share of the session
// result to Facebook / Threads / LINE / the native share sheet. Drives
// word-of-mouth reach. Lives in the lazy challenge chunk (imported only via
// ScoreReport), so the share helpers never touch the eager home bundle.
export function ShareButtons({
  language,
  attempts,
  accuracy
}: {
  language: Language;
  attempts: number;
  accuracy: number;
}) {
  const t = copy[language];
  const [copied, setCopied] = useState(false);
  const message = composeMessage(t.shareText(attempts, accuracy));

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
        await navigator.share({ text: t.shareText(attempts, accuracy), url: SHARE_URL });
        return;
      } catch {
        // user cancelled or share failed — fall through to clipboard
      }
    }
    await copyText();
  };

  return (
    <div className="share-panel" aria-label={t.shareTitle}>
      <p className="share-title">{t.shareTitle}</p>

      <button type="button" className="share-btn share-fb" onClick={onFacebook}>
        <Facebook aria-hidden="true" />
        Facebook
      </button>
      <p className="share-fb-hint">{copied ? t.shareCopied : t.shareFbHint}</p>

      <button type="button" className="share-btn share-threads" onClick={onThreads}>
        <AtSign aria-hidden="true" />
        Threads
      </button>
      <button type="button" className="share-btn share-line" onClick={onLine}>
        <MessageCircle aria-hidden="true" />
        LINE
      </button>
      <button type="button" className="share-btn share-other" onClick={onOther}>
        <Share2 aria-hidden="true" />
        {t.shareOther}
      </button>
    </div>
  );
}
