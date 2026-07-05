import { useEffect, useMemo, useState, type FormEvent } from "react";
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
  const [wantsReply, setWantsReply] = useState(false);
  const [status, setStatus] = useState<Status>("idle");

  // buildQuestionReportMessage prepends the structured question block (plus a
  // "detail:" prefix when there's free text) and then truncates `detail` to
  // whatever room is left under FEEDBACK_MAX. Cap the textarea to that REAL
  // remaining budget so the user can never type a detail that gets silently
  // dropped. Probe with a one-char detail so the prefix's cost is included;
  // budget = FEEDBACK_MAX - (probe length - 1). Recomputed when the
  // question/reason/etc change, since the structured block length depends on them.
  const detailBudget = useMemo(() => {
    const probeLength = buildQuestionReportMessage({
      question,
      reason,
      detail: "x",
      language,
      selectedAnswer
    }).length;
    return Math.max(0, FEEDBACK_MAX - (probeLength - 1));
  }, [question, reason, language, selectedAnswer]);

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
      await submit({ category: "bug", message, wantsReply });
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
          maxLength={detailBudget}
          aria-label={t.reportTitle}
        />
        <p className="feedback-char-remaining" aria-live="polite">
          {Math.max(0, detailBudget - detail.length)}
        </p>
        <label className="feedback-reply">
          <input
            type="checkbox"
            checked={wantsReply}
            onChange={(event) => setWantsReply(event.target.checked)}
          />
          {t.feedbackWantsReply}
        </label>
        {wantsReply ? <p className="feedback-reply-hint">{t.feedbackWantsReplyHint}</p> : null}
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
