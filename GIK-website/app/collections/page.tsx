"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Image from "next/image";
import { ProductCard } from "@/components/ui/ProductCard";
import { collections } from "@/lib/data/collections";
import { products, type Product } from "@/lib/data/products";
import { perspective3DEntrance } from "@/lib/animations";
import { cn } from "@/lib/utils";

gsap.registerPlugin(ScrollTrigger);

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const EASE_OUT_EXPO = "expo.out";

// ---------------------------------------------------------------------------
// Collections Page
// ---------------------------------------------------------------------------

export default function CollectionsPage() {
  const [selectedCollectionSlug, setSelectedCollectionSlug] = useState<
    string | null
  >(null);

  // Refs for GSAP animations
  const headerLabelRef = useRef<HTMLParagraphElement>(null);
  const headerTitleRef = useRef<HTMLHeadingElement>(null);
  const headerSubtitleRef = useRef<HTMLParagraphElement>(null);
  const cardRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const productsContainerRef = useRef<HTMLDivElement>(null);
  const productsInnerRef = useRef<HTMLDivElement>(null);

  const selectedCollection = collections.find(
    (c) => c.slug === selectedCollectionSlug
  );

  const collectionProducts: Product[] = selectedCollection
    ? selectedCollection.productIds
        .map((id) => products.find((p) => p.id === id))
        .filter((p): p is Product => p !== undefined)
    : [];

  // -------------------------------------------
  // Header entrance animation on mount
  // -------------------------------------------
  useEffect(() => {
    const ctx = gsap.context(() => {
      if (headerLabelRef.current) {
        gsap.fromTo(
          headerLabelRef.current,
          { opacity: 0, y: 10 },
          { opacity: 1, y: 0, duration: 0.5, ease: EASE_OUT_EXPO }
        );
      }
      if (headerTitleRef.current) {
        gsap.fromTo(
          headerTitleRef.current,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.8, ease: EASE_OUT_EXPO }
        );
      }
      if (headerSubtitleRef.current) {
        gsap.fromTo(
          headerSubtitleRef.current,
          { opacity: 0, y: 10 },
          { opacity: 1, y: 0, duration: 0.6, delay: 0.2, ease: EASE_OUT_EXPO }
        );
      }
    });

    return () => ctx.revert();
  }, []);

  // -------------------------------------------
  // Collection cards ScrollTrigger stagger
  // -------------------------------------------
  useEffect(() => {
    const validCards = cardRefs.current.filter(
      (el): el is HTMLButtonElement => el !== null
    );
    if (validCards.length === 0) return;

    perspective3DEntrance(validCards, {
      rotateX: -12,
      fromScale: 0.92,
      stagger: 0.1,
      scrollTrigger: {
        trigger: validCards[0],
        start: "top bottom-=50px",
        once: true,
      },
    });
  }, []);

  // -------------------------------------------
  // Selected collection expand / collapse
  // -------------------------------------------
  const prevSlugRef = useRef<string | null>(null);

  useEffect(() => {
    const container = productsContainerRef.current;
    if (!container) return;

    if (selectedCollectionSlug && collectionProducts.length > 0) {
      // Expand: measure natural height, then animate from 0
      gsap.set(container, { display: "block", overflow: "hidden" });

      // Temporarily set height auto to measure
      gsap.set(container, { height: "auto" });
      const naturalHeight = container.scrollHeight;

      gsap.fromTo(
        container,
        { height: 0, opacity: 0 },
        {
          height: naturalHeight,
          opacity: 1,
          duration: 0.5,
          ease: EASE_OUT_EXPO,
          onComplete: () => {
            gsap.set(container, { height: "auto", overflow: "visible" });
          },
        }
      );
    } else if (prevSlugRef.current !== null) {
      // Collapse
      const currentHeight = container.scrollHeight;
      gsap.fromTo(
        container,
        { height: currentHeight, opacity: 1 },
        {
          height: 0,
          opacity: 0,
          duration: 0.5,
          ease: EASE_OUT_EXPO,
          onComplete: () => {
            gsap.set(container, { display: "none" });
          },
        }
      );
    }

    prevSlugRef.current = selectedCollectionSlug;
  }, [selectedCollectionSlug, collectionProducts.length]);

  // Callback ref setter for cards
  const setCardRef = useCallback(
    (index: number) => (el: HTMLButtonElement | null) => {
      cardRefs.current[index] = el;
    },
    []
  );

  return (
    <section className="min-h-screen content-auto">
      <div
        className="page-pad"
        style={{ paddingTop: "var(--space-section)", paddingBottom: "var(--space-section)" }}
      >
        {/* Header */}
        <div className="text-center mb-16 md:mb-20">
          <p
            ref={headerLabelRef}
            style={{ opacity: 0 }}
            className="text-[10px] tracking-[0.12em] uppercase text-gik-stone/50 font-body font-medium mb-4"
          >
            Curated
          </p>
          <h1
            ref={headerTitleRef}
            style={{ opacity: 0 }}
            className="font-display text-h1 font-light text-gik-void mb-4"
          >
            Collections
          </h1>
          <p
            ref={headerSubtitleRef}
            style={{ opacity: 0 }}
            className="font-display italic text-lg md:text-xl text-gik-stone"
          >
            Curated with intention
          </p>
        </div>

        {/* Collection Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {collections.map((collection, index) => (
            <button
              key={collection.id}
              ref={setCardRef(index)}
              onClick={() =>
                setSelectedCollectionSlug(
                  selectedCollectionSlug === collection.slug
                    ? null
                    : collection.slug
                )
              }
              className={cn(
                "group relative aspect-[16/9] overflow-hidden bg-gik-linen text-left transition-all duration-500",
                selectedCollectionSlug === collection.slug &&
                  "ring-1 ring-gik-void"
              )}
            >
              {/* Background Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-gik-void/60 via-gik-void/20 to-transparent z-10" />

              {/* Collection Image */}
              <div
                className={cn(
                  "absolute inset-0",
                  "transition-transform duration-[600ms]",
                  "group-hover:scale-[1.03]"
                )}
                style={{ transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)" }}
              >
                <Image
                  src={collection.image}
                  alt={collection.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover"
                />
              </div>

              {/* Content */}
              <div className="absolute inset-0 z-20 flex flex-col justify-end p-8 md:p-10">
                <p className="text-[10px] tracking-[0.12em] uppercase font-body font-medium text-gik-canvas/70 mb-2">
                  {collection.productIds.length} Objects
                </p>
                <h2 className="font-display text-h2 font-light text-gik-canvas mb-2">
                  {collection.name}
                </h2>
                <p className="font-body text-xs text-gik-canvas/60 max-w-md line-clamp-2 leading-relaxed">
                  {collection.description}
                </p>
              </div>

              {/* Hover Lift Shadow — pure CSS transition, no motion needed */}
              <div
                className="absolute inset-0 shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
              />
            </button>
          ))}
        </div>

        {/* Selected Collection Products */}
        <div
          ref={productsContainerRef}
          className="overflow-hidden"
          style={{ display: selectedCollectionSlug ? "block" : "none", height: 0, opacity: 0 }}
        >
          {selectedCollection && collectionProducts.length > 0 && (
            <div ref={productsInnerRef} className="pt-20 md:pt-24">
              {/* Collection Detail Header */}
              <div className="mb-12">
                <p className="text-[10px] tracking-[0.12em] uppercase text-gik-stone/50 font-body font-medium mb-4">
                  {selectedCollection.name}
                </p>
                <p className="font-body text-sm text-gik-stone leading-relaxed max-w-2xl">
                  {selectedCollection.description}
                </p>
              </div>

              {/* Horizontal scroll products gallery */}
              <div
                className="flex gap-6 overflow-x-auto scrollbar-hide pb-4 cursor-grab select-none"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
              >
                {collectionProducts.map((product) => (
                  <div key={product.id} className="flex-shrink-0 w-[70vw] sm:w-[45vw] lg:w-[22vw]">
                    <ProductCard product={product} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
