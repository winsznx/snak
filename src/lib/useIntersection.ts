"use client";

import { useEffect, useRef, useState } from "react";

type Options = IntersectionObserverInit & { freezeOnceVisible?: boolean };

export function useIntersection<T extends Element>({
  freezeOnceVisible = true,
  root = null,
  rootMargin = "0px",
  threshold = 0,
}: Options = {}) {
  const ref = useRef<T | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || (freezeOnceVisible && visible)) return;
    const obs = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        if (entry.isIntersecting) setVisible(true);
        else if (!freezeOnceVisible) setVisible(false);
      },
      { root, rootMargin, threshold },
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, [freezeOnceVisible, root, rootMargin, threshold, visible]);

  return { ref, visible } as const;
}
