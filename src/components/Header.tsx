import Link from "next/link";
import { ConnectButton } from "./ConnectButton";
import { NavDrawer } from "./NavDrawer";
import { NetworkSelector } from "./NetworkSelector";

export function Header({ showWallet = true }: { showWallet?: boolean }) {
  return (
    <header className="sticky top-3 z-50 px-3">
      <div className="container-page nav-frame flex min-h-[60px] md:min-h-[72px] items-center justify-between gap-2 px-3 md:gap-5 md:px-6">
        <Link href="/" className="flex min-w-0 items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-cyan/40 bg-void shadow-[0_0_15px_rgba(0,229,255,0.2)]">
            <span className="h-4 w-4 rounded-sm bg-toxic glow-toxic animate-pulse-neon" />
          </span>
          <span className="flex min-w-0 flex-col leading-none">
            <span className="font-display text-xl font-bold uppercase tracking-[0.2em] text-snow glow-text-cyan">
              Snak
            </span>
            <span className="mt-1 hidden max-w-[180px] truncate font-mono text-[10px] uppercase tracking-widest text-silver sm:block">
              Onchain arena
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 rounded-lg bg-carbon/80 p-1 md:flex">
          <Link href="/play" className="nav-link">Arena</Link>
          <Link href="/leaderboard" className="nav-link">Rankings</Link>
          <Link href="/play#boost" className="nav-link">Boost</Link>
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <NetworkSelector />
          {showWallet ? <ConnectButton /> : null}
          <Link href="/play" className="hidden sm:inline-flex btn-primary btn-compact">
            Enter Arena
          </Link>
          <NavDrawer />
        </div>
      </div>
    </header>
  );
}
