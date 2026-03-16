"use client";

import { createContext, useEffect, useRef, useState } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export const LenisContext = createContext<Lenis | null>(null);

export default function SmoothScroll({ children }: { children: React.ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null);
  const [lenis, setLenis] = useState<Lenis | null>(null);

  useEffect(() => {
    const instance = new Lenis({
      lerp: 0.1,
      duration: 1.2,
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: true,
    });

    lenisRef.current = instance;
    setLenis(instance);

    // Integrate Lenis with GSAP ScrollTrigger
    instance.on("scroll", ScrollTrigger.update);

    gsap.ticker.add((time) => {
      instance.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0);

    return () => {
      instance.destroy();
      lenisRef.current = null;
      setLenis(null);
    };
  }, []);

  return (
    <LenisContext.Provider value={lenis}>
      {children}
    </LenisContext.Provider>
  );
}
