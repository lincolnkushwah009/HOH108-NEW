"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { MagneticElement } from "@/components/effects/MagneticElement";
import { GlassMorphism } from "@/components/effects/GlassMorphism";

gsap.registerPlugin(ScrollTrigger);

const product = {
  category: "GIK Align",
  name: "The Vedic Frame",
  description:
    "Handcrafted from reclaimed teak, each piece carries the memory of its past life, reborn with intention. The natural grain patterns tell stories of decades past, now given a sacred new purpose.",
  price: "\u20B912,500",
  href: "/shop/align/dhyana-meditation-frame",
  image: "https://images.unsplash.com/photo-1631679706909-1844bbd07221?w=1200&q=80",
};

export default function ProductBriefing() {
  const sectionRef = useRef<HTMLElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const priceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (imageRef.current) {
        gsap.fromTo(
          imageRef.current,
          { clipPath: "inset(10% 10%)" },
          {
            clipPath: "inset(0% 0%)",
            ease: "none",
            scrollTrigger: {
              trigger: imageRef.current,
              start: "top 80%",
              end: "top 40%",
              scrub: 1,
            },
          }
        );
      }

      if (priceRef.current) {
        gsap.to(priceRef.current, {
          y: -8,
          duration: 2,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });
      }

      gsap.fromTo(
        ".briefing-animate",
        { y: 30, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.85,
          ease: "expo.out",
          stagger: 0.1,
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 60%",
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
      className="relative bg-gik-void"
      style={{
        paddingTop: "var(--space-section)",
        paddingBottom: "var(--space-section)",
      }}
    >
      {/* Ambient glow */}
      <div
        className="absolute left-1/2 top-[30%] -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(184,157,111,0.06) 0%, transparent 60%)",
        }}
      />

      <div className="page-pad max-w-7xl mx-auto relative z-10">
        {/* Heading */}
        <div className="mb-10 md:mb-14">
          <p className="briefing-animate text-caption text-gik-gold/50 font-body mb-4 opacity-0">
            {product.category}
          </p>
          <h2 className="briefing-animate font-display text-h1 font-light text-gik-canvas opacity-0">
            Unveiling a New Era in{" "}
            <span className="heading-bold text-gradient-gold">Sacred Design</span>
            <br className="hidden md:block" />
            {" "}and <span className="heading-bold text-gradient-gold">Intentional Living</span>
          </h2>
        </div>

        {/* Full-width image with glassmorphic overlays */}
        <div ref={imageRef} className="relative w-full overflow-hidden rounded-[24px] border border-white/[0.06]" style={{ clipPath: "inset(10% 10%)" }}>
          <div className="relative aspect-[16/9] md:aspect-[21/9]">
            <Image
              src={product.image}
              alt={`${product.name} lifestyle`}
              fill
              sizes="100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-gik-void/80 via-gik-void/10 to-transparent" />

            {/* Floating price pill */}
            <div ref={priceRef} className="absolute top-6 left-6 z-10">
              <GlassMorphism blur={16} opacity={0.5} dark className="rounded-full px-5 py-2">
                <span className="font-display text-lg font-light text-gik-canvas">
                  {product.price}
                </span>
              </GlassMorphism>
            </div>

            {/* Floating testimonial */}
            <div className="absolute bottom-6 right-6 z-10 max-w-xs hidden md:block">
              <GlassMorphism blur={16} opacity={0.4} dark border className="rounded-xl p-5">
                <div className="flex items-center gap-1 mb-2">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <span key={s} className="text-gik-gold text-sm">&#9733;</span>
                  ))}
                </div>
                <p className="font-display italic text-sm text-gik-canvas/70 leading-relaxed">
                  &ldquo;The Vedic Frame transformed my meditation space. It carries an energy that feels both ancient and perfectly new.&rdquo;
                </p>
                <p className="text-[11px] text-gik-stone/50 mt-3 font-body">
                  Priya K. &middot; Mumbai
                </p>
              </GlassMorphism>
            </div>
          </div>
        </div>

        {/* CTA + description */}
        <div className="flex flex-col md:flex-row justify-between items-start gap-6 mt-8">
          <div className="briefing-animate opacity-0">
            <MagneticElement>
              <Link
                href={product.href}
                className="btn-text-slide relative overflow-hidden inline-flex items-center justify-center h-[45px] px-8 text-[12px] tracking-[0.1em] uppercase font-body font-medium rounded-full border border-gik-gold/30 text-gik-canvas transition-all duration-500 hover:bg-gik-gold hover:text-gik-void hover:border-gik-gold"
              >
                <span
                  className="btn-text block transition-transform duration-500"
                  style={{ transitionTimingFunction: "var(--ease-out-expo)" }}
                >
                  View {product.name}
                </span>
                <span
                  className="btn-text-hover absolute inset-0 flex items-center justify-center translate-y-full transition-transform duration-500"
                  style={{ transitionTimingFunction: "var(--ease-out-expo)" }}
                >
                  View {product.name}
                </span>
              </Link>
            </MagneticElement>
          </div>
          <p className="briefing-animate text-gik-stone/50 leading-relaxed font-body max-w-md text-sm opacity-0">
            {product.description}
          </p>
        </div>
      </div>
    </section>
  );
}
