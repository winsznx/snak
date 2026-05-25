import { keccak256, toHex } from "viem";

/**
 * Stable hash builder used by the scorer key to sign score reports. We hash
 * matchId + player + score so a single signature can't be replayed for a
 * different score.
 */
export function buildScoreDigest(matchId: bigint | number, player: `0x${string}`, score: number | bigint): `0x${string}` {
  return keccak256(toHex(`${matchId.toString()}|${player.toLowerCase()}|${score.toString()}`));
}
