"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import gsap from "gsap";
import { ArrowRight } from "lucide-react";

const stats = [
  { value: "850+", label: "Materials Saved" },
  { value: "50+", label: "Master Artisans" },
  { value: "₹10M+", label: "In Sacred Craft" },
];

export default function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const avatarsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ delay: 0.3 });

      tl.fromTo(imageRef.current, { scale: 1.1, opacity: 0 }, { scale: 1, opacity: 1, duration: 1.4, ease: "expo.out" });
      tl.fromTo(titleRef.current, { y: 50, opacity: 0 }, { y: 0, opacity: 1, duration: 1, ease: "expo.out" }, "-=0.8");
      tl.fromTo(subtitleRef.current, { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: "expo.out" }, "-=0.5");
      tl.fromTo(ctaRef.current, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: "expo.out" }, "-=0.3");
      tl.fromTo(statsRef.current?.children ? Array.from(statsRef.current.children) : [], { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: "expo.out", stagger: 0.1 }, "-=0.2");
      tl.fromTo(avatarsRef.current, { x: 20, opacity: 0 }, { x: 0, opacity: 1, duration: 0.5, ease: "expo.out" }, "-=0.3");
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="relative pt-[80px] md:pt-[88px] pb-8 page-pad">
      <div className="max-w-[1400px] mx-auto">
        {/* Hero Image Container */}
        <div ref={imageRef} className="relative w-full rounded-[16px] md:rounded-[24px] overflow-hidden opacity-0 aspect-[3/4] md:aspect-[16/7]">
          <Image
            src="https://images.unsplash.com/photo-1600210492493-0946911123ea?w=1600&q=85"
            alt="Sacred handcrafted interior objects"
            fill
            sizes="100vw"
            className="object-cover"
            priority
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-gik-void/70 via-gik-void/30 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-gik-void/60 via-transparent to-transparent" />

          {/* Hero Content */}
          <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-10 lg:p-14">
            <div className="max-w-2xl">
              <h1 ref={titleRef} className="font-display font-light text-white leading-[1.05] tracking-[-0.02em] text-[clamp(2rem,5.5vw,4.5rem)] uppercase opacity-0">
                Find Your Perfect
                <br />
                Sacred Objects
              </h1>
              <p ref={subtitleRef} className="mt-4 text-white/70 text-sm md:text-base max-w-lg font-body leading-relaxed opacity-0">
                We craft intentional home objects from reclaimed materials, guiding you through every detail with personalised experiences that honour the sacred.
              </p>
              <div ref={ctaRef} className="mt-6 opacity-0">
                <Link
                  href="/shop"
                  className="inline-flex items-center gap-3 bg-white text-gik-void text-[13px] font-medium px-6 py-3 rounded-full transition-all duration-300 hover:bg-gik-gold hover:text-white group"
                >
                  Explore Collection
                  <span className="w-6 h-6 rounded-full bg-gik-void text-white flex items-center justify-center transition-all duration-300 group-hover:bg-white group-hover:text-gik-void">
                    <ArrowRight size={12} />
                  </span>
                </Link>
              </div>
            </div>

            {/* Stats Row */}
            <div className="flex items-end justify-between mt-6 md:mt-12">
              <div ref={statsRef} className="flex items-center gap-3 md:gap-10 flex-wrap">
                {stats.map((stat, i) => (
                  <div key={i} className="flex items-baseline gap-1">
                    <span className="font-display text-[clamp(1.2rem,3vw,2.5rem)] font-light text-white leading-none">{stat.value}</span>
                    <span className="text-[9px] md:text-[11px] text-white/50 font-body tracking-wide">{stat.label}</span>
                  </div>
                ))}
              </div>

              {/* Artisan Avatars */}
              <div ref={avatarsRef} className="hidden md:flex items-center gap-3 opacity-0">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="w-9 h-9 rounded-full bg-white/20 border-2 border-white overflow-hidden">
                      <Image
                        src={`https://images.unsplash.com/photo-${i === 1 ? "1507003211169-0a1dd7228f2d" : i === 2 ? "1506439773649-6e0eb8cfb237" : i === 3 ? "1494790108377-be9c29b29330" : "1500648767791-00dcc994a43e"}?w=80&q=80`}
                        alt="Artisan" width={36} height={36} className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
                <div>
                  <p className="text-[11px] text-white font-medium">10+ Featured Artisans</p>
                  <div className="flex items-center gap-0.5 mt-0.5">
                    {[1, 2, 3, 4, 5].map((s) => <span key={s} className="text-gik-gold text-[10px]">★</span>)}
                    <span className="text-[10px] text-white/60 ml-1">5/5</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
