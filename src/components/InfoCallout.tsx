import type { ReactNode } from "react";

type Tone = "cyan" | "magenta" | "toxic" | "amber";

const TONES: Record<Tone, { border: string; bg: string; fg: string; glyph: string }> = {
  cyan: { border: "border-cyan/40", bg: "bg-cyan/10", fg: "text-cyan", glyph: "ⓘ" },
  magenta: { border: "border-magenta/40", bg: "bg-magenta/10", fg: "text-magenta", glyph: "⚠" },
  toxic: { border: "border-toxic/40", bg: "bg-toxic/10", fg: "text-toxic", glyph: "✓" },
  amber: { border: "border-amber/40", bg: "bg-amber/10", fg: "text-amber", glyph: "▲" },
};

type Props = { tone?: Tone; title?: string; children: ReactNode; className?: string };

export function InfoCallout({ tone = "cyan", title, children, className = "" }: Props) {
  const t = TONES[tone];
  return (
    <div className={`flex gap-3 rounded border px-4 py-3 ${t.border} ${t.bg} ${t.fg} ${className}`}>
      <span aria-hidden className="text-base leading-none">{t.glyph}</span>
      <div className="text-sm">
        {title && <div className="font-mono uppercase tracking-widest text-xs">{title}</div>}
        <div className={title ? "mt-0.5 opacity-90" : ""}>{children}</div>
      </div>
    </div>
  );
}
