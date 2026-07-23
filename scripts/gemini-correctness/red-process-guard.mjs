// Trusted Node preload used by the RED runner. It emits marker-only diagnostics
// for process-level failures without serializing rejected values or secrets.

const UNHANDLED_REJECTION_MARKER = "JABIKO_RED_UNHANDLED_REJECTION";
const UNCAUGHT_EXCEPTION_MARKER = "JABIKO_RED_UNCAUGHT_EXCEPTION";

process.prependListener("unhandledRejection", () => {
  process.stderr.write(`${UNHANDLED_REJECTION_MARKER}\n`);
});

process.prependListener("uncaughtExceptionMonitor", () => {
  process.stderr.write(`${UNCAUGHT_EXCEPTION_MARKER}\n`);
});
