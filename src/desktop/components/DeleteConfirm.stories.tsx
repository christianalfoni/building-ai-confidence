import { DeleteConfirm } from "../ui-components/DeleteConfirm";

// onConfirm is never triggered by these snapshots — they seed `initialStatus`
// directly to render each visual state in isolation.
const noop = () => new Promise<void>(() => {});

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-terminal p-8 font-mono text-sm">
      <div className="border-t border-border pt-3 flex items-center justify-end gap-4 text-xs">
        {children}
        <span className="text-dim">q to go back</span>
      </div>
    </div>
  );
}

export function idle() {
  return {
    element: (
      <Frame>
        <DeleteConfirm confirmMessage="delete this post?" onConfirm={noop} initialStatus="idle" />
      </Frame>
    ),
  };
}

export function confirm() {
  return {
    element: (
      <Frame>
        <DeleteConfirm confirmMessage="delete this post?" onConfirm={noop} initialStatus="confirm" />
      </Frame>
    ),
  };
}

export function deleting() {
  return {
    element: (
      <Frame>
        <DeleteConfirm confirmMessage="delete this post?" onConfirm={noop} initialStatus="deleting" />
      </Frame>
    ),
  };
}

export function error() {
  return {
    element: (
      <Frame>
        <DeleteConfirm confirmMessage="delete this post?" onConfirm={noop} initialStatus="error" />
      </Frame>
    ),
  };
}
