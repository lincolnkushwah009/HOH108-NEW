"use client";

import { useEffect, useRef, createElement } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { flashReveal } from "@/lib/animations";

gsap.registerPlugin(ScrollTrigger);

interface FlashRevealProps {
  children: string;
  as?: "h1" | "h2" | "h3" | "h4" | "p" | "span" | "div";
  className?: string;
  delay?: number;
  stagger?: number;
  scrollTrigger?: boolean;
  triggerStart?: string;
}

export default function FlashReveal({
  children,
  as: tag = "span",
  className = "",
  delay = 0,
  stagger = 0.04,
  scrollTrigger: useScrollTrigger = true,
  triggerStart = "top 80%",
}: FlashRevealProps) {
  const containerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const ctx = gsap.context(() => {
      const scrollTriggerConfig = useScrollTrigger
        ? {
            trigger: container,
            start: triggerStart,
            once: true,
          }
        : undefined;

      flashReveal(container, {
        delay,
        stagger,
        scrollTrigger: scrollTriggerConfig,
      });
    }, container);

    return () => ctx.revert();
  }, [delay, stagger, useScrollTrigger, triggerStart]);

  // Split into words first, then characters within each word.
  // Words are wrapped in inline-flex spans so the browser only
  // line-breaks between words — never mid-word.
  const words = children.split(" ");

  const wordElements = words.map((word, wi) => {
    const charSpans = word.split("").map((char, ci) =>
      createElement(
        "span",
        {
          key: `${wi}-${ci}`,
          className: "flash-char inline-block opacity-0",
          style: { willChange: "transform, opacity, color" },
        },
        char
      )
    );

    // Each word is an inline-flex container so chars stay together
    const wordSpan = createElement(
      "span",
      { key: `w${wi}`, className: "inline-flex" },
      ...charSpans
    );

    // Add a space between words (except after last word)
    if (wi < words.length - 1) {
      const space = createElement(
        "span",
        {
          key: `s${wi}`,
          className: "flash-char inline-block opacity-0",
          style: { willChange: "transform, opacity, color" },
        },
        "\u00A0"
      );
      return [wordSpan, space];
    }

    return [wordSpan];
  });

  return createElement(
    tag,
    { ref: containerRef, className, style: { flexWrap: "wrap" } as React.CSSProperties },
    ...wordElements.flat()
  );
}

export { FlashReveal };
