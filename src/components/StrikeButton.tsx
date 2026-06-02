"use client";

import { useEffect, useState } from "react";
import { useAccount, useReadContract, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { useChainKind } from "@/chain/ChainProvider";
import { connectStacks, readStacksSession } from "@/chain/stacksSession";
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
  const [stxConnected, setStxConnected] = useState(false);

  useEffect(() => {
    if (kind !== "stacks") return;
    setStxConnected(readStacksSession().isConnected);
  }, [kind]);

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
      setStxConnected(s.isConnected);
      if (!s.isConnected) return;
    }
    await stx.call({
      contractAddress: SNAK_STX_DEPLOYER,
      contractName: SNAK_STX_STRIKE_CONTRACT,
      functionName: SNAK_STX_DAILY_STRIKE_FN,
      args: [],
    });
  }

  const ctaCelo = mining
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

  const ctaStacks = stx.pending
    ? "sign in wallet…"
    : stx.txid
      ? "struck on stacks ✓"
      : stxConnected
        ? "daily strike ▸"
        : "connect stacks ▸";

  const cta = kind === "celo" ? ctaCelo : ctaStacks;

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
