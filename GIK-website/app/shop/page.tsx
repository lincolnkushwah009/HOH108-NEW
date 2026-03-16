"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import gsap from "gsap";
import { Button } from "@/components/ui/Button";
import { ProductGrid } from "@/components/shop/ProductGrid";
import { CategoryTabs } from "@/components/shop/CategoryTabs";
import { FilterBar } from "@/components/shop/FilterBar";
import { products } from "@/lib/data/products";

type SortOption = "newest" | "price-asc" | "price-desc";
const PRODUCTS_PER_PAGE = 9;

export default function ShopPage() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [visibleCount, setVisibleCount] = useState(PRODUCTS_PER_PAGE);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.fromTo(
      heroRef.current,
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.85, ease: "expo.out" }
    );
  }, []);

  const filteredProducts = useMemo(() => {
    let filtered = [...products];
    if (activeCategory === "limited") {
      filtered = filtered.filter((p) => p.isLimited);
    } else if (activeCategory !== "all") {
      filtered = filtered.filter((p) => p.category === activeCategory);
    }
    switch (sortBy) {
      case "price-asc":
        filtered.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        filtered.sort((a, b) => b.price - a.price);
        break;
    }
    return filtered;
  }, [activeCategory, sortBy]);

  const handleCategoryChange = (category: string) => {
    setActiveCategory(category);
    setVisibleCount(PRODUCTS_PER_PAGE);
  };

  const handleSortChange = (sort: SortOption) => {
    setSortBy(sort);
    setVisibleCount(PRODUCTS_PER_PAGE);
  };

  const visibleProducts = filteredProducts.slice(0, visibleCount);
  const hasMore = visibleCount < filteredProducts.length;

  return (
    <section className="min-h-screen bg-gik-canvas">
      <div
        ref={heroRef}
        className="page-pad bg-gik-canvas opacity-0"
        style={{
          paddingTop: "clamp(100px, 12vw, 160px)",
          paddingBottom: "clamp(48px, 6vw, 80px)",
        }}
      >
        <h1 className="font-display text-hero font-light text-gik-void">
          Our Collection
        </h1>
        <p className="font-display italic text-base md:text-lg text-gik-stone mt-3 max-w-lg">
          Objects of intention, crafted from what the world left behind
        </p>
      </div>

      <div
        className="page-pad"
        style={{
          paddingTop: "clamp(32px, 4vw, 48px)",
          paddingBottom: "var(--space-section)",
        }}
      >
        <CategoryTabs activeCategory={activeCategory} onCategoryChange={handleCategoryChange} />
        <FilterBar sortBy={sortBy} onSortChange={handleSortChange} productCount={filteredProducts.length} />

        <div className="mt-10 md:mt-12">
          {visibleProducts.length > 0 ? (
            <ProductGrid products={visibleProducts} columns={3} />
          ) : (
            <div className="text-center py-20">
              <p className="text-gik-stone font-body text-[13px] tracking-[0.03em]">
                No products found in this category.
              </p>
            </div>
          )}
        </div>

        {hasMore && (
          <div className="flex justify-center mt-16">
            <Button variant="secondary" onClick={() => setVisibleCount((prev) => prev + PRODUCTS_PER_PAGE)}>
              Load More
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
