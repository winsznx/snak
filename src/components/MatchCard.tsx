import Link from "next/link";
import { Pill } from "./Pill";
import { StakePill } from "./StakePill";
import { CountdownPill } from "./CountdownPill";
import { matchStatusLabel, matchStatusTone } from "@/lib/matchStatus";
import { arenaUrl } from "@/lib/share";
import { shortAddr } from "@/lib/format";

type Props = {
  matchId: bigint | number;
  stake: bigint;
  maxPlayers: number;
  currentPlayers: number;
  deadline: number | bigint;
  status: number;
  creator?: string;
  className?: string;
};

export function MatchCard({
  matchId,
  stake,
  maxPlayers,
  currentPlayers,
  deadline,
  status,
  creator,
  className = "",
}: Props) {
  const slotsLeft = Math.max(0, maxPlayers - currentPlayers);
  return (
    <Link
      href={`/play?match=${matchId.toString()}`}
      className={`group flex flex-col gap-3 rounded-lg border border-cyan/20 bg-carbon p-4 transition hover:border-cyan/50 ${className}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-[10px] uppercase tracking-widest text-silver">
          arena · {matchId.toString()}
        </span>
        <Pill tone={matchStatusTone(status)}>{matchStatusLabel(status)}</Pill>
      </div>
      <div className="flex items-center justify-between">
        <StakePill stakeWei={stake} />
        <CountdownPill targetSec={deadline} />
      </div>
      <div className="flex items-center justify-between font-mono text-[11px] text-silver">
        <span>{currentPlayers}/{maxPlayers} players</span>
        <span className="text-cyan">{slotsLeft} slots</span>
      </div>
      {creator && (
        <div className="font-mono text-[10px] uppercase tracking-widest text-silver/70">
          host · {shortAddr(creator)}
        </div>
      )}
      <div className="mt-1 text-[10px] uppercase tracking-widest text-cyan/60 font-mono">
        {arenaUrl(matchId).replace("https://", "")}
      </div>
    </Link>
  );
}
