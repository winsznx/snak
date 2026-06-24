"use client";

import { useState } from "react";
import {
  useAccount,
  useReadContract,
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

const EXTEND_OPTIONS = [
  { label: "+30 MIN", seconds: 30 * 60 },
  { label: "+1 HR", seconds: 60 * 60 },
  { label: "+3 HR", seconds: 3 * 60 * 60 },
  { label: "+12 HR", seconds: 12 * 60 * 60 },
];

/**
 * Creator-only push the deadline forward. Contract requires:
 *   - msg.sender == creator
 *   - status == Open
 *   - newDeadline > current deadline AND > block.timestamp
 * We compute newDeadline = current + selected offset so the strictly-greater
 * constraint is always satisfied (matching the contract's own check).
 */
export function ExtendDeadlinePanel() {
  const { kind } = useChainKind();

  const { address, isConnected } = useAccount();
  const [matchId, setMatchId] = useState("");
  const [extra, setExtra] = useState<number>(60 * 60);

  const idBn = (() => {
    try {
      const n = BigInt(matchId);
      return n >= 0n ? n : -1n;
    } catch {
      return -1n;
    }
  })();
  const validId = idBn >= 0n;

  const { data: matchData } = useReadContract({
    abi: snakAbi,
    address: SNAK_ADDRESS,
    functionName: "matches",
    args: validId ? [idBn] : undefined,
    query: { enabled: kind === "celo" && validId && isSnakDeployed, refetchInterval: 30_000 },
  });
  const tuple = matchData as MatchTuple | undefined;

  const { writeContract, data: hash, isPending, reset } = useWriteContract();
  const { isLoading: mining, isSuccess: confirmed } = useWaitForTransactionReceipt({ hash });

  const isCreator = tuple && address ? tuple[0].toLowerCase() === address.toLowerCase() : false;
  const status = tuple?.[6] ?? -1;
  const deadline = tuple?.[3] ?? 0n;

  const eligible = validId && isConnected && isSnakDeployed && isCreator && status === 0;

  const nowSec = useNowSec();
  // Floor to nowSec before adding the extra window — the snak contract
  // requires newDeadline > block.timestamp, so extending an already-expired
  // (but still Open) match by deadline + extra would silently revert when
  // (deadline + extra) is still in the past. Use max(deadline, now) + extra.
  const computedNewDeadline = (() => {
    if (deadline === 0n) return 0n;
    if (nowSec === 0) return deadline + BigInt(extra); // first paint — hook will refire
    const base = deadline > BigInt(nowSec) ? deadline : BigInt(nowSec);
    return base + BigInt(extra);
  })();

  function submit() {
    if (!eligible) return;
    writeContract({
      abi: snakAbi,
      address: SNAK_ADDRESS,
      functionName: "extendDeadline",
      args: [idBn, computedNewDeadline],
    });
  }

  const reason = (() => {
    if (!isSnakDeployed) return "ARENA_OFFLINE";
    if (!isConnected) return "CONNECT_RIG first";
    if (!validId) return "enter a match id";
    if (!tuple) return "match not found";
    if (!isCreator) return "only the creator can extend";
    if (status !== 0) return "match no longer OPEN";
    return null;
  })();

  const currentDeadlineLabel =
    deadline > 0n
      ? new Date(Number(deadline) * 1000).toLocaleString(undefined, {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "—";
  const newDeadlineLabel =
    computedNewDeadline > 0n
      ? new Date(Number(computedNewDeadline) * 1000).toLocaleString(undefined, {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "—";

  if (kind === "stacks") {
    return <CeloOnlyNotice feature="Extend Deadline" />;
  }

  return (
    <div className="bg-carbon/80 border border-cyan/30 rounded-lg p-5 space-y-4 text-snow font-mono">
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-[0.2em] text-cyan">▸ EXTEND_DEADLINE</span>
        <span className="text-[10px] uppercase tracking-widest text-silver">creator-only</span>
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
          placeholder="0" aria-label="Match id"
          className="w-full bg-void border border-ash rounded px-3 py-2 text-snow text-sm"
        />
      </div>

      <div>
        <label className="text-[10px] uppercase tracking-widest text-silver block mb-2">
          EXTRA TIME
        </label>
        <div className="flex flex-wrap gap-2">
          {EXTEND_OPTIONS.map((o) => (
            <button
              key={o.label}
              type="button"
              aria-pressed={extra === o.seconds}
              onClick={() => setExtra(o.seconds)}
              className={`px-3 py-1.5 min-h-[44px] text-xs rounded border transition-colors ${
                extra === o.seconds
                  ? "border-cyan text-cyan"
                  : "border-ash text-silver hover:text-snow"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {reason ? (
        <p className="text-[11px] text-silver uppercase tracking-widest">{reason}</p>
      ) : (
        <p className="text-[11px] text-toxic uppercase tracking-widest leading-relaxed">
          eligible · pushes {currentDeadlineLabel} → {newDeadlineLabel}
        </p>
      )}

      <button
        type="button"
        onClick={submit}
        disabled={!eligible || mining || isPending}
        className="w-full px-4 py-3 rounded border border-cyan bg-cyan/10 hover:bg-cyan/20 text-cyan uppercase tracking-widest text-sm disabled:opacity-30"
      >
        {mining ? "MINING…" : isPending ? "WAITING_FOR_WALLET" : "EXTEND ▸"}
      </button>

      {hash && (
        <div className="flex items-center gap-3 text-[10px]">
          <a
            href={`https://celoscan.io/tx/${hash}`}
            target="_blank"
            rel="noreferrer"
            className="text-cyan underline hover:text-toxic"
          >
            view tx ↗
          </a>
          <button type="button" onClick={() => reset()} className="text-silver underline">
            reset
          </button>
        </div>
      )}
      {confirmed && (
        <p className="text-[11px] text-toxic uppercase tracking-widest">
          ✓ deadline pushed to {newDeadlineLabel}
        </p>
      )}
    </div>
  );
}
