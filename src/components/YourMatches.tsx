"use client";

import { useMemo } from "react";
import { formatUnits } from "viem";
import {
  useAccount,
  useChainId,
  useConfig,
  useReadContracts,
} from "wagmi";
import { getPublicClient } from "wagmi/actions";
import { useQuery } from "@tanstack/react-query";
import { useChainKind } from "@/chain/ChainProvider";
import { CeloOnlyNotice } from "@/components/CeloOnlyNotice";
import { snakAbi } from "@/lib/abi/snak";
import { SNAK_ADDRESS, isSnakDeployed } from "@/lib/wagmi";

const LOOKBACK = 200_000n;

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

const STATUS_LABELS = ["OPEN", "LOCKED", "SETTLED", "CANCELLED"] as const;

/**
 * Reads the connected user's Joined events from the recent block window, then
 * batch-fetches the live match state so the player sees their entire arena
 * history including which ones are claimable and which already settled.
 */
export function YourMatches() {
  const { kind } = useChainKind();
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const config = useConfig();

  const idsQuery = useQuery({
    queryKey: ["snak-your-matches", chainId, address],
    queryFn: async (): Promise<bigint[]> => {
      if (kind !== "celo") return [];
      if (!address) return [];
      const client = getPublicClient(config, { chainId });
      if (!client) return [];
      const head = await client.getBlockNumber();
      const from = head > LOOKBACK ? head - LOOKBACK : 0n;
      const eventAbi = snakAbi.find(
        (i) => i.type === "event" && i.name === "Joined",
      ) as Extract<(typeof snakAbi)[number], { type: "event"; name: "Joined" }>;
      const logs = await client.getLogs({
        address: SNAK_ADDRESS,
        event: eventAbi,
        args: { player: address },
        fromBlock: from,
        toBlock: head,
      });
      const seen = new Set<string>();
      const out: bigint[] = [];
      for (const l of logs) {
        const id = l.args.matchId;
        if (typeof id !== "bigint") continue;
        const key = id.toString();
        if (seen.has(key)) continue;
        seen.add(key);
        out.push(id);
      }
      return out;
    },
    enabled: kind === "celo" && isConnected && isSnakDeployed && !!address,
    refetchInterval: 60_000,
  });

  const ids = useMemo(() => idsQuery.data ?? [], [idsQuery.data]);

  const { data: results } = useReadContracts({
    contracts: ids.map((id) => ({
      abi: snakAbi,
      address: SNAK_ADDRESS,
      functionName: "matches" as const,
      args: [id] as const,
    })),
    query: {
      enabled: kind === "celo" && ids.length > 0,
      refetchInterval: 30_000,
    },
  });

  const rows = useMemo(() => {
    if (!ids.length || !results) return [];
    return ids
      .map((id, idx) => {
        const r = results[idx];
        if (!r || r.status !== "success") return null;
        const m = r.result as unknown as MatchTuple;
        return {
          id,
          stake: m[1],
          prizePool: m[2],
          status: m[6],
          winner: m[7],
          winningScore: m[8],
        };
      })
      .filter(Boolean) as Array<{
      id: bigint;
      stake: bigint;
      prizePool: bigint;
      status: number;
      winner: `0x${string}`;
      winningScore: bigint;
    }>;
  }, [ids, results]);

  if (kind === "stacks") {
    return <CeloOnlyNotice feature="Your match history" />;
  }
  if (!isSnakDeployed) {
    return (
      <div className="font-mono text-[11px] text-magenta uppercase tracking-widest">
        ARENA_OFFLINE
      </div>
    );
  }
  if (!isConnected) {
    return (
      <div className="font-mono text-[11px] text-silver uppercase tracking-widest">
        connect_rig to see your matches
      </div>
    );
  }
  if (idsQuery.isLoading) {
    return (
      <div className="font-mono text-[11px] text-silver uppercase tracking-widest">
        scanning your match history…
      </div>
    );
  }
  if (rows.length === 0) {
    return (
      <div className="font-mono text-[11px] text-silver uppercase tracking-widest">
        no matches joined yet. find one under OPEN_ARENAS.
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {rows
        .sort((a, b) => Number(b.id - a.id))
        .map((row) => {
          const stakeStr = Number(formatUnits(row.stake, 18)).toFixed(2);
          const poolStr = Number(formatUnits(row.prizePool, 18)).toFixed(2);
          const statusLabel = STATUS_LABELS[row.status] ?? "?";
          const youWon =
            row.status === 2 &&
            address?.toLowerCase() === row.winner.toLowerCase() &&
            row.winningScore > 0n;
          return (
            <li
              key={row.id.toString()}
              className="bg-carbon/60 border border-ash rounded p-3 flex items-center justify-between gap-4 font-mono text-xs text-snow"
            >
              <div className="flex items-center gap-4 flex-wrap">
                <span className="text-cyan uppercase tracking-widest">#{row.id.toString()}</span>
                <span
                  className={`px-2 py-0.5 rounded border text-[10px] uppercase tracking-widest ${
                    statusLabel === "OPEN" || statusLabel === "LOCKED"
                      ? "border-cyan text-cyan"
                      : statusLabel === "SETTLED"
                        ? youWon
                          ? "border-toxic text-toxic"
                          : "border-silver text-silver"
                        : "border-magenta text-magenta"
                  }`}
                >
                  {youWon ? "WON" : statusLabel}
                </span>
                <span className="text-silver">${stakeStr} staked</span>
                <span className="text-toxic">${poolStr} pool</span>
              </div>
            </li>
          );
        })}
    </ul>
  );
}
