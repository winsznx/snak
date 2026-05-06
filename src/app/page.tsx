import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen relative overflow-hidden bg-void flex flex-col">
      {/* Background Grid & Scanlines */}
      <div className="absolute inset-0 grid-pattern"></div>
      <div className="scanline"></div>
      
      {/* Heavy Ambient Glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-cyan/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[800px] h-[800px] bg-magenta/10 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Header */}
      <header className="relative z-10 w-full max-w-[1200px] mx-auto px-6 py-8 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-void border border-cyan/40 flex items-center justify-center shadow-[0_0_15px_rgba(0,229,255,0.2)]">
            <div className="w-4 h-4 bg-toxic rounded-sm glow-toxic animate-pulse-neon"></div>
          </div>
          <span className="text-2xl font-bold text-snow font-display tracking-[0.2em] uppercase glow-text-cyan">Snak</span>
        </div>
        
        <nav className="hidden md:flex gap-10 text-sm font-mono text-silver tracking-widest uppercase">
          <Link href="#arena" className="hover:text-cyan transition-colors">Arena</Link>
          <Link href="#leaderboard" className="hover:text-cyan transition-colors">Rankings</Link>
          <Link href="#rewards" className="hover:text-cyan transition-colors">Bounty</Link>
        </nav>
        
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded bg-carbon border border-ash">
            <div className="w-2 h-2 rounded-full bg-toxic glow-toxic"></div>
            <span className="text-xs font-mono text-cloud">Celo Mainnet</span>
          </div>
        </div>
      </header>

      {/* Hero Content */}
      <div className="relative z-10 flex-1 max-w-[1200px] mx-auto px-6 flex flex-col lg:flex-row items-center justify-center gap-16 lg:gap-24 pt-12 pb-24">
        
        {/* Left Column: Copy */}
        <div className="flex-1 space-y-8 text-center lg:text-left z-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-cyan/30 bg-cyan/5 text-cyan font-mono text-xs tracking-[0.2em] uppercase shadow-[0_0_20px_rgba(0,229,255,0.1)]">
            <span className="w-1.5 h-1.5 bg-cyan rounded-full animate-pulse-neon"></span>
            Season 1 Active
          </div>
          
          <h1 className="text-6xl md:text-8xl font-bold font-display leading-[0.9] tracking-tighter uppercase">
            <span className="block text-snow mb-2">Eat.</span>
            <span className="block text-snow mb-2">Survive.</span>
            <span className="block text-gradient-cyan glow-text-cyan pb-2">Dominate.</span>
          </h1>
          
          <p className="text-lg md:text-xl text-cloud font-body leading-relaxed max-w-lg mx-auto lg:mx-0 opacity-80">
            A high-stakes, on-chain battle royale. Outmaneuver enemy bots, grow your mass, and extract the daily cUSD prize pool.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-6 pt-6">
            <Link href="/play" className="btn-primary">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
              Enter Arena
            </Link>
            <div className="flex flex-col font-mono text-xs text-silver tracking-wider">
              <span>ENTRY: $0.10 cUSD</span>
              <span>PRIZE: DYNAMIC POOL</span>
            </div>
          </div>
        </div>

        {/* Right Column: Premium Game Mockup */}
        <div className="flex-1 w-full max-w-[500px] animate-float relative z-20">
          <div className="relative w-full aspect-square surface-elevated overflow-hidden group">
            
            {/* Top Bar of the Mockup */}
            <div className="absolute top-0 left-0 right-0 h-12 bg-carbon/80 border-b border-ash flex items-center justify-between px-6 z-30 backdrop-blur-md">
              <div className="flex gap-4 font-mono text-xs">
                <span className="text-silver">P1_MASS <span className="text-toxic font-bold glow-text-toxic">4,250</span></span>
                <span className="text-silver">BOT_REMAIN <span className="text-magenta font-bold">12</span></span>
              </div>
              <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full bg-ash"></div>
                <div className="w-2 h-2 rounded-full bg-ash"></div>
                <div className="w-2 h-2 rounded-full bg-cyan/50"></div>
              </div>
            </div>

            {/* Mockup Grid */}
            <div className="absolute inset-0 grid-pattern opacity-50 z-10 transition-opacity duration-1000 group-hover:opacity-100"></div>
            
            {/* Player Snake */}
            <div className="absolute z-20 top-[40%] left-[30%] flex items-center gap-1.5 transition-transform duration-1000 group-hover:translate-x-12">
              <div className="w-6 h-6 bg-toxic rounded-md glow-toxic flex items-center justify-center relative shadow-[0_0_30px_rgba(57,255,20,0.4)]">
                <div className="absolute right-1 top-1 w-1 h-1 bg-void rounded-full"></div>
                <div className="absolute right-1 bottom-1 w-1 h-1 bg-void rounded-full"></div>
              </div>
              <div className="w-5 h-5 bg-toxic/90 rounded-sm"></div>
              <div className="w-5 h-5 bg-toxic/70 rounded-sm"></div>
              <div className="w-5 h-5 bg-toxic/50 rounded-sm"></div>
              <div className="w-4 h-4 bg-toxic/30 rounded-sm"></div>
              <div className="w-4 h-4 bg-toxic/10 rounded-sm"></div>
            </div>

            {/* Enemy Snake */}
            <div className="absolute z-20 top-[20%] right-[20%] flex flex-col gap-1.5 rotate-[15deg]">
              <div className="w-6 h-6 bg-magenta rounded-md glow-magenta relative shadow-[0_0_30px_rgba(255,45,120,0.4)]"></div>
              <div className="w-5 h-5 bg-magenta/90 rounded-sm"></div>
              <div className="w-5 h-5 bg-magenta/70 rounded-sm"></div>
              <div className="w-5 h-5 bg-magenta/50 rounded-sm"></div>
            </div>
            
            {/* Enemy Snake 2 */}
            <div className="absolute z-20 bottom-[20%] left-[20%] flex gap-1.5 -rotate-[45deg]">
              <div className="w-5 h-5 bg-violet rounded-md shadow-[0_0_20px_rgba(139,92,246,0.4)]"></div>
              <div className="w-4 h-4 bg-violet/80 rounded-sm"></div>
              <div className="w-4 h-4 bg-violet/60 rounded-sm"></div>
            </div>

            {/* Food Particles */}
            <div className="absolute z-20 top-[42%] left-[60%] w-4 h-4 bg-amber rounded-full animate-pulse-neon shadow-[0_0_15px_rgba(255,184,0,0.6)]"></div>
            <div className="absolute z-20 top-[60%] left-[40%] w-3 h-3 bg-cyan rounded-full shadow-[0_0_10px_rgba(0,229,255,0.5)]"></div>
            <div className="absolute z-20 top-[30%] right-[40%] w-2 h-2 bg-amber rounded-full opacity-60"></div>
            
            {/* Vignette */}
            <div className="absolute inset-0 bg-radial-gradient from-transparent to-void/80 z-30 pointer-events-none"></div>
          </div>
        </div>

      </div>
      
      {/* Bottom Ticker */}
      <div className="relative z-20 border-t border-ash bg-carbon/50 backdrop-blur-md overflow-hidden py-3">
        <div className="flex gap-12 font-mono text-xs text-smoke whitespace-nowrap animate-[marquee_20s_linear_infinite]">
          <span>// LATEST_KILL: 0X7F...8A2 ELIMINATED 0X2B...1F9</span>
          <span className="text-cyan">RANK_1: 0X4A...9E0 (MASS: 12,450)</span>
          <span>// PRIZE_POOL: $42.50 cUSD</span>
          <span>// NEXT_PAYOUT: 04:23:11</span>
          <span className="text-toxic">AGENT_STATUS: ONLINE</span>
          <span>// LATEST_KILL: 0X7F...8A2 ELIMINATED 0X2B...1F9</span>
          <span className="text-cyan">RANK_1: 0X4A...9E0 (MASS: 12,450)</span>
        </div>
      </div>
    </main>
  );
}
