"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[snak] route error:", error);
  }, [error]);

  return (
    <main className="app-shell flex min-h-screen items-center justify-center px-5 py-20">
      <div className="rounded-lg border border-cyan/30 bg-carbon/80 p-8 text-center backdrop-blur">
        <div className="text-[11px] uppercase tracking-[0.2em] text-magenta font-mono">system fault</div>
        <h1 className="mt-3 text-2xl font-bold text-snow">The grid blinked</h1>
        <p className="mt-3 max-w-sm text-sm text-silver">
          A route handler crashed mid-render. Your match state is on chain — refresh to recover.
        </p>
        {error.digest && (
          <p className="mt-3 font-mono text-[11px] text-silver/60">trace: {error.digest}</p>
        )}
        <div className="mt-6 flex justify-center gap-3">
          <button type="button" onClick={reset} className="rounded border border-cyan bg-cyan/10 px-4 py-2 text-sm font-mono uppercase tracking-widest text-cyan hover:bg-cyan/20">
            Reset
          </button>
          <Link href="/" className="rounded border border-cyan/30 px-4 py-2 text-sm font-mono uppercase tracking-widest text-silver hover:text-cyan">
            Home
          </Link>
        </div>
      </div>
    </main>
  );
}
