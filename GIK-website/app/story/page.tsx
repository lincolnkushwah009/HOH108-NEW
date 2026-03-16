"use client";

import { useRef, useEffect } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";
import { SectionTransition } from "@/components/effects/SectionTransition";
import { FlashReveal } from "@/components/effects/FlashReveal";
import { scaleEntrance, perspective3DEntrance } from "@/lib/animations";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

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

const EASE_OUT_EXPO = "power4.out";

// ---------------------------------------------------------------------------
// Values Data
// ---------------------------------------------------------------------------

const values = [
  {
    title: "Kindness",
    description:
      "Every object we create begins with an act of kindness — to the material that might have been discarded, to the artisan whose craft deserves a living wage, and to the home that deserves objects with soul.",
  },
  {
    title: "Sustainability",
    description:
      "We do not sustain. We regenerate. Every reclaimed fragment we transform is a small act of restoration — pulling matter from the waste stream and returning it to the stream of daily life, more beautiful than before.",
  },
  {
    title: "Sacred Craft",
    description:
      "We believe that making things by hand is a form of prayer. Our artisans bring centuries of inherited knowledge to every curve, joint, and finish — a lineage that machines cannot replicate and markets must not be allowed to erase.",
  },
];

// ---------------------------------------------------------------------------
// Timeline Milestones
// ---------------------------------------------------------------------------

