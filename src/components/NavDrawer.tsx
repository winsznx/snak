"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

const LINKS = [
  { href: "/play", label: "Arena" },
  { href: "/leaderboard", label: "Rankings" },
  { href: "/play#boost", label: "Boost" },
  { href: "/", label: "Home" },
];

export function NavDrawer() {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Move focus into the dialog on open so keyboard users land inside the
    // modal instead of staying on the trigger behind the overlay.
    closeBtnRef.current?.focus();

    const focusable = () =>
      Array.from(
        dialogRef.current?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      );

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        return;
      }
      if (e.key !== "Tab") return;
      const nodes = focusable();
      if (nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
      // Restore focus to the trigger so the user lands back where they were.
      triggerRef.current?.focus();
    };
  }, [open]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        aria-expanded={open}
        aria-haspopup="dialog"
        className="grid h-10 w-10 place-items-center rounded-md border border-cyan/30 bg-carbon md:hidden"
      >
        <span aria-hidden className="text-lg leading-none text-cyan">☰</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-[80] md:hidden">
          {/* aria-hidden div instead of <button> so the backdrop doesn't enter
              the focus order in front of the dialog. */}
          <div
            aria-hidden="true"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-void/80 backdrop-blur-sm"
          />
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            className="absolute inset-y-0 right-0 flex w-[min(320px,86vw)] flex-col gap-3 border-l border-cyan/30 bg-carbon p-6 shadow-[0_0_60px_rgba(0,229,255,0.15)]"
          >
            <div className="flex items-center justify-between">
              <span className="font-display text-lg font-bold uppercase tracking-[0.2em] text-snow">
                Snak
              </span>
              <button
                ref={closeBtnRef}
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
