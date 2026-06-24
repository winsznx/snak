"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useAccount, useReadContract, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { useChainKind } from "@/chain/ChainProvider";
import { CeloOnlyNotice } from "@/components/CeloOnlyNotice";
import { snakAbi } from "@/lib/abi/snak";
import { useNowSec } from "@/lib/useNowSec";
import { SNAK_ADDRESS, isSnakDeployed } from "@/lib/wagmi";

/**
 * Two paths in one panel:
 *   1) settleMatch — anyone can call after the deadline; computes winner
 *      from highest score and transfers cut to treasury.
 *   2) claimPrize — winner pulls their 95% share.
 *
 * Both share the same match-id input so a settler can immediately claim
 * if they happen to be the winner.
 */
export function SettlePanel() {
  const { kind } = useChainKind();

  const { address } = useAccount();
  const [matchInput, setMatchInput] = useState<string>("");
  const nowSec = useNowSec();

  const matchId = useMemo(() => {
    if (!matchInput.trim()) return undefined;
    try {
      return BigInt(matchInput.trim());
    } catch {
      return undefined;
    }
  }, [matchInput]);

  const { data: match, refetch } = useReadContract({
    abi: snakAbi,
    address: SNAK_ADDRESS,
    functionName: "getMatch",
    args: matchId !== undefined ? [matchId] : undefined,
    query: { enabled: kind === "celo" && isSnakDeployed && matchId !== undefined, refetchInterval: 20_000 },
  });

  const {
    writeContract: settleWrite,
    data: settleHash,
    isPending: settlePending,
    error: settleError,
    reset: resetSettle,
  } = useWriteContract();
  const { isLoading: settleMining } = useWaitForTransactionReceipt({ hash: settleHash });

  const {
    writeContract: claimWrite,
    data: claimHash,
    isPending: claimPending,
    error: claimError,
    reset: resetClaim,
  } = useWriteContract();
  const { isLoading: claimMining } = useWaitForTransactionReceipt({ hash: claimHash });

  const status = match?.status ?? 0;
  // useNowSec is 0 on first paint, so an expired match would briefly read as
  // not-yet-passed and disable the Settle button — gate on nowSec > 0.
  const deadlinePassed = match && nowSec > 0 ? Number(match.deadline) < nowSec : false;
  const isWinner = match && address && match.winner.toLowerCase() === address.toLowerCase();

  // 0 = Open, 1 = Locked, 2 = Settled, 3 = Cancelled
  const canSettle =
    isSnakDeployed &&
    !!match &&
    (status === 0 || status === 1) &&
    deadlinePassed &&
    !settleMining &&
    !settlePending;
  const canClaim =
    isSnakDeployed && !!match && status === 2 && isWinner && !claimMining && !claimPending;

  const refetchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (refetchTimer.current) clearTimeout(refetchTimer.current);
  }, []);

  function settle() {
    if (matchId === undefined) return;
    settleWrite({
      abi: snakAbi,
      address: SNAK_ADDRESS,
      functionName: "settleMatch",
      args: [matchId],
    });
    if (refetchTimer.current) clearTimeout(refetchTimer.current);
    refetchTimer.current = setTimeout(
      () => refetch().catch(() => undefined),
      8_000,
    );
  }

  function claim() {
    if (matchId === undefined) return;
    claimWrite({
      abi: snakAbi,
      address: SNAK_ADDRESS,
      functionName: "claimPrize",
      args: [matchId],
    });
  }

  const statusLabel = ["OPEN", "LOCKED", "SETTLED", "CANCELLED"][status] ?? "—";

  if (kind === "stacks") {
    return <CeloOnlyNotice feature="Settle" />;
  }

  return (
    <div className="bg-carbon/80 border border-toxic/30 rounded-lg p-5 space-y-4 text-snow font-mono">
      <div className="text-[10px] uppercase tracking-[0.2em] text-silver">▸ SETTLE_OR_CLAIM</div>
      <input
        type="text"
        inputMode="numeric"
        placeholder="match id" aria-label="Match id"
        value={matchInput}
        onChange={(e) => setMatchInput(e.target.value)}
        className="w-full bg-void border border-ash rounded px-3 py-2 text-snow placeholder-smoke focus:border-toxic outline-none"
      />

      {match && (
        <ul className="text-xs space-y-1 text-silver">
          <li className="flex justify-between">
            <span>STATUS</span>
            <span className="text-snow">{statusLabel}</span>
          </li>
          <li className="flex justify-between">
            <span>WINNER</span>
            <span className="text-snow text-[11px]">
              {match.winner === "0x0000000000000000000000000000000000000000"
                ? "—"
                : `${match.winner.slice(0, 6)}…${match.winner.slice(-4)}`}
            </span>
          </li>
          <li className="flex justify-between">
            <span>DEADLINE</span>
            <span className={deadlinePassed ? "text-toxic" : "text-silver"}>
              {deadlinePassed ? "PASSED" : "RUNNING"}
            </span>
          </li>
        </ul>
      )}

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={settle}
          disabled={!canSettle}
          aria-busy={settleMining || settlePending}
          className="px-3 py-2 rounded border border-toxic bg-toxic/10 hover:bg-toxic/20 text-toxic text-xs uppercase tracking-widest disabled:opacity-30"
        >
          {settleMining ? "settling…" : "settle ▸"}
        </button>
        <button
          type="button"
          onClick={claim}
          disabled={!canClaim}
          aria-busy={claimMining || claimPending}
          className="px-3 py-2 rounded border border-cyan bg-cyan/10 hover:bg-cyan/20 text-cyan text-xs uppercase tracking-widest disabled:opacity-30"
        >
          {claimMining ? "claiming…" : "claim prize ▸"}
        </button>
      </div>

      {(settleHash || claimHash) && (
        <div className="flex items-center gap-3 text-[11px]">
          <a
            href={`https://celoscan.io/tx/${settleHash || claimHash}`}
            target="_blank"
            rel="noreferrer"
            className="text-cyan underline hover:text-toxic"
          >
            view tx ↗
          </a>
          <button
            type="button"
            onClick={() => {
              resetSettle();
              resetClaim();
              setMatchInput("");
            }}
            className="text-silver underline"
          >
            reset
          </button>
        </div>
      )}
      {(settleError || claimError) && (
        <p className="text-[11px] text-magenta uppercase tracking-widest">
          {(settleError || claimError)?.message?.split("\n")[0] ?? "transaction failed"}
        </p>
      )}
    </div>
  );
}
