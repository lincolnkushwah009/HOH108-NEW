"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ProductInfo } from "@/components/product/ProductInfo";
import { ArrowLeft } from "lucide-react";
import type { Product } from "@/lib/data/products";

gsap.registerPlugin(ScrollTrigger);

interface ProductHeroProps {
  product: Product;
}

export function ProductHero({ product }: ProductHeroProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const [activeImage, setActiveImage] = useState(0);
  const images = product.images.length > 0 ? product.images : [];

  // Image transition: crossfade + scale pulse
  useEffect(() => {
    if (imageContainerRef.current) {
      gsap.fromTo(
        imageContainerRef.current,
        { scale: 1.03, opacity: 0.7, filter: "blur(2px)" },
        { scale: 1, opacity: 1, filter: "blur(0px)", duration: 0.6, ease: "expo.out" }
      );
    }
  }, [activeImage]);

  return (
    <section
      ref={sectionRef}
      className="contain-layout"
    >
      {/* Split-view: Dark left + Light right on desktop, stacked on mobile */}
      <div className="flex flex-col lg:flex-row min-h-screen">
        {/* Left panel — Dark (product showcase) */}
        <div className="lg:w-1/2 bg-gik-void relative lg:sticky lg:top-0 lg:h-screen">
          {/* Back link */}
          <div className="absolute top-6 left-6 z-20">
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 text-[11px] text-gik-stone font-body tracking-[0.05em] uppercase hover:text-gik-canvas transition-colors"
              style={{
                transitionDuration: "var(--duration-fast)",
                transitionTimingFunction: "var(--ease-out-expo)",
              }}
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Shop</span>
            </Link>
          </div>

          {/* Product image */}
          <div className="flex items-center justify-center h-full p-8 pt-16 lg:p-12">
            <div
              ref={imageContainerRef}
              className="relative w-full max-w-md aspect-[4/5] bento-card overflow-hidden will-change-transform"
            >
              {images[activeImage] && (
                <Image
                  src={images[activeImage]}
                  alt={`${product.name} — Image ${activeImage + 1}`}
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                  priority={activeImage === 0}
                />
              )}
            </div>
          </div>

          {/* Image dots */}
          {images.length > 1 && (
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
              {images.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(i)}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    i === activeImage
                      ? "bg-gik-canvas scale-100"
                      : "bg-gik-stone/40 scale-75 hover:bg-gik-stone/60"
                  }`}
                  aria-label={`View image ${i + 1}`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Right panel — Light (product details) */}
        <div className="lg:w-1/2 lg:min-h-screen bg-gik-canvas">
          <div
            className="page-pad"
            style={{
              paddingTop: "clamp(32px, 4vw, 80px)",
              paddingBottom: "clamp(48px, 6vw, 96px)",
            }}
          >
            <ProductInfo product={product} />
          </div>
        </div>
      </div>
    </section>
  );
}
