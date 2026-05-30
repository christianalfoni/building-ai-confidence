export function Tag({ label }: { label: string }) {
  return (
    <span className="text-xs text-green bg-green/10 px-1.5 py-0.5 rounded font-mono">
      #{label}
    </span>
  );
}
