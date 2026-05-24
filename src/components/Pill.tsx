import type { ReactNode } from "react";

type Tone = "cyan" | "magenta" | "toxic" | "amber" | "silver";

const TONES: Record<Tone, string> = {
  cyan: "border-cyan/40 text-cyan",
  magenta: "border-magenta/50 text-magenta",
  toxic: "border-toxic/40 text-toxic",
  amber: "border-amber/40 text-amber",
  silver: "border-silver/30 text-silver",
};

export function Pill({
  children,
  tone = "cyan",
  className = "",
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded border bg-carbon/80 px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest ${TONES[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
