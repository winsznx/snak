import type { ReactNode } from "react";

type Props = { title: string; description?: ReactNode; action?: ReactNode; className?: string };

export function EmptyState({ title, description, action, className = "" }: Props) {
  return (
    <div
      className={`flex flex-col items-center gap-3 rounded-lg border border-cyan/20 bg-carbon px-6 py-16 text-center ${className}`}
    >
      <h3 className="font-display text-lg font-bold uppercase tracking-[0.1em] text-snow">{title}</h3>
      {description && <p className="max-w-md text-sm text-silver">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
