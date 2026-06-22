"use client";

import Link from "next/link";

export default function PlayError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="app-shell flex min-h-[100svh] items-center justify-center px-5 py-20">
      <div className="rounded-lg border border-magenta/40 bg-carbon/80 p-8 text-center backdrop-blur">
        <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-magenta">arena failure</div>
        <h1 className="mt-3 font-display text-2xl font-bold uppercase tracking-[0.1em] text-snow">
          Arena did not boot
        </h1>
        <p className="mt-3 max-w-sm text-sm text-silver">
          Match-state read failed mid-render. Re-init the arena or head back.
        </p>
        {error.digest && (
          <p className="mt-3 font-mono text-[11px] text-silver/60">trace: {error.digest}</p>
        )}
        <div className="mt-6 flex justify-center gap-3">
          <button type="button" onClick={reset} className="rounded border border-cyan bg-cyan/10 px-4 py-2 text-sm font-mono uppercase tracking-widest text-cyan">
            Re-init
          </button>
          <Link href="/" className="rounded border border-cyan/30 px-4 py-2 text-sm font-mono uppercase tracking-widest text-silver">
            Home
          </Link>
        </div>
      </div>
    </main>
  );
}
