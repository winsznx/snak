"use client";

import { addressUrl } from "@/lib/celoscan";
import { shortAddr } from "@/lib/format";
import { useClipboard } from "@/lib/useClipboard";

type Props = { address: string; chainId?: number; linkToScan?: boolean };

export function AddressChip({ address, chainId, linkToScan = true }: Props) {
  const { copied, copy } = useClipboard();
  const label = shortAddr(address);

  if (!linkToScan) {
    return (
      <button
        type="button"
        onClick={() => copy(address)}
        className="inline-flex items-center gap-1 font-mono text-sm text-cloud"
        title={copied ? "Copied" : "Copy"}
      >
        {label}
        <span aria-hidden className="text-xs text-silver">
          {copied ? "✓" : "⧉"}
        </span>
      </button>
    );
  }

  return (
    <span className="inline-flex items-center gap-1">
      <a
        href={addressUrl(address, chainId)}
        target="_blank"
        rel="noreferrer"
        className="font-mono text-sm text-cyan hover:text-snow"
      >
        {label}
      </a>
      <button
        type="button"
        onClick={() => copy(address)}
        aria-label={copied ? "Copied" : "Copy address"}
        className="text-xs text-silver hover:text-cyan"
      >
        {copied ? "✓" : "⧉"}
      </button>
    </span>
  );
}
