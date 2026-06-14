"use client";

import { useEffect, useMemo, useState } from "react";
import { erc20Abi, parseEventLogs, parseUnits } from "viem";
import {
  useAccount,
  useReadContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { useChainKind } from "@/chain/ChainProvider";
import { connectStacks, readStacksSession } from "@/chain/stacksSession";
import { useStacksWrite } from "@/chain/useStacksWrite";
import {
  SNAK_STX_CONTRACT,
  SNAK_STX_CREATE_MATCH_FN,
  SNAK_STX_DEPLOYER,
} from "@/chain/stacksContracts";
import { snakAbi } from "@/lib/abi/snak";
import { CUSD_ADDRESS, SNAK_ADDRESS, isSnakDeployed } from "@/lib/wagmi";

const STAKE_PRESETS = [0.5, 1, 2, 5];
const PLAYER_PRESETS = [4, 6, 10, 20];
const DURATION_OPTIONS = [
  { label: "30 MIN", seconds: 30 * 60 },
  { label: "1 HR", seconds: 60 * 60 },
  { label: "3 HR", seconds: 3 * 60 * 60 },
  { label: "12 HR", seconds: 12 * 60 * 60 },
];

/**
 * Single-shot create-match form. Approves cUSD only when the existing allowance
 * is below the chosen stake (so the host's first match is two-tx, subsequent
 * matches at the same stake are one-tx).
 */
export function CreateMatchPanel() {
  const { kind } = useChainKind();
  const { address, isConnected } = useAccount();
  const [stake, setStake] = useState<number>(1);
  const [maxPlayers, setMaxPlayers] = useState<number>(6);
  const [durationSec, setDurationSec] = useState<number>(60 * 60);
  const [phase, setPhase] = useState<"idle" | "approving" | "creating">("idle");
  const stx = useStacksWrite();

  const stakeWei = parseUnits(stake.toString(), 18);

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    abi: erc20Abi,
    address: CUSD_ADDRESS,
    functionName: "allowance",
    args: address ? [address, SNAK_ADDRESS] : undefined,
    query: { enabled: isConnected && isSnakDeployed && !!address },
  });

  const { writeContract, data: hash, reset, isPending } = useWriteContract();
  const { isLoading: mining, isSuccess: confirmed, data: receipt } = useWaitForTransactionReceipt({
    hash,
    query: { enabled: !!hash },
  });

  // wagmi v2 caches the initial allowance read — without an explicit refetch
  // after the approve receipt lands, the next click sees the stale pre-
  // approve value, still thinks an approve is needed, and sends another one.
  // The user dead-ends in an infinite approve loop. Force the refetch the
  // moment the approve receipt confirms.
  useEffect(() => {
    if (confirmed && phase === "approving") {
      void refetchAllowance();
      setPhase("idle");
    }
  }, [confirmed, phase, refetchAllowance]);

  // Parse the ArenaCreated event so the host gets a real match id to share —
  // without this, the create flow ends at "tx 0xab…" and the host has no way
  // to invite friends without guessing the next matchId.
  const matchId = useMemo<bigint | null>(() => {
    if (!receipt) return null;
    try {
      const events = parseEventLogs({
        abi: snakAbi,
        eventName: "ArenaCreated",
        logs: receipt.logs,
      });
      const ev = events[0];
      if (ev && "args" in ev) {
        return (ev.args as { matchId: bigint }).matchId;
      }
    } catch {
      /* approve receipt won't carry ArenaCreated — ignore */
    }
    return null;
  }, [receipt]);

  const needsApprove = kind === "celo" && (!allowance || (allowance as bigint) < stakeWei);
  const enabledCelo = isConnected && isSnakDeployed && !mining && !isPending;
  const enabledStacks = !stx.pending;
  const enabled = kind === "celo" ? enabledCelo : enabledStacks;

  async function submit() {
    if (kind === "celo") {
      if (!isConnected) return;
      if (needsApprove) {
        setPhase("approving");
        writeContract({
          abi: erc20Abi,
          address: CUSD_ADDRESS,
          functionName: "approve",
          args: [SNAK_ADDRESS, stakeWei],
        });
        return;
      }
      setPhase("creating");
      const deadline = BigInt(Math.floor(Date.now() / 1000) + durationSec);
      writeContract({
        abi: snakAbi,
        address: SNAK_ADDRESS,
        functionName: "createMatch",
        args: [stakeWei, maxPlayers, deadline],
      });
      return;
    }

    let s = readStacksSession();
    if (!s.isConnected) {
      s = await connectStacks();
      if (!s.isConnected) return;
    }
    // Stacks deadline is a future block height — fetch tip from Hiro.
    let deadlineBlocks = 0n;
    try {
      const info = await fetch("https://api.hiro.so/v2/info").then((r) => r.json());
      const tip = BigInt(info?.stacks_tip_height ?? info?.burn_block_height ?? 0);
      deadlineBlocks = tip + BigInt(Math.max(1, Math.floor(durationSec / 600))); // ~600s per stacks block
    } catch {
      return;
    }
    const stakeMicroStx = BigInt(Math.floor(stake * 1_000_000));
    // NOTE on post-condition mode: the deployed `snak.create-match` Clarity
    // is currently a stub that doesn't stx-transfer? from tx-sender — so a
    // `deny + willSendEq(stake)` post-condition would cause the wallet to
    // refuse to sign with a post-condition violation. Flip to `deny` +
    // exact STX post-condition the same day the SIP-010 escrow lands in
    // snak.clar.
    await stx.call({
      contractAddress: SNAK_STX_DEPLOYER,
      contractName: SNAK_STX_CONTRACT,
      functionName: SNAK_STX_CREATE_MATCH_FN,
      args: [
        { type: "uint", value: stakeMicroStx },
        { type: "uint", value: BigInt(maxPlayers) },
        { type: "uint", value: deadlineBlocks },
      ],
    });
  }

  const ctaCelo = mining
    ? phase === "approving"
      ? "Approving stake…"
      : "Spinning up arena…"
    : needsApprove
      ? `Approve $${stake} cUSD`
      : "Open arena ▸";
  const ctaStacks = stx.pending
    ? "Sign on Stacks…"
    : stx.txid
      ? "Arena opened ✓"
      : `Open arena (${stake} STX) ▸`;
  const cta = kind === "celo" ? ctaCelo : ctaStacks;

  return (
    <div className="bg-carbon/80 border border-cyan/30 rounded-lg p-5 space-y-5 text-snow font-mono">
      <div>
        <div className="text-[10px] uppercase tracking-[0.2em] text-silver mb-2">STAKE</div>
        <div className="flex flex-wrap gap-2">
          {STAKE_PRESETS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStake(s)}
              className={`px-3 py-1.5 text-xs rounded border transition-colors ${
                stake === s
                  ? "border-toxic text-toxic"
                  : "border-ash text-silver hover:text-snow"
              }`}
            >
              ${s}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="text-[10px] uppercase tracking-[0.2em] text-silver mb-2">SLOTS</div>
        <div className="flex flex-wrap gap-2">
          {PLAYER_PRESETS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setMaxPlayers(p)}
              className={`px-3 py-1.5 text-xs rounded border transition-colors ${
                maxPlayers === p
                  ? "border-magenta text-magenta"
                  : "border-ash text-silver hover:text-snow"
              }`}
            >
              {p}P
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="text-[10px] uppercase tracking-[0.2em] text-silver mb-2">WINDOW</div>
        <div className="flex flex-wrap gap-2">
          {DURATION_OPTIONS.map((d) => (
            <button
              key={d.label}
              type="button"
              onClick={() => setDurationSec(d.seconds)}
              className={`px-3 py-1.5 text-xs rounded border transition-colors ${
                durationSec === d.seconds
                  ? "border-cyan text-cyan"
                  : "border-ash text-silver hover:text-snow"
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={submit}
        disabled={!enabled}
        className="w-full px-4 py-3 rounded border border-cyan bg-cyan/10 hover:bg-cyan/20 text-cyan uppercase tracking-widest text-sm disabled:opacity-30"
      >
        {cta}
      </button>
      {hash && (
        <button type="button" onClick={() => reset()} className="text-xs text-silver underline">
          reset
        </button>
      )}
      {matchId !== null && (
        <p className="text-[11px] font-mono uppercase tracking-widest text-toxic">
          MATCH_ID&nbsp;<span className="text-snow">#{matchId.toString()}</span>
          &nbsp;— share this id so friends can join via the JOIN_ARENA panel.
        </p>
      )}

      {!isConnected && (
        <p className="text-[11px] text-silver">CONNECT_RIG to spin up an arena.</p>
      )}
      {isConnected && !isSnakDeployed && (
        <p className="text-[11px] text-magenta">
          ARENA_OFFLINE — set NEXT_PUBLIC_SNAK_ADDRESS at build time.
        </p>
      )}
    </div>
  );
}
