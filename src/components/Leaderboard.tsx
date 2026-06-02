"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useConfig } from "wagmi";
import { getPublicClient } from "wagmi/actions";
import { useQuery } from "@tanstack/react-query";
import { celo } from "wagmi/chains";
import { useChainKind } from "@/chain/ChainProvider";
import { snakAbi } from "@/lib/abi/snak";
import { SNAK_ADDRESS, isSnakDeployed } from "@/lib/wagmi";
import { fetchActorAggregates, formatCusd, shortAddr, type ActorEvent } from "@/lib/leaderboard";
import {
  fetchStacksAggregates,
  shortStxAddress,
  type StacksAggregateEntry,
} from "@/lib/stacksLeaderboard";

type ChainTab = "celo" | "stacks";

const STACKS_CONTRACTS = [
  "SP31DP8F8CF2GXSZBHHHK5J6Y061744E1TNFGYWYV.snak",
  "SP31DP8F8CF2GXSZBHHHK5J6Y061744E1TNFGYWYV.snak-strike",
  "SP31DP8F8CF2GXSZBHHHK5J6Y061744E1TNFGYWYV.snak-badges",
] as const;

const ACTOR_EVENTS: ActorEvent[] = [
  { name: "ArenaCreated", actorArg: "creator", valueArg: "stake" },
  { name: "Joined", actorArg: "player", valueArg: "stake" },
  { name: "ScoreSubmitted", actorArg: "player" },
  { name: "MatchSettled", actorArg: "winner", valueArg: "prize" },
  { name: "PrizeClaimed", actorArg: "winner", valueArg: "amount" },
  { name: "StakeRescued", actorArg: "player", valueArg: "amount" },
  { name: "Forfeited", actorArg: "player" },
  { name: "PrizeBoosted", actorArg: "sponsor", valueArg: "amount" },
  { name: "Striked", actorArg: "player" },
  { name: "IntroducerSet", actorArg: "player" },
  { name: "RankBadgeMinted", actorArg: "player" },
];

const PAGE_SIZE = 25;

type Row = {
  address: string;
  actions: number;
  valueLabel: string;
  lastBlock: string;
  eventBreakdown: Record<string, number>;
};

