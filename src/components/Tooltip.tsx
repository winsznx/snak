"use client";

import { useState, type ReactNode } from "react";

type Props = { children: ReactNode; content: ReactNode; side?: "top" | "bottom" };

export function Tooltip({ children, content, side = "top" }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      {children}
      {open && (
        <span
          role="tooltip"
          className={`pointer-events-none absolute left-1/2 -translate-x-1/2 whitespace-nowrap rounded border border-cyan/30 bg-void px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-silver shadow-[0_0_20px_rgba(0,229,255,0.15)] ${
            side === "top" ? "bottom-full mb-1" : "top-full mt-1"
          }`}
        >
          {content}
        </span>
      )}
    </span>
  );
}
