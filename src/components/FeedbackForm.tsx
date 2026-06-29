import { useEffect, useState, type FormEvent } from "react";
import { Send, X } from "lucide-react";
import { copy, type Language } from "../i18n";
import { getSupabase } from "../lib/supabase";
import {
  submitFeedback,
  CONTACT_MAX,
  FEEDBACK_MAX,
  type FeedbackCategory,
  type FeedbackInput
} from "../domain/feedbackRemote";

// Anonymous feedback form (#218 follow-up). A small in-app "suggestion box":
// pick a kind (許願 / 問題 / 其他), type a message, optionally leave a contact,
// submit anonymously to Supabase (no login). On failure (e.g. table not
// migrated yet, or Supabase unconfigured) it falls back to opening a GitHub
// issue. `submit` is injectable so the UI can be tested without Supabase.

const ISSUE_NEW = "https://github.com/nurockplayer/Jabiko/issues/new";
const GH_FALLBACK: Record<FeedbackCategory, string> = {
  wish: `${ISSUE_NEW}?labels=enhancement&title=${encodeURIComponent("[許願] ")}`,
  bug: `${ISSUE_NEW}?labels=bug&title=${encodeURIComponent("[Bug] ")}`,
  other: ISSUE_NEW
};

async function defaultSubmit(input: FeedbackInput): Promise<void> {
  const client = await getSupabase();
  await submitFeedback(client, input);
}

type Status = "idle" | "sending" | "done" | "error";

const KINDS: FeedbackCategory[] = ["wish", "bug", "other"];

export function FeedbackForm({
  language,
  category,
  context,
  onClose,
  submit = defaultSubmit
}: {
  language: Language;
  category: FeedbackCategory;
  /** Optional report context (e.g. the question id) — shown to the learner and
   *  folded into the submitted message so the owner can identify the item. */
  context?: string;
  onClose: () => void;
  submit?: (input: FeedbackInput) => Promise<void>;
}) {
  const t = copy[language];
  const [kind, setKind] = useState<FeedbackCategory>(category);
  const [message, setMessage] = useState("");
  const [contact, setContact] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  const trimmed = message.trim();

  // Modal behaviour: Escape closes, and the background page is locked from
  // scrolling while open (the form pops centered over the viewport so the
  // learner never has to scroll down to find it).
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  const stopClose = (event: { stopPropagation: () => void }) => event.stopPropagation();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!trimmed || status === "sending") return;
    setStatus("sending");
    const fullMessage = context ? `${trimmed}\n\n— ${context}` : trimmed;
    try {
      await submit({ category: kind, message: fullMessage, contact: contact.trim() || undefined });
      setStatus("done");
    } catch {
      setStatus("error");
    }
  };

  if (status === "done") {
    return (
      <div className="feedback-overlay" role="presentation" onClick={onClose}>
        <div
          className="feedback-form feedback-done"
          role="dialog"
          aria-modal="true"
          aria-label={t.feedbackTitle}
          onClick={stopClose}
        >
          <p>{t.feedbackThanks}</p>
          <button type="button" className="ghost-button" onClick={onClose}>
            {t.feedbackClose}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="feedback-overlay" role="presentation" onClick={onClose}>
      <form
        className="feedback-form"
        role="dialog"
        aria-modal="true"
        onSubmit={handleSubmit}
        aria-label={t.feedbackTitle}
        onClick={stopClose}
      >
      <div className="feedback-head">
        <strong>{t.feedbackTitle}</strong>
        <button type="button" className="feedback-close" aria-label={t.feedbackClose} onClick={onClose}>
          <X aria-hidden="true" />
        </button>
      </div>

      <div className="segmented feedback-kind">
        {KINDS.map((option) => (
          <button
            key={option}
            type="button"
            className={kind === option ? "selected" : ""}
            aria-pressed={kind === option}
            onClick={() => setKind(option)}
          >
            {t.feedbackKind[option]}
          </button>
        ))}
      </div>

      {context ? (
        <p className="feedback-context">
          {t.feedbackContextLabel}
          <span>{context}</span>
        </p>
      ) : null}

      <textarea
        className="feedback-message"
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        placeholder={t.feedbackPlaceholder}
        rows={4}
        maxLength={FEEDBACK_MAX}
        aria-label={t.feedbackTitle}
      />
      <input
        className="feedback-contact"
        type="text"
        value={contact}
        onChange={(event) => setContact(event.target.value)}
        placeholder={t.feedbackContact}
        maxLength={CONTACT_MAX}
      />
      <p className="feedback-anon">{t.feedbackAnon}</p>

      {status === "error" ? (
        <p className="feedback-error" role="alert">
          {t.feedbackError}{" "}
          <a href={GH_FALLBACK[kind]} target="_blank" rel="noopener noreferrer">
            {t.feedbackFallback}
          </a>
        </p>
      ) : null}

      <div className="feedback-actions">
        <button type="submit" className="next-button" disabled={!trimmed || status === "sending"}>
          <Send aria-hidden="true" />
          {status === "sending" ? t.feedbackSending : t.feedbackSend}
        </button>
      </div>
      </form>
    </div>
  );
}
