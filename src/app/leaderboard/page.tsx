import type { Metadata } from "next";
import Link from "next/link";
import { Leaderboard } from "@/components/Leaderboard";

export const metadata: Metadata = {
  title: "Rankings · Snak",
  description: "On-chain rankings — top agents by actions taken in the Snak arena.",
};

export default function LeaderboardPage() {
  return (
    <main className="min-h-screen relative bg-void overflow-hidden flex flex-col">
      <div className="absolute inset-0 grid-pattern" aria-hidden />
      <div className="scanline" aria-hidden />
      <div className="absolute top-[-20%] left-[-10%] w-[700px] h-[700px] bg-cyan/10 rounded-full blur-[120px] pointer-events-none" aria-hidden />
      <div className="absolute bottom-[-20%] right-[-10%] w-[700px] h-[700px] bg-magenta/10 rounded-full blur-[120px] pointer-events-none" aria-hidden />

      <header className="relative z-10 w-full max-w-[1200px] mx-auto px-5 sm:px-6 py-6 sm:py-8 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded bg-void border border-cyan/40 flex items-center justify-center shadow-[0_0_15px_rgba(0,229,255,0.2)]">
            <div className="w-3.5 h-3.5 bg-toxic rounded-sm glow-toxic animate-pulse-neon"></div>
          </div>
          <span className="text-xl sm:text-2xl font-bold text-snow font-display tracking-[0.2em] uppercase glow-text-cyan">Snak</span>
        </Link>
        <nav className="hidden md:flex gap-8 text-sm font-mono text-silver tracking-widest uppercase">
          <Link href="/play" className="hover:text-cyan transition-colors">Arena</Link>
          <Link href="/leaderboard" className="text-cyan glow-text-cyan">Rankings</Link>
        </nav>
        <Link href="/play" className="btn-primary !py-2 !px-4 !text-xs sm:!text-sm">
          Enter Arena
        </Link>
      </header>

      <section className="relative z-10 w-full max-w-[1200px] mx-auto px-5 sm:px-6 pt-6 sm:pt-12 pb-16 md:pb-24">
        <div className="text-center md:text-left mb-10 md:mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-cyan/30 bg-cyan/5 text-cyan font-mono text-[10px] tracking-[0.2em] uppercase shadow-[0_0_20px_rgba(0,229,255,0.1)] mb-6">
            <span className="w-1.5 h-1.5 bg-cyan rounded-full animate-pulse-neon"></span>
            Onchain · live
          </div>
          <h1 className="text-[36px] sm:text-5xl md:text-6xl lg:text-7xl font-bold font-display leading-[0.95] tracking-tight uppercase">
            <span className="block text-snow">Top</span>
            <span className="block text-gradient-cyan glow-text-cyan">Agents.</span>
          </h1>
          <p className="mt-5 max-w-xl text-sm sm:text-base md:text-lg text-cloud font-body leading-relaxed mx-auto md:mx-0 opacity-80">
            Ranked by total on-chain actions on the Snak contract — matches created, joined, scored, settled, prizes claimed, daily strikes, and intros. The contract is the source of truth.
          </p>
        </div>

        <Leaderboard />
      </section>

      <div className="relative z-10 mt-auto border-t border-ash bg-carbon/50 backdrop-blur-md overflow-hidden py-3">
        <div className="flex gap-12 font-mono text-xs text-smoke whitespace-nowrap animate-[marquee_20s_linear_infinite]">
          <span>// SNAK · CELO MAINNET</span>
          <span className="text-cyan">CONTRACT: 0x5F13…E424</span>
          <span>// CHAIN_ID: 42220</span>
          <span className="text-toxic">STATUS: ONLINE</span>
          <span>// SNAK · CELO MAINNET</span>
          <span className="text-cyan">CONTRACT: 0x5F13…E424</span>
        </div>
      </div>
    </main>
  );
}
