"use client";

import { useClipboard } from "@/lib/useClipboard";

type Props = { value: string; label?: string; copiedLabel?: string; className?: string };

export function CopyButton({ value, label = "Copy", copiedLabel = "Copied", className = "" }: Props) {
  const { copied, copy } = useClipboard();
  return (
    <button
      type="button"
      onClick={() => copy(value)}
      aria-live="polite"
      className={`rounded border border-cyan/30 px-3 py-1.5 font-mono text-xs uppercase tracking-widest text-cyan hover:bg-cyan/10 ${className}`}
    >
      {copied ? copiedLabel : label}
    </button>
  );
}
