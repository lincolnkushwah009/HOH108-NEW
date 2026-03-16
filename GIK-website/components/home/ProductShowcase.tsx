"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { products } from "@/lib/data/products";

gsap.registerPlugin(ScrollTrigger);

const featuredProducts = [
  products[6],
  products[1],
  products[14],
];

const cardLayouts = [
  { left: "8%",  top: "12%", rotate: -10, scale: 0.85, z: 1 },
  { left: "33%", top: "0%",  rotate: 0,   scale: 1,    z: 3 },
  { left: "58%", top: "12%", rotate: 10,  scale: 0.85, z: 1 },
];

export default function ProductShowcase() {
  const sectionRef = useRef<HTMLElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);
  const titleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const cards = cardsRef.current.filter(Boolean) as HTMLDivElement[];
    const isDesktop = window.innerWidth >= 768;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        titleRef.current,
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 1,
          ease: "expo.out",
          scrollTrigger: {
            trigger: section,
            start: "top 75%",
            once: true,
          },
        }
      );

      if (isDesktop) {
        const order = [1, 0, 2];
        order.forEach((i, stagger) => {
          const card = cards[i];
          if (!card) return;
          const layout = cardLayouts[i];

          gsap.fromTo(
            card,
            { y: 100, opacity: 0, rotate: 0, scale: 0.5 },
            {
              y: 0,
              opacity: 1,
              rotate: layout.rotate,
              scale: layout.scale,
              duration: 1.2,
              ease: "expo.out",
              delay: stagger * 0.12,
              scrollTrigger: {
                trigger: section,
                start: "top 65%",
                once: true,
              },
            }
          );
        });
      } else {
        gsap.fromTo(
          cards,
          { y: 60, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.8,
            ease: "expo.out",
            stagger: 0.15,
            scrollTrigger: {
              trigger: section,
              start: "top 65%",
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
      className="relative bg-gik-void py-16 md:py-32 lg:py-40 overflow-hidden"
    >
      {/* Dramatic ambient glow */}
      <div
        className="absolute left-1/2 top-[55%] -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[700px] pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(184,157,111,0.12) 0%, rgba(184,157,111,0.03) 45%, transparent 70%)",
        }}
      />
      <div className="noise-overlay absolute inset-0 pointer-events-none opacity-20" />

      <div className="relative z-10 page-pad">
        <div ref={titleRef} className="text-center mb-10 md:mb-24 opacity-0">
          <p className="text-[10px] tracking-[0.2em] uppercase text-gik-gold/50 font-body mb-5">
            Collections
          </p>
          <h2 className="font-display font-light text-gik-canvas text-[clamp(1.6rem,4.5vw,4rem)] leading-[1.1] max-w-2xl mx-auto">
            Shaping the Future of{" "}
            <span className="heading-bold text-gradient-gold">Sacred Living</span>
          </h2>
          <p className="mt-5 text-gik-stone/35 text-sm max-w-md mx-auto font-body">
            Objects of intention, crafted from what the world left behind.
          </p>
        </div>

        {/* Desktop: absolute positioned overlapping cards */}
        <div className="hidden md:block relative mx-auto w-full max-w-5xl" style={{ height: "clamp(400px, 55vw, 580px)" }}>
          {featuredProducts.map((product, i) => {
            const layout = cardLayouts[i];
            return (
              <div
                key={product.id}
                ref={(el) => { cardsRef.current[i] = el; }}
                className="absolute opacity-0"
                style={{
                  width: "clamp(240px, 30vw, 340px)",
                  aspectRatio: "3/4",
                  left: layout.left,
                  top: layout.top,
                  transform: `rotate(${layout.rotate}deg) scale(${layout.scale})`,
                  zIndex: layout.z,
                  transformOrigin: "center center",
                }}
              >
                <ProductCard product={product} />
              </div>
            );
          })}
        </div>

        {/* Mobile: horizontal scroll cards */}
        <div className="md:hidden flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory -mx-[var(--space-page)] px-[var(--space-page)]" style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}>
          {featuredProducts.map((product, i) => (
            <div
              key={product.id}
              ref={(el) => { if (!cardsRef.current[i]) cardsRef.current[i] = el; }}
              className="shrink-0 snap-center opacity-0"
              style={{ width: "75vw", aspectRatio: "3/4" }}
            >
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProductCard({ product }: { product: typeof products[0] }) {
  return (
    <Link
      href={`/shop/${product.category}/${product.slug}`}
      className="block relative w-full h-full group"
    >
      <div
        className="relative w-full h-full rounded-[20px] md:rounded-[24px] overflow-hidden border border-white/[0.06] shadow-2xl shadow-black/50 transition-all duration-500 group-hover:shadow-gik-gold/15 group-hover:border-white/[0.12] group-hover:-translate-y-2"
        style={{ backgroundColor: "rgba(20,18,16,0.6)" }}
      >
        <Image
          src={product.images[0]}
          alt={product.name}
          fill
          sizes="(max-width: 768px) 75vw, 340px"
          className="object-cover transition-transform duration-700 group-hover:scale-105"
          style={{ transitionTimingFunction: "var(--ease-out-expo)" }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 z-10">
          <span className="inline-block text-[9px] tracking-[0.14em] uppercase text-gik-gold/50 mb-2">
            {product.category}
          </span>
          <h3 className="font-display text-base md:text-lg font-light text-gik-canvas leading-tight">
            {product.name}
          </h3>
          <p className="text-xs text-gik-canvas/30 mt-2 font-body group-hover:text-gik-gold transition-colors duration-300">
            Explore &rarr;
          </p>
        </div>
      </div>
    </Link>
  );
}
