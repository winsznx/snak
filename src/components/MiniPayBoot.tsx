"use client";

import { useEffect, useRef } from "react";
import { useAccount, useConnect } from "wagmi";
import { injected } from "wagmi/connectors";

/**
 * MiniPay auto-connect. When the app is loaded inside the MiniPay in-app
 * browser, `window.ethereum.isMiniPay` is true — we auto-connect the injected
 * wallet so the user never sees a connect button. Outside MiniPay this is a
 * no-op.
 */
export function MiniPayBoot() {
  const { isConnected } = useAccount();
  const { connect } = useConnect();
  const tried = useRef(false);

  useEffect(() => {
    if (tried.current || isConnected) return;
    const eth = (globalThis as { ethereum?: { isMiniPay?: boolean } }).ethereum;
    if (eth?.isMiniPay) {
      tried.current = true;
      // MiniPay injects window.ethereum with isMiniPay=true but does NOT set
      // isMetaMask, so wagmi's injected({ target: "metaMask" }) target
      // descriptor (which keys off isMetaMask) fails to discover MiniPay's
      // provider in newer builds. Bare injected() picks up window.ethereum
      // directly, matching MiniPay's own integration guidance.
      connect({ connector: injected() });
    }
  }, [isConnected, connect]);

  return null;
}
