"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { TiltCard } from "@/components/effects/TiltCard";
import { FlashReveal } from "@/components/effects/FlashReveal";
import { perspective3DEntrance } from "@/lib/animations";

gsap.registerPlugin(ScrollTrigger);

const materials = [
  {
    name: "Reclaimed Teak",
    origin: "Tamil Nadu",
    description:
      "Century-old teak beams salvaged from demolished heritage structures, hand-restored to reveal the grain patterns that only time can create.",
    image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&q=80",
  },
  {
    name: "Upcycled Brass",
    origin: "Moradabad",
    description:
      "Temple bells and traditional vessels melted and recast by fifth-generation artisans.",
    image: "https://images.unsplash.com/photo-1602192509154-0b900ee1f851?w=800&q=80",
  },
  {
    name: "Salvaged Driftwood",
    origin: "Kerala",
    description:
      "Ocean-shaped wood collected from the Kerala backwaters, each piece uniquely sculpted by water and time.",
    image: "https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=800&q=80",
  },
];

export default function MaterialStorySection() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const cards = sectionRef.current?.querySelectorAll(".material-card");
      if (cards) {
        perspective3DEntrance(cards, {
          rotateX: -20,
          fromScale: 0.85,
          stagger: 0.15,
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 65%",
            once: true,
          },
        });
      }

      gsap.fromTo(
        ".material-label",
        { y: 20, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.85,
          ease: "expo.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 75%",
            once: true,
          },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative bg-gik-void noise-overlay content-auto"
      style={{
        paddingTop: "var(--space-section)",
        paddingBottom: "var(--space-section)",
      }}
    >
      {/* Ambient glow */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[600px] pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(184,157,111,0.08) 0%, transparent 55%)",
        }}
      />

      <div className="page-pad max-w-6xl mx-auto relative z-10">
        <div className="text-center mb-12 md:mb-16">
          <p className="material-label text-caption text-gik-gold/50 font-body mb-4 opacity-0">
            Material Heritage
          </p>
          <FlashReveal as="h2" className="font-display text-h1 font-light text-gik-canvas">
            Stories in Every Grain
          </FlashReveal>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 md:grid-rows-2 bento-gap perspective-scroll md:h-[640px]">
          {/* Left — Tall card */}
          <div className="material-card md:row-span-2 opacity-0">
            <TiltCard maxTilt={6} glare>
              <div className="relative h-full min-h-[400px] overflow-hidden rounded-[24px] border border-white/[0.06]">
                <Image
                  src={materials[0].image}
                  alt={materials[0].name}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-gik-void/80 via-gik-void/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 z-10">
                  <span className="tag-pill tag-pill-light text-[9px] mb-3">
                    {materials[0].origin}
                  </span>
                  <h3 className="font-display text-h3 font-light text-gik-canvas mt-2">
                    {materials[0].name}
                  </h3>
                  <p className="text-sm text-gik-canvas/50 leading-relaxed mt-2 max-w-sm">
                    {materials[0].description}
                  </p>
                </div>
              </div>
            </TiltCard>
          </div>

          {/* Right — Two smaller cards */}
          {materials.slice(1).map((material) => (
            <div key={material.name} className="material-card opacity-0">
              <TiltCard maxTilt={6} glare>
                <div className="relative min-h-[240px] overflow-hidden rounded-[24px] border border-white/[0.06]">
                  <Image
                    src={material.image}
                    alt={material.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-gik-void/80 via-gik-void/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-6 z-10">
                    <span className="tag-pill tag-pill-light text-[9px] mb-2">
                      {material.origin}
                    </span>
                    <h3 className="font-display text-h3 font-light text-gik-canvas mt-2">
                      {material.name}
                    </h3>
                    <p className="text-sm text-gik-canvas/50 leading-relaxed mt-1">
                      {material.description}
                    </p>
                  </div>
                </div>
              </TiltCard>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
