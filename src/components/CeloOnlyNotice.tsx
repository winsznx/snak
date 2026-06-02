"use client";

/**
 * Renders when a feature only ships on the Celo deployment of a contract.
 * Use as an early return inside chain-aware panels so Stacks users see a
 * clear "switch to Celo" affordance instead of a silently disabled button
 * that secretly fires a Celo write.
 */
export function CeloOnlyNotice({ feature }: { feature: string }) {
  return (
    <div className="rounded border border-cyan/40 bg-carbon/60 px-4 py-3 font-mono text-[11px] uppercase tracking-widest text-cyan">
      {feature} ships on celo only — flip the chain toggle to celo to use it.
    </div>
  );
}
