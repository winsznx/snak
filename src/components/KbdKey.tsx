import type { ReactNode } from "react";

export function KbdKey({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <kbd
      className={`inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded border border-cyan/30 bg-void px-1 font-mono text-[11px] text-cyan ${className}`}
    >
      {children}
    </kbd>
  );
}
