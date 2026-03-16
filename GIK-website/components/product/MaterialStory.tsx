"use client";

import { useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Container, SectionHeading } from "@/components/ui";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface MaterialStoryProps {
  material: string;
  origin: string;
  productName: string;
  longDescription: string;
}

const materialTextureImage =
  "https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=800&q=80";

export default function MaterialStory({
  material,
  origin,
  productName,
  longDescription,
}: MaterialStoryProps) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const wordsRef = useRef<(HTMLSpanElement | null)[]>([]);

  const descriptionWords = longDescription.split(" ");

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Deep parallax on material image (yPercent -15 to +15)
      if (imageRef.current) {
        gsap.fromTo(
          imageRef.current,
          { yPercent: -15 },
          {
            yPercent: 15,
            ease: "none",
            scrollTrigger: {
              trigger: sectionRef.current,
              start: "top bottom",
              end: "bottom top",
              scrub: 1,
            },
          }
        );
      }

      // Word-by-word origin text reveal (scrubbed opacity + scale)
      wordsRef.current.filter(Boolean).forEach((word, i) => {
        gsap.fromTo(
          word,
          { opacity: 0.1, scale: 0.95 },
          {
            opacity: 1,
            scale: 1,
            ease: "none",
            scrollTrigger: {
              trigger: sectionRef.current,
              start: () => `top+=${i * 15 + 100} center`,
              end: () => `top+=${i * 15 + 140} center`,
              scrub: 1,
            },
          }
        );
      });

      // Image clip-path reveal on scroll
      const imageOuter = sectionRef.current?.querySelector(".material-image-outer");
      if (imageOuter) {
        gsap.fromTo(
          imageOuter,
          { clipPath: "inset(8% 4%)" },
          {
            clipPath: "inset(0% 0%)",
            ease: "none",
            scrollTrigger: {
              trigger: imageOuter,
              start: "top 85%",
              end: "top 50%",
              scrub: 1,
            },
          }
        );
      }

      // Spec rows stagger entrance with slide from left
      const specs = sectionRef.current?.querySelectorAll(".spec-row");
      if (specs) {
        gsap.fromTo(
          specs,
          { y: 20, x: -15, opacity: 0 },
          {
            y: 0,
            x: 0,
            opacity: 1,
            duration: 0.7,
            ease: "expo.out",
            stagger: 0.12,
            scrollTrigger: {
              trigger: textRef.current,
              start: "top 75%",
              once: true,
            },
          }
        );
      }

      // Title entrance
      const title = textRef.current?.querySelector(".material-section-title");
      if (title) {
        gsap.fromTo(
          title,
          { opacity: 0, y: 20 },
          {
            opacity: 1,
            y: 0,
            duration: 0.7,
            ease: "expo.out",
            scrollTrigger: {
              trigger: textRef.current,
              start: "top 80%",
              once: true,
            },
          }
        );
      }
    }, sectionRef);

    return () => ctx.revert();
  }, [descriptionWords.length]);

  return (
    <section ref={sectionRef} className="py-24 content-auto">
      <Container>
        <SectionHeading title="THE MATERIAL" align="left" />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">
          {/* Left: Material texture image with deep parallax + clip reveal */}
          <div className="material-image-outer relative aspect-square bg-gik-linen overflow-hidden" style={{ clipPath: "inset(8% 4%)" }}>
            <div ref={imageRef} className="absolute inset-[-15%] will-change-transform">
              <Image
                src={materialTextureImage}
                alt={`Material texture for ${productName} - ${material}`}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>

            <div className="absolute inset-0 bg-gradient-to-t from-gik-void/30 to-transparent" />
            <div className="absolute bottom-6 left-6">
              <span className="text-[10px] tracking-[0.2em] uppercase text-white/70 font-body font-medium">
                Material Detail
              </span>
            </div>
          </div>

          {/* Right: Word-by-word reveal + specs */}
          <div ref={textRef} className="flex flex-col justify-center">
            <h3 className="material-section-title font-display text-h3 font-light text-gik-void mb-6 opacity-0">
              The Story Behind {productName}
            </h3>

            {/* Word-by-word scrubbed opacity */}
            <p className="font-body text-base text-gik-void/80 leading-[1.8] mb-10 flex flex-wrap gap-x-[0.25em]">
              {descriptionWords.map((word, i) => (
                <span
                  key={i}
                  ref={(el) => { wordsRef.current[i] = el; }}
                  className="inline-block"
                  style={{ opacity: 0.1, transform: "scale(0.95)" }}
                >
                  {word}
                </span>
              ))}
            </p>

            {/* Material specs list */}
            <div className="space-y-0">
              {[
                { label: "Material", value: material },
                { label: "Origin", value: origin },
                { label: "Process", value: "Handcrafted by traditional artisans" },
              ].map((spec, index) => (
                <div
                  key={spec.label}
                  className={cn(
                    "spec-row flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4 py-4 opacity-0",
                    index < 2 && "border-b border-gik-linen"
                  )}
                >
                  <span className="text-caption text-gik-stone font-body font-medium w-24 flex-shrink-0">
                    {spec.label}
                  </span>
                  <span className="text-sm text-gik-void/80 font-body leading-relaxed">
                    {spec.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

export { MaterialStory };
