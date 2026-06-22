import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Leaderboard } from "@/components/Leaderboard";

export const metadata: Metadata = {
  title: "Rankings · Snak",
  description: "Onchain rankings — top agents by actions in the Snak arena on Celo and Stacks.",
};

export default function LeaderboardPage() {
  return (
    <main className="app-shell flex flex-col">
      <div className="absolute inset-0 grid-pattern" aria-hidden />
      <div className="scanline" aria-hidden />
      <Header />

      <section className="container-page relative z-10 py-16 md:py-24">
        <div className="mb-12 max-w-3xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan/30 bg-cyan/5 px-4 py-2 text-cyan shadow-[0_0_20px_rgba(0,229,255,0.1)]">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan animate-pulse-neon" />
            <span className="eyebrow">Onchain · live</span>
          </div>
          <h1 className="display-lg">
            Top
            <br />
            <span className="text-gradient-cyan glow-text-cyan">Agents.</span>
          </h1>
          <p className="mt-5 max-w-2xl body-lg">
            Ranked by total onchain actions on the Snak contracts — matches created, joined, scored,
            settled, prizes claimed, daily strikes, and intros. Toggle Celo (cUSD) or Stacks (STX) to
            switch the source chain.
          </p>
          <Link href="/play" className="mt-8 inline-flex btn-primary btn-compact">
            Enter Arena
          </Link>
        </div>

        <Leaderboard />
      </section>

      <div className="relative z-10 mt-auto overflow-hidden border-t border-ash bg-carbon/50 py-3 backdrop-blur-md">
        <div
          className="flex w-max gap-12 whitespace-nowrap font-mono text-xs text-smoke animate-[marquee_20s_linear_infinite]"
          aria-hidden
        >
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="flex gap-12">
              <span>SNAK · CELO + STACKS MAINNET</span>
              <span className="text-cyan">SOLIDITY · CELO 42220</span>
              <span>CLARITY · STACKS MAINNET</span>
              <span className="text-toxic">STATUS: ONLINE</span>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
