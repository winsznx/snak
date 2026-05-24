"use client";

import type { ReactNode } from "react";

type Props = {
  title?: string;
  description?: ReactNode;
  hint?: ReactNode;
  onRetry?: () => void;
  className?: string;
};

export function ErrorState({
  title = "System fault",
  description,
  hint,
  onRetry,
  className = "",
}: Props) {
  return (
    <div
      role="alert"
      className={`flex flex-col items-center gap-3 rounded-lg border border-magenta/40 bg-carbon px-6 py-12 text-center ${className}`}
    >
      <span aria-hidden className="text-2xl text-magenta">⚠</span>
      <h3 className="font-display text-lg font-bold uppercase tracking-[0.1em] text-snow">{title}</h3>
      {description && <p className="max-w-md text-sm text-silver">{description}</p>}
      {hint && <p className="font-mono text-xs text-silver/70">{hint}</p>}
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-1 rounded border border-cyan bg-cyan/10 px-4 py-1.5 font-mono text-xs uppercase tracking-widest text-cyan"
        >
          Re-init
        </button>
      )}
    </div>
  );
}
