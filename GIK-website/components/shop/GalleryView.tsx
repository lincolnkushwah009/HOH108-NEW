"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { Product } from "@/lib/data/products";

gsap.registerPlugin(ScrollTrigger);

const categoryLabels: Record<string, string> = {
  utility: "GIK Utility",
  align: "GIK Align",
  panel: "GIK Panel",
};

function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

interface GalleryViewProps {
  products: Product[];
}

export function GalleryView({ products }: GalleryViewProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
  }, []);

  useEffect(() => {
    if (isMobile) return;

    const section = sectionRef.current;
    const track = trackRef.current;
    if (!section || !track) return;

    const ctx = gsap.context(() => {
      const totalWidth = track.scrollWidth - window.innerWidth;
      if (totalWidth <= 0) return;

      // Vertical scroll drives horizontal movement
      const scrollTween = gsap.to(track, {
        x: () => -totalWidth,
        ease: "none",
        scrollTrigger: {
          trigger: section,
          pin: true,
          scrub: 1,
          end: () => "+=" + totalWidth,
          invalidateOnRefresh: true,
        },
      });

      // Each card: perspective rotation as it enters/exits center
      const cards = track.querySelectorAll(".gallery-card");
      cards.forEach((card) => {
        gsap.fromTo(
          card,
          { rotateY: 20, z: -150, scale: 0.9 },
          {
            rotateY: 0,
            z: 0,
            scale: 1,
            ease: "none",
            scrollTrigger: {
              trigger: card,
              containerAnimation: scrollTween,
              start: "left 90%",
              end: "left 50%",
              scrub: 1,
            },
          }
        );
      });
    }, sectionRef);

    return () => ctx.revert();
  }, [isMobile, products]);

  // Mobile fallback: 2-column vertical masonry grid
  if (isMobile) {
    return (
      <div className="grid grid-cols-2 gap-4">
        {products.map((product) => (
          <Link
            key={product.id}
            href={`/shop/${product.category}/${product.slug}`}
            className="block group"
          >
            <div className="relative aspect-[4/5] overflow-hidden bg-gik-linen">
              {product.images[0] && (
                <Image
                  src={product.images[0]}
                  alt={product.name}
                  fill
                  sizes="50vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                />
              )}
            </div>
            <div className="mt-2">
              <p className="text-[10px] tracking-[0.08em] uppercase text-gik-stone font-body">
                {categoryLabels[product.category] || product.category}
              </p>
              <h3 className="font-body text-[12px] font-medium text-gik-void leading-snug mt-0.5">
                {product.name}
              </h3>
              <p className="text-[12px] text-gik-stone font-body">{formatPrice(product.price)}</p>
            </div>
          </Link>
        ))}
      </div>
    );
  }

  return (
    <section ref={sectionRef} className="relative overflow-hidden" style={{ perspective: "1200px" }}>
      <div ref={trackRef} className="flex items-center h-[80vh] will-change-transform gap-8 pl-[var(--space-page)]">
        {products.map((product) => (
          <Link
            key={product.id}
            href={`/shop/${product.category}/${product.slug}`}
            className="gallery-card flex-shrink-0 group block"
            style={{
              width: "clamp(280px, 22vw, 360px)",
              transformStyle: "preserve-3d",
            }}
          >
            <div className="relative aspect-[3/4] overflow-hidden bg-gik-linen rounded-sm transition-shadow duration-500 group-hover:shadow-[0_20px_60px_rgba(27,24,22,0.12)]">
              {product.images[0] && (
                <Image
                  src={product.images[0]}
                  alt={product.name}
                  fill
                  sizes="25vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                  style={{ transitionTimingFunction: "var(--ease-out-expo)" }}
                />
              )}
              {product.images[1] && (
                <Image
                  src={product.images[1]}
                  alt={`${product.name} — alt`}
                  fill
                  sizes="25vw"
                  className="object-cover absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                />
              )}
            </div>
            <div className="mt-3 transition-transform duration-500 group-hover:-translate-y-1">
              <p className="text-[10px] tracking-[0.08em] uppercase text-gik-stone font-body">
                {categoryLabels[product.category] || product.category}
              </p>
              <h3 className="font-body text-[13px] font-medium text-gik-void leading-snug mt-0.5">
                {product.name}
              </h3>
              <p className="text-[13px] text-gik-stone font-body">{formatPrice(product.price)}</p>
            </div>
          </Link>
        ))}
        {/* Trailing space */}
        <div className="flex-shrink-0 w-[var(--space-page)]" />
      </div>
    </section>
  );
}
