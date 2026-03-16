"use client";

import { useRef, useEffect, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { cn } from "@/lib/utils";

gsap.registerPlugin(ScrollTrigger);

interface ParallaxLayerProps {
  children: ReactNode;
  speed?: number;
  className?: string;
}

export function ParallaxLayer({
  children,
  speed = 0.3,
  className,
}: ParallaxLayerProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const yPercent = speed * 30;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { yPercent: -yPercent },
        {
          yPercent: yPercent,
          ease: "none",
          scrollTrigger: {
            trigger: el,
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          },
        }
      );
    });

    return () => ctx.revert();
  }, [speed]);

  return (
    <div ref={ref} className={cn("will-change-transform", className)}>
      {children}
    </div>
  );
}
