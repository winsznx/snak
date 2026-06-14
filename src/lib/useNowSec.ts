"use client";

import { useEffect, useState } from "react";

/**
 * Returns the current unix-second timestamp, updated every `intervalMs`.
 *
 * Lazy initializer reads `Date.now()` on the FIRST client paint instead of
 * starting at 0 — without this, every consumer (deadline countdowns, "X left"
 * pills) flashes "Infinity h Infinity m" for one frame because `deadline - 0`
 * blows up. SSR still gets `0` so hydration stays clean; the first client
 * render fills the real value.
 */
export function useNowSec(intervalMs = 60_000) {
  const [nowSec, setNowSec] = useState<number>(() =>
    typeof window === "undefined" ? 0 : Math.floor(Date.now() / 1000),
  );

  useEffect(() => {
    setNowSec(Math.floor(Date.now() / 1000));
    const interval = window.setInterval(
      () => setNowSec(Math.floor(Date.now() / 1000)),
      intervalMs,
    );
    return () => {
      window.clearInterval(interval);
    };
  }, [intervalMs]);

  return nowSec;
}
