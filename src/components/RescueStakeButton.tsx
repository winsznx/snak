"use client";

import { useState } from "react";
import { formatUnits } from "viem";
import {
  useAccount,
  useReadContracts,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { useChainKind } from "@/chain/ChainProvider";
import { CeloOnlyNotice } from "@/components/CeloOnlyNotice";
import { snakAbi } from "@/lib/abi/snak";
import { useNowSec } from "@/lib/useNowSec";
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

const RESCUE_DELAY_SECONDS = 3 * 24 * 60 * 60;

/** Pull your stake back from a match that never settled. */
export function RescueStakeButton() {
  const { kind } = useChainKind();
  if (kind === "stacks") return <CeloOnlyNotice feature="Rescue Stake" />;

  const { address, isConnected } = useAccount();
  const [matchId, setMatchId] = useState("");
  const nowSec = useNowSec();

  const idBn = (() => {
    try {
      const n = BigInt(matchId);
      return n >= 0n ? n : -1n;
    } catch {
      return -1n;
    }
  })();
  const validId = idBn >= 0n;

  const probes = useReadContracts({
    contracts: validId && address
      ? ([
          { abi: snakAbi, address: SNAK_ADDRESS, functionName: "matches", args: [idBn] },
          {
            abi: snakAbi,
            address: SNAK_ADDRESS,
            functionName: "hasJoined",
            args: [idBn, address],
          },
          {
            abi: snakAbi,
            address: SNAK_ADDRESS,
            functionName: "hasForfeited",
            args: [idBn, address],
          },
          {
            abi: snakAbi,
            address: SNAK_ADDRESS,
            functionName: "claimedRescue",
            args: [idBn, address],
          },
        ] as const)
      : [],
    query: { enabled: validId && isSnakDeployed && isConnected && !!address, refetchInterval: 30_000 },
  });

  const tuple = probes.data?.[0]?.status === "success"
    ? (probes.data[0].result as unknown as MatchTuple)
    : undefined;
  const joined = probes.data?.[1]?.status === "success" ? (probes.data[1].result as boolean) : false;
  const forfeited = probes.data?.[2]?.status === "success" ? (probes.data[2].result as boolean) : false;
  const claimed = probes.data?.[3]?.status === "success" ? (probes.data[3].result as boolean) : false;

  const now = BigInt(nowSec);
  const status = tuple?.[6] ?? -1;
  const deadline = tuple?.[3] ?? 0n;
  const stake = tuple?.[1] ?? 0n;
  const rescueOpensAt = deadline + BigInt(RESCUE_DELAY_SECONDS);
  const stakeStr = stake > 0n ? Number(formatUnits(stake, 18)).toFixed(2) : "—";

  const eligible =
    validId && isConnected && isSnakDeployed && joined && !forfeited && !claimed &&
    (status === 0 || status === 1) && deadline > 0n && now >= rescueOpensAt;

  const { writeContract, data: hash, isPending, reset } = useWriteContract();
  const { isLoading: mining, isSuccess: confirmed } = useWaitForTransactionReceipt({ hash });

  function submit() {
    if (!eligible) return;
    writeContract({
      abi: snakAbi,
      address: SNAK_ADDRESS,
      functionName: "rescueStake",
      args: [idBn],
    });
  }

  const reason = (() => {
    if (!isSnakDeployed) return "ARENA_OFFLINE";
    if (!isConnected) return "CONNECT_RIG first";
    if (!validId) return "enter a match id";
    if (!tuple) return "match not found";
    if (!joined) return "you're not in this match";
    if (forfeited) return "you forfeited — refund already taken";
    if (claimed) return "already rescued";
    if (status === 2) return "match already SETTLED — claimPrize instead";
    if (status === 3) return "match was CANCELLED";
    if (deadline === 0n) return "no deadline set";
    if (now < rescueOpensAt) {
      const opens = new Date(Number(rescueOpensAt) * 1000);
      return `rescue opens ${opens.toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}`;
    }
    return null;
  })();

  return (
    <div className="bg-carbon/80 border border-cyan/30 rounded-lg p-5 space-y-4 text-snow font-mono">
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-[0.2em] text-cyan">▸ RESCUE_STAKE</span>
        <span className="text-[10px] uppercase tracking-widest text-silver">post-deadline + 3d</span>
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
          eligible · pull ${stakeStr} back
        </p>
      )}

      <button
        type="button"
        onClick={submit}
        disabled={!eligible || mining || isPending}
        className="w-full px-4 py-3 rounded border border-cyan bg-cyan/10 hover:bg-cyan/20 text-cyan uppercase tracking-widest text-sm disabled:opacity-30"
      >
        {mining ? "MINING…" : isPending ? "WAITING_FOR_WALLET" : "RESCUE ▸"}
      </button>

      {hash && (
        <button type="button" onClick={() => reset()} className="text-[10px] text-silver underline">
          reset
        </button>
      )}
      {confirmed && (
        <p className="text-[11px] text-toxic uppercase tracking-widest">
          ✓ stake recovered — ${stakeStr} back in your wallet
        </p>
      )}
    </div>
  );
}
