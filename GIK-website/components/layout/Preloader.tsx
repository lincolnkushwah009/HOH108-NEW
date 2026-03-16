"use client";

import { useEffect, useRef, useState, useContext, useCallback } from "react";
import Image from "next/image";
import gsap from "gsap";
import { GlassMorphism } from "@/components/effects/GlassMorphism";
import { LenisContext } from "@/components/providers/SmoothScroll";

export default function Preloader() {
  const [show, setShow] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef<HTMLSpanElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);
  const hasRun = useRef(false);

  const lenis = useContext(LenisContext);
  const lenisRef = useRef(lenis);
  lenisRef.current = lenis;

  // Pause Lenis when it becomes available and preloader is still showing
  useEffect(() => {
    if (lenis && show) {
      lenis.stop();
    }
  }, [lenis, show]);

  useEffect(() => {
    // Only run once
    if (hasRun.current) return;
    hasRun.current = true;

    // Skip if already visited this session
    if (typeof window !== "undefined" && sessionStorage.getItem("gik-loaded")) {
      setShow(false);
      return;
    }

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        onComplete: () => {
          sessionStorage.setItem("gik-loaded", "1");

          // Radial clipPath shrink exit
          gsap.to(containerRef.current, {
            clipPath: "circle(0% at 50% 50%)",
            duration: 0.8,
            ease: "expo.inOut",
            delay: 0.2,
            onComplete: () => {
              setShow(false);
              // Resume Lenis after preloader
              lenisRef.current?.start();
            },
          });
        },
      });

      // Phase 1: Golden line expand
      tl.fromTo(
        lineRef.current,
        { scaleX: 0 },
        { scaleX: 1, duration: 0.5, ease: "expo.out" },
        0
      );

      // Phase 2: Logo fade in with scale entrance
      tl.fromTo(
        logoRef.current,
        { scale: 0.8, opacity: 0 },
        {
          scale: 1,
          opacity: 1,
          duration: 0.85,
          ease: "expo.out",
        },
        0.3
      );

      // Phase 3: Scramble counter — random digits flash, then count up
      tl.fromTo(
        counterRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.4, ease: "power2.out" },
        1.2
      );

      // Scramble phase: random digits flash for 0.3s
      const scramble = { val: 0 };
      tl.to(
        scramble,
        {
          val: 1,
          duration: 0.3,
          ease: "none",
          onUpdate: () => {
            if (counterRef.current) {
              counterRef.current.textContent = String(
                Math.floor(Math.random() * 100)
              );
            }
          },
        },
        1.2
      );

      // Then smooth count 0→100
      const counter = { val: 0 };
      tl.to(
        counter,
        {
          val: 100,
          duration: 0.8,
          ease: "power2.out",
          onUpdate: () => {
            if (counterRef.current) {
              counterRef.current.textContent = String(Math.round(counter.val));
            }
          },
        },
        1.5
      );
    }, containerRef);

    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!show) return null;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-gik-canvas"
      style={{ clipPath: "circle(150% at 50% 50%)" }}
    >
      {/* Golden line */}
      <div
        ref={lineRef}
        className="h-px bg-gik-gold origin-center"
        style={{ width: 120, transform: "scaleX(0)" }}
      />

      {/* Brand logo — scale entrance */}
      <div ref={logoRef} className="mt-6 opacity-0">
        <Image
          src="/logo.png"
          alt="God Is Kind 108"
          width={400}
          height={400}
          className="h-20 md:h-24 w-auto"
          priority
        />
      </div>

      {/* Counter with glass morphism */}
      <GlassMorphism blur={8} opacity={0.3} className="fixed bottom-8 right-[var(--space-page)] rounded-full px-3 py-1">
        <span
          ref={counterRef}
          className="text-[11px] tracking-wider text-gik-stone font-body tabular-nums opacity-0"
        >
          0
        </span>
      </GlassMorphism>
    </div>
  );
}
