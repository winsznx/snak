import Link from "next/link";

export function EmptyArena() {
  return (
    <div className="rounded-lg border border-cyan/20 bg-carbon p-8 text-center">
      <div className="font-mono text-[10px] uppercase tracking-widest text-silver">
        no live arenas
      </div>
      <h3 className="mt-2 font-display text-lg font-bold uppercase tracking-[0.1em] text-snow">
        Spin one up
      </h3>
      <p className="mt-2 text-sm text-silver">
        Pick a stake, deadline, and player cap to seed the first match — others will join.
      </p>
      <Link
        href="/play"
        className="mt-4 inline-flex items-center rounded border border-cyan bg-cyan/10 px-4 py-2 font-mono text-xs uppercase tracking-widest text-cyan hover:bg-cyan/20"
      >
        Host arena →
      </Link>
    </div>
  );
}
