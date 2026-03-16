"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowRight, Eye, Target } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

const stats = [
  { value: 850, label: "Materials Reclaimed" },
  { value: 50, label: "Master Artisans" },
  { value: 12, label: "Years of Craft" },
  { value: 2000, label: "Homes Transformed" },
];

export default function AboutSection() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".about-header",
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          ease: "expo.out",
          stagger: 0.1,
          scrollTrigger: { trigger: sectionRef.current, start: "top 75%", once: true },
        }
      );

      gsap.fromTo(
        ".about-stat",
        { y: 30, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
          ease: "expo.out",
          stagger: 0.08,
          scrollTrigger: { trigger: ".about-stats", start: "top 85%", once: true },
        }
      );

      // Animate stat counters
      document.querySelectorAll<HTMLElement>(".stat-counter").forEach((el) => {
        const target = parseInt(el.dataset.target || "0", 10);
        const counter = { val: 0 };
        gsap.to(counter, {
          val: target,
          duration: 2,
          ease: "power2.out",
          scrollTrigger: { trigger: ".about-stats", start: "top 95%", once: true },
          onUpdate: () => {
            el.textContent = Math.round(counter.val) + "+";
          },
        });
      });

      gsap.fromTo(
        ".about-card",
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.7,
          ease: "expo.out",
          stagger: 0.12,
          scrollTrigger: { trigger: ".about-cards", start: "top 80%", once: true },
        }
      );

      gsap.fromTo(
        ".about-image",
        { scale: 1.05, opacity: 0 },
        {
          scale: 1,
          opacity: 1,
          duration: 1,
          ease: "expo.out",
          scrollTrigger: { trigger: ".about-image", start: "top 80%", once: true },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="py-[var(--space-section)] page-pad content-auto">
      <div className="max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="mb-14 md:mb-20">
          <span className="about-header section-pill mb-6 inline-block opacity-0">About God Is Kind</span>
          <h2 className="about-header font-display text-h1 font-medium text-gik-void uppercase tracking-[-0.01em] opacity-0">
            Crafting Sacred Spaces
            <br className="hidden md:block" /> Since 2012
          </h2>
          <p className="about-header mt-4 text-gik-stone max-w-xl text-[15px] leading-relaxed opacity-0">
            We transform discarded materials into objects of reverence — blending ancient craft traditions
            with modern design to create pieces that honour both earth and spirit.
          </p>
        </div>

        {/* Main Layout */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left — Image + Stats */}
          <div className="lg:w-[55%] flex flex-col gap-6">
            <div className="about-image relative rounded-[20px] overflow-hidden opacity-0" style={{ aspectRatio: "3/2" }}>
              <Image
                src="https://images.unsplash.com/photo-1616046229478-9901c5536a45?w=1200&q=85"
                alt="GIK artisan workshop"
                fill
                sizes="(max-width: 1024px) 100vw, 55vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-gik-void/30 to-transparent" />
            </div>

            {/* Stats Row */}
            <div className="about-stats grid grid-cols-2 md:grid-cols-4 gap-4">
              {stats.map((stat) => (
                <div key={stat.label} className="about-stat card-bordered p-4 text-center opacity-0">
                  <span
                    className="stat-counter font-display text-[clamp(1.5rem,2.5vw,2rem)] font-light text-gik-void leading-none"
                    data-target={stat.value}
                  >
                    0+
                  </span>
                  <p className="text-[11px] text-gik-stone tracking-wide mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right — Vision + Mission cards */}
          <div className="about-cards lg:w-[45%] flex flex-col gap-5">
            {/* Vision */}
            <div className="about-card card p-8 flex-1 opacity-0">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gik-void flex items-center justify-center">
                  <Eye size={18} strokeWidth={1.5} className="text-white" />
                </div>
                <h3 className="font-display text-[1.2rem] font-medium text-gik-void">Our Vision</h3>
              </div>
              <p className="text-gik-stone text-[14px] leading-relaxed mb-4">
                To become India&apos;s most trusted name in sacred, sustainable home design — proving that beauty,
                craft, and environmental responsibility can coexist in every object we create.
              </p>
              <p className="text-gik-stone text-[14px] leading-relaxed">
                We envision homes filled with intention — where every object carries a story of reclamation,
                every surface reflects ancient wisdom, and every space breathes with purpose.
              </p>
            </div>

            {/* Mission */}
            <div className="about-card card p-8 flex-1 opacity-0">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gik-gold flex items-center justify-center">
                  <Target size={18} strokeWidth={1.5} className="text-white" />
                </div>
                <h3 className="font-display text-[1.2rem] font-medium text-gik-void">Our Mission</h3>
              </div>
              <p className="text-gik-stone text-[14px] leading-relaxed mb-4">
                To rescue 10,000+ tonnes of material from landfills by 2030, transforming them into
                handcrafted objects that bring harmony to Indian homes and livelihoods to traditional artisans.
              </p>
              <Link
                href="/story"
                className="inline-flex items-center gap-2 text-gik-void text-[13px] font-medium group"
              >
                <span className="link-hover">Read Our Full Story</span>
                <ArrowRight size={14} className="transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
