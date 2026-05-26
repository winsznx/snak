export function avatarHue(address: string | null | undefined): number {
  if (!address) return 180;
  return (parseInt(address.slice(-4), 16) * 37) % 360;
}

export function avatarBg(address: string): string {
  return `hsl(${avatarHue(address)}deg 70% 30%)`;
}

export function avatarShadow(address: string): string {
  return `0 0 12px hsl(${avatarHue(address)}deg 80% 50% / 0.4)`;
}
