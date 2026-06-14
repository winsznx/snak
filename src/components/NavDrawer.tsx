"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const LINKS = [
  { href: "/play", label: "Arena" },
  { href: "/leaderboard", label: "Rankings" },
  { href: "/leaderboard#bounty", label: "Bounty" },
  { href: "/", label: "Home" },
];

export function NavDrawer() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        aria-expanded={open}
        className="grid h-10 w-10 place-items-center rounded-md border border-cyan/30 bg-carbon md:hidden"
      >
        <span aria-hidden className="text-lg leading-none text-cyan">☰</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-[80] md:hidden">
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-void/80 backdrop-blur-sm"
          />
          <div
            role="dialog"
            aria-modal="true"
            className="absolute inset-y-0 right-0 flex w-[min(320px,86vw)] flex-col gap-3 border-l border-cyan/30 bg-carbon p-6 shadow-[0_0_60px_rgba(0,229,255,0.15)]"
          >
            <div className="flex items-center justify-between">
              <span className="font-display text-lg font-bold uppercase tracking-[0.2em] text-snow">
                Snak
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="h-9 w-9 rounded-md border border-cyan/30 text-cyan"
              >
                ×
              </button>
            </div>
            <nav className="mt-4 flex flex-col">
              {LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="border-b border-cyan/10 py-3 font-mono text-sm uppercase tracking-widest text-snow hover:text-cyan"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
