import type { ReactNode } from "react";

type Tone = "ok" | "err" | "info" | "warn";

const TONES: Record<Tone, string> = {
  ok: "text-toxic",
  err: "text-magenta",
  info: "text-cyan",
  warn: "text-amber",
};

const PREFIX: Record<Tone, string> = {
  ok: "▸",
  err: "✗",
  info: "ⓘ",
  warn: "▲",
};

type Props = { tone?: Tone; children: ReactNode; className?: string };

/**
 * Single-line "console output" row. Used in the play-side panels to echo
 * tx state in a way that matches the terminal aesthetic.
 */
export function ConsoleLine({ tone = "info", children, className = "" }: Props) {
  return (
    <div className={`flex gap-2 font-mono text-[11px] uppercase tracking-widest ${TONES[tone]} ${className}`}>
      <span aria-hidden>{PREFIX[tone]}</span>
      <span>{children}</span>
    </div>
  );
}
