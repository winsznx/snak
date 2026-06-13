"use client";

import { useAccount, useReadContract } from "wagmi";
import { useChainKind } from "@/chain/ChainProvider";
import { snakAbi } from "@/lib/abi/snak";
import { SNAK_ADDRESS, isSnakDeployed } from "@/lib/wagmi";

/**
 * Reads the player's current strikeRun + freeEntries from the contract.
 * Used in the play HUD so the player can see whether they have a free entry
 * available. The deployed Stacks contract doesn't carry an equivalent state,
 * so on Stacks the pill renders inert rather than polling Celo for state the
 * user can't use.
 */
export function StrikePill() {
  const { kind } = useChainKind();
  const { address, isConnected } = useAccount();

  const { data: run } = useReadContract({
    abi: snakAbi,
    address: SNAK_ADDRESS,
    functionName: "strikeRun",
    args: address ? [address] : undefined,
    query: {
      enabled: kind === "celo" && isConnected && isSnakDeployed && !!address,
      refetchInterval: 30_000,
    },
  });

  const { data: free } = useReadContract({
    abi: snakAbi,
    address: SNAK_ADDRESS,
    functionName: "freeEntries",
    args: address ? [address] : undefined,
    query: {
      enabled: kind === "celo" && isConnected && isSnakDeployed && !!address,
      refetchInterval: 30_000,
    },
  });

  const r = run !== undefined ? Number(run) : 0;
  const f = free !== undefined ? Number(free) : 0;

  return (
    <div className="px-3 py-1.5 rounded border border-toxic/40 bg-carbon font-mono text-[11px] uppercase tracking-widest text-toxic flex items-center gap-3">
      <span>STRIKE_RUN&nbsp;<span className="text-snow">{r}</span></span>
      <span className="text-silver">·</span>
      <span>FREE&nbsp;<span className="text-snow">{f}</span></span>
    </div>
  );
}
