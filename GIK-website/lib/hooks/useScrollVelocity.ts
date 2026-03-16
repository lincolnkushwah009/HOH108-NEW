"use client";

import { useEffect, useRef, useState } from "react";
import { useLenis } from "./useLenis";

interface ScrollVelocity {
  velocity: number;
  direction: number;
  progress: number;
}

export function useScrollVelocity() {
  const lenis = useLenis();
  const [state, setState] = useState<ScrollVelocity>({
    velocity: 0,
    direction: 0,
    progress: 0,
  });
  const stateRef = useRef(state);

  useEffect(() => {
    if (!lenis) return;

    const onScroll = () => {
      const next = {
        velocity: lenis.velocity,
        direction: lenis.direction,
        progress: lenis.progress,
      };
      stateRef.current = next;
      setState(next);
    };

    lenis.on("scroll", onScroll);
    return () => {
      lenis.off("scroll", onScroll);
    };
  }, [lenis]);

  return { ...state, stateRef };
}
