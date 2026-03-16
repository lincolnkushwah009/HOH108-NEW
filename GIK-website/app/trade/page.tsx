"use client";

import { useState, useRef, useEffect, type ChangeEvent, type FormEvent } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Image from "next/image";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

gsap.registerPlugin(ScrollTrigger);

// ---------------------------------------------------------------------------
// Easing
// ---------------------------------------------------------------------------

const EASE_OUT_EXPO = "expo.out";

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const benefits = [
  "Trade pricing -- 20% below retail on all collections",
  "Priority access to new collections before public release",
  "Custom order capabilities for bespoke client projects",
  "Dedicated account manager for seamless project coordination",
  "Complimentary project consultation and material sourcing",
];

const projectTypes = [
  "Residential Interior Design",
  "Commercial Spaces",
  "Hospitality & Hotels",
  "Retail & Showroom",
  "Architectural Restoration",
  "Other",
];

// ---------------------------------------------------------------------------
// Trade Program Page
// ---------------------------------------------------------------------------

export default function TradePage() {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    companyName: "",
    yourName: "",
    email: "",
    phone: "",
    portfolioUrl: "",
    projectType: "",
    annualVolume: "",
  });

  // Refs
  const heroRef = useRef<HTMLDivElement>(null);
  const heroImageRef = useRef<HTMLDivElement>(null);
  const heroSubtitleRef = useRef<HTMLParagraphElement>(null);
  const heroTitleRef = useRef<HTMLHeadingElement>(null);
  const heroTaglineRef = useRef<HTMLParagraphElement>(null);

  const benefitsRef = useRef<HTMLDivElement>(null);
  const benefitsItemsRef = useRef<HTMLUListElement>(null);

  const formRef = useRef<HTMLDivElement>(null);
  const formContentRef = useRef<HTMLDivElement>(null);
  const successRef = useRef<HTMLDivElement>(null);
  const successCircleRef = useRef<HTMLDivElement>(null);
  const successCheckRef = useRef<HTMLDivElement>(null);

  // ── Hero parallax + text entrance ──
  useEffect(() => {
    const ctx = gsap.context(() => {
      // Parallax on the hero image wrapper
      if (heroImageRef.current && heroRef.current) {
        gsap.to(heroImageRef.current, {
          yPercent: 25,
          ease: "none",
          scrollTrigger: {
            trigger: heroRef.current,
            start: "top top",
            end: "bottom top",
            scrub: true,
          },
        });
      }

      // Hero text entrance timeline
      const tl = gsap.timeline({ defaults: { ease: EASE_OUT_EXPO } });

      if (heroSubtitleRef.current) {
        gsap.set(heroSubtitleRef.current, { opacity: 0, y: 12 });
        tl.to(heroSubtitleRef.current, { opacity: 1, y: 0, duration: 0.6 }, 0.1);
      }

      if (heroTitleRef.current) {
        gsap.set(heroTitleRef.current, { opacity: 0, y: 30 });
        tl.to(heroTitleRef.current, { opacity: 1, y: 0, duration: 0.9 }, 0);
      }

      if (heroTaglineRef.current) {
        gsap.set(heroTaglineRef.current, { opacity: 0, y: 12 });
        tl.to(heroTaglineRef.current, { opacity: 1, y: 0, duration: 0.6 }, 0.3);
      }
    });

    return () => ctx.revert();
  }, []);

  // ── Benefits section scroll-triggered entrance ──
  useEffect(() => {
    const ctx = gsap.context(() => {
      if (benefitsRef.current) {
        gsap.set(benefitsRef.current, { opacity: 0, y: 40 });
        gsap.to(benefitsRef.current, {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: EASE_OUT_EXPO,
          scrollTrigger: {
            trigger: benefitsRef.current,
            start: "top bottom-=80",
            once: true,
          },
        });
      }

      if (benefitsItemsRef.current) {
        const items = benefitsItemsRef.current.querySelectorAll("li");
        gsap.set(items, { opacity: 0, x: -16 });
        gsap.to(items, {
          opacity: 1,
          x: 0,
          duration: 0.6,
          ease: EASE_OUT_EXPO,
          stagger: 0.1,
          delay: 0.2,
          scrollTrigger: {
            trigger: benefitsRef.current,
            start: "top bottom-=80",
            once: true,
          },
        });
      }
    });

    return () => ctx.revert();
  }, []);

  // ── Form section scroll-triggered entrance ──
  useEffect(() => {
    const ctx = gsap.context(() => {
      if (formRef.current) {
        gsap.set(formRef.current, { opacity: 0, y: 40 });
        gsap.to(formRef.current, {
          opacity: 1,
          y: 0,
          duration: 0.8,
          delay: 0.15,
          ease: EASE_OUT_EXPO,
          scrollTrigger: {
            trigger: formRef.current,
            start: "top bottom-=80",
            once: true,
          },
        });
      }
    });

    return () => ctx.revert();
  }, []);

  // ── Success state entrance animation ──
  useEffect(() => {
    if (!submitted) return;

    const ctx = gsap.context(() => {
      // Fade out form, then animate success in
      if (formContentRef.current) {
        gsap.to(formContentRef.current, {
          opacity: 0,
          y: -20,
          duration: 0.3,
          ease: EASE_OUT_EXPO,
        });
      }

      // Small delay so the form exit finishes first
      if (successRef.current) {
        gsap.fromTo(
          successRef.current,
          { opacity: 0, y: 24 },
          { opacity: 1, y: 0, duration: 0.7, delay: 0.35, ease: EASE_OUT_EXPO }
        );
      }

      if (successCircleRef.current) {
        gsap.fromTo(
          successCircleRef.current,
          { scale: 0 },
          {
            scale: 1,
            duration: 0.5,
            delay: 0.55,
            ease: "back.out(3)",
          }
        );
      }

      if (successCheckRef.current) {
        gsap.fromTo(
          successCheckRef.current,
          { opacity: 0 },
          { opacity: 1, duration: 0.3, delay: 0.85 }
        );
      }
    });

    return () => ctx.revert();
  }, [submitted]);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <section className="min-h-screen bg-gik-canvas">
      {/* -- Cinematic Hero -- */}
      <div
        ref={heroRef}
        className="relative h-[70vh] overflow-hidden flex items-end"
      >
        {/* Parallax Background */}
        <div ref={heroImageRef} className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1920&q=80"
            alt="Luxury interior design space"
            fill
            sizes="100vw"
            className="object-cover scale-110"
            priority
            quality={90}
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-gik-void/70 via-gik-void/30 to-transparent" />

        {/* Bottom-left aligned content */}
        <div className="relative z-10 page-pad pb-14 md:pb-20 w-full">
          <p
            ref={heroSubtitleRef}
            className="text-[10px] tracking-[0.12em] uppercase text-gik-canvas/50 font-body font-medium mb-5"
          >
            Exclusive Access
          </p>
          <h1
            ref={heroTitleRef}
            className="font-display text-display font-light text-gik-canvas mb-4 max-w-3xl"
          >
            The GIK Trade Program
          </h1>
          <p
            ref={heroTaglineRef}
            className="font-display italic text-lg md:text-xl text-gik-canvas/70"
          >
            For Architects &amp; Interior Designers
          </p>
        </div>
      </div>

      {/* -- Benefits + Application Form -- */}
      <div
        className="page-pad"
        style={{
          paddingTop: "var(--space-section)",
          paddingBottom: "var(--space-section)",
        }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 lg:gap-32">
          {/* -- Left: Editorial Benefits -- */}
          <div ref={benefitsRef}>
            <p className="text-[10px] tracking-[0.12em] uppercase text-gik-stone/50 font-body font-medium mb-8">
              Benefits
            </p>
            <h2 className="font-display text-h2 font-light text-gik-void mb-10">
              Designed for those who
              <br />
              design for others
            </h2>
            <p className="font-body text-sm text-gik-stone leading-relaxed mb-14 max-w-md">
              The GIK Trade Program grants architects, interior designers, and
              design professionals exclusive access to our full catalogue at
              preferred pricing, along with services crafted to support your
              creative vision.
            </p>

            <ul ref={benefitsItemsRef} className="space-y-6">
              {benefits.map((benefit, index) => (
                <li key={index} className="flex items-start gap-5">
                  <span className="w-6 h-px bg-gik-gold mt-2.5 shrink-0" />
                  <span className="font-body text-sm text-gik-void leading-relaxed">
                    {benefit}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* -- Right: Application Form -- */}
          <div ref={formRef}>
            {!submitted ? (
              <div ref={formContentRef}>
                <p className="text-[10px] tracking-[0.12em] uppercase text-gik-stone/50 font-body font-medium mb-10">
                  Apply for Trade Access
                </p>
                <form onSubmit={handleSubmit} className="space-y-7">
                  <Input
                    label="Company Name"
                    name="companyName"
                    required
                    value={formData.companyName}
                    onChange={handleChange}
                  />
                  <Input
                    label="Your Name"
                    name="yourName"
                    required
                    value={formData.yourName}
                    onChange={handleChange}
                  />
                  <Input
                    label="Email Address"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                  />
                  <Input
                    label="Phone Number"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                  />
                  <Input
                    label="Portfolio URL"
                    name="portfolioUrl"
                    type="url"
                    value={formData.portfolioUrl}
                    onChange={handleChange}
                  />

                  {/* Project Type Select */}
                  <div className="relative">
                    <select
                      name="projectType"
                      value={formData.projectType}
                      onChange={handleChange}
                      className={cn(
                        "w-full h-14 bg-transparent border-0 border-b px-0 pt-5 pb-2",
                        "font-body text-sm text-gik-void",
                        "outline-none transition-colors duration-300 appearance-none cursor-pointer",
                        "border-gik-stone focus:border-gik-void",
                        !formData.projectType && "text-transparent"
                      )}
                    >
                      <option value="" disabled>
                        Select project type
                      </option>
                      {projectTypes.map((type) => (
                        <option
                          key={type}
                          value={type}
                          className="text-gik-void"
                        >
                          {type}
                        </option>
                      ))}
                    </select>
                    <label
                      className={cn(
                        "absolute left-0 font-body transition-all duration-300 pointer-events-none",
                        formData.projectType
                          ? "top-1 text-[10px] tracking-[0.1em] uppercase text-gik-void"
                          : "top-1/2 -translate-y-1/2 text-sm text-gik-stone"
                      )}
                    >
                      Project Type
                    </label>
                    <svg
                      className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 text-gik-stone pointer-events-none"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.5}
                    >
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </div>

                  <Input
                    label="Estimated Annual Volume (INR)"
                    name="annualVolume"
                    value={formData.annualVolume}
                    onChange={handleChange}
                  />

                  <div className="pt-8">
                    <Button type="submit" className="w-full rounded-full">
                      Submit Application
                    </Button>
                  </div>
                </form>
              </div>
            ) : (
              <div
                ref={successRef}
                className="flex flex-col items-center justify-center text-center py-24"
                style={{ opacity: 0 }}
              >
                {/* Animated gold checkmark circle */}
                <div
                  ref={successCircleRef}
                  className="w-16 h-16 rounded-full border border-gik-gold flex items-center justify-center mb-8"
                  style={{ transform: "scale(0)" }}
                >
                  <div ref={successCheckRef} style={{ opacity: 0 }}>
                    <Check
                      className="w-7 h-7 text-gik-gold"
                      strokeWidth={1.5}
                    />
                  </div>
                </div>
                <h3 className="font-display text-h2 font-light text-gik-void mb-4">
                  Application Received
                </h3>
                <p className="font-body text-sm text-gik-stone leading-relaxed max-w-sm">
                  Thank you for your interest in the GIK Trade Program. Our
                  team will review your application and respond within 48
                  hours.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
