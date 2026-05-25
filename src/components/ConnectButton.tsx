"use client";

import { useEffect, useMemo, useState } from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { useChainKind } from "@/chain/ChainProvider";
import { connectStacks, disconnectStacks, readStacksSession } from "@/chain/stacksSession";

const short = (a: string) => `${a.slice(0, 5)}…${a.slice(-3)}`;

export function ConnectButton() {
  const { kind } = useChainKind();
  const { address, isConnected } = useAccount();
  const { connectors, connect, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const [open, setOpen] = useState(false);
  const [stxAddr, setStxAddr] = useState<string | null>(null);

  const baseClass =
    "px-4 py-2 rounded border border-cyan/40 bg-carbon font-mono text-xs uppercase tracking-widest text-cyan hover:border-cyan hover:shadow-[0_0_15px_rgba(0,229,255,0.4)] transition-all";

  useEffect(() => {
    if (kind !== "stacks") return;
    const t = window.setTimeout(() => {
      const snap = readStacksSession();
      setStxAddr(snap.address);
    }, 0);
    return () => window.clearTimeout(t);
  }, [kind]);

  const isStacksConnected = useMemo(() => kind === "stacks" && !!stxAddr, [kind, stxAddr]);

  if (kind === "stacks") {
    if (isStacksConnected && stxAddr) {
      return (
        <button
          type="button"
          onClick={() => {
            disconnectStacks();
            setStxAddr(null);
          }}
          className={baseClass}
          title="Disconnect"
        >
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-toxic mr-2 align-middle animate-pulse-neon" />
          {short(stxAddr)}
        </button>
      );
    }
    return (
      <button
        type="button"
        disabled={isPending}
        className={baseClass}
        onClick={async () => {
          try {
            await connectStacks();
          } finally {
            const snap = readStacksSession();
            setStxAddr(snap.address);
          }
        }}
      >
        ▸ STACKS_RIG
      </button>
    );
  }

  if (isConnected && address) {
    return (
      <button type="button" onClick={() => disconnect()} className={baseClass} title="Disconnect">
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-toxic mr-2 align-middle animate-pulse-neon" />
        {short(address)}
      </button>
    );
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} disabled={isPending} className={baseClass}>
        ▸ JACK_IN
      </button>
    );
  }

  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen(false)} className={baseClass}>
        SELECT_RIG
      </button>
      <div className="absolute right-0 top-full mt-2 w-56 bg-carbon border border-cyan/40 rounded p-2 z-50 space-y-1 shadow-[0_0_30px_rgba(0,229,255,0.2)]">
        {connectors.length === 0 ? (
          <p className="text-xs text-silver font-mono p-2">no_signal</p>
        ) : (
          connectors.map((c) => (
            <button
              key={c.uid}
              type="button"
              onClick={() => {
                connect({ connector: c });
                setOpen(false);
              }}
              disabled={isPending}
              className="w-full text-left px-3 py-2 rounded font-mono text-xs uppercase text-snow hover:bg-graphite border border-transparent hover:border-cyan/40 disabled:opacity-50"
            >
              {c.name}
            </button>
          ))
        )}
      </div>
    </div>
  );
}
