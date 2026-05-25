import { Pill } from "./Pill";

type Status = "idle" | "signing" | "pending" | "confirmed" | "failed";

const LABEL: Record<Status, string> = {
  idle: "Ready",
  signing: "Sign",
  pending: "Pending",
  confirmed: "Confirmed",
  failed: "Failed",
};

const TONE: Record<Status, "silver" | "cyan" | "amber" | "toxic" | "magenta"> = {
  idle: "silver",
  signing: "cyan",
  pending: "amber",
  confirmed: "toxic",
  failed: "magenta",
};

export function TxStatusBadge({ status }: { status: Status }) {
  return <Pill tone={TONE[status]}>{LABEL[status]}</Pill>;
}
