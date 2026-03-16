"use client";

import { useEffect, useRef, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface JournalArticleClientProps {
  children: ReactNode;
}

export function JournalArticleClient({ children }: JournalArticleClientProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;

    const ctx = gsap.context(() => {
      // Reading progress bar — scrubbed scaleX
      gsap.to(".reading-progress", {
        scaleX: 1,
        ease: "none",
        scrollTrigger: {
          trigger: el,
          start: "top top",
          end: "bottom bottom",
          scrub: 1,
        },
      });

      // Parallax hero image
      const heroInner = el.querySelector(".hero-image-inner");
      if (heroInner) {
        gsap.fromTo(
          heroInner,
          { yPercent: -8 },
          {
            yPercent: 8,
            ease: "none",
            scrollTrigger: {
              trigger: ".hero-image-wrap",
              start: "top bottom",
              end: "bottom top",
              scrub: 1,
            },
          }
        );
      }

      // Article header fade-in
      gsap.fromTo(
        ".article-header",
        { opacity: 0, y: 24 },
        {
          opacity: 1,
          y: 0,
          duration: 0.7,
          ease: "expo.out",
          scrollTrigger: {
            trigger: ".article-header",
            start: "top 85%",
            once: true,
          },
        }
      );

      // Paragraph-by-paragraph fade-up
      const paragraphs = el.querySelectorAll(".article-paragraph");
      paragraphs.forEach((p) => {
        gsap.to(p, {
          opacity: 1,
          y: 0,
          duration: 0.6,
          ease: "expo.out",
          scrollTrigger: {
            trigger: p,
            start: "top 88%",
            once: true,
          },
        });
      });

      // Related cards stagger
      const cards = el.querySelectorAll(".related-card");
      if (cards.length > 0) {
        gsap.to(cards, {
          opacity: 1,
          y: 0,
          duration: 0.7,
          ease: "expo.out",
          stagger: 0.1,
          scrollTrigger: {
            trigger: cards[0],
            start: "top 85%",
            once: true,
          },
        });
      }
    }, el);

    return () => ctx.revert();
  }, []);

  return <div ref={wrapperRef}>{children}</div>;
}
