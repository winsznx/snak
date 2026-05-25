import { formatCusd } from "@/lib/cusd";
import { Pill } from "./Pill";

type Props = { stakeWei: bigint; className?: string };

export function StakePill({ stakeWei, className }: Props) {
  return (
    <Pill tone="toxic" className={className}>
      {formatCusd(stakeWei)} cUSD
    </Pill>
  );
}
