"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Link from "next/link";
import Image from "next/image";
import {
  articles,
  getFeaturedArticle,
  type ArticleCategory,
} from "@/lib/data/journal";
import { cn } from "@/lib/utils";
import { TiltCard } from "@/components/effects/TiltCard";

gsap.registerPlugin(ScrollTrigger);

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const EASE_OUT_EXPO = "expo.out";

// ---------------------------------------------------------------------------
// Category Tabs with sliding indicator
// ---------------------------------------------------------------------------

type JournalFilter = "all" | ArticleCategory;

const tabs: { id: JournalFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "design", label: "Design" },
  { id: "living", label: "Living" },
  { id: "sustainability", label: "Sustainability" },
  { id: "sacred-spaces", label: "Sacred Spaces" },
];

function JournalCategoryTabs({
  active,
  onChange,
}: {
  active: JournalFilter;
  onChange: (id: JournalFilter) => void;
}) {
  const navRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Animate sliding indicator
  useEffect(() => {
    const activeIndex = tabs.findIndex((t) => t.id === active);
    const activeTab = tabRefs.current[activeIndex];
    const indicator = indicatorRef.current;
    const nav = navRef.current;

    if (!activeTab || !indicator || !nav) return;

    const navRect = nav.getBoundingClientRect();
    const tabRect = activeTab.getBoundingClientRect();

    gsap.to(indicator, {
      x: tabRect.left - navRect.left,
      width: tabRect.width,
      duration: 0.4,
      ease: "expo.out",
    });
  }, [active]);

  return (
    <div className="mb-14">
      <nav
        ref={navRef}
        className={cn(
          "relative flex gap-2 overflow-x-auto pb-1 no-scrollbar",
          "-mx-6 px-6 md:mx-0 md:px-0"
        )}
        data-lenis-prevent
        style={{ scrollbarWidth: "none", msOverflowStyle: "none", touchAction: "pan-x" }}
      >
        {/* Sliding indicator */}
        <div
          ref={indicatorRef}
          className="absolute top-0 left-0 h-full rounded-full bg-gik-void pointer-events-none transition-none"
          style={{ width: 0 }}
        />

        {tabs.map((tab, i) => (
          <button
            key={tab.id}
            ref={(el) => { tabRefs.current[i] = el; }}
            onClick={() => onChange(tab.id)}
            className={cn(
              "relative z-10 px-5 py-2.5 rounded-full text-[11px] tracking-[0.1em] uppercase font-medium font-body",
              "whitespace-nowrap transition-colors duration-300",
              "focus-visible:outline-none",
              active === tab.id
                ? "text-gik-canvas"
                : "text-gik-stone hover:text-gik-void/70"
            )}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Featured Article Card with clip-path reveal
// ---------------------------------------------------------------------------

function FeaturedArticle({
  article,
}: {
  article: (typeof articles)[number];
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        ref.current,
        { clipPath: "inset(15% 5%)", opacity: 0 },
        {
          clipPath: "inset(0% 0%)",
          opacity: 1,
          duration: 1,
          ease: EASE_OUT_EXPO,
          scrollTrigger: {
            trigger: ref.current,
            start: "top bottom-=60px",
            once: true,
          },
        }
      );
    }, ref);

    return () => ctx.revert();
  }, []);

  const formattedDate = new Date(article.date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div
      ref={ref}
      className="mb-24 opacity-0"
    >
      <Link href={`/journal/${article.slug}`} className="group block">
        <div className="relative w-full aspect-[2.2/1] bg-gik-linen overflow-hidden rounded-sm">
          <Image
            src={article.image}
            alt={article.title}
            fill
            sizes="100vw"
            className={cn(
              "object-cover",
              "transition-transform duration-700 ease-out",
              "group-hover:scale-[1.03]"
            )}
            priority
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

          {/* Content overlaid at bottom-left */}
          <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12 lg:p-16">
            <p className="text-[10px] tracking-[0.12em] uppercase text-white/50 font-body font-medium mb-3">
              {article.category.replace("-", " ")}
            </p>
            <h2 className="font-display text-h2 font-light text-white mb-4 max-w-3xl leading-tight">
              {article.title}
            </h2>
            <p className="text-sm text-white/70 leading-relaxed font-body mb-4 max-w-2xl line-clamp-2">
              {article.excerpt}
            </p>
            <p className="text-xs text-white/40 font-body">
              {formattedDate} &middot; {article.readTime}
            </p>
          </div>
        </div>
      </Link>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Article Card with TiltCard and clip-path reveal
// ---------------------------------------------------------------------------

function ArticleCard({
  article,
  index,
}: {
  article: (typeof articles)[number];
  index: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        ref.current,
        { clipPath: "inset(20% 0%)", opacity: 0 },
        {
          clipPath: "inset(0% 0%)",
          opacity: 1,
          duration: 0.8,
          delay: (index % 2) * 0.12,
          ease: EASE_OUT_EXPO,
          scrollTrigger: {
            trigger: ref.current,
            start: "top bottom-=40px",
            once: true,
          },
        }
      );
    }, ref);

    return () => ctx.revert();
  }, [index]);

  const formattedDate = new Date(article.date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Alternate heights for masonry effect
  const isOddIndex = index % 2 !== 0;

  return (
    <div
      ref={ref}
      className={cn("opacity-0", isOddIndex && "md:mt-16")}
    >
      <TiltCard maxTilt={4} glare>
        <Link href={`/journal/${article.slug}`} className="group block">
          {/* Image */}
          <div className={cn(
            "relative bg-gik-linen overflow-hidden mb-5",
            isOddIndex ? "aspect-[4/5]" : "aspect-[3/4]"
          )}>
            <Image
              src={article.image}
              alt={article.title}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className={cn(
                "object-cover",
                "transition-transform duration-700 ease-out",
                "group-hover:scale-105"
              )}
            />
          </div>

          {/* Content */}
          <div className="transition-transform duration-500 ease-out group-hover:-translate-y-1">
            <p className="text-[10px] tracking-[0.12em] uppercase text-gik-stone/50 font-body font-medium mb-2">
              {article.category.replace("-", " ")}
            </p>
            <h3 className="font-display text-h3 font-light text-gik-void mb-3 leading-snug">
              {article.title}
            </h3>
            <p className="text-sm text-gik-stone leading-relaxed font-body line-clamp-2 mb-3">
              {article.excerpt}
            </p>
            <p className="text-xs text-gik-stone/60 font-body">
              {formattedDate} &middot; {article.readTime}
            </p>
          </div>
        </Link>
      </TiltCard>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Journal Page
// ---------------------------------------------------------------------------

export default function JournalPage() {
  const [activeFilter, setActiveFilter] = useState<JournalFilter>("all");

  const featured = getFeaturedArticle();

  // Filter articles (exclude featured from grid)
  const filteredArticles = useMemo(() => {
    const remaining = articles.filter((a) => a.id !== featured.id);
    if (activeFilter === "all") return remaining;
    return remaining.filter((a) => a.category === activeFilter);
  }, [activeFilter, featured.id]);

  // Check if featured matches filter
  const showFeatured =
    activeFilter === "all" || featured.category === activeFilter;

  return (
    <section className="min-h-screen">
      {/* -- Header -- */}
      <div
        className="bg-gik-linen"
        style={{
          paddingTop: "var(--space-section)",
          paddingBottom: "var(--space-section)",
        }}
      >
        <div className="page-pad text-center">
          <p className="text-[10px] tracking-[0.12em] uppercase text-gik-stone/50 font-body font-medium mb-6">
            Editorial
          </p>
          <h1 className="font-display text-h1 font-light text-gik-void">
            The GIK Journal
          </h1>
        </div>
      </div>

      {/* -- Content -- */}
      <div
        className="page-pad"
        style={{
          paddingTop: "var(--space-section)",
          paddingBottom: "var(--space-section)",
        }}
      >
        {/* -- Category Tabs with sliding indicator -- */}
        <JournalCategoryTabs active={activeFilter} onChange={setActiveFilter} />

        {/* -- Featured Article with clip-path reveal -- */}
        {showFeatured && <FeaturedArticle article={featured} />}

        {/* -- Masonry 2-col Article Grid -- */}
        {filteredArticles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-16">
            {filteredArticles.map((article, index) => (
              <ArticleCard
                key={article.id}
                article={article}
                index={index}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-gik-stone font-body text-sm tracking-[0.05em]">
              No articles found in this category.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
