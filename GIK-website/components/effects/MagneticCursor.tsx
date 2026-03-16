"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { useCursor } from "@/components/providers/CursorProvider";
import { useScrollVelocity } from "@/lib/hooks/useScrollVelocity";

export function MagneticCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const { variant, text } = useCursor();
  const { velocity } = useScrollVelocity();
  const isTouch = useRef(false);

  useEffect(() => {
    isTouch.current = window.matchMedia("(pointer: coarse)").matches;
    if (isTouch.current) return;

    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    const moveDotX = gsap.quickTo(dot, "x", { duration: 0.15, ease: "power2.out" });
    const moveDotY = gsap.quickTo(dot, "y", { duration: 0.15, ease: "power2.out" });
    const moveRingX = gsap.quickTo(ring, "x", { duration: 0.35, ease: "power2.out" });
    const moveRingY = gsap.quickTo(ring, "y", { duration: 0.35, ease: "power2.out" });

    const onMouseMove = (e: MouseEvent) => {
      moveDotX(e.clientX);
      moveDotY(e.clientY);
      moveRingX(e.clientX);
      moveRingY(e.clientY);
    };

    const onMouseDown = () => {
      gsap.to(ring, { scale: 0.8, duration: 0.15 });
      gsap.to(dot, { scale: 1.5, duration: 0.15 });
    };

    const onMouseUp = () => {
      gsap.to(ring, { scale: 1, duration: 0.3, ease: "elastic.out(1, 0.4)" });
      gsap.to(dot, { scale: 1, duration: 0.3, ease: "elastic.out(1, 0.4)" });
    };

    const interactiveSelector = "a, button, [data-magnetic], [role='button']";

    const onMouseEnterInteractive = (e: Event) => {
      const target = e.target instanceof Element ? e.target : (e.target as Node)?.parentElement;
      if (target && target.matches(interactiveSelector)) {
        gsap.to(ring, { scale: 1.8, opacity: 0.15, duration: 0.3, ease: "expo.out" });
        gsap.to(dot, { scale: 0.5, duration: 0.3, ease: "expo.out" });
      }
    };

    const onMouseLeaveInteractive = (e: Event) => {
      const target = e.target instanceof Element ? e.target : (e.target as Node)?.parentElement;
      if (target && target.matches(interactiveSelector)) {
        gsap.to(ring, { scale: 1, opacity: 0.35, duration: 0.3, ease: "expo.out" });
        gsap.to(dot, { scale: 1, duration: 0.3, ease: "expo.out" });
      }
    };

    window.addEventListener("mousemove", onMouseMove, { passive: true });
    window.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mouseup", onMouseUp);
    document.addEventListener("mouseenter", onMouseEnterInteractive, true);
    document.addEventListener("mouseleave", onMouseLeaveInteractive, true);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mouseup", onMouseUp);
      document.removeEventListener("mouseenter", onMouseEnterInteractive, true);
      document.removeEventListener("mouseleave", onMouseLeaveInteractive, true);
    };
  }, []);

  // Update cursor visual based on variant
  useEffect(() => {
    if (isTouch.current) return;
    const ring = ringRef.current;
    const dot = dotRef.current;
    if (!ring || !dot) return;

    switch (variant) {
      case "hover":
        gsap.to(ring, { scale: 1.8, opacity: 0.15, duration: 0.3 });
        gsap.to(dot, { scale: 0.5, duration: 0.3 });
        break;
      case "drag":
        gsap.to(ring, { scale: 2.2, opacity: 0.1, duration: 0.3 });
        gsap.to(dot, { scale: 0.3, duration: 0.3 });
        break;
      case "hidden":
        gsap.to(ring, { scale: 0, duration: 0.2 });
        gsap.to(dot, { scale: 0, duration: 0.2 });
        break;
      default:
        gsap.to(ring, { scale: 1, opacity: 0.35, duration: 0.3 });
        gsap.to(dot, { scale: 1, duration: 0.3 });
    }
  }, [variant]);

  // Text label mode
  useEffect(() => {
    if (isTouch.current) return;
    const ring = ringRef.current;
    const label = labelRef.current;
    if (!ring || !label) return;

    if (text) {
      label.textContent = text;
      gsap.to(ring, { width: 80, height: 80, duration: 0.3, ease: "expo.out" });
      gsap.to(label, { opacity: 1, duration: 0.2 });
    } else {
      gsap.to(ring, { width: 40, height: 40, duration: 0.3, ease: "expo.out" });
      gsap.to(label, { opacity: 0, duration: 0.2 });
    }
  }, [text]);

  // Scroll velocity ring scaling
  useEffect(() => {
    if (isTouch.current) return;
    const ring = ringRef.current;
    if (!ring || variant !== "default") return;

    const velScale = 1 + Math.min(Math.abs(velocity) * 0.0008, 0.5);
    gsap.to(ring, { scaleY: velScale, duration: 0.2, overwrite: "auto" });
  }, [velocity, variant]);

  return (
    <>
      <div
        ref={dotRef}
        className="cursor-dot pointer-events-none fixed top-0 left-0 z-[9999] -translate-x-1/2 -translate-y-1/2 hidden md:block"
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          backgroundColor: "var(--gik-earth)",
        }}
      />
      <div
        ref={ringRef}
        className="cursor-ring pointer-events-none fixed top-0 left-0 z-[9998] -translate-x-1/2 -translate-y-1/2 hidden md:flex items-center justify-center"
        style={{
          width: 40,
          height: 40,
          borderRadius: "50%",
          border: "1px solid var(--gik-earth)",
          opacity: 0.35,
          mixBlendMode: "difference",
        }}
      >
        <span
          ref={labelRef}
          className="text-[9px] tracking-wider uppercase font-body text-gik-canvas whitespace-nowrap opacity-0"
        />
      </div>
    </>
  );
}
