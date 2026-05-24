export function Divider({ label, className = "" }: { label?: string; className?: string }) {
  if (!label) {
    return <hr className={`border-t border-cyan/15 ${className}`} />;
  }
  return (
    <div
      className={`flex items-center gap-3 font-mono text-[10px] uppercase tracking-widest text-silver ${className}`}
    >
      <span className="flex-1 border-t border-cyan/15" />
      <span>{label}</span>
      <span className="flex-1 border-t border-cyan/15" />
    </div>
  );
}
