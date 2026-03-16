"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { MagneticElement } from "@/components/effects/MagneticElement";

gsap.registerPlugin(ScrollTrigger);

const statPills = [
  { value: "12", suffix: " tons", label: "CO\u2082 Offset" },
  { value: "100", suffix: "%", label: "Recycled" },
  { value: "0", suffix: "", label: "Landfill" },
  { value: "50", suffix: "+", label: "Artisans" },
];

export default function SustainabilityStats() {
  const sectionRef = useRef<HTMLElement>(null);
  const counterRef = useRef<HTMLSpanElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);
  const pillsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (cardsRef.current) {
        const cards = cardsRef.current.children;
        gsap.fromTo(
          cards,
          { y: 40, opacity: 0, scale: 0.95 },
          {
            y: 0,
            opacity: 1,
            scale: 1,
            duration: 0.85,
            ease: "expo.out",
            stagger: 0.12,
            scrollTrigger: {
              trigger: sectionRef.current,
              start: "top 75%",
              once: true,
            },
          }
        );
      }

      const el = counterRef.current;
      if (el) {
        const scrambleTl = gsap.timeline({
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 75%",
            once: true,
          },
          delay: 0.3,
        });

        const scramble = { v: 0 };
        scrambleTl.to(scramble, {
          v: 1,
          duration: 0.3,
          ease: "none",
          onUpdate: () => {
            el.textContent = String(Math.floor(Math.random() * 850));
          },
        });

        const counter = { val: 0 };
        scrambleTl.to(counter, {
          val: 850,
          duration: 2,
          ease: "power2.out",
          onUpdate: () => {
            el.textContent = String(Math.round(counter.val));
          },
        });
      }

      if (pillsRef.current) {
        const pills = pillsRef.current.children;
        gsap.fromTo(
          pills,
          { y: 20, opacity: 0, scale: 0.9 },
          {
            y: 0,
            opacity: 1,
            scale: 1,
            duration: 0.6,
            ease: "expo.out",
            stagger: 0.08,
            scrollTrigger: {
              trigger: pillsRef.current,
              start: "top 85%",
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
            "radial-gradient(ellipse at center, rgba(184,157,111,0.06) 0%, transparent 60%)",
        }}
      />

      <div className="page-pad max-w-7xl mx-auto relative z-10">
        <div ref={cardsRef} className="grid grid-cols-1 md:grid-cols-3 bento-gap">
          {/* Card 1: Stat card */}
          <div
            className="overflow-hidden rounded-[24px] border border-white/[0.06] p-8 md:p-10 flex flex-col justify-between min-h-[320px]"
            style={{
              background: "rgba(184,157,111,0.06)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
            }}
          >
            <div>
              <div className="stat-number text-gik-canvas">
                <span ref={counterRef}>0</span>
                <span className="text-gik-gold">+</span>
              </div>
              <p className="text-caption text-gik-stone/50 font-body mt-3">
                KG of Materials Saved
              </p>
            </div>
            <div className="mt-8">
              <MagneticElement>
                <Link
                  href="/sustainability"
                  className="btn-text-slide relative overflow-hidden inline-flex items-center justify-center h-[42px] px-6 text-[11px] tracking-[0.1em] uppercase font-body font-medium rounded-full border border-gik-gold/30 text-gik-canvas transition-all duration-500 hover:bg-gik-gold hover:text-gik-void"
                >
                  <span
                    className="btn-text block transition-transform duration-500"
                    style={{ transitionTimingFunction: "var(--ease-out-expo)" }}
                  >
                    Read Our Story
                  </span>
                  <span
                    className="btn-text-hover absolute inset-0 flex items-center justify-center translate-y-full transition-transform duration-500"
                    style={{ transitionTimingFunction: "var(--ease-out-expo)" }}
                  >
                    Read Our Story
                  </span>
                </Link>
              </MagneticElement>
            </div>
          </div>

          {/* Card 2: Quote card */}
          <div
            className="overflow-hidden rounded-[24px] border border-white/[0.06] p-8 md:p-10 flex flex-col justify-between min-h-[320px]"
            style={{
              background: "rgba(27,24,22,0.5)",
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
            }}
          >
            <div>
              <p className="font-display italic text-lg md:text-xl leading-relaxed text-gik-canvas/60">
                &ldquo;We don&rsquo;t just make products. We give materials a second life, and in doing so, honour the earth that bore them.&rdquo;
              </p>
            </div>
            <div className="mt-8">
              <p className="text-caption text-gik-stone/40 font-body">
                12 artisan workshops across India
              </p>
            </div>
          </div>

          {/* Card 3: Image card */}
          <div className="relative min-h-[320px] overflow-hidden rounded-[24px] border border-white/[0.06]">
            <Image
              src="https://images.unsplash.com/photo-1416339306562-f3d12fefd36f?w=800&q=80"
              alt="Lush green forest"
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-gik-void/80 via-gik-void/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-8">
              <p className="font-display text-h3 font-light text-gik-canvas">
                See a <span className="heading-bold text-gradient-gold">Kinder</span> World
              </p>
            </div>
          </div>
        </div>

        {/* Stat pills */}
        <div ref={pillsRef} className="flex flex-wrap justify-center gap-3 mt-8">
          {statPills.map((pill) => (
            <div
              key={pill.label}
              className="rounded-[16px] px-5 py-3 flex items-center gap-3 border border-white/[0.06]"
              style={{
                background: "rgba(27,24,22,0.5)",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
              }}
            >
              <span className="font-display text-xl font-light text-gik-canvas">
                {pill.value}{pill.suffix}
              </span>
              <span className="text-[10px] tracking-[0.08em] uppercase text-gik-stone/50 font-body">
                {pill.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
