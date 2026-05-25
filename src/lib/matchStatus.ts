export const MATCH_STATUS = ["Open", "Active", "Settled", "Cancelled"] as const;
export type MatchStatus = (typeof MATCH_STATUS)[number];

export function matchStatusLabel(status: number): MatchStatus {
  return MATCH_STATUS[status] ?? "Open";
}

export function matchStatusTone(status: number): "cyan" | "toxic" | "magenta" | "silver" {
  switch (status) {
    case 0:
      return "cyan";
    case 1:
      return "toxic";
    case 2:
      return "silver";
    case 3:
      return "magenta";
    default:
      return "silver";
  }
}
