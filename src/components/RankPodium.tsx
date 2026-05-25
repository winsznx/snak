import { PlayerAvatar } from "./PlayerAvatar";
import { shortAddr } from "@/lib/format";

type Entry = { address: string; score: number | bigint };

type Props = {
  entries: Entry[];
  className?: string;
};

const MEDALS = ["1st", "2nd", "3rd"] as const;
const TONES = ["text-toxic", "text-cyan", "text-amber"];

/**
 * Three-slot leaderboard podium. Renders nothing if there are no entries,
 * shows up to three rows otherwise — perfect for the rankings header strip.
 */
export function RankPodium({ entries, className = "" }: Props) {
  if (entries.length === 0) return null;
  return (
    <ul className={`flex flex-col gap-2 ${className}`}>
      {entries.slice(0, 3).map((e, i) => (
        <li
          key={e.address}
          className="flex items-center gap-3 rounded border border-cyan/15 bg-carbon px-3 py-2"
        >
          <span className={`font-mono text-[10px] uppercase tracking-widest ${TONES[i]}`}>
            {MEDALS[i]}
          </span>
          <PlayerAvatar address={e.address} size={24} />
          <span className="font-mono text-sm text-snow">{shortAddr(e.address)}</span>
          <span className="ml-auto font-mono text-xs tabular-nums text-silver">
            {e.score.toString()}
          </span>
        </li>
      ))}
    </ul>
  );
}
