"use client";

import { useEffect, useState } from "react";
import { useAccount, useReadContract, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { useChainKind } from "@/chain/ChainProvider";
import { connectStacks, readStacksSession } from "@/chain/stacksSession";
import { useStacksSession } from "@/chain/useStacksSession";
import { useStacksWrite } from "@/chain/useStacksWrite";
import {
  SNAK_STX_DAILY_STRIKE_FN,
  SNAK_STX_DEPLOYER,
  SNAK_STX_STRIKE_CONTRACT,
} from "@/chain/stacksContracts";
import { snakAbi } from "@/lib/abi/snak";
import { useNowSec } from "@/lib/useNowSec";
import { SNAK_ADDRESS, isSnakDeployed } from "@/lib/wagmi";

const COOLDOWN_SEC = 22 * 60 * 60; // Snak.STRIKE_COOLDOWN

export function StrikeButton() {
  const { kind } = useChainKind();
  const { address, isConnected } = useAccount();
  const nowSec = useNowSec();
  const stx = useStacksWrite();
  // Reactive subscription — without this the button stayed stuck on the old
  // principal after a header-driven Stacks connect, and "connect stacks ▸"
  // never flipped to "daily strike ▸" until the next render trigger.
  const { isConnected: stxConnected, address: stxPrincipalSession } = useStacksSession();

  const { data: last } = useReadContract({
    abi: snakAbi,
    address: SNAK_ADDRESS,
    functionName: "lastStrike",
    args: address ? [address] : undefined,
    query: {
      enabled: kind === "celo" && isConnected && isSnakDeployed && !!address,
      refetchInterval: 60_000,
    },
  });

  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: mining, isSuccess } = useWaitForTransactionReceipt({ hash });

  const lastTs = typeof last === "bigint" ? Number(last) : 0;
  const secondsLeft = lastTs === 0 ? 0 : Math.max(0, lastTs + COOLDOWN_SEC - nowSec);
  const onCooldown = kind === "celo" && secondsLeft > 0;

  const canSubmitCelo =
    kind === "celo" && isConnected && isSnakDeployed && !onCooldown && !mining && !isPending;
  const canSubmitStacks = kind === "stacks" && !stx.pending;
  const canSubmit = kind === "celo" ? canSubmitCelo : canSubmitStacks;

  async function submit() {
    if (kind === "celo") {
      writeContract({
        abi: snakAbi,
        address: SNAK_ADDRESS,
        functionName: "dailyStrike",
        args: [],
      });
      return;
    }
    let s = readStacksSession();
    if (!s.isConnected) {
      s = await connectStacks();
      if (!s.isConnected) return;
    }
    const res = await stx.call({
      contractAddress: SNAK_STX_DEPLOYER,
      contractName: SNAK_STX_STRIKE_CONTRACT,
      functionName: SNAK_STX_DAILY_STRIKE_FN,
      args: [],
    });
    if (res && s.address) {
      try {
        // Key by Stacks principal so switching wallets in the same browser
        // doesn't inherit the previous user's cooldown stamp.
        window.localStorage.setItem(`snak.strike.lastStx:${s.address}`, String(Date.now()));
      } catch {
        /* ignore */
      }
    }
  }

  // Surface a local cooldown after a successful Stacks strike so the user
  // doesn't fire the wallet popup repeatedly. The contract enforces the
  // real cooldown server-side; this just stops the optimistic UI from
  // letting the user spam through it.
  let stacksCooldownLabel: string | null = null;
  // Read the per-principal cooldown key so two wallets in the same browser
  // don't share each other's stamps. Falls back to the legacy unkeyed entry
  // for one release so users who struck before the key change still see
  // their cooldown surface.
  const stxPrincipal = stxPrincipalSession;
  if (typeof window !== "undefined" && kind === "stacks" && stxPrincipal) {
    try {
      const raw =
        window.localStorage.getItem(`snak.strike.lastStx:${stxPrincipal}`) ??
        window.localStorage.getItem("snak.strike.lastStx");
      if (raw) {
        const last = Number(raw);
        const remaining = COOLDOWN_SEC - Math.floor((Date.now() - last) / 1000);
        if (remaining > 0) stacksCooldownLabel = fmt(remaining);
      }
    } catch {
      /* ignore */
    }
  }

  const ctaCelo = mining
    ? "striking…"
    : isPending
      ? "sign…"
      : isSuccess && kind === "celo"
        ? "struck ✓"
        : onCooldown
          ? fmt(secondsLeft)
          : !isConnected
            ? "jack in"
            : "daily strike ▸";

  const ctaStacks = stx.pending
    ? "sign in wallet…"
    : stx.txid
      ? "struck on stacks ✓"
      : stacksCooldownLabel
        ? stacksCooldownLabel
        : stxConnected
          ? "daily strike ▸"
          : "connect stacks ▸";

  const cta = kind === "celo" ? ctaCelo : ctaStacks;

  return (
    <button
      type="button"
      onClick={submit}
      disabled={!canSubmit}
      className="px-3 py-2 min-h-[44px] min-w-[160px] inline-flex items-center justify-center rounded border border-toxic/40 bg-carbon font-mono text-[11px] uppercase tracking-widest text-toxic hover:border-toxic disabled:opacity-30"
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
