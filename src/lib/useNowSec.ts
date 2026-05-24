"use client";

import { useEffect, useState } from "react";

export function useNowSec(intervalMs = 60_000) {
  const [nowSec, setNowSec] = useState(0);

  useEffect(() => {
    const initial = window.setTimeout(() => setNowSec(Math.floor(Date.now() / 1000)), 0);
    const interval = window.setInterval(
      () => setNowSec(Math.floor(Date.now() / 1000)),
      intervalMs,
    );
    return () => {
      window.clearTimeout(initial);
      window.clearInterval(interval);
    };
  }, [intervalMs]);

  return nowSec;
}
