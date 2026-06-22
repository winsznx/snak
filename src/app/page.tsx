import Link from "next/link";
import { Header } from "@/components/Header";

export default function Home() {
  return (
    <main className="app-shell flex flex-col">
      <div className="absolute inset-0 grid-pattern" aria-hidden />
      <div className="scanline" aria-hidden />
      <Header />

      <section className="container-page relative z-10 grid flex-1 items-center gap-12 py-16 md:grid-cols-[1fr_480px] md:py-24">
        <div>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan/30 bg-cyan/5 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.2em] text-cyan shadow-[0_0_20px_rgba(0,229,255,0.1)]">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan animate-pulse-neon" />
            Season 1 active
          </div>
          <h1 className="display-xl">
            Eat.
            <br />
            Survive.
            <br />
            <span className="text-gradient-cyan glow-text-cyan">Dominate.</span>
          </h1>
          <p className="mt-6 max-w-2xl body-lg">
            A high-stakes onchain snake arena. Host matches, join rival players, survive the board,
            and extract the prize pool — staked in cUSD on Celo or STX on Stacks.
          </p>
          <div className="mt-8 flex flex-col gap-5 sm:flex-row sm:items-center">
            <Link href="/play" className="btn-primary">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              Enter Arena
            </Link>
            <div className="font-mono text-xs uppercase tracking-wider text-silver">
              <div>Entry: $0.10 (cUSD · STX)</div>
              <div>Prize: dynamic pool</div>
            </div>
          </div>
        </div>

        <ArenaPreview />
      </section>

      <div className="relative z-20 overflow-hidden border-t border-ash bg-carbon/50 py-3 backdrop-blur-md">
        <div
          className="flex w-max gap-12 whitespace-nowrap font-mono text-xs text-smoke animate-[marquee_20s_linear_infinite]"
          aria-hidden
        >
          {/*
            Children duplicated so the keyframe's -50% translate has a second
            copy to roll in. Without the dupe the belt would slide once and
            leave empty space. aria-hidden because the line is purely
            atmospheric — no real-time data.
          */}
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="flex gap-12">
              <span>AGENT_STATUS: ONLINE</span>
              <span className="text-cyan">ARENA_ESCROW: cUSD + STX</span>
              <span>STAKE_RANGE: $0.50 — $5</span>
              <span className="text-toxic">PRIZE_SPLIT: 60/30/10</span>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

function ArenaPreview() {
  return (
    <div className="relative z-20 w-full animate-float">
      <div className="surface-elevated relative aspect-square overflow-hidden">
        <div className="absolute left-0 right-0 top-0 z-30 flex h-12 items-center justify-between border-b border-ash bg-carbon/80 px-6 backdrop-blur-md">
          <div className="flex gap-4 font-mono text-xs">
            <span className="text-silver">P1_MASS <span className="font-bold text-toxic">4,250</span></span>
            <span className="text-silver">BOT_REMAIN <span className="font-bold text-magenta">12</span></span>
          </div>
        </div>
        <div className="absolute inset-0 grid-pattern opacity-70" />
        <Snake className="left-[28%] top-[42%]" color="toxic" />
        <Snake className="right-[18%] top-[20%] rotate-[15deg]" color="magenta" vertical />
        <Snake className="bottom-[22%] left-[18%] -rotate-[45deg]" color="violet" />
        <div className="absolute left-[60%] top-[42%] z-20 h-4 w-4 rounded-full bg-amber shadow-[0_0_15px_rgba(255,184,0,0.6)] animate-pulse-neon" />
        <div className="absolute left-[40%] top-[60%] z-20 h-3 w-3 rounded-full bg-cyan shadow-[0_0_10px_rgba(0,229,255,0.5)]" />
      </div>
    </div>
  );
}

function Snake({ className, color, vertical }: { className: string; color: "toxic" | "magenta" | "violet"; vertical?: boolean }) {
  const blocks =
    color === "toxic"
      ? ["bg-toxic", "bg-toxic/90", "bg-toxic/70", "bg-toxic/50"]
      : color === "magenta"
        ? ["bg-magenta", "bg-magenta/90", "bg-magenta/70", "bg-magenta/50"]
        : ["bg-violet", "bg-violet/90", "bg-violet/70", "bg-violet/50"];
  return (
    <div className={`absolute z-20 flex gap-1.5 ${vertical ? "flex-col" : "items-center"} ${className}`}>
      <div className={`h-6 w-6 rounded-md ${blocks[0]} shadow-[0_0_30px_rgba(0,229,255,0.24)]`} />
      <div className={`h-5 w-5 rounded-sm ${blocks[1]}`} />
      <div className={`h-5 w-5 rounded-sm ${blocks[2]}`} />
      <div className={`h-5 w-5 rounded-sm ${blocks[3]}`} />
    </div>
  );
}
