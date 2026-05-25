"use client";

import { useChainKind } from "@/chain/ChainProvider";
import { CHAIN_KIND_LABEL, type ChainKind } from "@/chain/chainKinds";

const ORDER: ChainKind[] = ["celo", "stacks"];

export function NetworkSelector() {
  const { kind, setKind } = useChainKind();
  return (
    <div
      className="flex items-center rounded-md border border-ash bg-carbon p-1"
      role="group"
      aria-label="Network selector"
    >
      {ORDER.map((k) => {
        const active = k === kind;
        return (
          <button
            key={k}
            type="button"
            onClick={() => setKind(k)}
            className={[
              "rounded px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-widest transition-colors sm:px-3",
              active ? "bg-cyan/10 text-cyan shadow-[0_0_12px_rgba(0,229,255,0.18)]" : "text-silver hover:text-snow",
            ].join(" ")}
            aria-pressed={active}
          >
            {CHAIN_KIND_LABEL[k]}
          </button>
        );
      })}
    </div>
  );
}

