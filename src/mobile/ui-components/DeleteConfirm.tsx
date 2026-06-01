import { useState } from "react";

type Status = "idle" | "confirm" | "deleting" | "error";

// Inline, touch-friendly destructive confirm. Generic — knows nothing about
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
        type="button"
        onClick={() => setStatus("confirm")}
        className="text-sm text-muted font-mono active:text-red"
      >
        delete
      </button>
    );
  }

  if (status === "deleting") {
    return <span className="text-sm text-dim font-mono">deleting…</span>;
  }

  return (
    <div className="flex items-center gap-3 text-sm font-mono">
      <span className={status === "error" ? "text-red" : "text-muted"}>
        {status === "error" ? "delete failed" : confirmMessage}
      </span>
      <button type="button" onClick={handleConfirm} className="text-red active:text-red/70">
        yes
      </button>
      <button type="button" onClick={() => setStatus("idle")} className="text-muted active:text-text">
        no
      </button>
    </div>
  );
}
