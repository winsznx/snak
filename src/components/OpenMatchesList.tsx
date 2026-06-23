"use client";

import { useEffect, useMemo, useState } from "react";
import { erc20Abi, formatUnits } from "viem";
import {
  useAccount,
  useReadContract,
  useReadContracts,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { useChainKind } from "@/chain/ChainProvider";
import { CeloOnlyNotice } from "@/components/CeloOnlyNotice";
import { snakAbi } from "@/lib/abi/snak";
import { useNowSec } from "@/lib/useNowSec";
import { CUSD_ADDRESS, SNAK_ADDRESS, isSnakDeployed } from "@/lib/wagmi";

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
  const { kind } = useChainKind();
  const { address, isConnected } = useAccount();
  const nowSec = useNowSec();

  // Pre-read cUSD allowance so the inline JOIN button can branch to an
  // approve-first call when the wallet hasn't pre-authorized the snak escrow.
  // Without this the click signs joinMatch directly and the tx reverts with
  // SafeERC20FailedOperation.
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    abi: erc20Abi,
    address: CUSD_ADDRESS,
    functionName: "allowance",
    args: address ? [address, SNAK_ADDRESS] : undefined,
    query: { enabled: kind === "celo" && isConnected && isSnakDeployed && !!address },
  });

  const { data: nextIdRaw } = useReadContract({
    abi: snakAbi,
    address: SNAK_ADDRESS,
    functionName: "nextMatchId",
    query: { enabled: kind === "celo" && isSnakDeployed, refetchInterval: 30_000 },
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
    query: {
      enabled: kind === "celo" && isSnakDeployed && count > 0,
      refetchInterval: 30_000,
    },
  });

  // Track the tx so users see "approving…" / "joining…" + auto-refresh the
  // open list once the join confirms. We also remember WHICH match id is
  // being signed so the in-flight row is the only one showing "MINING…" —
  // without this every row in the list dims while any one is pending.
  const {
    writeContract,
    data: txHash,
    isPending,
    reset: resetWrite,
  } = useWriteContract();
  const { isLoading: mining, isSuccess: confirmed } = useWaitForTransactionReceipt({
    hash: txHash,
    query: { enabled: !!txHash },
  });
  const [activeMatchId, setActiveMatchId] = useState<bigint | null>(null);

  const open = useMemo(() => {
    if (!results) return [];
    // useNowSec is 0 on first paint (hydration-safe) — skip the deadline
    // filter entirely so we don't briefly admit expired matches with a huge
    // "left" label; the next effect tick will repopulate with real values.
    if (nowSec === 0) return [];
    const now = BigInt(nowSec);
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
  }, [nowSec, results, startId]);

  // After a join confirms, drop the tx so subsequent clicks aren't stuck on
  // the previous receipt state. The effect gate stops this from firing on
  // every render and triggering an infinite update loop.
  useEffect(() => {
    if (confirmed && txHash) {
      // Refetch allowance the moment any receipt confirms — if the user just
      // approved cUSD for a row, the cached value would otherwise stay stale
      // and the next click would send ANOTHER approve instead of joinMatch.
      void refetchAllowance();
      resetWrite();
      setActiveMatchId(null);
    }
  }, [confirmed, txHash, resetWrite, refetchAllowance]);

  if (kind === "stacks") {
    return <CeloOnlyNotice feature="The open-matches list" />;
  }
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
            Number(m.deadline - BigInt(nowSec)),
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
                  disabled={!isConnected || isPending || mining}
                  onClick={() => {
                    setActiveMatchId(m.id);
                    const need = !allowance || (allowance as bigint) < m.stake;
                    if (need) {
                      writeContract({
                        abi: erc20Abi,
                        address: CUSD_ADDRESS,
                        functionName: "approve",
                        args: [SNAK_ADDRESS, m.stake],
                      });
                      return;
                    }
                    writeContract({
                      abi: snakAbi,
                      address: SNAK_ADDRESS,
                      functionName: "joinMatch",
                      args: [m.id],
                    });
                  }}
                  className="px-3 py-2 min-h-[44px] rounded border border-cyan text-cyan hover:bg-cyan/10 disabled:opacity-40 disabled:cursor-not-allowed uppercase tracking-widest text-[10px]"
                >
                  {activeMatchId === m.id && mining
                    ? "MINING…"
                    : activeMatchId === m.id && isPending
                      ? "SIGN…"
                      : !allowance || (allowance as bigint) < m.stake
                        ? "APPROVE ▸"
                        : "JOIN ▸"}
                </button>
              </div>
            </li>
          );
        })}
    </ul>
  );
}
