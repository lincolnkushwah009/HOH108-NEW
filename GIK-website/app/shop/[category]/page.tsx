"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Button } from "@/components/ui/Button";
import { ProductGrid } from "@/components/shop/ProductGrid";
import { FilterBar } from "@/components/shop/FilterBar";
import { FlashReveal } from "@/components/effects/FlashReveal";
import { getProductsByCategory, type Category } from "@/lib/data/products";
import { ArrowLeft, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

gsap.registerPlugin(ScrollTrigger);

type SortOption = "newest" | "price-asc" | "price-desc";
const PRODUCTS_PER_PAGE = 9;
const validCategories: Category[] = ["utility", "align", "panel"];

const categoryMeta: Record<Category, { name: string; description: string }> = {
  utility: {
    name: "Utility",
    description: "Functional objects for the intentional home",
  },
  align: {
    name: "Align",
    description: "Sacred objects for the conscious home",
  },
  panel: {
    name: "Panel",
    description: "Statement pieces that command presence",
  },
};

function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

export default function CategoryPage() {
  const params = useParams();
  const categorySlug = params.category as string;
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [visibleCount, setVisibleCount] = useState(PRODUCTS_PER_PAGE);
  const heroRef = useRef<HTMLDivElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef<HTMLSpanElement>(null);

  const isValidCategory = validCategories.includes(categorySlug as Category);

  /* Hero entrance */
  useEffect(() => {
    if (heroRef.current) {
      gsap.fromTo(
        heroRef.current,
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.85, ease: "expo.out" }
      );
    }
  }, []);

  const categoryProducts = useMemo(() => {
    if (!isValidCategory) return [];
    const filtered = getProductsByCategory(categorySlug as Category);
    switch (sortBy) {
      case "price-asc":
        return [...filtered].sort((a, b) => a.price - b.price);
      case "price-desc":
        return [...filtered].sort((a, b) => b.price - a.price);
      default:
        return filtered;
    }
  }, [categorySlug, sortBy, isValidCategory]);

  /* ── Bikeville-style horizontal scroll ── */
  useEffect(() => {
    const carousel = carouselRef.current;
    const track = trackRef.current;
    if (!carousel || !track || categoryProducts.length === 0) return;

    const ctx = gsap.context(() => {
      const getScrollAmount = () => track.scrollWidth - carousel.offsetWidth;

      /* Main horizontal scroll tween — pin section, scrub track left */
      gsap.to(track, {
        x: () => -getScrollAmount(),
        ease: "none",
        scrollTrigger: {
          trigger: carousel,
          start: "top top",
          end: () => `+=${getScrollAmount()}`,
          pin: true,
          scrub: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            /* Live counter update */
            const idx = Math.min(
              Math.round(self.progress * (categoryProducts.length - 1)),
              categoryProducts.length - 1
            );
            if (counterRef.current) {
              counterRef.current.textContent = String(idx + 1).padStart(
                2,
                "0"
              );
            }
          },
        },
      });

      /* Card stagger entrance */
      gsap.fromTo(
        track.querySelectorAll(".bv-card"),
        { y: 60, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.85,
          ease: "expo.out",
          stagger: 0.08,
          scrollTrigger: {
            trigger: carousel,
            start: "top 85%",
            once: true,
          },
        }
      );
    }, carouselRef);

    const handleResize = () => ScrollTrigger.refresh();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      ctx.revert();
    };
  }, [categoryProducts.length]);

  const handleSortChange = (sort: SortOption) => {
    setSortBy(sort);
    setVisibleCount(PRODUCTS_PER_PAGE);
  };

  /* ── Invalid category ── */
  if (!isValidCategory) {
    return (
      <section className="min-h-screen">
        <div
          className="page-pad flex flex-col items-center justify-center text-center"
          style={{
            paddingTop: "var(--space-section)",
            paddingBottom: "var(--space-section)",
          }}
        >
          <h1 className="font-display text-h2 font-light text-gik-void mb-4">
            Category not found
          </h1>
          <p className="text-gik-stone font-body text-[13px] mb-10 max-w-md">
            The category you are looking for does not exist. Explore our full
            collection instead.
          </p>
          <Button variant="primary" href="/shop">
            Browse All Products
          </Button>
        </div>
      </section>
    );
  }

  const meta = categoryMeta[categorySlug as Category];
  const visibleProducts = categoryProducts.slice(0, visibleCount);
  const hasMore = visibleCount < categoryProducts.length;

  return (
    <section className="min-h-screen bg-gik-canvas">
      {/* ── Category heading ── */}
      <div
        ref={heroRef}
        className="page-pad bg-gik-canvas opacity-0"
        style={{
          paddingTop: "clamp(100px, 12vw, 160px)",
          paddingBottom: "clamp(24px, 3vw, 40px)",
        }}
      >
        <FlashReveal
          as="h1"
          className="font-display text-hero font-light text-gik-void"
        >
          {meta.name}
        </FlashReveal>
        <p className="font-display italic text-base md:text-lg text-gik-stone mt-3 max-w-md">
          {meta.description}
        </p>
      </div>

      {/* ── Bikeville horizontal scroll carousel ── */}
      <div ref={carouselRef} className="relative h-screen overflow-hidden">
        {/* Horizontal track */}
        <div
          ref={trackRef}
          className="flex items-center gap-4 md:gap-10 h-full will-change-transform"
          style={{
            paddingLeft: "max(4vw, 16px)",
            paddingRight: "max(10vw, 60px)",
          }}
        >
          {categoryProducts.map((product) => (
            <Link
              key={product.id}
              href={`/shop/${product.category}/${product.slug}`}
              className="bv-card flex-shrink-0 group opacity-0"
            >
              {/* Card wrapper — overflow visible for image breakout effect */}
              <div className="relative w-[240px] md:w-[340px] lg:w-[380px]">
                <div className="relative bg-gik-void rounded-[20px] md:rounded-[32px] overflow-hidden h-[340px] md:h-[500px] lg:h-[560px]">
                  {/* Product name — top */}
                  <div className="relative z-10 p-6 md:p-8">
                    <h3 className="font-display text-lg md:text-xl font-light text-gik-canvas line-clamp-2">
                      {product.name}
                    </h3>
                  </div>

                  {/* Product image — fills card */}
                  <div className="absolute inset-0">
                    <Image
                      src={product.images[0]}
                      alt={product.name}
                      fill
                      sizes="(max-width: 768px) 300px, 400px"
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                      style={{
                        transitionTimingFunction: "var(--ease-out-expo)",
                      }}
                    />
                    {/* Gradient overlays for text legibility */}
                    <div className="absolute inset-0 bg-gradient-to-b from-gik-void/70 via-transparent to-gik-void/80" />
                  </div>

                  {/* Bottom: Price + Add button */}
                  <div className="absolute bottom-0 left-0 right-0 z-10 p-6 md:p-8 flex items-end justify-between">
                    <div>
                      <p className="text-[10px] text-gik-stone uppercase tracking-[0.06em] font-body">
                        Price
                      </p>
                      <p className="font-display text-xl md:text-2xl font-light text-gik-canvas mt-1">
                        {formatPrice(product.price)}
                      </p>
                    </div>
                    <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-gik-gold flex items-center justify-center text-gik-void group-hover:bg-gik-canvas transition-colors duration-500">
                      <Plus size={20} strokeWidth={1.5} />
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Counter — bottom left (01 / 06) */}
        <div className="absolute bottom-4 left-4 md:bottom-8 md:left-8 z-10 flex items-baseline gap-1">
          <span
            ref={counterRef}
            className="font-display text-3xl md:text-4xl font-light text-gik-void"
          >
            01
          </span>
          <span className="text-gik-stone text-lg font-display mx-1">/</span>
          <span className="text-lg text-gik-stone font-display">
            {String(categoryProducts.length).padStart(2, "0")}
          </span>
        </div>

        {/* Scroll hint — bottom right */}
        <div className="absolute bottom-4 right-4 md:bottom-8 md:right-8 z-10">
          <span className="text-[10px] text-gik-stone/60 font-body tracking-[0.08em] uppercase">
            Scroll to explore
          </span>
        </div>
      </div>

      {/* ── Back link + filter + product grid ── */}
      <div
        className="page-pad"
        style={{
          paddingTop: "clamp(48px, 6vw, 80px)",
          paddingBottom: "var(--space-section)",
        }}
      >
        <Link
          href="/shop"
          className={cn(
            "inline-flex items-center gap-2 mb-8",
            "text-[11px] text-gik-stone font-body tracking-[0.05em] uppercase",
            "hover:text-gik-void transition-colors"
          )}
          style={{
            transitionDuration: "var(--duration-fast)",
            transitionTimingFunction: "var(--ease-out-expo)",
          }}
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>All Products</span>
        </Link>

        <FilterBar
          sortBy={sortBy}
          onSortChange={handleSortChange}
          productCount={categoryProducts.length}
        />

        <div className="mt-10 md:mt-12">
          {visibleProducts.length > 0 ? (
            <ProductGrid products={visibleProducts} columns={3} />
          ) : (
            <div className="text-center py-20">
              <p className="text-gik-stone font-body text-[13px] tracking-[0.03em]">
                No products available in this category yet.
              </p>
            </div>
          )}
        </div>

        {hasMore && (
          <div className="flex justify-center mt-16">
            <Button
              variant="secondary"
              onClick={() =>
                setVisibleCount((prev) => prev + PRODUCTS_PER_PAGE)
              }
            >
              Load More
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
