import { useFlash } from "@/lib/useFlash";

type Props = {
  taken: number;
  total: number;
  className?: string;
};

/**
 * Visualises filled / open slots as a row of pips. Filled = cyan glow,
 * open = silver outline. Flashes once when `taken` changes so a new join
 * registers visually.
 */
export function ArenaSlotsTicker({ taken, total, className = "" }: Props) {
  const flash = useFlash(taken, 600);
  return (
    <div className={`flex gap-1 ${className}`}>
      {Array.from({ length: total }).map((_, i) => {
        const filled = i < taken;
        return (
          <span
            key={i}
            aria-hidden
            className={`h-2 w-2 rounded-full transition-colors ${
              filled
                ? `bg-cyan ${flash ? "shadow-[0_0_10px_rgba(0,229,255,0.8)]" : "shadow-[0_0_4px_rgba(0,229,255,0.4)]"}`
                : "border border-silver/40"
            }`}
          />
        );
      })}
    </div>
  );
}
