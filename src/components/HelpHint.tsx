import { Tooltip } from "./Tooltip";

type Props = { children: React.ReactNode; help: React.ReactNode; className?: string };

export function HelpHint({ children, help, className = "" }: Props) {
  return (
    <span className={`inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-widest text-silver ${className}`}>
      {children}
      <Tooltip content={help}>
        <span aria-hidden className="grid h-4 w-4 place-items-center rounded-full border border-cyan/40 text-[10px] text-cyan">
          ?
        </span>
      </Tooltip>
    </span>
  );
}
