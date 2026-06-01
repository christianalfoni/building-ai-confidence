import { useState } from "react";

type Status = "idle" | "confirm" | "deleting" | "error";

// Inline, terminal-styled destructive confirm. Generic — knows nothing about
// posts; the caller supplies what to delete via `onConfirm`. On success the
// caller is expected to navigate away, so the disabled "deleting…" state simply
// persists until the page unloads.
export function DeleteConfirm({
  confirmMessage = "delete this?",
  onConfirm,
  initialStatus = "idle",
}: {
  confirmMessage?: string;
  onConfirm: () => Promise<void>;
  // Seeds the starting state — used by stories/tests to render each visual
  // state in isolation. Defaults to the normal idle entry point.
  initialStatus?: Status;
}) {
  const [status, setStatus] = useState<Status>(initialStatus);

  async function handleConfirm() {
    setStatus("deleting");
    try {
      await onConfirm();
    } catch {
      setStatus("error");
    }
  }

  if (status === "idle") {
    return (
      <button
        onClick={() => setStatus("confirm")}
        className="text-muted hover:text-red transition-colors cursor-pointer"
      >
        delete
      </button>
    );
  }

  if (status === "deleting") {
    return <span className="text-dim">deleting…</span>;
  }

  return (
    <span className="flex items-center gap-2">
      <span className={status === "error" ? "text-red" : "text-muted"}>
        {status === "error" ? "delete failed — try again" : confirmMessage}
      </span>
      <button
        onClick={handleConfirm}
        className="text-red hover:text-red/80 transition-colors cursor-pointer underline underline-offset-2"
      >
        yes
      </button>
      <button
        onClick={() => setStatus("idle")}
        className="text-muted hover:text-text transition-colors cursor-pointer underline underline-offset-2"
      >
        no
      </button>
    </span>
  );
}
