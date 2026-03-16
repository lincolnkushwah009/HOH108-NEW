"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const testimonials = [
  {
    quote:
      "The reclaimed teak panel GIK created for our living room is absolutely breathtaking. Every guest asks about it — it's become the soul of our home.",
    name: "Priya Mehta",
    role: "Homeowner, Mumbai",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&q=80",
    rating: 5,
  },
  {
    quote:
      "Working with GIK on our meditation room was transformative. The Vaastu-aligned objects they crafted brought a sense of peace we didn't know was missing.",
    name: "Arjun Kapoor",
    role: "Architect, Bangalore",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&q=80",
    rating: 5,
  },
  {
    quote:
      "As an interior designer, I recommend GIK to every client who values sustainability. Their utility collection is the perfect marriage of form and purpose.",
    name: "Sneha Reddy",
    role: "Interior Designer, Hyderabad",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&q=80",
    rating: 5,
  },
  {
    quote:
      "The brass pen holder and desk organiser from GIK Utility sit on my desk every day. Minimal, purposeful, beautiful — exactly what functional design should be.",
    name: "Rohan Desai",
    role: "Creative Director, Pune",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&q=80",
    rating: 5,
  },
];

export default function Testimonials() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".test-header",
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
        ".test-card",
        { y: 50, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.7,
          ease: "expo.out",
          stagger: 0.1,
          scrollTrigger: { trigger: ".test-track", start: "top 80%", once: true },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="py-[var(--space-section)] content-auto bg-gik-canvas overflow-hidden">
      <div className="page-pad max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="mb-10 md:mb-16">
          <span className="test-header section-pill mb-6 inline-block opacity-0">Testimonials</span>
          <h2 className="test-header font-display text-h1 font-medium text-gik-void uppercase tracking-[-0.01em] opacity-0">
            What Our Clients
            <br className="hidden md:block" /> Say About Us
          </h2>
          <p className="test-header mt-4 text-gik-stone max-w-xl text-[14px] md:text-[15px] leading-relaxed opacity-0">
            Hear from homeowners, designers, and architects who have experienced the GIK difference.
          </p>
        </div>
      </div>

      {/* Horizontal swipeable track */}
      <div
        className="test-track flex gap-4 md:gap-6 overflow-x-auto pb-6 no-scrollbar snap-x snap-mandatory pl-[var(--space-page)]"
        data-lenis-prevent
        style={{ WebkitOverflowScrolling: "touch", touchAction: "pan-x" }}
      >
        {testimonials.map((t) => (
          <div
            key={t.name}
            className="test-card shrink-0 snap-start card-bordered p-6 md:p-8 flex flex-col justify-between opacity-0"
            style={{ width: "min(85vw, 480px)", minHeight: 280 }}
          >
            {/* Stars */}
            <div>
              <div className="flex items-center gap-0.5 mb-4">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <span key={i} className="text-gik-gold text-[14px]">★</span>
                ))}
              </div>
              <p className="text-gik-void text-[15px] leading-relaxed italic font-body">
                &ldquo;{t.quote}&rdquo;
              </p>
            </div>

            {/* Author */}
            <div className="flex items-center gap-3 mt-6 pt-5 border-t border-gik-void/[0.06]">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-gik-linen flex-shrink-0">
                <Image
                  src={t.avatar}
                  alt={t.name}
                  width={40}
                  height={40}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <p className="text-[13px] font-medium text-gik-void">{t.name}</p>
                <p className="text-[12px] text-gik-stone">{t.role}</p>
              </div>
            </div>
          </div>
        ))}
        {/* End spacer */}
        <div className="shrink-0 w-[var(--space-page)]" />
      </div>
    </section>
  );
}
