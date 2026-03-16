"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface ScrollPromptProps {
  label?: string;
  dark?: boolean;
}

export default function ScrollPrompt({ label = "Scroll to Discover", dark = true }: ScrollPromptProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ref.current,
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          ease: "expo.out",
          scrollTrigger: {
            trigger: ref.current,
            start: "top 95%",
            once: true,
          },
        }
      );
    });
    return () => ctx.revert();
  }, []);

  const textColor = dark ? "text-gik-stone/40" : "text-gik-void/30";
  const lineColor = dark ? "bg-gik-gold/30" : "bg-gik-earth/20";
  const arrowColor = dark ? "text-gik-gold/50" : "text-gik-earth/40";

  return (
    <div ref={ref} className="flex flex-col items-center py-12 md:py-16 opacity-0">
      <p className={`text-[10px] tracking-[0.2em] uppercase font-body mb-4 ${textColor}`}>
        {label}
      </p>
      <div className={`w-px h-8 ${lineColor}`} />
      <div className={`scroll-prompt mt-2 ${arrowColor}`}>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1">
          <path d="M2 4L6 8L10 4" />
        </svg>
      </div>
    </div>
  );
}
