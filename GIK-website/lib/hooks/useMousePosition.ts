"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

interface MousePosition {
  x: number;
  y: number;
  normalizedX: number;
  normalizedY: number;
}

export function useMousePosition() {
  const [position, setPosition] = useState<MousePosition>({
    x: 0,
    y: 0,
    normalizedX: 0,
    normalizedY: 0,
  });

  const posRef = useRef({ x: 0, y: 0, normalizedX: 0, normalizedY: 0 });
  const smoothX = useRef<ReturnType<typeof gsap.quickTo> | null>(null);
  const smoothY = useRef<ReturnType<typeof gsap.quickTo> | null>(null);
  const targetRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    // Detect touch device
    const isTouch = window.matchMedia("(pointer: coarse)").matches;
    if (isTouch) return;

    const proxy = { x: 0, y: 0 };

    smoothX.current = gsap.quickTo(proxy, "x", {
      duration: 0.3,
      ease: "power2.out",
      onUpdate: () => {
        const nx = (proxy.x / window.innerWidth) * 2 - 1;
        const ny = (proxy.y / window.innerHeight) * 2 - 1;
        posRef.current = { x: proxy.x, y: proxy.y, normalizedX: nx, normalizedY: ny };
        setPosition({ x: proxy.x, y: proxy.y, normalizedX: nx, normalizedY: ny });
      },
    });

    smoothY.current = gsap.quickTo(proxy, "y", {
      duration: 0.3,
      ease: "power2.out",
    });

    const onMouseMove = (e: MouseEvent) => {
      targetRef.current = { x: e.clientX, y: e.clientY };
      smoothX.current?.(e.clientX);
      smoothY.current?.(e.clientY);
    };

    window.addEventListener("mousemove", onMouseMove, { passive: true });

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
    };
  }, []);

  return { position, posRef };
}
