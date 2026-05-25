"use client";

import type { ReactNode } from "react";
import { useAccount } from "wagmi";
import { ConnectButton } from "./ConnectButton";

type Props = {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackBody?: string;
};

/**
 * Wraps any wallet-dependent panel so disconnected users see a single Connect
 * CTA rather than empty placeholders or wagmi errors.
 */
export function ConnectGate({
  children,
  fallbackTitle = "Connect to enter the arena",
  fallbackBody = "Snak reads escrow + stakes straight from your wallet — no account.",
}: Props) {
  const { isConnected } = useAccount();
  if (isConnected) return <>{children}</>;
  return (
    <div className="rounded-lg border border-cyan/20 bg-carbon p-6 text-center">
      <h3 className="font-display text-lg font-bold uppercase tracking-[0.1em] text-snow">
        {fallbackTitle}
      </h3>
      <p className="mt-2 text-sm text-silver">{fallbackBody}</p>
      <div className="mt-4 inline-flex">
        <ConnectButton />
      </div>
    </div>
  );
}
