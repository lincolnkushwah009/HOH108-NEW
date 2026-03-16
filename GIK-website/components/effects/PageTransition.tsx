"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import gsap from "gsap";

export function PageTransition({ children }: { children: React.ReactNode }) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const prevPathname = useRef(pathname);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (prevPathname.current === pathname) return;
    prevPathname.current = pathname;

    const overlay = overlayRef.current;
    if (!overlay) return;

    setIsAnimating(true);

    const tl = gsap.timeline({
      onComplete: () => setIsAnimating(false),
    });

    // Slide up from bottom
    tl.fromTo(
      overlay,
      { yPercent: 100 },
      { yPercent: 0, duration: 0.4, ease: "expo.out" }
    );

    // Hold
    tl.to(overlay, { duration: 0.3 });

    // Slide up off top
    tl.to(overlay, {
      yPercent: -100,
      duration: 0.4,
      ease: "expo.out",
    });
  }, [pathname]);

  return (
    <>
      {children}
      <div
        ref={overlayRef}
        className="fixed inset-0 z-[90] bg-gik-void pointer-events-none"
        style={{
          transform: "translateY(100%)",
          display: isAnimating ? "block" : "none",
        }}
      />
    </>
  );
}
