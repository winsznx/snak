import Link from "next/link";
import { Pill } from "./Pill";

type Props = {
  matchId: bigint | number;
  joined: boolean;
  open: boolean;
  className?: string;
};

/**
 * Tight CTA strip for an arena's lifecycle. Default state is "Join" but flips
 * to "Forfeit" once the user is a player and "View" once the match closes.
 */
export function MatchActionStrip({ matchId, joined, open, className = "" }: Props) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Pill tone={open ? "cyan" : "silver"}>{open ? "Joinable" : "Closed"}</Pill>
      <Link
        href={`/play?match=${matchId.toString()}`}
        className="rounded border border-cyan bg-cyan/10 px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest text-cyan hover:bg-cyan/20"
      >
        {joined ? "Enter arena" : open ? "Join" : "View"}
      </Link>
    </div>
  );
}
