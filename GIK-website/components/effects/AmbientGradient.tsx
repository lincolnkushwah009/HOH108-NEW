"use client";

import { useRef, useEffect } from "react";
import gsap from "gsap";
import { cn } from "@/lib/utils";

interface AmbientGradientProps {
  colors?: string[];
  speed?: number;
  opacity?: number;
  className?: string;
}

export function AmbientGradient({
  colors = ["#b89d6f", "#4d3d30", "#9f9689"],
  speed = 0.0003,
  opacity = 0.12,
  className,
}: AmbientGradientProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const blobRefs = useRef<HTMLDivElement[]>([]);

  useEffect(() => {
    const blobs = blobRefs.current;
    if (blobs.length === 0) return;

    const animations = blobs.map((blob, i) => {
      const angle = (i / blobs.length) * Math.PI * 2;
      const radiusX = 30 + Math.random() * 20;
      const radiusY = 20 + Math.random() * 15;
      const speedMultiplier = 0.8 + Math.random() * 0.4;

      return gsap.to(blob, {
        keyframes: [
          {
            x: Math.cos(angle) * radiusX,
            y: Math.sin(angle) * radiusY,
            scale: 1.1,
            duration: (20 / speedMultiplier) * (1 / (speed * 1000)),
          },
          {
            x: Math.cos(angle + Math.PI) * radiusX * 0.8,
            y: Math.sin(angle + Math.PI) * radiusY * 1.2,
            scale: 0.9,
            duration: (20 / speedMultiplier) * (1 / (speed * 1000)),
          },
        ],
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });
    });

    return () => {
      animations.forEach((a) => a.kill());
    };
  }, [speed, colors]);

  return (
    <div
      ref={containerRef}
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
      style={{ opacity }}
    >
      {colors.map((color, i) => (
        <div
          key={i}
          ref={(el) => {
            if (el) blobRefs.current[i] = el;
          }}
          className="absolute rounded-full blur-[80px]"
          style={{
            width: "40%",
            height: "40%",
            left: `${20 + (i * 25)}%`,
            top: `${15 + (i * 20)}%`,
            backgroundColor: color,
          }}
        />
      ))}
    </div>
  );
}
