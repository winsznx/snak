"use client";

import { useAccount, useReadContract, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { snakAbi } from "@/lib/abi/snak";
import { useNowSec } from "@/lib/useNowSec";
import { SNAK_ADDRESS, isSnakDeployed } from "@/lib/wagmi";

const COOLDOWN_SEC = 22 * 60 * 60; // Snak.STRIKE_COOLDOWN

export function StrikeButton() {
  const { address, isConnected } = useAccount();
  const nowSec = useNowSec();

  const { data: last } = useReadContract({
    abi: snakAbi,
    address: SNAK_ADDRESS,
    functionName: "lastStrike",
    args: address ? [address] : undefined,
    query: { enabled: isConnected && isSnakDeployed && !!address, refetchInterval: 60_000 },
  });

  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: mining, isSuccess } = useWaitForTransactionReceipt({ hash });

  const lastTs = typeof last === "bigint" ? Number(last) : 0;
  const secondsLeft = lastTs === 0 ? 0 : Math.max(0, lastTs + COOLDOWN_SEC - nowSec);
  const onCooldown = secondsLeft > 0;

  const canSubmit = isConnected && isSnakDeployed && !onCooldown && !mining && !isPending;

  function submit() {
    writeContract({
      abi: snakAbi,
      address: SNAK_ADDRESS,
      functionName: "dailyStrike",
      args: [],
    });
  }

  const cta = mining
    ? "striking…"
    : isPending
      ? "sign…"
      : isSuccess
        ? "struck ✓"
        : onCooldown
          ? fmt(secondsLeft)
          : !isConnected
            ? "jack in"
            : "daily strike ▸";

  return (
    <button
      type="button"
      onClick={submit}
      disabled={!canSubmit}
      className="px-3 py-2 rounded border border-toxic/40 bg-carbon font-mono text-[11px] uppercase tracking-widest text-toxic hover:border-toxic disabled:opacity-30"
    >
      {cta}
    </button>
  );
}

function fmt(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `wait ${h}h ${m}m` : `wait ${m}m`;
}
