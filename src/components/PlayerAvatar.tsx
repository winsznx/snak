import { shortAddr } from "@/lib/format";

type Props = {
  address: string;
  size?: number;
  className?: string;
};

/**
 * Address-derived avatar. We hash the last 2 hex chars into a hue so identicons
 * stay deterministic without shipping a heavyweight identicon library.
 */
export function PlayerAvatar({ address, size = 28, className = "" }: Props) {
  const hue = address ? (parseInt(address.slice(-2), 16) * 17) % 360 : 0;
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full font-mono text-[10px] uppercase tracking-widest text-snow ${className}`}
      style={{ width: size, height: size, background: `hsl(${hue}deg 70% 30%)`, boxShadow: `0 0 12px hsl(${hue}deg 80% 50% / 0.4)` }}
      title={address}
    >
      {shortAddr(address, 2, 0).replace("0x", "")}
    </span>
  );
}
