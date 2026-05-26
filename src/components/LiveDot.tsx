type Props = { active?: boolean; className?: string; label?: string };

export function LiveDot({ active = true, className = "", label }: Props) {
  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      <span
        aria-hidden
        className={`inline-block h-1.5 w-1.5 rounded-full ${active ? "bg-toxic animate-pulse-neon" : "bg-silver/50"}`}
      />
      {label && (
        <span className="font-mono text-[10px] uppercase tracking-widest text-silver">{label}</span>
      )}
    </span>
  );
}
