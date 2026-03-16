"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { Product } from "@/lib/data/products";

gsap.registerPlugin(ScrollTrigger);

interface FeatureRevealsProps {
  product: Product;
}

const featurePanels = (product: Product) => [
  {
    keyword: "Material",
    title: product.material,
    description: `Each piece is crafted from ${product.material.toLowerCase()}, carefully selected for its character and quality. The natural variations ensure no two pieces are identical.`,
  },
  {
    keyword: "Origin",
    title: product.origin,
    description: `Sourced and crafted in ${product.origin}, where traditional artisans apply time-honoured techniques passed down through generations.`,
  },
  {
    keyword: "Dimensions",
    title: `${product.dimensions.length} × ${product.dimensions.width} × ${product.dimensions.height} cm`,
    description: `Weighing ${product.dimensions.weight} kg, this piece is designed to be both substantial and balanced, fitting naturally into your living space.`,
  },
];

export function FeatureReveals({ product }: FeatureRevealsProps) {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const panels = sectionRef.current?.querySelectorAll(".feature-panel");
      if (!panels) return;

      panels.forEach((panel) => {
        const keyword = panel.querySelector(".feature-keyword");
        const detail = panel.querySelector(".feature-detail");
        const counter = panel.querySelector(".feature-counter");

        // Counter fades in
        if (counter) {
          gsap.fromTo(
            counter,
            { opacity: 0, y: 10 },
            {
              opacity: 1,
              y: 0,
              duration: 0.6,
              ease: "expo.out",
              scrollTrigger: {
                trigger: panel,
                start: "top 75%",
                once: true,
              },
            }
          );
        }

        // Keyword: scale + rotateX entrance with scrub
        if (keyword) {
          gsap.fromTo(
            keyword,
            { scale: 0.7, opacity: 0, rotateX: -15 },
            {
              scale: 1,
              opacity: 1,
              rotateX: 0,
              duration: 0.85,
              ease: "expo.out",
              scrollTrigger: {
                trigger: panel,
                start: "top 70%",
                once: true,
              },
            }
          );
        }

        // Detail: slides in from right with rotation
        if (detail) {
          gsap.fromTo(
            detail,
            { x: 60, opacity: 0, rotateY: 5 },
            {
              x: 0,
              opacity: 1,
              rotateY: 0,
              duration: 0.85,
              ease: "expo.out",
              scrollTrigger: {
                trigger: panel,
                start: "top 65%",
                once: true,
              },
              delay: 0.2,
            }
          );
        }

        // Scrub-driven parallax: keyword moves slower, detail moves faster
        if (keyword) {
          gsap.fromTo(
            keyword,
            { yPercent: 8 },
            {
              yPercent: -8,
              ease: "none",
              scrollTrigger: {
                trigger: panel,
                start: "top bottom",
                end: "bottom top",
                scrub: 1,
              },
            }
          );
        }

        if (detail) {
          gsap.fromTo(
            detail,
            { yPercent: -5 },
            {
              yPercent: 5,
              ease: "none",
              scrollTrigger: {
                trigger: panel,
                start: "top bottom",
                end: "bottom top",
                scrub: 1,
              },
            }
          );
        }
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const panels = featurePanels(product);

  return (
    <section ref={sectionRef} className="bg-gik-void content-auto noise-overlay-heavy">
      {panels.map((panel, i) => (
        <div
          key={i}
          className="feature-panel relative min-h-[70vh] flex items-center page-pad border-b border-white/5 overflow-hidden"
          style={{
            paddingTop: "var(--space-block)",
            paddingBottom: "var(--space-block)",
            perspective: "1000px",
          }}
        >
          <div className="max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Large keyword */}
            <div className="feature-keyword opacity-0 will-change-transform">
              <p className="feature-counter text-caption text-gik-gold font-body mb-4 opacity-0">
                {String(i + 1).padStart(2, "0")}
              </p>
              <h2 className="font-display text-h1 font-light text-gik-canvas leading-tight">
                {panel.keyword}
              </h2>
            </div>

            {/* Detail text */}
            <div className="feature-detail opacity-0 will-change-transform">
              <h3 className="font-display text-h3 font-light text-gik-canvas mb-4">
                {panel.title}
              </h3>
              <p className="text-gik-stone leading-relaxed font-body">
                {panel.description}
              </p>
            </div>
          </div>
        </div>
      ))}
    </section>
  );
}
