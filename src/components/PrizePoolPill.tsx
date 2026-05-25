import { formatCusd } from "@/lib/cusd";

type Props = { poolWei: bigint; className?: string };

export function PrizePoolPill({ poolWei, className = "" }: Props) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded border border-toxic/40 bg-carbon px-3 py-1 font-mono text-xs uppercase tracking-widest text-toxic glow-toxic ${className}`}
    >
      <span aria-hidden>◆</span>
      pool · {formatCusd(poolWei)} cUSD
    </span>
  );
}
