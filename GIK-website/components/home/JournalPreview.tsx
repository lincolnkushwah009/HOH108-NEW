"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { articles } from "@/lib/data/journal";
import { MagneticElement } from "@/components/effects/MagneticElement";
import { FlashReveal } from "@/components/effects/FlashReveal";
import { perspective3DEntrance } from "@/lib/animations";

gsap.registerPlugin(ScrollTrigger);

const featuredArticles = articles.slice(0, 3);

export default function JournalPreview() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const cards = sectionRef.current?.querySelectorAll(".journal-card");
      if (cards) {
        perspective3DEntrance(cards, {
          rotateX: -12,
          fromScale: 0.9,
          stagger: 0.12,
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 65%",
            once: true,
          },
          delay: 0.2,
        });
      }

      gsap.fromTo(
        ".journal-cta",
        { opacity: 0 },
        {
          opacity: 1,
          duration: 0.6,
          ease: "expo.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 60%",
            once: true,
          },
          delay: 0.6,
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative bg-gik-void content-auto"
      style={{
        paddingTop: "var(--space-section)",
        paddingBottom: "var(--space-section)",
      }}
    >
      {/* Ambient glow */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(184,157,111,0.06) 0%, transparent 60%)",
        }}
      />

      <div className="page-pad max-w-7xl mx-auto relative z-10">
        <div className="flex items-end justify-between mb-10 md:mb-14">
          <FlashReveal as="h2" className="font-display text-h2 font-light text-gik-canvas">
            From the Journal
          </FlashReveal>
          <div className="journal-cta opacity-0">
            <MagneticElement>
              <Link
                href="/journal"
                className="text-sm font-body font-medium text-gik-canvas/50 tracking-[0.05em] group inline-flex items-center gap-2 hover:text-gik-gold transition-colors duration-300"
              >
                <span className="link-hover">View All</span>
                <span className="transition-transform duration-300 group-hover:translate-x-1">
                  &rarr;
                </span>
              </Link>
            </MagneticElement>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 bento-gap perspective-scroll">
          {/* Featured article */}
          {featuredArticles[0] && (
            <div className="journal-card md:col-span-2 opacity-0">
              <Link href={`/journal/${featuredArticles[0].slug}`} className="group block">
                <div className="relative overflow-hidden aspect-[16/9] md:aspect-[21/9] rounded-[24px] border border-white/[0.06]">
                  <Image
                    src={featuredArticles[0].image}
                    alt={featuredArticles[0].title}
                    fill
                    sizes="100vw"
                    className="object-cover transition-transform group-hover:scale-[1.03]"
                    style={{
                      transitionDuration: "var(--duration-slow)",
                      transitionTimingFunction: "var(--ease-out-expo)",
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-gik-void/80 via-gik-void/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 z-10">
                    <span className="tag-pill tag-pill-light text-[9px] mb-3">
                      {featuredArticles[0].category.replace("-", " ")}
                    </span>
                    <h3 className="font-display text-h3 md:text-h2 font-light text-gik-canvas mt-2 max-w-xl">
                      {featuredArticles[0].title}
                    </h3>
                  </div>
                </div>
              </Link>
            </div>
          )}

          {/* Two smaller cards */}
          {featuredArticles.slice(1, 3).map((article) => (
            <div key={article.slug} className="journal-card opacity-0">
              <Link href={`/journal/${article.slug}`} className="group block">
                <div className="relative overflow-hidden aspect-[4/3] rounded-[24px] border border-white/[0.06]">
                  <Image
                    src={article.image}
                    alt={article.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover transition-transform group-hover:scale-[1.03]"
                    style={{
                      transitionDuration: "var(--duration-slow)",
                      transitionTimingFunction: "var(--ease-out-expo)",
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-gik-void/80 via-gik-void/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-6 z-10">
                    <span className="tag-pill tag-pill-light text-[9px] mb-2">
                      {article.category.replace("-", " ")}
                    </span>
                    <h3 className="font-display text-h3 font-light text-gik-canvas mt-2">
                      {article.title}
                    </h3>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
