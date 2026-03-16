"use client";

import { useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import gsap from "gsap";

interface CategoryTabsProps {
  activeCategory: string;
  onCategoryChange: (category: string) => void;
}

const tabs = [
  { id: "all", label: "All" },
  { id: "utility", label: "Utility\u2122" },
  { id: "align", label: "Align\u2122" },
  { id: "panel", label: "Panel\u2122" },
  { id: "limited", label: "Limited" },
];

export function CategoryTabs({ activeCategory, onCategoryChange }: CategoryTabsProps) {
  const underlineRef = useRef<HTMLSpanElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    const activeIndex = tabs.findIndex((t) => t.id === activeCategory);
    const activeTab = tabRefs.current[activeIndex];
    const underline = underlineRef.current;

    if (activeTab && underline) {
      gsap.to(underline, {
        x: activeTab.offsetLeft,
        width: activeTab.offsetWidth,
        duration: 0.4,
        ease: "expo.out",
      });
    }
  }, [activeCategory]);

  return (
    <div className="relative">
      <nav
        className={cn(
          "flex gap-8 overflow-x-auto pb-px",
          "scrollbar-hide",
          "-mx-[var(--space-page)] px-[var(--space-page)] md:mx-0 md:px-0"
        )}
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {tabs.map((tab, i) => (
          <button
            key={tab.id}
            ref={(el) => { tabRefs.current[i] = el; }}
            onClick={() => onCategoryChange(tab.id)}
            className={cn(
              "relative py-3",
              "text-[11px] tracking-[0.08em] uppercase font-medium font-body",
              "whitespace-nowrap transition-colors",
              "focus-visible:outline-none",
              activeCategory === tab.id
                ? "text-gik-void"
                : "text-gik-stone hover:text-gik-void/70"
            )}
            style={{
              transitionDuration: "var(--duration-fast)",
              transitionTimingFunction: "var(--ease-out-expo)",
            }}
          >
            {tab.label}
          </button>
        ))}

        {/* Animated underline */}
        <span
          ref={underlineRef}
          className="absolute bottom-0 left-0 h-px bg-gik-void"
          style={{ width: 0 }}
        />
      </nav>
      <div className="h-px bg-gik-linen" />
    </div>
  );
}

export default CategoryTabs;
