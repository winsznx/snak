const LABELS: Record<number, { name: string; tone: string }> = {
  42220: { name: "Celo mainnet", tone: "bg-toxic" },
  44787: { name: "Alfajores", tone: "bg-amber" },
};

export function ChainBadge({ chainId, className = "" }: { chainId: number; className?: string }) {
  const info = LABELS[chainId] ?? { name: `Chain ${chainId}`, tone: "bg-silver" };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded border border-cyan/30 bg-carbon px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest text-silver ${className}`}
    >
      <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${info.tone}`} />
      {info.name}
    </span>
  );
}
