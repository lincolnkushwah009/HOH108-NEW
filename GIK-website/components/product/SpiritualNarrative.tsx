"use client";

import { useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { perspective3DEntrance } from "@/lib/animations";
import type { SpiritualSignificance } from "@/lib/data/products";

gsap.registerPlugin(ScrollTrigger);

interface SpiritualNarrativeProps {
  spiritualSignificance: SpiritualSignificance | null;
  productName: string;
}

export function SpiritualNarrative({
  spiritualSignificance,
  productName,
}: SpiritualNarrativeProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const topBorderRef = useRef<HTMLDivElement>(null);
  const bottomBorderRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLParagraphElement>(null);
  const quoteRef = useRef<HTMLParagraphElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!spiritualSignificance) return;

    const ctx = gsap.context(() => {
      // Animated sacred geometry borders — lines scale in, diamond rotates
      if (topBorderRef.current) {
        const lines = topBorderRef.current.querySelectorAll(".sacred-line");
        const diamond = topBorderRef.current.querySelector(".sacred-diamond");

        gsap.fromTo(
          lines,
          { scaleX: 0 },
          {
            scaleX: 1,
            duration: 0.8,
            ease: "expo.out",
            stagger: 0.1,
            scrollTrigger: {
              trigger: sectionRef.current,
              start: "top 80%",
              once: true,
            },
          }
        );

        if (diamond) {
          gsap.fromTo(
            diamond,
            { scale: 0, rotate: 0 },
            {
              scale: 1,
              rotate: 45,
              duration: 0.6,
              ease: "back.out(1.7)",
              scrollTrigger: {
                trigger: sectionRef.current,
                start: "top 80%",
                once: true,
              },
              delay: 0.3,
            }
          );
        }
      }

      // Bottom border mirrors top with delay
      if (bottomBorderRef.current) {
        const lines = bottomBorderRef.current.querySelectorAll(".sacred-line");
        const diamond = bottomBorderRef.current.querySelector(".sacred-diamond");

        gsap.fromTo(
          lines,
          { scaleX: 0 },
          {
            scaleX: 1,
            duration: 0.8,
            ease: "expo.out",
            stagger: 0.1,
            scrollTrigger: {
              trigger: bottomBorderRef.current,
              start: "top 90%",
              once: true,
            },
          }
        );

        if (diamond) {
          gsap.fromTo(
            diamond,
            { scale: 0, rotate: 0 },
            {
              scale: 1,
              rotate: 45,
              duration: 0.6,
              ease: "back.out(1.7)",
              scrollTrigger: {
                trigger: bottomBorderRef.current,
                start: "top 90%",
                once: true,
              },
              delay: 0.3,
            }
          );
        }
      }

      // Title stagger
      if (titleRef.current) {
        gsap.fromTo(
          titleRef.current,
          { opacity: 0, y: 15 },
          {
            opacity: 1,
            y: 0,
            duration: 0.7,
            ease: "expo.out",
            scrollTrigger: {
              trigger: sectionRef.current,
              start: "top 78%",
              once: true,
            },
            delay: 0.4,
          }
        );
      }

      // Editorial quote with slight scale
      if (quoteRef.current) {
        gsap.fromTo(
          quoteRef.current,
          { opacity: 0, y: 20, scale: 0.97 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.85,
            ease: "expo.out",
            scrollTrigger: {
              trigger: sectionRef.current,
              start: "top 75%",
              once: true,
            },
            delay: 0.5,
          }
        );
      }

      // Cards: 3D perspective entrance (bolder rotateX: -15)
      if (cardsRef.current) {
        const cards = cardsRef.current.children;
        perspective3DEntrance(cards, {
          rotateX: -15,
          fromScale: 0.9,
          stagger: 0.15,
          scrollTrigger: {
            trigger: cardsRef.current,
            start: "top 85%",
            once: true,
          },
        });
      }
    }, sectionRef);

    return () => ctx.revert();
  }, [spiritualSignificance]);

  if (!spiritualSignificance) return null;

  return (
    <section ref={sectionRef} className="bg-gik-linen py-16 md:py-24 content-auto">
      <div className="max-w-3xl mx-auto px-6 text-center">
        {/* Sacred geometry decorative border — animated */}
        <div ref={topBorderRef} className="flex items-center justify-center mb-10">
          <div className="sacred-line w-8 h-px bg-gik-stone/40 origin-right" style={{ transform: "scaleX(0)" }} />
          <div className="sacred-diamond w-2 h-2 border border-gik-stone/40 mx-3" style={{ transform: "scale(0)" }} />
          <div className="sacred-line w-8 h-px bg-gik-stone/40 origin-left" style={{ transform: "scaleX(0)" }} />
        </div>

        {/* Section title */}
        <p
          ref={titleRef}
          className="text-caption text-gik-stone font-body font-medium mb-6 opacity-0"
        >
          THE SACRED SIGNIFICANCE
        </p>

        {/* Editorial text */}
        <p
          ref={quoteRef}
          className="font-display text-xl md:text-2xl font-light text-gik-void leading-relaxed mb-12 italic opacity-0 will-change-transform"
        >
          Every object in the {productName} carries an intention older than memory &mdash;
          a sacred geometry rooted in Vaastu Shastra, the ancient Indian science of
          harmonious living.
        </p>

        {/* Placement and Best For */}
        <div
          ref={cardsRef}
          className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left"
          style={{ perspective: "800px" }}
        >
          {/* Recommended Placement */}
          <div
            className={cn(
              "p-6 md:p-8 opacity-0 will-change-transform",
              "border border-gik-stone/20 bg-gik-canvas/50",
              "hover-lift"
            )}
          >
            <p className="text-caption text-gik-earth font-body font-medium mb-4">
              RECOMMENDED PLACEMENT
            </p>
            <p className="text-sm text-gik-void/80 font-body leading-[1.8]">
              {spiritualSignificance.placement}
            </p>
          </div>

          {/* Best For */}
          <div
            className={cn(
              "p-6 md:p-8 opacity-0 will-change-transform",
              "border border-gik-stone/20 bg-gik-canvas/50",
              "hover-lift"
            )}
          >
            <p className="text-caption text-gik-earth font-body font-medium mb-4">
              BEST FOR
            </p>
            <p className="text-sm text-gik-void/80 font-body leading-[1.8]">
              {spiritualSignificance.bestFor}
            </p>
          </div>
        </div>

        {/* Bottom decorative element — animated */}
        <div ref={bottomBorderRef} className="flex items-center justify-center mt-10">
          <div className="sacred-line w-8 h-px bg-gik-stone/40 origin-right" style={{ transform: "scaleX(0)" }} />
          <div className="sacred-diamond w-2 h-2 border border-gik-stone/40 mx-3" style={{ transform: "scale(0)" }} />
          <div className="sacred-line w-8 h-px bg-gik-stone/40 origin-left" style={{ transform: "scaleX(0)" }} />
        </div>
      </div>
    </section>
  );
}
