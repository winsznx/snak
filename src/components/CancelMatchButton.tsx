"use client";

import { useState } from "react";
import {
  useAccount,
  useReadContracts,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { useChainKind } from "@/chain/ChainProvider";
import { CeloOnlyNotice } from "@/components/CeloOnlyNotice";
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
 * Cancel an empty match. Contract gates this on:
 *   - msg.sender == creator
 *   - status == Open (0)
 *   - joinedCount == 0
 * Once anyone joins, the match is locked in — there's no scrubbing it.
 */
export function CancelMatchButton() {
  const { kind } = useChainKind();
  if (kind === "stacks") return <CeloOnlyNotice feature="Cancel Match" />;

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

  const probes = useReadContracts({
    contracts: validId
      ? ([
          { abi: snakAbi, address: SNAK_ADDRESS, functionName: "matches", args: [idBn] },
        ] as const)
      : [],
    query: { enabled: validId && isSnakDeployed, refetchInterval: 30_000 },
  });

  const matchData = probes.data?.[0];
  const matchTuple =
    matchData?.status === "success" ? (matchData.result as unknown as MatchTuple) : null;

  const { writeContract, data: hash, isPending, reset } = useWriteContract();
  const { isLoading: mining, isSuccess: confirmed } = useWaitForTransactionReceipt({ hash });

  const isCreator =
    matchTuple && address ? matchTuple[0].toLowerCase() === address.toLowerCase() : false;
  const status = matchTuple?.[6] ?? -1;
  const joined = matchTuple?.[5] ?? 0;
  const eligible = validId && isConnected && isSnakDeployed && isCreator && status === 0 && joined === 0;

  function submit() {
    if (!eligible) return;
    writeContract({
      abi: snakAbi,
      address: SNAK_ADDRESS,
      functionName: "cancelMatch",
      args: [idBn],
    });
  }

  const reason = (() => {
    if (!isSnakDeployed) return "ARENA_OFFLINE";
    if (!isConnected) return "CONNECT_RIG first";
    if (!validId) return "enter a match id";
    if (!matchTuple) return "match not found";
    if (!isCreator) return "only the creator can cancel";
    if (status !== 0) return "match no longer OPEN";
    if (joined > 0) return `${joined} player${joined === 1 ? "" : "s"} already in — can't cancel`;
    return null;
  })();

  return (
    <div className="bg-carbon/80 border border-silver/30 rounded-lg p-5 space-y-4 text-snow font-mono">
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-[0.2em] text-silver">▸ CANCEL_MATCH</span>
        <span className="text-[10px] uppercase tracking-widest text-silver">creator-only · 0 joiners</span>
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
          eligible · cancel deletes the lobby
        </p>
      )}

      <button
        type="button"
        onClick={submit}
        disabled={!eligible || mining || isPending}
        className="w-full px-4 py-3 rounded border border-silver bg-silver/10 hover:bg-silver/20 text-silver hover:text-snow uppercase tracking-widest text-sm disabled:opacity-30"
      >
        {mining ? "MINING…" : isPending ? "WAITING_FOR_WALLET" : "CANCEL ▸"}
      </button>

      {hash && (
        <button type="button" onClick={() => reset()} className="text-[10px] text-silver underline">
          reset
        </button>
      )}
      {confirmed && (
        <p className="text-[11px] text-toxic uppercase tracking-widest">
          ✓ match #{matchId} cancelled
        </p>
      )}
    </div>
  );
}
