"use client";

import { useNowSec } from "@/lib/useNowSec";

type Props = {
  targetSec: number | bigint;
  label?: string;
  expiredLabel?: string;
  className?: string;
};

export function CountdownPill({
  targetSec,
  label = "deadline",
  expiredLabel = "expired",
  className = "",
}: Props) {
  const nowSec = useNowSec();
  const target = typeof targetSec === "bigint" ? Number(targetSec) : targetSec;
  if (nowSec === 0) {
    return (
      <span className={`inline-flex items-center rounded border border-cyan/30 bg-carbon px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-silver ${className}`}>
        {label}
      </span>
    );
  }
  const diff = target - nowSec;
  const expired = diff <= 0;
  const display = expired ? expiredLabel : formatDiff(diff);
  return (
    <span
      className={`inline-flex items-center rounded border bg-carbon px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest ${
        expired ? "border-magenta/40 text-magenta" : "border-cyan/30 text-cyan"
      } ${className}`}
    >
      {label} {display}
    </span>
  );
}

function formatDiff(diff: number): string {
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}
