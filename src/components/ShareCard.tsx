"use client";

import { QrCode } from "./QrCode";

type Props = {
  matchId: string | number;
  stake?: string;
  url: string;
  className?: string;
};

/**
 * Vertical share card for a match. Pure dark-mode — the cyberpunk theme
 * doesn't want a white card breaking the void background.
 */
export function ShareCard({ matchId, stake, url, className = "" }: Props) {
  return (
    <div
      className={`flex w-full max-w-sm flex-col gap-5 rounded-2xl border border-cyan/30 bg-carbon/80 p-6 shadow-[0_0_40px_rgba(0,229,255,0.08)] ${className}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-[0.2em] font-mono text-cyan">
          arena · {matchId}
        </span>
        {stake && (
          <span className="rounded-full border border-cyan/30 bg-void px-2.5 py-1 text-[11px] uppercase tracking-wide font-mono text-cyan">
            {stake} cUSD
          </span>
        )}
      </div>

      <div className="flex items-center justify-center rounded-xl border border-cyan/20 bg-void p-4">
        <QrCode value={url} size={208} alt={`QR for arena ${matchId}`} />
      </div>

      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="truncate font-mono text-xs text-cyan/70 hover:text-cyan"
      >
        {url}
      </a>
    </div>
  );
}
