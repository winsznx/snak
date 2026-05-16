import Link from "next/link";
import { ConnectButton } from "@/components/ConnectButton";
import { CreateMatchPanel } from "@/components/CreateMatchPanel";
import { JoinMatchPanel } from "@/components/JoinMatchPanel";
import { SettlePanel } from "@/components/SettlePanel";
import { StrikeButton } from "@/components/StrikeButton";
import { StrikePill } from "@/components/StrikePill";

export default function Play() {
  return (
    <main className="min-h-screen relative overflow-hidden bg-void flex flex-col items-center justify-center p-4">
      {/* Background Grid & Scanlines */}
      <div className="absolute inset-0 grid-pattern opacity-50"></div>
      <div className="scanline"></div>
      
      {/* HUD Header */}
      <div className="absolute top-0 left-0 w-full px-6 py-4 flex justify-between items-center z-50">
        <Link
          href="/"
          prefetch={false}
          aria-label="Leave the arena and return to the snak landing page"
          className="text-xl font-bold text-snow font-display tracking-widest uppercase hover:text-cyan transition-colors glow-text-cyan"
        >
          ← ABORT_MISSION
        </Link>
        <div className="flex items-center gap-3">
          <StrikePill />
          <StrikeButton />
          <ConnectButton />
        </div>
      </div>

      {/* Main Arena Container */}
      <div className="relative z-10 w-full max-w-5xl aspect-[4/3] md:aspect-video surface-elevated overflow-hidden flex flex-col group">
        
        {/* Arena Top HUD */}
        <div className="h-14 bg-carbon/90 border-b border-ash flex items-center justify-between px-6 z-30">
          <div className="flex gap-8 font-mono text-sm tracking-wider">
            <div className="flex flex-col justify-center">
              <span className="text-[10px] text-smoke leading-none mb-1">SCORE</span>
              <span className="text-cyan font-bold leading-none glow-text-cyan">00000</span>
            </div>
            <div className="flex flex-col justify-center">
              <span className="text-[10px] text-smoke leading-none mb-1">MASS</span>
              <span className="text-toxic font-bold leading-none">00010</span>
            </div>
          </div>
          
          <div className="flex gap-2">
            <div className="w-8 h-1 bg-ash rounded-full overflow-hidden">
              <div className="w-full h-full bg-toxic shadow-[0_0_8px_#39ff14]"></div>
            </div>
            <div className="w-8 h-1 bg-ash rounded-full overflow-hidden">
              <div className="w-full h-full bg-toxic shadow-[0_0_8px_#39ff14]"></div>
            </div>
            <div className="w-8 h-1 bg-ash rounded-full overflow-hidden">
              <div className="w-1/2 h-full bg-cyan shadow-[0_0_8px_#00e5ff] animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Game Canvas Area */}
        <div className="flex-1 relative bg-[#0a0c10]">
          {/* Inner Grid */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(0,229,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,229,255,0.03)_1px,transparent_1px)] bg-[size:20px_20px]"></div>
          
          {/* Start Menu Overlay */}
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-void/60 backdrop-blur-md z-40">
            <div className="surface-panel p-10 flex flex-col items-center max-w-md w-full text-center relative overflow-hidden">
              {/* Corner Accents */}
              <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-cyan/50"></div>
              <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-cyan/50"></div>
              <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-cyan/50"></div>
              <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-cyan/50"></div>

              <h2 className="text-4xl font-display font-bold text-snow mb-2 tracking-[0.1em] uppercase">Initialize</h2>
              <p className="text-silver font-body mb-8 text-sm">Deploy snake into Sector 7G. Consume data nodes to expand mass. Avoid hostiles.</p>
              
              <button className="btn-primary w-full py-4 text-xl">
                START_PROTOCOL
              </button>
              
              <div className="mt-6 pt-6 border-t border-ash w-full flex justify-between items-center text-xs font-mono">
                <span className="text-smoke">FEE DEBIT</span>
                <span className="text-cyan">$0.10 cUSD</span>
              </div>
            </div>
          </div>
          
        </div>

        {/* Arena Bottom HUD */}
        <div className="h-10 bg-carbon/90 border-t border-ash flex items-center justify-between px-6 z-30 font-mono text-[10px] text-smoke uppercase tracking-widest">
          <span>INPUT: ARROWS / SWIPE</span>
          <span>FPS: 60</span>
        </div>
      </div>

      {/* Host & Join panels — distinct on-chain entry paths */}
      <section className="relative z-10 w-full max-w-5xl mt-10 grid md:grid-cols-2 gap-5">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-mono text-xs uppercase tracking-[0.2em] text-cyan">▸ HOST_ARENA</h3>
            <span className="font-mono text-[10px] text-silver uppercase tracking-widest">
              stake-escrow
            </span>
          </div>
          <CreateMatchPanel />
        </div>
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-mono text-xs uppercase tracking-[0.2em] text-magenta">▸ JOIN_ARENA</h3>
            <span className="font-mono text-[10px] text-silver uppercase tracking-widest">
              by match id
            </span>
          </div>
          <JoinMatchPanel />
        </div>
      </section>

      {/* Settlement + claim — anyone after deadline; winner claims */}
      <section className="relative z-10 w-full max-w-5xl mt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-mono text-xs uppercase tracking-[0.2em] text-toxic">▸ FINALIZE</h3>
          <span className="font-mono text-[10px] text-silver uppercase tracking-widest">
            anyone settles · winner claims
          </span>
        </div>
        <SettlePanel />
      </section>
    </main>
  );
}
