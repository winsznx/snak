"use client";

import { useEffect } from "react";
import { CopyButton } from "./CopyButton";
import { QrCode } from "./QrCode";
import { tweetLink, telegramLink, whatsAppLink, shareText } from "@/lib/share";

type Props = { open: boolean; onClose: () => void; url: string; stake?: string };

export function MobileShareSheet({ open, onClose, url, stake }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  const text = shareText(stake);

  return (
    <div className="fixed inset-0 z-[85] flex items-end justify-center" role="dialog" aria-modal="true">
      <button aria-label="Close" onClick={onClose} className="absolute inset-0 bg-void/80 backdrop-blur-sm" />
      <div className="relative w-full max-w-md rounded-t-lg border-t border-cyan/30 bg-carbon p-5">
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-cyan/40" />
        <div className="flex flex-col items-center gap-4">
          <div className="rounded-lg border border-cyan/20 bg-void p-3">
            <QrCode value={url} size={184} />
          </div>
          <div className="grid w-full grid-cols-3 gap-2">
            <a href={whatsAppLink(text, url)} target="_blank" rel="noreferrer" className="rounded border border-cyan/30 py-2 text-center font-mono text-xs uppercase tracking-widest text-cyan">WhatsApp</a>
            <a href={tweetLink(text, url)} target="_blank" rel="noreferrer" className="rounded border border-cyan/30 py-2 text-center font-mono text-xs uppercase tracking-widest text-cyan">X</a>
            <a href={telegramLink(text, url)} target="_blank" rel="noreferrer" className="rounded border border-cyan/30 py-2 text-center font-mono text-xs uppercase tracking-widest text-cyan">Telegram</a>
          </div>
          <div className="flex w-full items-center justify-between gap-2 rounded border border-cyan/20 bg-void px-3 py-2">
            <span className="truncate font-mono text-xs text-silver">{url}</span>
            <CopyButton value={url} />
          </div>
        </div>
      </div>
    </div>
  );
}
