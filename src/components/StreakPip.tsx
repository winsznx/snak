import { useFlash } from "@/lib/useFlash";

type Props = {
  streak: number;
  className?: string;
};

const TIERS = [
  { at: 60, glow: "shadow-[0_0_18px_rgba(255,184,0,0.7)]", color: "text-amber" },
  { at: 21, glow: "shadow-[0_0_15px_rgba(255,45,120,0.6)]", color: "text-magenta" },
  { at: 7, glow: "shadow-[0_0_12px_rgba(0,229,255,0.6)]", color: "text-cyan" },
  { at: 0, glow: "", color: "text-silver" },
] as const;

export function StreakPip({ streak, className = "" }: Props) {
  const tier = TIERS.find((t) => streak >= t.at)!;
  const flash = useFlash(streak, 1000);
  return (
    <span
      className={`inline-flex items-center gap-1 rounded border border-current bg-carbon px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest transition ${tier.color} ${flash ? tier.glow : ""} ${className}`}
    >
      <span aria-hidden>⚡</span>
      streak · {streak}
    </span>
  );
}
