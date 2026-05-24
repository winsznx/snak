"use client";

import { useCallback, useState } from "react";

type ShareInput = { title?: string; text?: string; url: string };
type Result = "shared" | "copied" | "blocked";

export function useShare() {
  const [lastResult, setLastResult] = useState<Result | null>(null);

  const share = useCallback(async (input: ShareInput): Promise<Result> => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share(input);
        setLastResult("shared");
        return "shared";
      } catch {
        // dismissed — fall through to copy
      }
    }
    try {
      await navigator.clipboard.writeText(input.url);
      setLastResult("copied");
      return "copied";
    } catch {
      setLastResult("blocked");
      return "blocked";
    }
  }, []);

  return { share, lastResult } as const;
}
