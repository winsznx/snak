import { badgeKindLabel, badgeKindGlow } from "@/lib/badgeKinds";

type Props = {
  rank: number;
  tokenId: bigint | number | string;
  className?: string;
};

const SVG_FOR: Record<string, string> = {
  Diamond: "◆",
  Gold: "★",
  Silver: "◐",
  Bronze: "●",
};

export function BadgeTile({ rank, tokenId, className = "" }: Props) {
  const kind = badgeKindLabel(rank);
  const glow = badgeKindGlow(rank);
  return (
    <div
      className={`flex flex-col items-center gap-2 rounded-lg border border-cyan/20 bg-carbon p-4 text-center ${glow} ${className}`}
    >
      <span aria-hidden className="text-3xl text-cyan">{SVG_FOR[kind]}</span>
      <span className="font-display text-xs font-bold uppercase tracking-[0.15em] text-snow">{kind}</span>
      <span className="font-mono text-[10px] uppercase tracking-widest text-silver">
        rank #{rank} · token {tokenId.toString()}
      </span>
    </div>
  );
}
