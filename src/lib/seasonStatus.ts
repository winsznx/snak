/**
 * Season-state mapping mirrored from the Snak contract. We don't pull it from
 * the ABI to keep the labels copy-friendly (the contract just emits enum
 * indices).
 */
export const SEASON_STATUS = ["Pending", "Active", "Finalized"] as const;
export type SeasonStatus = (typeof SEASON_STATUS)[number];

export function seasonStatusLabel(status: number): SeasonStatus {
  return SEASON_STATUS[status] ?? "Pending";
}
