import type { ReactNode } from "react";

/**
 * Cyberpunk glass surface: translucent carbon background with a soft cyan
 * inset and backdrop blur. Use over the grid-pattern bg without the content
 * disappearing into noise.
 */
export function GlassPanel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`relative rounded-lg border border-cyan/20 bg-carbon/70 p-5 shadow-[inset_0_1px_0_rgba(0,229,255,0.12)] backdrop-blur-sm ${className}`}
    >
      {children}
    </div>
  );
}
