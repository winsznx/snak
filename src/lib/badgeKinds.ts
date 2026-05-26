/**
 * On-chain badge kinds the Snak contract can mint. Kept in sync with the
 * RankBadgeMinted event tier param so we can render names without re-reading
 * the contract.
 */
export const BADGE_KINDS = ["Bronze", "Silver", "Gold", "Diamond"] as const;
export type BadgeKind = (typeof BADGE_KINDS)[number];

export function badgeKindLabel(rank: number): BadgeKind {
  if (rank >= 50) return "Diamond";
  if (rank >= 20) return "Gold";
  if (rank >= 10) return "Silver";
  return "Bronze";
}

export function badgeKindGlow(rank: number): string {
  const kind = badgeKindLabel(rank);
  switch (kind) {
    case "Diamond":
      return "shadow-[0_0_22px_rgba(0,229,255,0.6)]";
    case "Gold":
      return "shadow-[0_0_18px_rgba(255,184,0,0.6)]";
    case "Silver":
      return "shadow-[0_0_14px_rgba(200,204,216,0.6)]";
    case "Bronze":
      return "shadow-[0_0_10px_rgba(236,150,80,0.5)]";
  }
}
