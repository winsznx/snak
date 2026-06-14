"use client";

import { useEffect, useState } from "react";

/**
 * Returns the current unix-second timestamp, updated every `intervalMs`.
 *
 * The lazy `Date.now()` initializer we used briefly caused a React 19
 * hydration mismatch (server renders 0, client renders the real second).
 * Now we always start at 0 on both server and first client render — then
 * an effect fills the real value on the next paint. Consumers that show a
 * countdown should guard "X left" rendering on `nowSec > 0` so they don't
 * flash "Infinity" for one frame.
 */
export function useNowSec(intervalMs = 60_000) {
  const [nowSec, setNowSec] = useState(0);

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
