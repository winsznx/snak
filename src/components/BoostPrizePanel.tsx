"use client";

import { useEffect, useMemo, useState } from "react";
import { erc20Abi, formatUnits, parseUnits } from "viem";
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

const PRESETS = [0.5, 1, 5, 10];

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
 * Sponsor flow — anyone (not just players) can call boostPrize to top up a
 * match's prize pool. Reads the target match to display its current pool +
 * status before approving + writing.
 */
export function BoostPrizePanel() {
  const { kind } = useChainKind();

  const { address, isConnected } = useAccount();
  const [matchIdRaw, setMatchIdRaw] = useState("");
  const [amount, setAmount] = useState<number>(1);
  const [phase, setPhase] = useState<"idle" | "approving" | "boosting">("idle");

  const matchId = useMemo(() => {
    const trimmed = matchIdRaw.trim();
    if (!trimmed) return undefined;
    try {
      return BigInt(trimmed);
    } catch {
      return undefined;
    }
  }, [matchIdRaw]);

  const amountWei = parseUnits(amount.toString(), 18);

  const { data: match } = useReadContract({
    abi: snakAbi,
    address: SNAK_ADDRESS,
    functionName: "matches",
    args: matchId !== undefined ? [matchId] : undefined,
    query: {
      enabled: kind === "celo" && isSnakDeployed && matchId !== undefined,
      refetchInterval: 20_000,
    },
  });

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    abi: erc20Abi,
    address: CUSD_ADDRESS,
    functionName: "allowance",
    args: address ? [address, SNAK_ADDRESS] : undefined,
    query: {
      enabled: kind === "celo" && isConnected && isSnakDeployed && !!address,
      refetchInterval: 30_000,
    },
  });

  const { writeContract, data: hash, isPending, reset } = useWriteContract();
  const { isLoading: mining, isSuccess: confirmed } = useWaitForTransactionReceipt({
    hash,
    query: { enabled: !!hash },
  });

  // Refetch allowance after the approve receipt confirms so the next click
  // actually fires boostPrize instead of sending another approve.
  useEffect(() => {
    if (confirmed && phase === "approving") {
      void refetchAllowance();
      setPhase("idle");
    }
  }, [confirmed, phase, refetchAllowance]);

  const tuple = match as unknown as MatchTuple | undefined;
  const status = tuple?.[6] ?? -1;
  const validStatus = status === 0 || status === 1; // Open or Locked
  const stakedEnough = (allowance as bigint | undefined) ?? 0n;
  const needsApprove = stakedEnough < amountWei;
  const canSubmit =
    isConnected &&
    isSnakDeployed &&
    matchId !== undefined &&
    validStatus &&
    amountWei > 0n &&
    !mining &&
    !isPending;

  function submit() {
    if (!isConnected || matchId === undefined) return;
    if (needsApprove) {
      setPhase("approving");
      writeContract({
        abi: erc20Abi,
        address: CUSD_ADDRESS,
        functionName: "approve",
        args: [SNAK_ADDRESS, amountWei],
      });
      return;
    }
    setPhase("boosting");
    writeContract({
      abi: snakAbi,
      address: SNAK_ADDRESS,
      functionName: "boostPrize",
      args: [matchId, amountWei],
    });
  }

  const cta = mining
    ? phase === "approving"
      ? "Approving…"
      : "Boosting…"
    : isPending
      ? "Confirm in wallet"
      : needsApprove
        ? `Approve $${amount} cUSD`
        : `Boost $${amount} →`;

  if (kind === "stacks") {
    return <CeloOnlyNotice feature="Boost Prize" />;
  }

  return (
    <div className="bg-carbon/80 border border-magenta/30 rounded-lg p-5 text-snow font-mono space-y-4">
      <div className="space-y-2">
        <div className="text-[10px] uppercase tracking-[0.2em] text-silver">MATCH ID</div>
        <input
          inputMode="numeric"
          value={matchIdRaw}
          onChange={(e) => setMatchIdRaw(e.target.value)}
          placeholder="0"
          className="w-full bg-void border border-ash rounded px-3 py-2 text-snow text-sm focus:outline-none focus:border-magenta"
        />
      </div>

      {matchId !== undefined && (
        <div className="text-xs text-silver">
          {tuple === undefined ? (
            "scanning…"
          ) : validStatus ? (
            <>
              <span className="text-toxic">
                pool ${Number(formatUnits(tuple[2], 18)).toFixed(2)}
              </span>{" "}
              ·{" "}
              <span>
                {tuple[5]}/{tuple[4]} slots
              </span>{" "}
              · status {status === 0 ? "OPEN" : "LOCKED"}
            </>
          ) : (
            <span className="text-magenta">match already settled / cancelled</span>
          )}
        </div>
      )}

      <div>
        <div className="text-[10px] uppercase tracking-[0.2em] text-silver mb-2">BOOST</div>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setAmount(p)}
              className={`px-3 py-1.5 min-h-[44px] text-xs rounded border transition-colors ${
                amount === p
                  ? "border-magenta text-magenta"
                  : "border-ash text-silver hover:text-snow"
              }`}
            >
              ${p}
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={submit}
        disabled={!canSubmit}
        className="w-full px-4 py-3 rounded border border-magenta bg-magenta/10 hover:bg-magenta/20 text-magenta uppercase tracking-widest text-sm disabled:opacity-30"
      >
        {cta}
      </button>

      {hash && (
        <button type="button" onClick={() => reset()} className="text-[11px] text-silver underline">
          reset
        </button>
      )}

      {!isConnected && (
        <p className="text-[11px] text-silver">CONNECT_RIG to sponsor a match.</p>
      )}
      {isConnected && !isSnakDeployed && (
        <p className="text-[11px] text-magenta">ARENA_OFFLINE — contract not yet configured.</p>
      )}
    </div>
  );
}
