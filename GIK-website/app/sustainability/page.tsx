"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Image from "next/image";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/Button";
import { FlashReveal } from "@/components/effects/FlashReveal";
import { cn } from "@/lib/utils";

gsap.registerPlugin(ScrollTrigger);

const ParticleField = dynamic(
  () =>
    import("@/components/effects/ParticleField").then(
      (mod) => mod.ParticleField
    ),
  { ssr: false }
);

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const EASE_OUT_EXPO = "expo.out";

// ---------------------------------------------------------------------------
// Material Journey Data
// ---------------------------------------------------------------------------

interface JourneyStep {
  id: number;
  title: string;
  label: string;
  description: string;
  image: string;
}

const journeySteps: JourneyStep[] = [
  {
    id: 0,
    title: "Source",
    label: "SOURCE",
    description:
      "Our material scouts traverse demolition sites, decommissioned railways, temple renovation projects, and artisan workshops across India. They identify timber, brass, iron, glass, and textile fragments that carry the richest histories — materials that the industrial supply chain has abandoned but that still hold decades of embodied energy and cultural memory.",
    image:
      "https://images.unsplash.com/photo-1416339306562-f3d12fefd36f?w=800&q=80",
  },
  {
    id: 1,
    title: "Collect",
    label: "COLLECT",
    description:
      "Each salvaged material is catalogued with its origin story: where it came from, what it was, how old it is. A beam from a 120-year-old Chettinad mansion is documented differently than a brass vessel from a Kerala household. This documentation travels with the material through every stage of its transformation, ensuring complete traceability from source to your shelf.",
    image:
      "https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=800&q=80",
  },
  {
    id: 2,
    title: "Process",
    label: "PROCESS",
    description:
      "At our Auroville workshop, materials are cleaned, treated, and prepared using low-impact methods. Reclaimed wood is de-nailed by hand and naturally seasoned rather than kiln-dried. Brass is melted at the lowest effective temperature. We use plant-based finishes and water-based sealants wherever possible, ensuring that the act of processing does not undo the environmental benefit of reclamation.",
    image:
      "https://images.unsplash.com/photo-1510133768164-a8f7e4d4e3dc?w=800&q=80",
  },
  {
    id: 3,
    title: "Craft",
    label: "CRAFT",
    description:
      "Our artisan partners — ironworkers in Bastar, woodcarvers in Saharanpur, brass casters in Moradabad — apply generations of inherited skill to shape each object. Every piece is handcrafted, meaning no two are identical. The natural variations in reclaimed materials become design features: a nail hole becomes a decorative accent, a weathered grain pattern becomes the centrepiece of a tray.",
    image:
      "https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800&q=80",
  },
  {
    id: 4,
    title: "You",
    label: "YOU",
    description:
      "The finished object arrives at your door wrapped in 100% recycled and recyclable packaging, accompanied by a material passport that tells the complete story of its journey. You are not buying a product. You are adopting a piece of material history and giving it the dignity of a second life — one that might last another century.",
    image:
      "https://images.unsplash.com/photo-1618220179428-22790b461013?w=800&q=80",
  },
];

// ---------------------------------------------------------------------------
// Impact Stats Data
// ---------------------------------------------------------------------------

interface StatItem {
  value: number;
  suffix: string;
  label: string;
}

const stats: StatItem[] = [
  { value: 850, suffix: "+", label: "kg Materials Saved" },
  { value: 12, suffix: "", label: "Tons CO\u2082 Offset" },
  { value: 100, suffix: "%", label: "Recycled Packaging" },
  { value: 0, suffix: "", label: "Landfill Waste" },
];

// ---------------------------------------------------------------------------
// Parallax Image Component
// ---------------------------------------------------------------------------

