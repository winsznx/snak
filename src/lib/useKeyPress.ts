"use client";

import { useEffect } from "react";

type Options = { enabled?: boolean; target?: "document" | "window" };

export function useKeyPress(
  key: string,
  handler: (event: KeyboardEvent) => void,
  { enabled = true, target = "document" }: Options = {},
) {
  useEffect(() => {
    if (!enabled) return;
    const node = target === "document" ? document : window;
    const listener = (event: Event) => {
      if ((event as KeyboardEvent).key === key) handler(event as KeyboardEvent);
    };
    node.addEventListener("keydown", listener);
    return () => node.removeEventListener("keydown", listener);
  }, [key, handler, enabled, target]);
}
