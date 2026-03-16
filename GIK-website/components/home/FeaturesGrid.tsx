"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Recycle, Sparkles, Shield, Truck, Palette, Heart } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

const features = [
  {
    icon: Recycle,
    title: "Reclaimed Materials",
    description:
      "Every piece is crafted from salvaged driftwood, reclaimed teak, and upcycled metals — giving new life to discarded beauty.",
  },
  {
    icon: Sparkles,
    title: "Artisan Handcraft",
    description:
      "Our master artisans bring decades of expertise, blending traditional Indian craft techniques with contemporary design sensibility.",
  },
  {
    icon: Shield,
    title: "Vaastu Aligned",
    description:
      "Sacred geometry and Vaastu principles guide our designs, ensuring every object brings harmony and positive energy to your space.",
  },
  {
    icon: Truck,
    title: "White-Glove Delivery",
    description:
      "Each piece is carefully packed with sustainable materials and delivered with care — installation guidance included for panels.",
  },
  {
    icon: Palette,
    title: "Custom Finishes",
    description:
      "Choose from our curated palette of natural finishes — raw wood, matte brass, oxidised copper — or request a bespoke tone.",
  },
  {
    icon: Heart,
    title: "Lifetime Stories",
    description:
      "Every product comes with a material passport — tracing its journey from salvaged origin to your home. A story you can share.",
  },
];

export default function FeaturesGrid() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".feat-header",
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
        ".feat-card",
        { y: 50, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.7,
          ease: "expo.out",
          stagger: 0.08,
          scrollTrigger: { trigger: ".feat-grid", start: "top 80%", once: true },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="py-[var(--space-section)] page-pad content-auto bg-gik-canvas">
      <div className="max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="text-center mb-14 md:mb-20">
          <span className="feat-header section-pill mb-6 inline-block opacity-0">Why GIK</span>
          <h2 className="feat-header font-display text-h1 font-medium text-gik-void uppercase tracking-[-0.01em] opacity-0">
            Explore Our Range of
            <br className="hidden md:block" /> Sacred Design Services
          </h2>
          <p className="feat-header mt-4 text-gik-stone max-w-xl mx-auto text-[15px] leading-relaxed opacity-0">
            From reclaimed materials to Vaastu-aligned sacred objects, we offer comprehensive design solutions for intentional living.
          </p>
        </div>

        {/* Grid */}
        <div className="feat-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feat) => {
            const Icon = feat.icon;
            return (
              <div
                key={feat.title}
                className="feat-card card-bordered p-8 group hover:border-gik-void/[0.15] opacity-0"
              >
                <div className="w-12 h-12 rounded-2xl bg-gik-linen flex items-center justify-center mb-5 transition-colors duration-300 group-hover:bg-gik-void">
                  <Icon
                    size={22}
                    strokeWidth={1.5}
                    className="text-gik-void transition-colors duration-300 group-hover:text-white"
                  />
                </div>
                <h3 className="font-display text-[1.15rem] font-medium text-gik-void mb-2.5">
                  {feat.title}
                </h3>
                <p className="text-gik-stone text-[14px] leading-relaxed">
                  {feat.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
