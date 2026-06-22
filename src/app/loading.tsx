export default function Loading() {
  return (
    <main className="app-shell flex min-h-[100svh] items-center justify-center px-5 py-20">
      <div className="flex flex-col items-center gap-4 text-center">
        <span className="h-6 w-6 animate-pulse rounded bg-toxic glow-toxic" />
        <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-silver">
          Spinning up arena
        </span>
      </div>
    </main>
  );
}
