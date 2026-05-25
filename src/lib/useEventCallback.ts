"use client";

import { useCallback, useLayoutEffect, useRef } from "react";

/**
 * Stable callback that always sees the latest props/state. Mostly for handlers
 * passed deep into memoised children where you can't rebuild the deps array
 * (animation engine glue, for example).
 */
export function useEventCallback<Args extends unknown[], R>(
  fn: (...args: Args) => R,
): (...args: Args) => R {
  const ref = useRef(fn);
  useLayoutEffect(() => {
    ref.current = fn;
  }, [fn]);
  return useCallback((...args: Args) => ref.current(...args), []);
}