const milestones = [
  { year: "2019", title: "The Spark", description: "A question born in a South Indian workshop — what if discarded materials could carry stories of redemption?" },
  { year: "2020", title: "First Collection", description: "Our inaugural line of reclaimed teak objects, handcrafted by artisans in Auroville, found its first admirers." },
  { year: "2021", title: "Artisan Network", description: "Partnerships with 12 cooperatives across India — ironworkers in Bastar, brass casters in Moradabad, woodworkers in Saharanpur." },
  { year: "2022", title: "The Align Collection", description: "Sacred geometry meets reclaimed materials. Temple bells reborn as meditation objects." },
  { year: "2023", title: "Zero Waste Certified", description: "Every material catalogued, every offcut repurposed. Nothing enters the waste stream." },
  { year: "2024", title: "Global Reach", description: "From Indian workshops to homes across 14 countries. The story of reclamation, told worldwide." },
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
    const el = ref.current;
    const inner = innerRef.current;
    if (!el || !inner) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        inner,
        { yPercent: -15 },
        {
          yPercent: 15,
          ease: "none",
          scrollTrigger: {
            trigger: el,
            start: "top bottom",
            end: "bottom top",
            scrub: 1,
          },
        }
      );
    }, el);

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
    const el = ref.current;
    if (!el) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          delay,
          ease: EASE_OUT_EXPO,
          scrollTrigger: {
            trigger: el,
            start: "top 85%",
            once: true,
          },
        }
      );
    }, el);

    return () => ctx.revert();
  }, [delay]);

  return (
    <div ref={ref} className={cn("opacity-0", className)}>
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Story Page
// ---------------------------------------------------------------------------

export default function StoryPage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const quoteRef = useRef<HTMLDivElement>(null);
  const valuesRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const timelineLineRef = useRef<HTMLDivElement>(null);

  const quoteText =
    "We believe that every discarded material holds the potential for beauty.";
  const quoteWords = quoteText.split(" ");

  // Hero animations — triggered on mount
  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: EASE_OUT_EXPO } });

      tl.fromTo(
        ".hero-label",
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.8 },
        0.2
      );

      tl.fromTo(
        ".hero-subtitle",
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.8 },
        0.7
      );

      // Hero content parallax out on scroll
      gsap.to(".hero-content", {
        yPercent: -30,
        opacity: 0,
        ease: "none",
        scrollTrigger: {
          trigger: el,
          start: "top top",
          end: "bottom top",
          scrub: 1,
        },
      });
    }, el);

    return () => ctx.revert();
  }, []);

  // Quote word-by-word scroll-scrubbed reveal
  useEffect(() => {
    const el = quoteRef.current;
    if (!el) return;

    const ctx = gsap.context(() => {
      const words = el.querySelectorAll(".quote-word");

      words.forEach((word, i) => {
        gsap.fromTo(
          word,
          { opacity: 0.08 },
          {
            opacity: 1,
            ease: "none",
            scrollTrigger: {
              trigger: el,
              start: () => `top+=${i * 12 + 80} center`,
              end: () => `top+=${i * 12 + 120} center`,
              scrub: 1,
            },
          }
        );
      });
    }, el);

    return () => ctx.revert();
  }, []);

  // Timeline scroll-driven line draw
  useEffect(() => {
    const el = timelineRef.current;
    const line = timelineLineRef.current;
    if (!el || !line) return;

    const ctx = gsap.context(() => {
      // Animate the gold progress line
      gsap.fromTo(
        line,
        { scaleY: 0 },
        {
          scaleY: 1,
          ease: "none",
          scrollTrigger: {
            trigger: el,
            start: "top 60%",
            end: "bottom 40%",
            scrub: 1,
          },
        }
      );

      // Stagger milestone entries with subtle 3D rotateY
      const items = el.querySelectorAll(".milestone-item");
      items.forEach((item, i) => {
        gsap.fromTo(
          item,
          { opacity: 0, x: i % 2 === 0 ? -40 : 40, rotateY: i % 2 === 0 ? -5 : 5 },
          {
            opacity: 1,
            x: 0,
            rotateY: 0,
            duration: 0.7,
            ease: "expo.out",
            scrollTrigger: {
              trigger: item,
              start: "top 80%",
              once: true,
            },
          }
        );
      });
    }, el);

    return () => ctx.revert();
  }, []);

  // Values stagger reveal
  useEffect(() => {
    const el = valuesRef.current;
    if (!el) return;

    const ctx = gsap.context(() => {
      const cards = el.querySelectorAll(".value-card");

      perspective3DEntrance(cards, {
        rotateX: -15,
        fromScale: 0.9,
        stagger: 0.12,
        scrollTrigger: {
          trigger: el,
          start: "top 85%",
          once: true,
        },
      });
    }, el);

    return () => ctx.revert();
  }, []);

  return (
    <section className="min-h-screen">
      {/* ----------------------------------------------------------------- */}
      {/* Hero — Full-viewport cinematic with ParticleField                 */}
      {/* ----------------------------------------------------------------- */}
      <div
        ref={heroRef}
        className="relative h-screen overflow-hidden flex items-end"
      >
        {/* Background parallax image */}
        <ParallaxImage
          className="absolute inset-0 w-full h-full"
          src="https://images.unsplash.com/photo-1510133768164-a8f7e4d4e3dc?w=1920&q=80"
          alt="Artisan crafting reclaimed materials"
          priority
        />
        <div className="absolute inset-0 bg-gik-void/50" />
        <div className="absolute inset-0 hero-vignette" />

        {/* Particle overlay */}
        <div className="absolute inset-0 z-[1] three-desktop-only pointer-events-none">
          <ParticleField
            count={400}
            color="#b89d6f"
            speed={0.3}
            className="w-full h-full"
          />
        </div>

        {/* Bottom-left aligned content */}
        <div className="hero-content relative z-10 page-pad pb-16 md:pb-24 max-w-3xl">
          <p className="hero-label opacity-0 text-[10px] tracking-[0.2em] uppercase text-gik-canvas/50 font-body font-medium mb-4">
            The GIK Story
          </p>

          <FlashReveal
            as="h1"
            className="font-display text-display font-light text-gik-canvas"
            delay={0.4}
          >
            Where waste becomes wonder
          </FlashReveal>

          <p className="hero-subtitle opacity-0 font-display italic text-gik-canvas/70 text-lg md:text-xl mt-5">
            Reclaimed materials, reborn with reverence
          </p>
        </div>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Opening Quote — Word-by-word scroll-scrubbed reveal               */}
      {/* ----------------------------------------------------------------- */}
      <div
        ref={quoteRef}
        className="page-pad noise-overlay content-auto"
        style={{
          paddingTop: "var(--space-section)",
          paddingBottom: "var(--space-section)",
        }}
      >
        <div className="max-w-4xl mx-auto text-center">
          <p
            className="font-display italic font-light text-gik-void leading-[1.4] flex flex-wrap justify-center gap-x-[0.3em]"
            style={{ fontSize: "clamp(1.5rem, 3.5vw, 2.8rem)" }}
          >
            {quoteWords.map((word, i) => (
              <span
                key={i}
                className="quote-word inline-block will-change-transform"
                style={{ opacity: 0.08 }}
              >
                {word}
              </span>
            ))}
          </p>
        </div>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Origin Story — Asymmetric 2-column (60/40) with curtain reveal    */}
      {/* ----------------------------------------------------------------- */}
      <SectionTransition type="curtain">
        <div
          className="page-pad content-auto"
          style={{ paddingBottom: "var(--space-section)" }}
        >
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_0.65fr] gap-12 lg:gap-20">
            {/* Left column — body text */}
            <div className="space-y-8">
              <RevealSection>
                <p className="text-lg text-gik-void/80 leading-[1.85] font-body">
                  Born from a simple question — what if the objects in our homes
                  could carry stories of redemption? GIK began in a small workshop
                  in South India, where a handful of makers sat among piles of
                  salvaged wood, discarded brass, and broken temple bells. Around
                  them lay the debris of demolition sites and abandoned factories,
                  material that the modern world had judged worthless. But in those
                  fragments, they saw sentences waiting to be written — narratives
                  of transformation that could turn waste into wonder, and ordinary
                  homes into sanctuaries.
                </p>
              </RevealSection>

              <RevealSection delay={0.15}>
                <p className="text-lg text-gik-void/80 leading-[1.85] font-body">
                  The name GOD IS KIND was not chosen lightly. It is a statement
                  of faith — not in any particular doctrine, but in the
                  possibility that kindness is the organising principle of the
                  universe. That even in destruction, there is the seed of
                  creation. That a railway spike pulled from a decommissioned
                  track in Rajasthan can become a wall hook of quiet beauty. That
                  shards of broken lac bangles from the streets of Firozabad can
                  be reborn as a mosaic that catches the afternoon light in a
                  Bangalore apartment. Every GIK object is evidence of this faith.
                </p>
              </RevealSection>
            </div>

            {/* Right column — tall parallax image */}
            <RevealSection delay={0.2}>
              <ParallaxImage
                className="w-full aspect-[3/4] lg:aspect-auto lg:h-full min-h-[400px]"
                src="https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800&q=80"
                alt="GIK artisan workspace filled with reclaimed materials"
              />
            </RevealSection>
          </div>
        </div>
      </SectionTransition>

      {/* ----------------------------------------------------------------- */}
      {/* Full-width parallax image break                                   */}
      {/* ----------------------------------------------------------------- */}
      <ParallaxImage
        className="w-full aspect-[21/9] content-auto"
        src="https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=1200&q=80"
        alt="Natural organic textures and reclaimed materials"
      />

      {/* ----------------------------------------------------------------- */}
      {/* Craft & Mission — Reverse asymmetric with curtain reveal          */}
      {/* ----------------------------------------------------------------- */}
      <SectionTransition type="curtain">
        <div
          className="page-pad content-auto"
          style={{
            paddingTop: "var(--space-section)",
            paddingBottom: "var(--space-section)",
          }}
        >
          <div className="grid grid-cols-1 lg:grid-cols-[0.65fr_1fr] gap-12 lg:gap-20">
            {/* Left column — image */}
            <RevealSection>
              <ParallaxImage
                className="w-full aspect-[3/4] lg:aspect-auto lg:h-full min-h-[400px]"
                src="https://images.unsplash.com/photo-1510133768164-a8f7e4d4e3dc?w=800&q=80"
                alt="Artisan hands shaping reclaimed material"
              />
            </RevealSection>

            {/* Right column — body text */}
            <div className="flex flex-col justify-center space-y-8">
              <RevealSection delay={0.1}>
                <p className="text-[10px] tracking-[0.12em] uppercase text-gik-stone/50 font-body font-medium mb-6">
                  Craft & Mission
                </p>
                <p className="text-lg text-gik-void/80 leading-[1.85] font-body">
                  Our workshop in Auroville operates at the intersection of
                  ancient craft and contemporary design. We partner with artisan
                  cooperatives across India — ironworkers in Bastar whose families
                  have forged metal for two thousand years, woodworkers in
                  Saharanpur who can read the grain of a plank the way a musician
                  reads a score, brass casters in Moradabad who transform temple
                  bells into objects of secular devotion. These partnerships are
                  not transactional. They are relationships built on mutual
                  respect, fair compensation, and a shared belief that handcraft
                  is not a relic of the past but a technology of the future.
                </p>
              </RevealSection>

              <RevealSection delay={0.2}>
                <p className="text-lg text-gik-void/80 leading-[1.85] font-body">
                  Every material that enters our workshop carries a biography. We
                  document its origin, its previous life, the journey it took to
                  reach us. This is not marketing. It is accountability — a
                  refusal to participate in the anonymity that allows waste to
                  accumulate unseen. When you hold a GIK product, you hold
                  something that was once part of a ship, a house, a bridge, a
                  ceremony. Its weight is more than physical. It is historical,
                  emotional, and quietly sacred.
                </p>
              </RevealSection>
            </div>
          </div>
        </div>
      </SectionTransition>

      {/* ----------------------------------------------------------------- */}
      {/* Video Section — Full-bleed with clip-path reveal                  */}
      {/* ----------------------------------------------------------------- */}
      <SectionTransition type="clip" className="content-auto">
        <div className="relative overflow-hidden bg-gik-void">
          <video
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            className="w-full aspect-video object-cover"
            poster="https://images.unsplash.com/photo-1510133768164-a8f7e4d4e3dc?w=1920&q=80"
          >
            <source
              src="https://cdn.coverr.co/videos/coverr-woodworker-carefully-sanding-a-piece-of-wood-5765/1080p.mp4"
              type="video/mp4"
            />
          </video>

          <div className="absolute inset-0 bg-gik-void/20" />

          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-[10px] tracking-[0.25em] uppercase text-gik-canvas/60 font-body font-medium">
              The Making
            </p>
          </div>
        </div>
      </SectionTransition>

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
        <div className="max-w-3xl mx-auto space-y-8">
          <RevealSection>
            <p className="text-lg text-gik-void/80 leading-[1.85] font-body">
              We design for the long arc. Every GIK object is made to be used
              daily, to age gracefully, to become more beautiful with time
              rather than less. We reject the logic of planned obsolescence —
              the idea that objects should be consumed and replaced, feeding a
              cycle that fills landfills and empties meaning. Instead, we design
              for inheritance. The desk organiser you place on your table today
              should be the one your daughter places on hers twenty years from
              now, its patina deepened, its story extended.
            </p>
          </RevealSection>

          <RevealSection delay={0.1}>
            <p className="text-lg text-gik-void/80 leading-[1.85] font-body">
              This is our promise: that every object bearing the GIK mark has
              been made with reverence — for the material, for the maker, and
              for you. We do not mass-produce. We do not cut corners. We do not
              pretend that convenience is more important than conscience. We
              simply make things that are kind — to the earth, to the hands
              that shape them, and to the homes that receive them.
            </p>
          </RevealSection>
        </div>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Timeline — Parallax scroll-driven milestones                      */}
      {/* ----------------------------------------------------------------- */}
      <div
        className="bg-gik-linen content-auto"
        style={{
          paddingTop: "var(--space-section)",
          paddingBottom: "var(--space-section)",
        }}
      >
        <div className="page-pad">
          <RevealSection className="text-center mb-20">
            <p className="text-[10px] tracking-[0.2em] uppercase text-gik-stone/50 font-body font-medium mb-5">
              Our Journey
            </p>
            <h2
              className="font-display font-light text-gik-void"
              style={{ fontSize: "clamp(1.8rem, 3vw, 2.5rem)" }}
            >
              A timeline of intention
            </h2>
          </RevealSection>

          <div ref={timelineRef} className="relative max-w-4xl mx-auto">
            {/* Center vertical line */}
            <div className="absolute left-1/2 top-0 bottom-0 w-px -translate-x-1/2">
              <div className="absolute inset-0 bg-gik-stone/15" />
              <div
                ref={timelineLineRef}
                className="absolute inset-0 bg-gik-gold/60 origin-top"
                style={{ transform: "scaleY(0)" }}
              />
            </div>

            {/* Milestone items */}
            <div className="space-y-16 md:space-y-24">
              {milestones.map((milestone, i) => (
                <div
                  key={milestone.year}
                  className={cn(
                    "milestone-item relative grid grid-cols-[auto_1fr] md:grid-cols-[1fr_auto_1fr] gap-4 md:gap-10 items-start md:items-center opacity-0",
                  )}
                >
                  {/* Left content (even items) or empty — hidden on mobile */}
                  <div className={cn("text-right hidden md:block", i % 2 !== 0 && "md:invisible")}>
                    {i % 2 === 0 && (
                      <div>
                        <p className="font-display text-gik-gold text-sm tracking-[0.1em] mb-2">
                          {milestone.year}
                        </p>
                        <h3 className="font-display text-h3 font-light text-gik-void mb-2">
                          {milestone.title}
                        </h3>
                        <p className="text-sm text-gik-stone leading-relaxed font-body">
                          {milestone.description}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Center dot */}
                  <div className="relative z-10 w-3 h-3 rounded-full bg-gik-gold ring-4 ring-gik-linen flex-shrink-0 mt-1 md:mt-0" />

                  {/* Right content (odd items) or empty — hidden on mobile */}
                  <div className={cn("text-left hidden md:block", i % 2 === 0 && "md:invisible")}>
                    {i % 2 !== 0 && (
                      <div>
                        <p className="font-display text-gik-gold text-sm tracking-[0.1em] mb-2">
                          {milestone.year}
                        </p>
                        <h3 className="font-display text-h3 font-light text-gik-void mb-2">
                          {milestone.title}
                        </h3>
                        <p className="text-sm text-gik-stone leading-relaxed font-body">
                          {milestone.description}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Mobile content — always visible on mobile, hidden on desktop */}
                  <div className="md:hidden text-left">
                    <p className="font-display text-gik-gold text-sm tracking-[0.1em] mb-2">
                      {milestone.year}
                    </p>
                    <h3 className="font-display text-h3 font-light text-gik-void mb-2">
                      {milestone.title}
                    </h3>
                    <p className="text-sm text-gik-stone leading-relaxed font-body">
                      {milestone.description}
                    </p>
                  </div>

                  {/* Mobile: show content on right always */}
                  <div className={cn("col-span-3 md:hidden text-left pl-8", i % 2 === 0 && "hidden")}>
                    {/* Already shown above for even items on mobile */}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Values Section — Dark background, 3-column grid                   */}
      {/* ----------------------------------------------------------------- */}
      <div
        className="bg-gik-void content-auto"
        style={{
          paddingTop: "var(--space-section)",
          paddingBottom: "var(--space-section)",
        }}
      >
        <div className="page-pad">
          <RevealSection className="text-center mb-20">
            <p className="text-[10px] tracking-[0.2em] uppercase text-gik-stone/50 font-body font-medium mb-5">
              Our Values
            </p>
            <h2
              className="font-display font-light text-gik-canvas"
              style={{ fontSize: "clamp(1.8rem, 3vw, 2.5rem)" }}
            >
              What we stand for
            </h2>
          </RevealSection>

          <div
            ref={valuesRef}
            className="grid grid-cols-1 md:grid-cols-3 gap-16 md:gap-10 lg:gap-16"
            style={{ perspective: "800px" }}
          >
            {values.map((value) => (
              <div
                key={value.title}
                className="value-card opacity-0"
              >
                {/* Gold accent line */}
                <div className="w-10 h-px bg-gik-gold mb-8" />

                <h3 className="font-display text-h3 font-light text-gik-canvas mb-4">
                  {value.title}
                </h3>
                <p className="text-sm text-gik-stone leading-[1.8] font-body">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
