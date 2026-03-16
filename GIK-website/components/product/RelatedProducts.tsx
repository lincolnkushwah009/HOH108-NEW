"use client";

import { useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Container, SectionHeading } from "@/components/ui";
import { ProductCard } from "@/components/ui/ProductCard";
import { TiltCard } from "@/components/effects/TiltCard";
import { getRelatedProducts } from "@/lib/data/products";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface RelatedProductsProps {
  productId: string;
}

export default function RelatedProducts({ productId }: RelatedProductsProps) {
  const relatedProducts = getRelatedProducts(productId);
  const sectionRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

  useEffect(() => {
    if (relatedProducts.length === 0) return;

    const ctx = gsap.context(() => {
      // Title entrance
      const title = sectionRef.current?.querySelector(".related-title");
      if (title) {
        gsap.fromTo(
          title,
          { opacity: 0, y: 15 },
          {
            opacity: 1,
            y: 0,
            duration: 0.7,
            ease: "expo.out",
            scrollTrigger: {
              trigger: sectionRef.current,
              start: "top 85%",
              once: true,
            },
          }
        );
      }

      // Stagger entrance from right with rotation + scale
      const items = trackRef.current?.querySelectorAll(".related-item");
      if (items) {
        gsap.fromTo(
          items,
          { x: 60, opacity: 0, rotateY: 12, scale: 0.9 },
          {
            x: 0,
            opacity: 1,
            rotateY: 0,
            scale: 1,
            duration: 0.7,
            ease: "expo.out",
            stagger: 0.12,
            scrollTrigger: {
              trigger: sectionRef.current,
              start: "top 85%",
              once: true,
            },
            delay: 0.15,
          }
        );
      }
    }, sectionRef);

    return () => ctx.revert();
  }, [relatedProducts.length]);

  // Horizontal drag-to-scroll with momentum
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const onMouseDown = (e: MouseEvent) => {
      isDragging.current = true;
      startX.current = e.pageX - track.offsetLeft;
      scrollLeft.current = track.scrollLeft;
      track.style.cursor = "grabbing";
    };

    const onMouseUp = () => {
      isDragging.current = false;
      track.style.cursor = "grab";
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      e.preventDefault();
      const x = e.pageX - track.offsetLeft;
      const walk = (x - startX.current) * 1.5;
      track.scrollLeft = scrollLeft.current - walk;
    };

    track.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mouseup", onMouseUp);
    track.addEventListener("mousemove", onMouseMove);

    return () => {
      track.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mouseup", onMouseUp);
      track.removeEventListener("mousemove", onMouseMove);
    };
  }, []);

  if (relatedProducts.length === 0) return null;

  return (
    <section ref={sectionRef} className="py-24 border-t border-gik-linen content-auto">
      <Container>
        <SectionHeading title="YOU MAY ALSO APPRECIATE" align="center" />
      </Container>

      {/* Horizontal drag-to-scroll carousel */}
      <div
        ref={trackRef}
        className={cn(
          "flex gap-6 overflow-x-auto scrollbar-hide",
          "pb-4 cursor-grab select-none",
          "px-[var(--space-page)]"
        )}
      >
        {relatedProducts.slice(0, 6).map((product) => (
          <div
            key={product.id}
            className="related-item flex-shrink-0 w-[70vw] sm:w-[45vw] lg:w-[22vw] opacity-0"
          >
            <TiltCard maxTilt={5} glare>
              <ProductCard product={product} />
            </TiltCard>
          </div>
        ))}
      </div>
    </section>
  );
}

export { RelatedProducts };
