"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function Philosophy() {
  const sectionRef = useRef<HTMLElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Card scale entrance
      if (cardRef.current) {
        gsap.fromTo(
          cardRef.current,
          { scale: 0.92, opacity: 0, y: 40 },
          {
            scale: 1,
            opacity: 1,
            y: 0,
            duration: 1.2,
            ease: "expo.out",
            scrollTrigger: {
              trigger: sectionRef.current,
              start: "top 70%",
              once: true,
            },
          }
        );
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
      {/* Ambient glow */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(184,157,111,0.08) 0%, transparent 60%)",
        }}
      />

      <div className="page-pad max-w-4xl mx-auto relative z-10">
        <div
          ref={cardRef}
          className="relative overflow-hidden rounded-[24px] border border-white/[0.06] p-8 md:p-12 lg:p-16 text-center opacity-0"
          style={{
            background: "rgba(27,24,22,0.5)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
          }}
        >
          {/* Subtle inner glow */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: "radial-gradient(ellipse at center, rgba(184,157,111,0.05) 0%, transparent 60%)",
            }}
          />

          <div className="relative z-10">
            <h2 className="font-display text-h2 font-light text-gik-canvas leading-[1.2]">
              Every <span className="heading-bold text-gradient-gold">Object</span> in Your Home
              <br />
              Should Carry a Story of{" "}
              <span className="heading-bold text-gradient-gold">Kindness</span>
            </h2>

            <div className="mx-auto my-8 w-16 h-px bg-gik-gold/40" />

            <p className="font-display italic text-base md:text-lg text-gik-stone/60 max-w-lg mx-auto leading-relaxed">
              Objects of intention, crafted from what the world left behind.
              Where sustainability meets the sacred.
            </p>

            <div className="flex items-center justify-center gap-3 mt-10">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full bg-gik-earth/20 border-2 border-gik-void overflow-hidden"
                  >
                    <Image
                      src={`https://images.unsplash.com/photo-${
                        i === 1 ? "1507003211169-0a1dd7228f2d" :
                        i === 2 ? "1506439773649-6e0eb8cfb237" :
                        i === 3 ? "1494790108377-be9c29b29330" :
                        "1500648767791-00dcc994a43e"
                      }?w=100&q=80`}
                      alt="Artisan"
                      width={32}
                      height={32}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
              <p className="text-[12px] text-gik-stone/50 font-body tracking-[0.03em]">
                50+ artisans across India
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
