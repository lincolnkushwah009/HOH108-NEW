"use client";

import { useRef, useEffect, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { cn } from "@/lib/utils";

gsap.registerPlugin(ScrollTrigger);

type TransitionType = "clip" | "fade" | "slide" | "curtain";

interface SectionTransitionProps {
  children: ReactNode;
  type?: TransitionType;
  delay?: number;
  className?: string;
}

export function SectionTransition({
  children,
  type = "clip",
  delay = 0,
  className,
}: SectionTransitionProps) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const curtainLeftRef = useRef<HTMLDivElement>(null);
  const curtainRightRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const ctx = gsap.context(() => {
      switch (type) {
        case "clip":
          gsap.fromTo(
            el,
            { clipPath: "inset(12% 4% 12% 4%)" },
            {
              clipPath: "inset(0% 0% 0% 0%)",
              ease: "expo.out",
              duration: 1.2,
              delay,
              scrollTrigger: {
                trigger: el,
                start: "top 85%",
                once: true,
              },
            }
          );
          break;

        case "fade":
          gsap.fromTo(
            el,
            { opacity: 0, y: 40 },
            {
              opacity: 1,
              y: 0,
              duration: 1,
              ease: "expo.out",
              delay,
              scrollTrigger: {
                trigger: el,
                start: "top 85%",
                once: true,
              },
            }
          );
          break;

        case "slide":
          gsap.fromTo(
            el,
            { y: 80, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: 1,
              ease: "expo.out",
              delay,
              scrollTrigger: {
                trigger: el,
                start: "top 90%",
                once: true,
              },
            }
          );
          break;

        case "curtain":
          if (curtainLeftRef.current && curtainRightRef.current) {
            const tl = gsap.timeline({
              scrollTrigger: {
                trigger: el,
                start: "top 85%",
                once: true,
              },
              delay,
            });

            tl.to(curtainLeftRef.current, {
              xPercent: -100,
              duration: 1,
              ease: "expo.inOut",
            });
            tl.to(
              curtainRightRef.current,
              {
                xPercent: 100,
                duration: 1,
                ease: "expo.inOut",
              },
              0
            );
          }
          break;
      }
    });

    return () => ctx.revert();
  }, [type, delay]);

  if (type === "curtain") {
    return (
      <div ref={sectionRef} className={cn("relative overflow-hidden", className)}>
        {children}
        <div
          ref={curtainLeftRef}
          className="pointer-events-none absolute inset-y-0 left-0 z-10 w-1/2 bg-gik-canvas"
        />
        <div
          ref={curtainRightRef}
          className="pointer-events-none absolute inset-y-0 right-0 z-10 w-1/2 bg-gik-canvas"
        />
      </div>
    );
  }

  return (
    <div ref={sectionRef} className={cn(className)}>
      {children}
    </div>
  );
}
