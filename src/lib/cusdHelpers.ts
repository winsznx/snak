import { parseUnits } from "viem";

export const STAKE_PRESETS = [
  { label: "$0.50", wei: parseUnits("0.5", 18) },
  { label: "$1", wei: parseUnits("1", 18) },
  { label: "$2", wei: parseUnits("2", 18) },
  { label: "$5", wei: parseUnits("5", 18) },
] as const;

export const MAX_PLAYERS = [4, 6, 10, 20] as const;
export const DEADLINE_PRESETS = [
  { label: "30m", seconds: 30 * 60 },
  { label: "1h", seconds: 60 * 60 },
  { label: "3h", seconds: 3 * 60 * 60 },
  { label: "12h", seconds: 12 * 60 * 60 },
] as const;
