"use client";

import Link from "next/link";

export default function LeaderboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="app-shell">
      <div className="container-page py-20">
        <div className="rounded-lg border border-magenta/40 bg-carbon p-8 text-center">
          <div className="font-mono text-[11px] uppercase tracking-[0.25em] text-magenta">
            index failure
          </div>
          <h1 className="mt-3 font-display text-2xl font-bold uppercase tracking-[0.1em] text-snow">
            Could not index events
          </h1>
          <p className="mt-3 max-w-md text-sm text-silver">
            Forno may be rate-limiting. Retry in a minute or jump back home.
          </p>
          {error.digest && (
            <p className="mt-3 font-mono text-[11px] text-silver/60">trace: {error.digest}</p>
          )}
          <div className="mt-6 flex justify-center gap-3">
            <button type="button" onClick={reset} className="rounded border border-cyan bg-cyan/10 px-4 py-2 text-sm font-mono uppercase tracking-widest text-cyan">
              Retry
            </button>
            <Link href="/" className="rounded border border-cyan/30 px-4 py-2 text-sm font-mono uppercase tracking-widest text-silver">
              Home
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
