"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CategoryEnvironment, categoryConfigs } from "@/components/shop/CategoryEnvironment";
import { FlashReveal } from "@/components/effects/FlashReveal";
import { scaleEntrance } from "@/lib/animations";
import type { Category } from "@/lib/data/products";

gsap.registerPlugin(ScrollTrigger);

interface CategoryInfo {
  name: string;
  description: string;
  slug: string;
}

interface CategoryHeroProps {
  category: CategoryInfo;
}

const categoryDisplayNames: Record<string, string> = {
  utility: "Utility\u2122",
  align: "Align\u2122",
  panel: "Panel\u2122",
};

const categoryImages: Record<string, string> = {
  utility: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1920&q=80",
  align: "https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=1920&q=80",
  panel: "https://images.unsplash.com/photo-1572025442646-866d16c84a54?w=1920&q=80",
};

export default function CategoryHero({ category }: CategoryHeroProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const displayName = categoryDisplayNames[category.slug] || category.name;
  const bgImage = categoryImages[category.slug];
  const config = categoryConfigs[category.slug as Category];

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Video/image parallax on scroll
      gsap.to(bgRef.current, {
        yPercent: 25,
        ease: "none",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: "bottom top",
          scrub: 1,
        },
      });

      // Content scale entrance
      const contentElements = sectionRef.current?.querySelectorAll(".cat-content");
      if (contentElements) {
        scaleEntrance(contentElements, {
          stagger: 0.1,
          fromScale: 0.85,
          delay: 0.5,
        });
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="relative w-full h-screen overflow-hidden contain-layout">
      {/* Background with parallax */}
      <div ref={bgRef} className="absolute inset-0 will-change-transform">
        {config?.videoSrc ? (
          <video
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            poster={bgImage}
            className="h-full w-full object-cover opacity-40"
          >
            <source src={config.videoSrc} type="video/mp4" />
          </video>
        ) : bgImage ? (
          <Image src={bgImage} alt={`${displayName} collection`} fill sizes="100vw" className="object-cover opacity-40" priority />
        ) : null}
      </div>

      {/* Vignette */}
      <div className="hero-vignette" />
      <div className="absolute inset-0 bg-gik-void/30" />

      {/* Category environment (particles + gradient) */}
      <CategoryEnvironment category={category.slug as Category} />

      {/* Content */}
      <div ref={contentRef} className="absolute inset-0 flex items-end page-pad pb-16 z-10">
        <div className="max-w-2xl">
          <p className="cat-content text-[10px] tracking-[0.12em] uppercase text-gik-gold font-body font-medium mb-4 opacity-0">
            GIK Collection
          </p>
          <FlashReveal
            as="h1"
            className="font-display text-hero font-light text-gik-canvas mb-3"
            delay={0.2}
          >
            {displayName}
          </FlashReveal>
          <p className="cat-content text-gik-canvas/60 font-body text-base md:text-lg leading-relaxed max-w-xl opacity-0">
            {category.description}
          </p>
        </div>
      </div>
    </section>
  );
}

export { CategoryHero };
