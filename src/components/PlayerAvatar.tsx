import { shortAddr } from "@/lib/format";

type Props = {
  address: string;
  size?: number;
  className?: string;
};

/**
 * Address-derived avatar. We hash the trailing characters into a hue so
 * identicons stay deterministic without shipping a heavyweight identicon
 * library. Uses charCodeAt instead of parseInt(…, 16) so Stacks principals
 * (SP…/ST… base58) hash correctly — parseInt on non-hex chars returns NaN,
 * which produced `hsl(NaNdeg …)` and a transparent background for every
 * Stacks user.
 */
function hueFromAddress(address: string): number {
  if (!address) return 0;
  let h = 0;
  // Use the last 4 chars so SP… vs ST… vs 0x… inputs all get reasonable
  // bit-mixing without bunching on the same prefix.
  const tail = address.slice(-4);
  for (let i = 0; i < tail.length; i++) {
    h = (h * 31 + tail.charCodeAt(i)) >>> 0;
  }
  return h % 360;
}

export function PlayerAvatar({ address, size = 28, className = "" }: Props) {
  const hue = hueFromAddress(address);
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
