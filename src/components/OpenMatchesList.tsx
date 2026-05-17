"use client";

import { useMemo } from "react";
import { formatUnits } from "viem";
import { useAccount, useReadContract, useReadContracts, useWriteContract } from "wagmi";
import { snakAbi } from "@/lib/abi/snak";
import { SNAK_ADDRESS, isSnakDeployed } from "@/lib/wagmi";

const WINDOW = 20; // pull at most the latest 20 matches

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
 * Reads the most recent matches and surfaces the ones still accepting joiners
 * (status === Open, joinedCount < maxPlayers, deadline in the future).
 *
 * Each row carries a one-click join action so the user doesn't have to copy
 * a match id into the manual JoinMatchPanel.
 */
export function OpenMatchesList() {
  const { isConnected } = useAccount();

  const { data: nextIdRaw } = useReadContract({
    abi: snakAbi,
    address: SNAK_ADDRESS,
    functionName: "nextMatchId",
    query: { enabled: isSnakDeployed, refetchInterval: 30_000 },
  });

  const nextId = typeof nextIdRaw === "bigint" ? nextIdRaw : 0n;
  const startId = nextId > BigInt(WINDOW) ? nextId - BigInt(WINDOW) : 0n;
  const count = Number(nextId - startId);

  const contracts = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        abi: snakAbi,
        address: SNAK_ADDRESS,
        functionName: "matches" as const,
        args: [startId + BigInt(i)] as const,
      })),
    [count, startId],
  );

  const { data: results, isLoading } = useReadContracts({
    contracts,
    query: { enabled: isSnakDeployed && count > 0, refetchInterval: 30_000 },
  });

  const { writeContract, isPending } = useWriteContract();

  const open = useMemo(() => {
    if (!results) return [];
    const now = BigInt(Math.floor(Date.now() / 1000));
    return results
      .map((r, idx) => {
        if (r.status !== "success") return null;
        const m = r.result as unknown as MatchTuple;
        const status = m[6];
        const deadline = m[3];
        const joined = m[5];
        const maxP = m[4];
        if (status !== 0) return null; // 0 = Open
        if (deadline <= now) return null;
        if (joined >= maxP) return null;
        return {
          id: startId + BigInt(idx),
          stake: m[1],
          prizePool: m[2],
          deadline,
          joined,
          maxP,
        };
      })
      .filter(Boolean) as Array<{
      id: bigint;
      stake: bigint;
      prizePool: bigint;
      deadline: bigint;
      joined: number;
      maxP: number;
    }>;
  }, [results, startId]);

  if (!isSnakDeployed) {
    return (
      <div className="font-mono text-[11px] text-magenta uppercase tracking-widest">
        ARENA_OFFLINE — contract not configured
      </div>
    );
  }

  if (isLoading || count === 0) {
    return (
      <div className="font-mono text-[11px] text-silver uppercase tracking-widest">
        {count === 0 ? "no_matches_yet" : "scanning_arenas…"}
      </div>
    );
  }

  if (open.length === 0) {
    return (
      <div className="font-mono text-[11px] text-silver uppercase tracking-widest">
        no_open_arenas. host one yourself.
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {open
        .sort((a, b) => Number(a.deadline - b.deadline))
        .map((m) => {
          const stakeStr = Number(formatUnits(m.stake, 18)).toFixed(2);
          const poolStr = Number(formatUnits(m.prizePool, 18)).toFixed(2);
          const secondsLeft = Math.max(
            0,
            Number(m.deadline - BigInt(Math.floor(Date.now() / 1000))),
          );
          const minsLeft = Math.floor(secondsLeft / 60);
          const hoursLeft = Math.floor(minsLeft / 60);
          const timeLabel =
            hoursLeft >= 1 ? `${hoursLeft}h ${minsLeft % 60}m` : `${minsLeft}m`;
          // Status badge derivation:
          //   urgent  — < 10 minutes left
          //   filling — joinedCount / max >= 0.5
          //   fresh   — otherwise
          const fillRatio = m.joined / m.maxP;
          const badge =
            secondsLeft < 600
              ? { label: "URGENT", color: "border-magenta text-magenta" }
              : fillRatio >= 0.5
                ? { label: "FILLING", color: "border-toxic text-toxic" }
                : { label: "FRESH", color: "border-cyan text-cyan" };

          return (
            <li
              key={m.id.toString()}
              className="bg-carbon/60 border border-ash hover:border-cyan/40 rounded p-3 flex items-center justify-between gap-4 font-mono text-xs text-snow"
            >
              <div className="flex items-center gap-4 min-w-0 flex-wrap">
                <span className="text-cyan uppercase tracking-widest">#{m.id.toString()}</span>
                <span
                  className={`px-2 py-0.5 rounded border ${badge.color} text-[10px] uppercase tracking-widest`}
                >
                  {badge.label}
                </span>
                <span className="text-silver">${stakeStr} stake</span>
                <span className="text-silver">
                  {m.joined}/{m.maxP} slots
                </span>
                <span className="text-toxic">${poolStr} pool</span>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-silver text-[10px] uppercase tracking-widest">
                  {timeLabel} left
                </span>
                <button
                  type="button"
                  disabled={!isConnected || isPending}
                  onClick={() =>
                    writeContract({
                      abi: snakAbi,
                      address: SNAK_ADDRESS,
                      functionName: "joinMatch",
                      args: [m.id],
                    })
                  }
                  className="px-3 py-1 rounded border border-cyan text-cyan hover:bg-cyan/10 disabled:opacity-40 disabled:cursor-not-allowed uppercase tracking-widest text-[10px]"
                >
                  {isPending ? "SIGN…" : "JOIN ▸"}
                </button>
              </div>
            </li>
          );
        })}
    </ul>
  );
}