function ParallaxImage({
  className,
  src,
  alt,
  priority = false,
}: {
  className?: string;
  src: string;
  alt: string;
  priority?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (!innerRef.current) return;

      gsap.fromTo(
        innerRef.current,
        { yPercent: -15 },
        {
          yPercent: 15,
          ease: "none",
          scrollTrigger: {
            trigger: ref.current,
            start: "top bottom",
            end: "bottom top",
            scrub: 1,
          },
        }
      );
    }, ref);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={ref} className={cn("relative overflow-hidden", className)}>
      <div ref={innerRef} className="absolute inset-[-15%] will-change-transform">
        <Image
          src={src}
          alt={alt}
          fill
          sizes="100vw"
          className="object-cover"
          quality={85}
          priority={priority}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section Reveal Component
// ---------------------------------------------------------------------------

function RevealSection({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ref.current,
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          delay,
          ease: EASE_OUT_EXPO,
          scrollTrigger: {
            trigger: ref.current,
            start: "top 90%",
            once: true,
          },
        }
      );
    }, ref);

    return () => ctx.revert();
  }, [delay]);

  return (
    <div ref={ref} className={cn("opacity-0", className)}>
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sustainability Page
// ---------------------------------------------------------------------------

export default function SustainabilityPage() {
  const [activeStep, setActiveStep] = useState(0);

  const heroRef = useRef<HTMLDivElement>(null);
  const journeyRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);

  // Refs for journey step content transition
  const journeyImageRef = useRef<HTMLDivElement>(null);
  const journeyTextRef = useRef<HTMLDivElement>(null);

  // Counter refs
  const statWrapperRefs = useRef<(HTMLDivElement | null)[]>([]);
  const counterRefs = useRef<(HTMLSpanElement | null)[]>([]);

  // -----------------------------------------------------------------------
  // Hero animation — timeline on mount
  // -----------------------------------------------------------------------
  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: heroRef.current,
          start: "top 80%",
          once: true,
        },
      });

      tl.fromTo(
        ".hero-label",
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: EASE_OUT_EXPO }
      )
        .fromTo(
          ".hero-subtitle",
          { y: 20, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.8, ease: EASE_OUT_EXPO },
          0.5
        );

      // Hero content parallax out on scroll
      gsap.to(".hero-content-sust", {
        yPercent: -20,
        opacity: 0,
        ease: "none",
        scrollTrigger: {
          trigger: heroRef.current,
          start: "top top",
          end: "bottom top",
          scrub: 1,
        },
      });
    }, heroRef);

    return () => ctx.revert();
  }, []);

  // -----------------------------------------------------------------------
  // Journey timeline indicators — fade in on scroll
  // -----------------------------------------------------------------------
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".journey-indicators",
        { opacity: 0 },
        {
          opacity: 1,
          duration: 0.6,
          delay: 0.2,
          scrollTrigger: {
            trigger: journeyRef.current,
            start: "top 85%",
            once: true,
          },
        }
      );
    }, journeyRef);

    return () => ctx.revert();
  }, []);

  // -----------------------------------------------------------------------
  // Journey step transitions — animate on activeStep change
  // -----------------------------------------------------------------------
  const prevStepRef = useRef(0);

  useEffect(() => {
    const imageEl = journeyImageRef.current;
    const textEl = journeyTextRef.current;
    if (!imageEl || !textEl) return;

    // Skip initial mount — elements are already visible
    if (prevStepRef.current === activeStep) return;

    const ctx = gsap.context(() => {
      // Image transition
      gsap.fromTo(
        imageEl,
        { opacity: 0, scale: 1.05 },
        { opacity: 1, scale: 1, duration: 0.5, ease: EASE_OUT_EXPO }
      );

      // Text transition
      gsap.fromTo(
        textEl,
        { opacity: 0, y: 25 },
        { opacity: 1, y: 0, duration: 0.5, ease: EASE_OUT_EXPO }
      );
    });

    prevStepRef.current = activeStep;

    return () => ctx.revert();
  }, [activeStep]);

  // -----------------------------------------------------------------------
  // Impact stats — ScrollTrigger counters with scramble effect
  // -----------------------------------------------------------------------
  useEffect(() => {
    const ctx = gsap.context(() => {
      stats.forEach((stat, i) => {
        const wrapper = statWrapperRefs.current[i];
        const counterEl = counterRefs.current[i];
        if (!wrapper || !counterEl) return;

        // Fade in stat wrapper with scale
        gsap.fromTo(
          wrapper,
          { y: 30, opacity: 0, scale: 0.92 },
          {
            y: 0,
            opacity: 1,
            scale: 1,
            duration: 0.7,
            ease: EASE_OUT_EXPO,
            delay: 0.2 + Math.abs(i - 1.5) * 0.1,
            scrollTrigger: {
              trigger: statsRef.current,
              start: "top 80%",
              once: true,
            },
          }
        );

        // Scramble then count up
        if (stat.value > 0) {
          const scrambleDuration = 0.3;
          const countDuration = 2;
          let scrambleFrame: number;

          // Scramble phase: random digits
          ScrollTrigger.create({
            trigger: statsRef.current,
            start: "top 80%",
            once: true,
            onEnter: () => {
              const startTime = Date.now();
              const scramble = () => {
                const elapsed = (Date.now() - startTime) / 1000;
                if (elapsed < scrambleDuration) {
                  counterEl.textContent = String(
                    Math.floor(Math.random() * stat.value)
                  );
                  scrambleFrame = requestAnimationFrame(scramble);
                }
              };
              scrambleFrame = requestAnimationFrame(scramble);

              // Smooth count after scramble
              const counter = { val: 0 };
              gsap.to(counter, {
                val: stat.value,
                duration: countDuration,
                ease: "power2.out",
                delay: scrambleDuration + 0.2 + Math.abs(i - 1.5) * 0.1,
                onUpdate: () => {
                  counterEl.textContent = String(Math.round(counter.val));
                },
              });

              return () => cancelAnimationFrame(scrambleFrame);
            },
          });
        }
      });
    }, statsRef);

    return () => ctx.revert();
  }, []);

  // -----------------------------------------------------------------------
  // CTA — ScrollTrigger reveal
  // -----------------------------------------------------------------------
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ctaRef.current,
        { y: 30, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          ease: EASE_OUT_EXPO,
          scrollTrigger: {
            trigger: ctaRef.current,
            start: "top 90%",
            once: true,
          },
        }
      );
    }, ctaRef);

    return () => ctx.revert();
  }, []);

  // -----------------------------------------------------------------------
  // Callback for setting stat refs
  // -----------------------------------------------------------------------
  const setStatWrapperRef = useCallback(
    (el: HTMLDivElement | null, index: number) => {
      statWrapperRefs.current[index] = el;
    },
    []
  );

  const setCounterRef = useCallback(
    (el: HTMLSpanElement | null, index: number) => {
      counterRefs.current[index] = el;
    },
    []
  );

  return (
    <section className="min-h-screen">
      {/* ----------------------------------------------------------------- */}
      {/* Hero — Full-viewport cinematic                                    */}
      {/* ----------------------------------------------------------------- */}
      <div
        ref={heroRef}
        className="relative h-screen overflow-hidden flex items-end"
      >
        {/* Background parallax image */}
        <ParallaxImage
          className="absolute inset-0 w-full h-full"
          src="https://images.unsplash.com/photo-1416339306562-f3d12fefd36f?w=1920&q=80"
          alt="Lush natural landscape representing sustainability"
          priority
        />
        <div className="absolute inset-0 bg-gik-void/50" />
        <div className="absolute inset-0 hero-vignette" />

        {/* Particle overlay */}
        <div className="absolute inset-0 z-[1] three-desktop-only pointer-events-none">
          <ParticleField
            count={300}
            color="#7a8b6f"
            speed={0.2}
            className="w-full h-full"
          />
        </div>

        {/* Bottom-left aligned content */}
        <div className="hero-content-sust relative z-10 page-pad pb-16 md:pb-24 max-w-3xl">
          <p className="hero-label text-[10px] tracking-[0.2em] uppercase text-gik-canvas/50 font-body font-medium mb-4 opacity-0">
            Sustainability
          </p>

          <FlashReveal
            as="h1"
            className="font-display text-hero font-light text-gik-canvas"
            delay={0.2}
          >
            Our promise to the earth
          </FlashReveal>

          <p className="hero-subtitle font-display italic text-gik-canvas/70 text-lg md:text-xl mt-5 opacity-0">
            From salvage to sanctuary, every step matters
          </p>
        </div>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Material Journey — Interactive timeline                           */}
      {/* ----------------------------------------------------------------- */}
      <div
        className="page-pad content-auto"
        style={{
          paddingTop: "var(--space-section)",
          paddingBottom: "var(--space-section)",
        }}
      >
        <RevealSection className="text-center mb-16 md:mb-20">
          <p className="text-[10px] tracking-[0.2em] uppercase text-gik-stone/50 font-body font-medium mb-5">
            Material Journey
          </p>
          <h2
            className="font-display font-light text-gik-void"
            style={{ fontSize: "clamp(1.8rem, 3vw, 2.5rem)" }}
          >
            From salvage to sanctuary
          </h2>
        </RevealSection>

        <div ref={journeyRef}>
          {/* Step Indicators — horizontal with gold dots and connecting lines */}
          <div className="journey-indicators flex items-center justify-center mb-20 md:mb-24 opacity-0">
            {journeySteps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                {/* Dot + label */}
                <button
                  onClick={() => setActiveStep(index)}
                  className={cn(
                    "relative flex flex-col items-center",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gik-gold focus-visible:ring-offset-2 rounded-full"
                  )}
                >
                  <div
                    className={cn(
                      "w-3 h-3 rounded-full transition-all duration-500",
                      activeStep === index
                        ? "bg-gik-gold scale-125"
                        : activeStep > index
                          ? "bg-gik-gold/60"
                          : "border border-gik-stone/40 bg-transparent"
                    )}
                  />

                  {/* Label below */}
                  <span
                    className={cn(
                      "absolute top-6 left-1/2 -translate-x-1/2",
                      "text-[8px] md:text-[10px] tracking-[0.08em] md:tracking-[0.12em] uppercase font-body font-medium whitespace-nowrap",
                      "transition-colors duration-300",
                      activeStep === index
                        ? "text-gik-void"
                        : "text-gik-stone/60"
                    )}
                  >
                    {step.label}
                  </span>
                </button>

                {/* Connecting line */}
                {index < journeySteps.length - 1 && (
                  <div className="relative w-6 md:w-24 lg:w-32 h-px mx-1 md:mx-3">
                    <div className="absolute inset-0 bg-gik-stone/20" />
                    <div
                      className="absolute inset-y-0 left-0 bg-gik-gold/60 transition-all duration-500"
                      style={{
                        width: activeStep > index ? "100%" : "0%",
                        transitionTimingFunction:
                          "cubic-bezier(0.16, 1, 0.3, 1)",
                      }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Step Content — 2-column: image left, text right */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-20">
            {/* Image */}
            <div className="relative aspect-[3/4] bg-gik-linen overflow-hidden">
              <div ref={journeyImageRef} className="absolute inset-0">
                <Image
                  src={journeySteps[activeStep].image}
                  alt={journeySteps[activeStep].title}
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
              </div>
            </div>

            {/* Description */}
            <div className="flex items-center">
              <div ref={journeyTextRef}>
                <div className="w-10 h-px bg-gik-gold mb-8" />

                <h3
                  className="font-display font-light text-gik-void mb-6"
                  style={{
                    fontSize: "clamp(1.8rem, 3vw, 2.5rem)",
                  }}
                >
                  {journeySteps[activeStep].title}
                </h3>

                <p className="text-base md:text-lg text-gik-void/70 leading-[1.85] font-body">
                  {journeySteps[activeStep].description}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Impact Numbers — Dark section with scramble counters + particles  */}
      {/* ----------------------------------------------------------------- */}
      <div
        className="relative bg-gik-void content-auto"
        style={{
          paddingTop: "var(--space-section)",
          paddingBottom: "var(--space-section)",
        }}
      >
        {/* ParticleField overlay */}
        <div className="absolute inset-0 z-0 three-desktop-only pointer-events-none">
          <ParticleField
            count={300}
            color="#7a8b6f"
            speed={0.2}
            className="w-full h-full"
          />
        </div>

        <div className="page-pad relative z-10">
          <RevealSection className="text-center mb-16 md:mb-20">
            <p className="text-[10px] tracking-[0.2em] uppercase text-gik-stone/50 font-body font-medium mb-5">
              Our Impact
            </p>
            <h2
              className="font-display font-light text-gik-canvas"
              style={{ fontSize: "clamp(1.8rem, 3vw, 2.5rem)" }}
            >
              Numbers that matter
            </h2>
          </RevealSection>

          <div
            ref={statsRef}
            className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8"
          >
            {stats.map((stat, index) => (
              <div
                key={stat.label}
                ref={(el) => setStatWrapperRef(el, index)}
                className="text-center opacity-0"
              >
                <div
                  className="font-display font-light text-gik-gold mb-3"
                  style={{ fontSize: "clamp(2.5rem, 5vw, 4rem)" }}
                >
                  <span ref={(el) => setCounterRef(el, index)}>0</span>
                  {stat.suffix && <span>{stat.suffix}</span>}
                </div>
                <p className="text-caption text-gik-stone font-body">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Philosophy — Centered editorial text                              */}
      {/* ----------------------------------------------------------------- */}
      <div
        className="page-pad noise-overlay content-auto"
        style={{
          paddingTop: "var(--space-section)",
          paddingBottom: "var(--space-section)",
        }}
      >
        <div className="max-w-3xl mx-auto text-center">
          <RevealSection>
            <p
              className="font-display italic font-light text-gik-void leading-[1.45]"
              style={{ fontSize: "clamp(1.4rem, 2.8vw, 2.2rem)" }}
            >
              We do not merely reduce harm. We actively restore — pulling matter
              from the waste stream and returning it to the stream of daily
              life, more beautiful and more purposeful than before.
            </p>
          </RevealSection>

          <RevealSection delay={0.15} className="mt-8">
            <p className="text-base text-gik-stone leading-[1.8] font-body max-w-2xl mx-auto">
              Every GIK object is a small act of environmental justice — proof
              that sustainability and beauty are not opposing forces, but
              inseparable companions on the path to a kinder world.
            </p>
          </RevealSection>
        </div>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* CTA — Minimal centered call-to-action                             */}
      {/* ----------------------------------------------------------------- */}
      <div
        className="page-pad content-auto"
        style={{ paddingBottom: "var(--space-section)" }}
      >
        <div
          ref={ctaRef}
          className="text-center max-w-2xl mx-auto opacity-0"
        >
          <div className="w-10 h-px bg-gik-gold mx-auto mb-10" />

          <p
            className="font-display font-light text-gik-void mb-4"
            style={{ fontSize: "clamp(1.4rem, 2.5vw, 2rem)" }}
          >
            Want to know more?
          </p>
          <p className="text-sm text-gik-stone leading-relaxed font-body mb-10 max-w-md mx-auto">
            Download our full sustainability report for a comprehensive look at
            our materials, processes, partnerships, and environmental impact
            data.
          </p>
          <Button variant="secondary">
            DOWNLOAD SUSTAINABILITY REPORT
          </Button>
        </div>
      </div>
    </section>
  );
}
