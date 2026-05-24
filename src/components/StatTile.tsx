import type { ReactNode } from "react";

type Props = { label: string; value: ReactNode; hint?: ReactNode; className?: string };

export function StatTile({ label, value, hint, className = "" }: Props) {
  return (
    <div className={`rounded-lg border border-cyan/20 bg-carbon px-5 py-6 ${className}`}>
      <div className="font-mono text-[10px] uppercase tracking-widest text-silver">{label}</div>
      <div className="mt-2 font-display text-2xl font-bold tabular-nums text-snow md:text-3xl">{value}</div>
      {hint && <div className="mt-2 font-mono text-xs text-silver/80">{hint}</div>}
    </div>
  );
}
