"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { products } from "@/lib/data/products";

gsap.registerPlugin(ScrollTrigger);

const limitedProducts = products.filter((p) => p.isLimited);

export default function HorizontalCategories() {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const track = trackRef.current;
    if (!section || !track) return;

    const ctx = gsap.context(() => {
      const totalScroll = track.scrollWidth - window.innerWidth;

      gsap.to(track, {
        x: -totalScroll,
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: () => `+=${totalScroll}`,
          scrub: 1,
          pin: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden"
      style={{ backgroundColor: "#F0EBE3" }}
    >
      <div
        ref={trackRef}
        className="flex h-screen items-center"
        style={{ width: `${limitedProducts.length * 100}vw` }}
      >
        {limitedProducts.map((product) => (
          <div
            key={product.id}
            className="relative flex flex-col md:flex-row items-start md:items-center h-full shrink-0 pt-20 md:pt-0"
            style={{ width: "100vw" }}
          >
            {/* Two overlapping images */}
            <div className="relative ml-5 md:ml-[12vw] w-[70vw] h-[45vh] md:w-[clamp(280px,28vw,420px)] md:h-[clamp(340px,38vw,560px)]">
              {/* Background image */}
              <div
                className="absolute rounded-lg overflow-hidden shadow-lg"
                style={{ width: "100%", height: "100%", top: 0, left: 0, zIndex: 1 }}
              >
                <Image
                  src={product.images[0]}
                  alt={product.name}
                  fill
                  sizes="(max-width: 768px) 70vw, 30vw"
                  className="object-cover"
                />
              </div>
              {/* Foreground image */}
              <div
                className="absolute rounded-lg overflow-hidden shadow-xl"
                style={{ width: "55%", height: "50%", bottom: "-6%", left: "50%", zIndex: 2 }}
              >
                <Image
                  src={product.images[1]}
                  alt={`${product.name} detail`}
                  fill
                  sizes="(max-width: 768px) 40vw, 20vw"
                  className="object-cover"
                />
              </div>
            </div>

            {/* Product name + CTA */}
            <div className="ml-5 mt-6 md:mt-0 md:ml-[6vw] flex flex-col items-start pr-5 md:pr-0">
              <span
                className="text-[10px] md:text-[11px] tracking-[0.15em] uppercase font-medium mb-2 md:mb-4"
                style={{ color: "#8B7355" }}
              >
                Limited Edition
                {product.limitedEdition ? ` — ${product.limitedEdition} pieces` : ""}
              </span>
              <h2
                className="font-display font-medium uppercase leading-[0.9] tracking-[-0.02em] text-[clamp(1.6rem,6vw,8rem)]"
                style={{ color: "#3D3228" }}
              >
                {product.name}
              </h2>
              <p
                className="mt-2 md:mt-4 max-w-sm text-[13px] md:text-[15px] leading-relaxed"
                style={{ color: "#8B7355" }}
              >
                {product.description}
              </p>
              <Link
                href={`/shop/${product.category}/${product.slug}`}
                className="mt-4 md:mt-8 inline-flex items-center gap-2 md:gap-3 border border-[#3D3228] rounded-full px-4 md:px-6 py-2 md:py-3 text-[11px] md:text-[13px] font-medium tracking-[0.08em] uppercase transition-all duration-300 hover:bg-[#3D3228] hover:text-[#F0EBE3] group"
                style={{ color: "#3D3228" }}
              >
                SHOP NOW
                <span className="inline-flex items-center justify-center w-5 h-5 md:w-6 md:h-6 rounded-full border border-current transition-transform duration-300 group-hover:translate-x-1">
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M2.5 6h7M7 3l2.5 3-2.5 3" />
                  </svg>
                </span>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
