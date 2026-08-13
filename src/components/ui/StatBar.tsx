export function StatBar({ label, value, max = 100, colorClass = "bg-accent-gold" }: { label: string; value: number; max?: number; colorClass?: string }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between text-xs text-muted">
        <span>{label}</span>
        <span className="font-mono text-foreground">{Math.round(value)}</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
        <div className={`h-full rounded-full ${colorClass}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
