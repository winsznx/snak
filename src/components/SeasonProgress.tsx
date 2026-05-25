import { ProgressBar } from "./ProgressBar";
import { CountdownPill } from "./CountdownPill";

type Props = {
  startedAt: number | bigint;
  endsAt: number | bigint;
  className?: string;
};

/**
 * Two-line season header: progress bar from start→end plus a live countdown.
 * Driven entirely by props so it stays cheap to render high in the tree.
 */
export function SeasonProgress({ startedAt, endsAt, className = "" }: Props) {
  const start = Number(startedAt);
  const end = Number(endsAt);
  const now = Math.floor(Date.now() / 1000);
  const pct = end <= start ? 0 : Math.max(0, Math.min(100, ((now - start) / (end - start)) * 100));
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-widest text-silver">
        <span>season</span>
        <CountdownPill targetSec={end} label="ends" />
      </div>
      <ProgressBar value={pct} max={100} />
    </div>
  );
}
