"use client";

import { useState } from "react";
import { formatUnits } from "viem";
import {
  useAccount,
  useReadContract,
  useReadContracts,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { snakAbi } from "@/lib/abi/snak";
import { SNAK_ADDRESS, isSnakDeployed } from "@/lib/wagmi";

type MatchTuple = readonly [
  creator: `0x${string}`,
  stake: bigint,
  prizePool: bigint,
  deadline: bigint,
  maxPlayers: number,
  joinedCount: number,
  status: number,
  winner: `0x${string}`,
  winningScore: bigint,
];

/**
 * Bail on a match before its deadline. Contract refunds 80% of the stake,
 * keeps 20% for the treasury. Disabled unless the player is actually in the
 * match, hasn't already forfeited, the match is still Open, and the deadline
 * hasn't passed.
 */
export function ForfeitMatchButton() {
  const { address, isConnected } = useAccount();
  const [matchId, setMatchId] = useState("");

  const idBn = (() => {
    try {
      const n = BigInt(matchId);
      return n >= 0n ? n : -1n;
    } catch {
      return -1n;
    }
  })();
  const validId = idBn >= 0n;

  // Probe four contract reads for the chosen match
  const probes = useReadContracts({
    contracts: validId
      ? ([
          { abi: snakAbi, address: SNAK_ADDRESS, functionName: "matches", args: [idBn] },
          {
            abi: snakAbi,
            address: SNAK_ADDRESS,
            functionName: "hasJoined",
            args: [idBn, address ?? ("0x0000000000000000000000000000000000000000" as `0x${string}`)],
          },
          {
            abi: snakAbi,
            address: SNAK_ADDRESS,
            functionName: "hasForfeited",
            args: [idBn, address ?? ("0x0000000000000000000000000000000000000000" as `0x${string}`)],
          },
        ] as const)
      : [],
    query: { enabled: validId && isSnakDeployed && isConnected, refetchInterval: 30_000 },
  });

  const matchData = probes.data?.[0];
  const joinedData = probes.data?.[1];
  const forfeitedData = probes.data?.[2];

  const matchTuple =
    matchData?.status === "success" ? (matchData.result as unknown as MatchTuple) : null;
  const hasJoined = joinedData?.status === "success" ? (joinedData.result as boolean) : false;
  const hasForfeited =
    forfeitedData?.status === "success" ? (forfeitedData.result as boolean) : false;

  const { writeContract, data: hash, isPending, reset } = useWriteContract();
  const { isLoading: mining, isSuccess: confirmed } = useWaitForTransactionReceipt({ hash });

  const now = BigInt(Math.floor(Date.now() / 1000));
  const status = matchTuple?.[6] ?? -1;
  const stake = matchTuple?.[1] ?? 0n;
  const deadline = matchTuple?.[3] ?? 0n;
  const beforeDeadline = deadline > 0n && now < deadline;
  const eligible =
    validId && isConnected && isSnakDeployed && hasJoined && !hasForfeited && status === 0 && beforeDeadline;

  const refundCusd = stake > 0n ? Number(formatUnits((stake * 8000n) / 10000n, 18)).toFixed(2) : "—";

  function submit() {
    if (!eligible) return;
    writeContract({
      abi: snakAbi,
      address: SNAK_ADDRESS,
      functionName: "forfeit",
      args: [idBn],
    });
  }

  const reason = (() => {
    if (!isSnakDeployed) return "ARENA_OFFLINE";
    if (!isConnected) return "CONNECT_RIG first";
    if (!validId) return "enter a match id";
    if (!matchTuple) return "match not found";
    if (!hasJoined) return "you're not in this match";
    if (hasForfeited) return "already forfeited";
    if (status !== 0) return "match no longer OPEN";
    if (!beforeDeadline) return "deadline passed — too late to forfeit";
    return null;
  })();

  return (
    <div className="bg-carbon/80 border border-magenta/30 rounded-lg p-5 space-y-4 text-snow font-mono">
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-[0.2em] text-magenta">▸ FORFEIT</span>
        <span className="text-[10px] uppercase tracking-widest text-silver">80% refund</span>
      </div>

      <div>
        <label className="text-[10px] uppercase tracking-widest text-silver block mb-2">
          MATCH_ID
        </label>
        <input
          type="number"
          inputMode="numeric"
          min={0}
          value={matchId}
          onChange={(e) => setMatchId(e.target.value)}
          placeholder="0"
          className="w-full bg-void border border-ash rounded px-3 py-2 text-snow text-sm"
        />
      </div>

      {reason ? (
        <p className="text-[11px] text-silver uppercase tracking-widest">{reason}</p>
      ) : (
        <p className="text-[11px] text-toxic uppercase tracking-widest">
          eligible · refund ${refundCusd}
        </p>
      )}

      <button
        type="button"
        onClick={submit}
        disabled={!eligible || mining || isPending}
        className="w-full px-4 py-3 rounded border border-magenta bg-magenta/10 hover:bg-magenta/20 text-magenta uppercase tracking-widest text-sm disabled:opacity-30"
      >
        {mining ? "MINING…" : isPending ? "WAITING_FOR_WALLET" : "ABORT ▸ TAKE 80% BACK"}
      </button>

      {hash && (
        <button type="button" onClick={() => reset()} className="text-[10px] text-silver underline">
          reset
        </button>
      )}
      {confirmed && (
        <p className="text-[11px] text-toxic uppercase tracking-widest">
          ✓ forfeit confirmed — ${refundCusd} headed back to your wallet
        </p>
      )}
    </div>
  );
}
