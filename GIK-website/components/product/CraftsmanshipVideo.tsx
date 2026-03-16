"use client";

import { useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Container } from "@/components/ui/Container";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { scaleEntrance, lineReveal } from "@/lib/animations";

gsap.registerPlugin(ScrollTrigger);

interface CraftsmanshipVideoProps {
  productName: string;
}

export default function CraftsmanshipVideo({
  productName,
}: CraftsmanshipVideoProps) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const videoWrapRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  // titleLine and divider refs removed — using lineReveal pattern now

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Clip-path expand: inset(10%) → inset(0%) scrubbed on scroll
      if (videoWrapRef.current) {
        gsap.fromTo(
          videoWrapRef.current,
          { clipPath: "inset(10%)" },
          {
            clipPath: "inset(0%)",
            ease: "none",
            scrollTrigger: {
              trigger: sectionRef.current,
              start: "top bottom",
              end: "top 20%",
              scrub: 1,
            },
          }
        );
      }

      // Video opacity: 0.3→1.0 scrubbed
      const video = videoWrapRef.current?.querySelector("video");
      if (video) {
        gsap.fromTo(
          video,
          { opacity: 0.3 },
          {
            opacity: 1,
            ease: "none",
            scrollTrigger: {
              trigger: sectionRef.current,
              start: "top bottom",
              end: "center center",
              scrub: 1,
            },
          }
        );
      }

      // Content: scale entrance
      if (contentRef.current) {
        scaleEntrance(contentRef.current, {
          fromScale: 0.85,
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 40%",
            once: true,
          },
        });
      }

      // Title lines: lineReveal pattern
      const titleLines = contentRef.current?.querySelectorAll(".line-reveal > *");
      if (titleLines) {
        lineReveal(titleLines, {
          stagger: 0.15,
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 35%",
            once: true,
          },
          delay: 0.2,
        });
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="relative w-full content-auto">
      <div
        ref={videoWrapRef}
        className="relative w-full h-[60vh] min-h-[400px] overflow-hidden bg-gik-void will-change-transform"
        style={{ clipPath: "inset(10%)" }}
      >
        <video
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          className="absolute inset-0 w-full h-full object-cover"
          poster="https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=1920&q=80"
        >
          <source
            src="https://videos.pexels.com/video-files/3125908/3125908-uhd_2560_1440_30fps.mp4"
            type="video/mp4"
          />
        </video>

        <div className="absolute inset-0 bg-gik-void/50" />
        <div className="hero-vignette" />

        <Container className="relative z-10 h-full flex flex-col items-center justify-center text-center">
          <div ref={contentRef} className="opacity-0 will-change-transform">
            <p className="text-[10px] tracking-[0.25em] uppercase text-white/50 font-body font-medium mb-4">
              Craftsmanship
            </p>
            <div className="line-reveal">
              <h2
                className={cn(
                  "font-display text-3xl md:text-4xl lg:text-5xl font-light text-white",
                  "tracking-wide leading-tight"
                )}
                style={{ transform: "translateY(110%)" }}
              >
                The Making of
              </h2>
            </div>
            <div className="line-reveal">
              <h2
                className={cn(
                  "font-display text-3xl md:text-4xl lg:text-5xl font-light text-white/80",
                  "tracking-wide leading-tight mt-1"
                )}
                style={{ transform: "translateY(110%)" }}
              >
                {productName}
              </h2>
            </div>
            <p className="mt-6 text-xs tracking-[0.15em] uppercase text-white/40 font-body max-w-md mx-auto">
              Every piece is handcrafted by traditional artisans using reclaimed materials and time-honoured techniques
            </p>
          </div>
        </Container>
      </div>
    </section>
  );
}

export { CraftsmanshipVideo };
