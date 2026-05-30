export function Tag({ label }: { label: string }) {
  return (
    <span className="text-sm text-green bg-green/10 px-2 py-1 rounded font-mono">
      #{label}
    </span>
  );
}
