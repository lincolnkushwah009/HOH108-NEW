"use client";

import { useRef, useEffect, type ReactNode } from "react";
import gsap from "gsap";

interface MagneticElementProps {
  children: ReactNode;
  strength?: number;
  radius?: number;
  as?: React.ElementType;
  className?: string;
}

export function MagneticElement({
  children,
  strength = 0.3,
  radius = 150,
  as: Tag = "div",
  className,
}: MagneticElementProps) {
  const ref = useRef<HTMLElement>(null);
  const moveX = useRef<ReturnType<typeof gsap.quickTo> | null>(null);
  const moveY = useRef<ReturnType<typeof gsap.quickTo> | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Skip on touch devices
    if (window.matchMedia("(pointer: coarse)").matches) return;

    moveX.current = gsap.quickTo(el, "x", { duration: 0.4, ease: "power2.out" });
    moveY.current = gsap.quickTo(el, "y", { duration: 0.4, ease: "power2.out" });

    const onMouseMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const distX = e.clientX - centerX;
      const distY = e.clientY - centerY;
      const dist = Math.sqrt(distX * distX + distY * distY);

      if (dist < radius) {
        const factor = 1 - dist / radius;
        moveX.current?.(distX * strength * factor);
        moveY.current?.(distY * strength * factor);
      }
    };

    const onMouseLeave = () => {
      gsap.to(el, { x: 0, y: 0, duration: 0.6, ease: "elastic.out(1, 0.4)" });
    };

    el.addEventListener("mousemove", onMouseMove, { passive: true });
    el.addEventListener("mouseleave", onMouseLeave);

    return () => {
      el.removeEventListener("mousemove", onMouseMove);
      el.removeEventListener("mouseleave", onMouseLeave);
    };
  }, [strength, radius]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Component = Tag as any;

  return (
    <Component ref={ref} className={className} data-magnetic>
      {children}
    </Component>
  );
}
