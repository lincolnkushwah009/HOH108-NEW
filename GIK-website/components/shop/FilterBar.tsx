"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, SlidersHorizontal } from "lucide-react";
import gsap from "gsap";

type SortOption = "newest" | "price-asc" | "price-desc";

interface FilterBarProps {
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  productCount: number;
}

const sortOptions: { value: SortOption; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: Low \u2192 High" },
  { value: "price-desc", label: "Price: High \u2192 Low" },
];

export function FilterBar({
  sortBy,
  onSortChange,
  productCount,
}: FilterBarProps) {
  const [sortOpen, setSortOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);

  const activeSort = sortOptions.find((opt) => opt.value === sortBy);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (sortRef.current && !sortRef.current.contains(event.target as Node)) {
        setSortOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Animate dropdown open/close
  useEffect(() => {
    if (!dropdownRef.current) return;
    if (sortOpen) {
      gsap.fromTo(
        dropdownRef.current,
        { opacity: 0, y: -8 },
        { opacity: 1, y: 0, duration: 0.3, ease: "expo.out" }
      );
    }
  }, [sortOpen]);

  // Animated indicator for active sort
  useEffect(() => {
    if (!indicatorRef.current || !sortOpen) return;
    const activeIndex = sortOptions.findIndex((opt) => opt.value === sortBy);
    const buttons = dropdownRef.current?.querySelectorAll("button");
    if (buttons && buttons[activeIndex]) {
      const btn = buttons[activeIndex] as HTMLElement;
      gsap.to(indicatorRef.current, {
        y: btn.offsetTop,
        height: btn.offsetHeight,
        duration: 0.3,
        ease: "expo.out",
      });
    }
  }, [sortBy, sortOpen]);

  return (
    <div className="flex justify-between items-center py-4 border-b border-gik-linen text-sm text-gik-stone">
      {/* Filter Button */}
      <button
        onClick={() => setFilterOpen(!filterOpen)}
        className={cn(
          "flex items-center gap-2 font-body font-medium tracking-[0.05em] uppercase",
          "transition-colors duration-300 hover:text-gik-void",
          filterOpen && "text-gik-void"
        )}
      >
        <SlidersHorizontal className="w-3.5 h-3.5" />
        <span>Filter</span>
      </button>

      {/* Product Count */}
      <span className="font-body text-gik-stone hidden sm:block">
        {productCount} {productCount === 1 ? "item" : "items"}
      </span>

      {/* Sort Dropdown */}
      <div ref={sortRef} className="relative">
        <button
          onClick={() => setSortOpen(!sortOpen)}
          className={cn(
            "flex items-center gap-2 font-body font-medium tracking-[0.05em] uppercase",
            "transition-colors duration-300 hover:text-gik-void"
          )}
        >
          <span>{activeSort?.label ?? "Sort"}</span>
          <ChevronDown
            className={cn(
              "w-3.5 h-3.5 transition-transform duration-300",
              sortOpen && "rotate-180"
            )}
          />
        </button>

        {sortOpen && (
          <div
            ref={dropdownRef}
            className={cn(
              "absolute right-0 top-full mt-2 z-20",
              "py-1 min-w-[200px] rounded-lg overflow-hidden",
              "backdrop-blur-xl bg-gik-canvas/80 border border-gik-linen/50",
              "shadow-lg"
            )}
          >
            {/* Sliding indicator */}
            <div
              ref={indicatorRef}
              className="absolute left-0 right-0 bg-gik-linen/50 pointer-events-none"
              style={{ height: 0 }}
            />
            {sortOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onSortChange(option.value);
                  setSortOpen(false);
                }}
                className={cn(
                  "relative z-10 block w-full text-left px-4 py-2.5 text-sm font-body",
                  "transition-colors duration-200",
                  sortBy === option.value
                    ? "text-gik-void"
                    : "text-gik-stone hover:text-gik-void"
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
