"use client";

import { useMemo, useState } from "react";
import { erc20Abi, formatUnits } from "viem";
import {
  useAccount,
  useReadContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { useChainKind } from "@/chain/ChainProvider";
import { CeloOnlyNotice } from "@/components/CeloOnlyNotice";
import { snakAbi } from "@/lib/abi/snak";
import { CUSD_ADDRESS, SNAK_ADDRESS, isSnakDeployed } from "@/lib/wagmi";
import { useNowSec } from "@/lib/useNowSec";

/**
 * Look-up-and-join panel.
 *
 * On Celo there's no useful "list all open matches" view function on the
 * Snak contract, so we accept a match id directly (host shares it). When the
 * player has entered an id we read the match struct, gate the join button on
 * status/full/deadline, and walk an allowance-aware approve + joinMatch.
 */
export function JoinMatchPanel() {
  const { kind } = useChainKind();

  const { address, isConnected } = useAccount();
  const [matchInput, setMatchInput] = useState<string>("");
  const [phase, setPhase] = useState<"idle" | "approving" | "joining">("idle");
  const nowSec = useNowSec();

  const matchId = useMemo(() => {
    if (!matchInput.trim()) return undefined;
    try {
      return BigInt(matchInput.trim());
    } catch {
      return undefined;
    }
  }, [matchInput]);

  const { data: match } = useReadContract({
    abi: snakAbi,
    address: SNAK_ADDRESS,
    functionName: "getMatch",
    args: matchId !== undefined ? [matchId] : undefined,
    query: { enabled: isSnakDeployed && matchId !== undefined, refetchInterval: 20_000 },
  });

  const stake = match?.stake ?? 0n;
  const { data: allowance } = useReadContract({
    abi: erc20Abi,
    address: CUSD_ADDRESS,
    functionName: "allowance",
    args: address ? [address, SNAK_ADDRESS] : undefined,
    query: { enabled: isConnected && isSnakDeployed && !!address && stake > 0n },
  });

  const { writeContract, data: hash, reset, isPending } = useWriteContract();
  const { isLoading: mining } = useWaitForTransactionReceipt({ hash });

  const isOpen = match?.status === 0; // MatchStatus.Open
  const isFull = match ? match.joinedCount >= match.maxPlayers : false;
  const isExpired = match ? Number(match.deadline) <= nowSec : false;
  const needsApprove = !allowance || (allowance as bigint) < stake;

  function join() {
    if (matchId === undefined || !isConnected) return;
    if (needsApprove) {
      setPhase("approving");
      writeContract({
        abi: erc20Abi,
        address: CUSD_ADDRESS,
        functionName: "approve",
        args: [SNAK_ADDRESS, stake],
      });
      return;
    }
    setPhase("joining");
    writeContract({
      abi: snakAbi,
      address: SNAK_ADDRESS,
      functionName: "joinMatch",
      args: [matchId],
    });
  }

  const stakeStr =
    match && stake > 0n ? `$${Number(formatUnits(stake, 18)).toFixed(2)}` : "—";
  const slotsStr = match ? `${match.joinedCount}/${match.maxPlayers}` : "—/—";

  const cta = mining
    ? phase === "approving"
      ? "Approving…"
      : "Locking in…"
    : !isConnected
      ? "JACK_IN to join"
      : !isSnakDeployed
        ? "Arena offline"
        : matchId === undefined
          ? "Enter match id"
          : !match
            ? "Loading…"
            : !isOpen
              ? "Not open"
              : isFull
                ? "Full"
                : isExpired
                  ? "Window closed"
                  : needsApprove
                    ? `Approve ${stakeStr} cUSD`
                    : `Lock in for ${stakeStr} ▸`;

  const canSubmit =
    isConnected &&
    isSnakDeployed &&
    matchId !== undefined &&
    match &&
    isOpen &&
    !isFull &&
    !isExpired &&
    !mining &&
    !isPending;

  if (kind === "stacks") {
    return <CeloOnlyNotice feature="Join Match" />;
  }

  return (
    <div className="bg-carbon/80 border border-magenta/30 rounded-lg p-5 space-y-4 text-snow font-mono">
      <div className="text-[10px] uppercase tracking-[0.2em] text-silver">
        ▸ JOIN_BY_ID
      </div>
      <input
        type="text"
        inputMode="numeric"
        placeholder="match id (e.g. 0)"
        value={matchInput}
        onChange={(e) => setMatchInput(e.target.value)}
        className="w-full bg-void border border-ash rounded px-3 py-2 text-snow placeholder-smoke focus:border-magenta outline-none"
      />

      {match && (
        <ul className="text-xs space-y-1.5 text-silver">
          <li className="flex justify-between">
            <span>STAKE</span>
            <span className="text-snow">{stakeStr}</span>
          </li>
          <li className="flex justify-between">
            <span>SLOTS</span>
            <span className="text-snow">{slotsStr}</span>
          </li>
          <li className="flex justify-between">
            <span>STATUS</span>
            <span className={isOpen ? "text-toxic" : "text-magenta"}>
              {isExpired ? "EXPIRED" : isFull ? "FULL" : isOpen ? "OPEN" : "LOCKED"}
            </span>
          </li>
        </ul>
      )}

      <button
        type="button"
        onClick={join}
        disabled={!canSubmit}
        className="w-full px-4 py-3 rounded border border-magenta bg-magenta/10 hover:bg-magenta/20 text-magenta uppercase tracking-widest text-sm disabled:opacity-30"
      >
        {cta}
      </button>

      {hash && (
        <div className="flex justify-between items-center text-[11px] text-silver">
          <span>tx: {hash.slice(0, 10)}…</span>
          <button type="button" onClick={() => reset()} className="underline">
            reset
          </button>
        </div>
      )}
    </div>
  );
}
