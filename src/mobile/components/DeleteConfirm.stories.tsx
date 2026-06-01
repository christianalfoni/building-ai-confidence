import { DeleteConfirm } from "../ui-components/DeleteConfirm";

// onConfirm is never triggered by these snapshots — they seed `initialStatus`
// directly to render each visual state in isolation.
const noop = () => new Promise<void>(() => {});

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-terminal px-4 py-6">
      <div className="flex items-center justify-end">{children}</div>
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
