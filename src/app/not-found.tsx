import Link from "next/link";

export default function NotFound() {
  return (
    <main className="app-shell flex min-h-screen items-center justify-center px-5 py-20">
      <div className="text-center">
        <div className="text-[11px] uppercase tracking-[0.25em] text-magenta font-mono">404 · void</div>
        <h1 className="mt-4 font-display text-3xl font-bold uppercase tracking-[0.15em] text-snow glow-text-cyan">
          Sector unmapped
        </h1>
        <p className="mt-4 max-w-md text-sm text-silver">
          That arena id doesn't exist on this network — or it never spawned.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link
            href="/"
            className="rounded border border-cyan bg-cyan/10 px-4 py-2 text-sm font-mono uppercase tracking-widest text-cyan hover:bg-cyan/20"
          >
            Home
          </Link>
          <Link
            href="/play"
            className="rounded border border-toxic/40 px-4 py-2 text-sm font-mono uppercase tracking-widest text-toxic hover:bg-toxic/10"
          >
            Open arena
          </Link>
        </div>
      </div>
    </main>
  );
}
