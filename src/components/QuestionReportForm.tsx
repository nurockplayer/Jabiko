import { useEffect, useState, type FormEvent } from "react";
import { Send, X } from "lucide-react";
import { copy, type Language } from "../i18n";
import { getSupabase } from "../lib/supabase";
import { submitFeedback, FEEDBACK_MAX, type FeedbackInput } from "../domain/feedbackRemote";
import { buildQuestionReportMessage, type ReportReason } from "../domain/questionReport";
import type { PracticeQuestion } from "../domain/types";

// Per-question "report this question" modal (#299). Mirrors FeedbackForm
// (overlay, Escape-to-close, body-scroll lock, idle/sending/done/error states,
// GitHub fallback link on failure). It collects a reason + optional detail and
// submits through the SAME anonymous feedback pipeline as a "bug" -- no new
// Supabase category, no schema change -- with all question context packed into
// the message by buildQuestionReportMessage. `submit` is injectable for tests.

// Reuse the bug-category GitHub issue URL as the failure fallback, matching the
// pattern in FeedbackForm.
const ISSUE_NEW = "https://github.com/nurockplayer/Jabiko/issues/new";
const GH_FALLBACK_BUG = `${ISSUE_NEW}?labels=bug&title=${encodeURIComponent("[Bug] ")}`;

async function defaultSubmit(input: FeedbackInput): Promise<void> {
  const client = await getSupabase();
  await submitFeedback(client, input);
}

type Status = "idle" | "sending" | "done" | "error";

const REASONS: ReportReason[] = [
  "wrongAnswer",
  "awkwardMeaning",
  "confusingExplanation",
  "typo",
  "other"
];

export function QuestionReportForm({
  question,
  selectedAnswer,
  language,
  onClose,
  submit = defaultSubmit
}: {
  question: PracticeQuestion;
  selectedAnswer: string | null;
  language: Language;
  onClose: () => void;
  submit?: (input: FeedbackInput) => Promise<void>;
}) {
  const t = copy[language];
  const [reason, setReason] = useState<ReportReason>("wrongAnswer");
  const [detail, setDetail] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  // Modal behaviour: Escape closes, and the background page is locked from
  // scrolling while open -- same contract as FeedbackForm.
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
    if (status === "sending") return;
    setStatus("sending");
    try {
      const message = buildQuestionReportMessage({
        question,
        reason,
        detail: detail.trim() || undefined,
        language,
        selectedAnswer
      });
      await submit({ category: "bug", message });
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
          aria-label={t.reportTitle}
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
        aria-label={t.reportTitle}
        onClick={stopClose}
      >
        <div className="feedback-head">
          <strong>{t.reportTitle}</strong>
          <button
            type="button"
            className="feedback-close"
            aria-label={t.feedbackClose}
            onClick={onClose}
          >
            <X aria-hidden="true" />
          </button>
        </div>

        <p className="report-reason-label">{t.reportReasonLabel}</p>
        <div className="segmented report-reasons">
          {REASONS.map((option) => (
            <button
              key={option}
              type="button"
              className={reason === option ? "selected" : ""}
              aria-pressed={reason === option}
              onClick={() => setReason(option)}
            >
              {t.reportReasons[option]}
            </button>
          ))}
        </div>

        <textarea
          className="feedback-message"
          value={detail}
          onChange={(event) => setDetail(event.target.value)}
          placeholder={t.reportDetailPlaceholder}
          rows={4}
          maxLength={FEEDBACK_MAX}
          aria-label={t.reportTitle}
        />
        <p className="feedback-anon">{t.feedbackAnon}</p>

        {status === "error" ? (
          <p className="feedback-error" role="alert">
            {t.feedbackError}{" "}
            <a href={GH_FALLBACK_BUG} target="_blank" rel="noopener noreferrer">
              {t.feedbackFallback}
            </a>
          </p>
        ) : null}

        <div className="feedback-actions">
          <button type="submit" className="next-button" disabled={status === "sending"}>
            <Send aria-hidden="true" />
            {status === "sending" ? t.feedbackSending : t.reportSend}
          </button>
        </div>
      </form>
    </div>
  );
}
