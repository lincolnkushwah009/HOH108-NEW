"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { GlassMorphism } from "@/components/effects/GlassMorphism";
import { lineReveal } from "@/lib/animations";

gsap.registerPlugin(ScrollTrigger);

export default function FoundersLetter() {
  const sectionRef = useRef<HTMLElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const letterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (imageRef.current) {
        gsap.fromTo(
          imageRef.current,
          { clipPath: "inset(0% 100% 0% 0%)" },
          {
            clipPath: "inset(0% 0% 0% 0%)",
            duration: 1.2,
            ease: "expo.out",
            scrollTrigger: {
              trigger: sectionRef.current,
              start: "top 75%",
              once: true,
            },
          }
        );
      }

      const lines = letterRef.current?.querySelectorAll(".line-reveal > *");
      if (lines) {
        lineReveal(lines, {
          stagger: 0.1,
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 70%",
            once: true,
          },
          delay: 0.4,
        });
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative bg-gik-void"
      style={{
        paddingTop: "var(--space-section)",
        paddingBottom: "var(--space-section)",
      }}
    >
      <div className="page-pad max-w-7xl mx-auto relative z-10">
        <div
          ref={imageRef}
          className="relative w-full overflow-hidden rounded-[24px] border border-white/[0.06]"
          style={{ clipPath: "inset(0% 100% 0% 0%)" }}
        >
          <div className="relative aspect-[16/9] md:aspect-[21/9] min-h-[400px]">
            <Image
              src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1200&q=80"
              alt="Workshop with artisan crafting sacred objects"
              fill
              sizes="100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-gik-void/80 via-gik-void/20 to-transparent" />

            {/* Tag pill */}
            <div className="absolute top-6 right-6 z-10">
              <span className="tag-pill tag-pill-light text-[9px]">
                Story &rarr;
              </span>
            </div>

            {/* Glassmorphic letter card */}
            <div ref={letterRef} className="absolute bottom-6 left-6 z-10 max-w-md">
              <GlassMorphism blur={16} opacity={0.5} dark border className="rounded-xl p-6 md:p-8">
                <div className="line-reveal overflow-hidden">
                  <p className="text-caption text-gik-gold/60 font-body">
                    A Letter from the Founder
                  </p>
                </div>

                <div className="line-reveal overflow-hidden mt-4">
                  <div
                    className="font-display italic text-sm md:text-base leading-relaxed text-gik-canvas/70 space-y-3"
                  >
                    <p>
                      &ldquo;When I first held a piece of discarded teak &mdash; weathered,
                      forgotten, destined for a landfill &mdash; I saw something
                      others didn&rsquo;t. I saw a story waiting to continue.&rdquo;
                    </p>
                  </div>
                </div>

                <div className="line-reveal overflow-hidden mt-5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-gik-earth/30">
                      <Image
                        src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80"
                        alt="Arjun Mehta"
                        width={32}
                        height={32}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <p className="font-display text-sm font-light text-gik-canvas">
                        Arjun Mehta
                      </p>
                      <p className="text-[10px] text-gik-stone/50 font-body">
                        Founder
                      </p>
                    </div>
                  </div>
                </div>
              </GlassMorphism>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
