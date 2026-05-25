type Props = { value: number; max?: number; label?: string; className?: string };

export function ProgressBar({ value, max = 100, label, className = "" }: Props) {
  const pct = max === 0 ? 0 : Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className={`w-full ${className}`}>
      {label && (
        <div className="mb-1 flex justify-between font-mono text-[10px] uppercase tracking-widest text-silver">
          <span>{label}</span>
          <span>{pct.toFixed(0)}%</span>
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        className="h-2 overflow-hidden rounded-full bg-carbon"
      >
        <div className="h-full bg-toxic glow-toxic transition-[width]" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
