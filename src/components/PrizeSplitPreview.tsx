import { formatCusd } from "@/lib/cusd";

type Props = {
  poolWei: bigint;
  treasuryBps: number;
  className?: string;
};

/**
 * Math preview for what the winner takes vs what the treasury cuts. Driven
 * entirely by props so it stays renderable from any panel — including before
 * a match exists, with a poolWei=0 fallback.
 */
export function PrizeSplitPreview({ poolWei, treasuryBps, className = "" }: Props) {
  const treasury = (poolWei * BigInt(treasuryBps)) / 10000n;
  const winner = poolWei - treasury;
  return (
    <dl className={`grid grid-cols-2 gap-3 font-mono ${className}`}>
      <div>
        <dt className="text-[10px] uppercase tracking-widest text-silver">winner</dt>
        <dd className="mt-1 text-base tabular-nums text-toxic">{formatCusd(winner)} cUSD</dd>
      </div>
      <div>
        <dt className="text-[10px] uppercase tracking-widest text-silver">treasury</dt>
        <dd className="mt-1 text-base tabular-nums text-silver">{formatCusd(treasury)} cUSD</dd>
      </div>
    </dl>
  );
}