export function Leaderboard() {
  const config = useConfig();
  const { kind, setKind } = useChainKind();
  const [chain, setChain] = useState<ChainTab>(kind);

  // Mirror the global chain toggle so flipping either control switches both.
  useEffect(() => {
    setChain(kind);
  }, [kind]);
  const handleChainChange = (next: ChainTab) => {
    setChain(next);
    setKind(next);
  };

  const celoQuery = useQuery({
    queryKey: ["snak-leaderboard-celo", celo.id, SNAK_ADDRESS],
    queryFn: async () => {
      const client = getPublicClient(config, { chainId: celo.id });
      if (!client) return [];
      return fetchActorAggregates({
        client,
        address: SNAK_ADDRESS,
        abi: snakAbi,
        events: ACTOR_EVENTS,
      });
    },
    enabled: chain === "celo" && isSnakDeployed,
    refetchInterval: 90_000,
    staleTime: 60_000,
  });

  const stacksQuery = useQuery<StacksAggregateEntry[]>({
    queryKey: ["snak-leaderboard-stacks"],
    queryFn: () => fetchStacksAggregates({ contractIds: [...STACKS_CONTRACTS], perContractLimit: 50 }),
    enabled: chain === "stacks",
    refetchInterval: 90_000,
    staleTime: 60_000,
  });

  const rows: Row[] = useMemo(() => {
    if (chain === "celo") {
      return (celoQuery.data ?? []).map((r) => ({
        address: r.address,
        actions: r.actions,
        valueLabel: formatCusd(r.valueWei),
        lastBlock: `#${r.lastBlock.toString()}`,
        eventBreakdown: r.eventBreakdown,
      }));
    }
    return (stacksQuery.data ?? []).map((r) => ({
      address: r.address,
      actions: r.actions,
      valueLabel: (Number(r.microStxMoved) / 1_000_000).toFixed(4),
      lastBlock: `#${r.lastBlock}`,
      eventBreakdown: r.eventBreakdown,
    }));
  }, [chain, celoQuery.data, stacksQuery.data]);

  const top = useMemo(() => rows.slice(0, PAGE_SIZE), [rows]);
  const totalActions = useMemo(() => rows.reduce((s, r) => s + r.actions, 0), [rows]);
  const totalValue = useMemo(() => {
    if (chain === "celo") return (celoQuery.data ?? []).reduce((s, r) => s + r.valueWei, 0n);
    return (stacksQuery.data ?? []).reduce((s, r) => s + r.microStxMoved, 0n);
  }, [chain, celoQuery.data, stacksQuery.data]);
  const isLoading = chain === "celo" ? celoQuery.isLoading : stacksQuery.isLoading;
  const dataUpdatedAt = chain === "celo" ? celoQuery.dataUpdatedAt : stacksQuery.dataUpdatedAt;

  if (chain === "celo" && !isSnakDeployed) {
    return (
      <div className="surface-elevated rounded-lg p-12 text-center">
        <p className="text-silver font-mono uppercase tracking-widest text-xs">SNAK_CONTRACT not deployed on this network</p>
      </div>
    );
  }

  return (
    <div className="relative">
      <ChainToggle chain={chain} onChange={handleChainChange} />

      <div className="mt-6">
        <StatStrip
          uau={rows.length}
          actions={totalActions}
          value={totalValue}
          chain={chain}
          loading={isLoading}
        />
      </div>

      <div className="mt-10 surface-elevated rounded-lg overflow-hidden">
        <div className="grid grid-cols-[44px_1fr_72px_140px_96px] sm:grid-cols-[56px_1fr_92px_160px_120px] items-center gap-3 sm:gap-4 px-4 sm:px-6 py-4 bg-carbon/60 border-b border-ash">
          <div className="text-[10px] uppercase tracking-[0.18em] text-silver font-mono">Rank</div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-silver font-mono">Agent</div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-silver font-mono text-right">Actions</div>
          <div className="hidden sm:block text-[10px] uppercase tracking-[0.18em] text-silver font-mono text-right">
            {chain === "celo" ? "cUSD volume" : "STX fees"}
          </div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-silver font-mono text-right">Block</div>
        </div>

        {isLoading ? (
          <div className="px-6 py-16 text-center">
            <p className="text-cyan font-mono uppercase tracking-[0.2em] text-xs">SCANNING_LEDGER…</p>
          </div>
        ) : top.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="text-silver font-mono uppercase tracking-[0.2em] text-xs">NO_AGENT_ACTIVITY</p>
          </div>
        ) : (
          <ul>
            {top.map((row, idx) => (
              <li
                key={row.address}
                className="grid grid-cols-[44px_1fr_72px_140px_96px] sm:grid-cols-[56px_1fr_92px_160px_120px] items-center gap-3 sm:gap-4 px-4 sm:px-6 py-4 border-b border-ash last:border-b-0 hover:bg-graphite/50 transition-colors"
              >
                <RankCell rank={idx + 1} />
                <AddressCell address={row.address} breakdown={row.eventBreakdown} chain={chain} />
                <div className="text-right font-bold font-display text-base text-snow tabular-nums">{row.actions}</div>
                <div className="hidden sm:block text-right text-sm text-cloud font-mono tabular-nums">{row.valueLabel}</div>
                <div className="text-right text-xs text-smoke font-mono tabular-nums">{row.lastBlock}</div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {rows.length > PAGE_SIZE && (
        <p className="mt-4 text-[11px] text-smoke font-mono text-center uppercase tracking-widest">
          TOP {PAGE_SIZE} of {rows.length} agents · {chain}
        </p>
      )}

      {dataUpdatedAt > 0 && (
        <p className="mt-2 text-[11px] text-smoke font-mono text-center uppercase tracking-widest">
          INDEXED {new Date(dataUpdatedAt).toLocaleTimeString()} · refreshes every 90s
        </p>
      )}

      <p className="mt-6 text-[11px] text-smoke font-mono text-center uppercase tracking-widest">
        <Link href="/play" className="text-cyan hover:text-toxic transition-colors">↗ ENTER ARENA</Link>
      </p>
    </div>
  );
}

function ChainToggle({ chain, onChange }: { chain: ChainTab; onChange: (c: ChainTab) => void }) {
  const tabs: { id: ChainTab; label: string; hint: string }[] = [
    { id: "celo", label: "CELO", hint: "cUSD" },
    { id: "stacks", label: "STACKS", hint: "HIRO" },
  ];
  return (
    <div className="inline-flex rounded-md border border-ash bg-carbon/60 p-1" role="tablist" aria-label="Chain selector">
      {tabs.map((t) => {
        const active = t.id === chain;
        return (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(t.id)}
            className={`rounded px-3 py-1.5 text-[11px] font-mono uppercase tracking-[0.12em] transition-colors ${
              active ? "bg-void text-cyan glow-text-cyan" : "text-silver hover:text-snow"
            }`}
          >
            {t.label}
            <span className="ml-2 text-[9px] opacity-60">{t.hint}</span>
          </button>
        );
      })}
    </div>
  );
}

function StatStrip({
  uau,
  actions,
  value,
  chain,
  loading,
}: {
  uau: number;
  actions: number;
  value: bigint;
  chain: ChainTab;
  loading: boolean;
}) {
  const valueLabel = chain === "celo" ? "cUSD VOLUME" : "STX FEES";
  const valueValue = loading
    ? "…"
    : chain === "celo"
      ? formatCusd(value)
      : (Number(value) / 1_000_000).toFixed(4);
  const networkLabel = chain === "celo" ? "CELO" : "STACKS";
  const stats = [
    { label: "AGENTS", value: loading ? "…" : uau.toString() },
    { label: "ACTIONS", value: loading ? "…" : actions.toString() },
    { label: valueLabel, value: valueValue },
    { label: "NETWORK", value: networkLabel },
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-ash rounded-lg overflow-hidden border border-ash">
      {stats.map((s) => (
        <div key={s.label} className="bg-void px-4 sm:px-6 py-5 sm:py-6">
          <div className="text-[10px] uppercase tracking-[0.18em] text-silver font-mono">{s.label}</div>
          <div className="mt-2 text-2xl sm:text-3xl md:text-[32px] font-bold font-display text-snow leading-tight tabular-nums glow-text-cyan">{s.value}</div>
        </div>
      ))}
    </div>
  );
}

function RankCell({ rank }: { rank: number }) {
  const tone = rank === 1
    ? "text-toxic glow-text-toxic"
    : rank === 2
    ? "text-cyan glow-text-cyan"
    : rank === 3
    ? "text-magenta"
    : "text-silver";
  return (
    <div className={`text-sm font-bold font-mono tabular-nums ${tone}`}>
      {rank.toString().padStart(2, "0")}
    </div>
  );
}

function AddressCell({
  address,
  breakdown,
  chain,
}: {
  address: string;
  breakdown: Record<string, number>;
  chain: ChainTab;
}) {
  const top3 = Object.entries(breakdown).sort((a, b) => b[1] - a[1]).slice(0, 3);
  const href =
    chain === "celo"
      ? `https://celoscan.io/address/${address}`
      : `https://explorer.hiro.so/address/${address}?chain=mainnet`;
  const label = chain === "celo" ? shortAddr(address) : shortStxAddress(address);
  return (
    <div className="min-w-0">
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className="text-sm font-bold text-snow font-mono hover:text-cyan transition-colors block truncate"
      >
        {label}
      </a>
      <div className="mt-1 hidden sm:flex items-center gap-1.5 flex-wrap">
        {top3.map(([name, count]) => (
          <span
            key={name}
            className="text-[9px] uppercase tracking-[0.1em] text-cloud font-mono px-1.5 py-0.5 bg-carbon/60 border border-ash rounded"
          >
            {name} <span className="text-toxic font-bold">{count}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
