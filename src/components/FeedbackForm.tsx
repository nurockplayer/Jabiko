import { useContext, useEffect, useState, type FormEvent } from "react";
import { Send, X } from "lucide-react";
import { copy, type Language } from "../i18n";
import { getSupabase } from "../lib/supabase";
import { collectDiagnostics, type FeedbackDiagnostics } from "../domain/diagnostics";
import { FuriganaContext } from "./furiganaContext";
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

// GitHub fallback when the Supabase submit fails. The user's message and the
// (content-free) diagnostics are pre-filled into the issue BODY so nothing is
// lost and the user SEES exactly what will be sent before submitting (#654).
function githubFallbackUrl(kind: FeedbackCategory, message: string, diagnostics: FeedbackDiagnostics | null): string {
  const params = new URLSearchParams();
  if (kind === "wish") {
    params.set("labels", "enhancement");
    params.set("title", "[許願] ");
  } else if (kind === "bug") {
    params.set("labels", "bug");
    params.set("title", "[Bug] ");
  }
  const body = diagnostics
    ? `${message}\n\n---\ndiagnostics:\n${JSON.stringify(diagnostics, null, 2)}`
    : message;
  if (body.trim()) params.set("body", body);
  const qs = params.toString();
  return qs ? `${ISSUE_NEW}?${qs}` : ISSUE_NEW;
}

async function defaultSubmit(input: FeedbackInput): Promise<void> {
  const client = await getSupabase();
  await submitFeedback(client, input);
}

type Status = "idle" | "sending" | "done" | "error";

const KINDS: FeedbackCategory[] = ["wish", "bug", "other"];

export function FeedbackForm({
  language,
  category,
  onClose,
  submit = defaultSubmit,
  context
}: {
  language: Language;
  category: FeedbackCategory;
  onClose: () => void;
  submit?: (input: FeedbackInput) => Promise<void>;
  /** Practice-flow context (#654): the current question id + type, so a report
   *  sent mid-drill is locatable. Omitted outside the practice flow -- the
   *  diagnostics route still records which flow it was. */
  context?: { questionId?: string; promptLabel?: string };
}) {
  const t = copy[language];
  const { enabled: furiganaOn } = useContext(FuriganaContext);
  const [kind, setKind] = useState<FeedbackCategory>(category);
  const [message, setMessage] = useState("");
  const [contact, setContact] = useState("");
  const [wantsReply, setWantsReply] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  // Captured at submit time so the GitHub fallback can show what was attached.
  const [lastDiagnostics, setLastDiagnostics] = useState<FeedbackDiagnostics | null>(null);

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
    // Reproducibility diagnostics (#654) -- content-free by construction.
    const diagnostics = collectDiagnostics({
      locale: language,
      furigana: furiganaOn,
      questionId: context?.questionId,
      promptLabel: context?.promptLabel
    });
    setLastDiagnostics(diagnostics);
    try {
      await submit({
        category: kind,
        message: trimmed,
        contact: contact.trim() || undefined,
        wantsReply,
        diagnostics
      });
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

      <textarea
        className="feedback-message"
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        placeholder={t.feedbackPlaceholder}
        rows={4}
        maxLength={FEEDBACK_MAX}
        aria-label={t.feedbackTitle}
      />
      <label className="feedback-reply">
        <input
          type="checkbox"
          checked={wantsReply}
          onChange={(event) => setWantsReply(event.target.checked)}
        />
        {t.feedbackWantsReply}
      </label>
      {wantsReply ? <p className="feedback-reply-hint">{t.feedbackWantsReplyHint}</p> : null}
      <input
        className="feedback-contact"
        type="text"
        value={contact}
        onChange={(event) => setContact(event.target.value)}
        placeholder={t.feedbackContact}
        maxLength={CONTACT_MAX}
      />
      <p className="feedback-anon">{t.feedbackAnon}</p>
      <p className="feedback-anon feedback-diag-note">{t.feedbackDiagNote}</p>

      {status === "error" ? (
        <p className="feedback-error" role="alert">
          {t.feedbackError}{" "}
          <a
            href={githubFallbackUrl(kind, trimmed, lastDiagnostics)}
            target="_blank"
            rel="noopener noreferrer"
          >
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
