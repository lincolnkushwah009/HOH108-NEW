"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Leaf, Compass, Grid3X3 } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

const categories = [
  {
    num: "01",
    name: "GIK Utility",
    title: "Functional Minimalism",
    description:
      "Experience the elegance of purpose-driven design. Our utility collection features reclaimed wood organisers, brass pen holders, and handcrafted desk objects — minimal forms with maximum intention.",
    image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1200&q=85",
    icon: Grid3X3,
    href: "/shop/utility",
  },
  {
    num: "02",
    name: "GIK Align",
    title: "Sacred & Vaastu Objects",
    description:
      "Discover our collection of meditation frames, sacred geometry panels, and Vaastu-aligned objects — designed to bring harmony, balance, and spiritual resonance to every space.",
    image: "https://images.unsplash.com/photo-1631679706909-1844bbd07221?w=1200&q=85",
    icon: Compass,
    href: "/shop/align",
  },
  {
    num: "03",
    name: "GIK Panel",
    title: "Decorative Wall Panels",
    description:
      "Explore our curated collection of decorative wall panels — handcrafted from salvaged driftwood, reclaimed teak, and upcycled materials — offering distinctive textures for unforgettable interiors.",
    image: "https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=1200&q=85",
    icon: Leaf,
    href: "/shop/panel",
  },
];

export default function CategoriesCarousel() {
  const [active, setActive] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(".cat-header", { y: 40, opacity: 0 }, {
        y: 0, opacity: 1, duration: 0.8, ease: "expo.out", stagger: 0.1,
        scrollTrigger: { trigger: sectionRef.current, start: "top 75%", once: true },
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  // Animate image on category change
  useEffect(() => {
    if (!imageRef.current) return;
    gsap.fromTo(imageRef.current, { opacity: 0, scale: 1.05 }, { opacity: 1, scale: 1, duration: 0.6, ease: "expo.out" });
  }, [active]);

  const cat = categories[active];
  const Icon = cat.icon;

  return (
    <section ref={sectionRef} className="py-[var(--space-section)] page-pad content-auto">
      <div className="max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="mb-12 md:mb-16">
          <span className="cat-header section-pill mb-6 inline-block opacity-0">What We Offer</span>
          <h2 className="cat-header font-display text-h1 font-medium text-gik-void uppercase tracking-[-0.01em] opacity-0">
            Comprehensive Sacred
            <br className="hidden md:block" /> Design Collections
          </h2>
          <p className="cat-header mt-4 text-gik-stone max-w-xl text-[15px] leading-relaxed opacity-0">
            Our comprehensive collections encompass functional minimalism, sacred Vaastu objects, and premium decorative panels.
          </p>
        </div>

        {/* Carousel Layout */}
        <div className="relative flex flex-col md:flex-row gap-8 md:gap-0">
          {/* Left side — Description + Icon */}
          <div className="md:w-[35%] flex flex-col justify-end pb-4">
            <div className="mb-6">
              <Icon size={28} strokeWidth={1.5} className="text-gik-void" />
            </div>
            <h3 className="font-display text-[clamp(1.3rem,2.5vw,1.8rem)] font-medium text-gik-void mb-4">
              {cat.title}
            </h3>
            <p className="text-gik-stone text-[15px] leading-relaxed max-w-sm">
              {cat.description}
            </p>
            <Link href={cat.href} className="inline-flex items-center gap-2 mt-6 text-gik-void text-[13px] font-medium group">
              <span className="link-hover">Explore {cat.name}</span>
              <span className="transition-transform duration-300 group-hover:translate-x-1">&rarr;</span>
            </Link>
          </div>

          {/* Vertical labels — left of image */}
          <div className="hidden md:flex flex-col items-center justify-center gap-4 px-4">
            {categories.map((c, i) => (
              <button
                key={c.num}
                onClick={() => setActive(i)}
                className={`flex items-center gap-2 transition-all duration-300 ${i === active ? "opacity-100" : "opacity-30 hover:opacity-60"}`}
                style={{ writingMode: "vertical-lr", transform: "rotate(180deg)" }}
              >
                <span className="text-[clamp(1.5rem,2vw,2rem)] font-display font-light text-gik-void">{c.num}</span>
                <span className="text-[11px] tracking-[0.1em] uppercase font-body text-gik-void">{c.name}</span>
              </button>
            ))}
          </div>

          {/* Center — Image */}
          <div className="md:flex-1 relative">
            <div ref={imageRef} className="relative rounded-[20px] overflow-hidden" style={{ aspectRatio: "4/3" }}>
              <Image
                src={cat.image}
                alt={cat.title}
                fill
                sizes="(max-width: 768px) 100vw, 60vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-gik-void/30 to-transparent" />

              {/* Number indicator — bottom right */}
              <div className="absolute bottom-6 right-6 z-10">
                <div className="bg-white/90 backdrop-blur-sm rounded-xl px-5 py-3">
                  <span className="font-display text-[clamp(1.5rem,2.5vw,2.2rem)] font-light text-gik-void">{cat.num}</span>
                  <p className="text-[12px] font-medium text-gik-void mt-0.5">{cat.title}</p>
                </div>
              </div>
            </div>

            {/* Mobile category tabs */}
            <div className="flex md:hidden items-center gap-2 mt-4">
              {categories.map((c, i) => (
                <button
                  key={c.num}
                  onClick={() => setActive(i)}
                  className={`flex-1 py-3 rounded-xl text-center text-[12px] font-medium transition-all duration-300 ${
                    i === active ? "bg-gik-void text-white" : "bg-gik-linen text-gik-stone"
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
