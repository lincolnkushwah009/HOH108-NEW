"use client";

import { useRef, useEffect, type ReactNode } from "react";
import gsap from "gsap";
import { cn } from "@/lib/utils";

interface TiltCardProps {
  children: ReactNode;
  maxTilt?: number;
  scale?: number;
  glare?: boolean;
  className?: string;
}

export function TiltCard({
  children,
  maxTilt = 8,
  scale = 1.02,
  glare = false,
  className,
}: TiltCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const glareRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    // Skip on touch devices
    if (window.matchMedia("(pointer: coarse)").matches) return;

    const onMouseMove = (e: MouseEvent) => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;

      const rotateX = (0.5 - y) * maxTilt;
      const rotateY = (x - 0.5) * maxTilt;

      gsap.to(card, {
        rotateX,
        rotateY,
        scale,
        duration: 0.4,
        ease: "power2.out",
        transformPerspective: 800,
      });

      if (glare && glareRef.current) {
        gsap.to(glareRef.current, {
          opacity: 0.15,
          background: `radial-gradient(circle at ${x * 100}% ${y * 100}%, rgba(255,255,255,0.25), transparent 60%)`,
          duration: 0.3,
        });
      }
    };

    const onMouseLeave = () => {
      gsap.to(card, {
        rotateX: 0,
        rotateY: 0,
        scale: 1,
        duration: 0.6,
        ease: "expo.out",
      });

      if (glare && glareRef.current) {
        gsap.to(glareRef.current, { opacity: 0, duration: 0.4 });
      }
    };

    card.addEventListener("mousemove", onMouseMove, { passive: true });
    card.addEventListener("mouseleave", onMouseLeave);

    return () => {
      card.removeEventListener("mousemove", onMouseMove);
      card.removeEventListener("mouseleave", onMouseLeave);
    };
  }, [maxTilt, scale, glare]);

  return (
    <div
      ref={cardRef}
      className={cn("relative will-change-transform", className)}
      style={{ transformStyle: "preserve-3d" }}
    >
      {children}
      {glare && (
        <div
          ref={glareRef}
          className="pointer-events-none absolute inset-0 z-10 opacity-0"
          style={{ borderRadius: "inherit" }}
        />
      )}
    </div>
  );
}
