import { txUrl } from "@/lib/celoscan";
import { shortHash } from "@/lib/format";

type Props = { hash: string; chainId?: number; label?: string; className?: string };

export function TxLink({ hash, chainId, label, className = "" }: Props) {
  return (
    <a
      href={txUrl(hash, chainId)}
      target="_blank"
      rel="noreferrer"
      title={hash}
      className={`font-mono text-xs text-cyan/80 hover:text-cyan ${className}`}
    >
      {label ?? shortHash(hash)}
    </a>
  );
}
