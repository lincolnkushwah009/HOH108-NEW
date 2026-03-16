import gsap from "gsap";

// ═══════════════════════════════════════════════════════════
//   GOD IS KIND — Unified Animation Language
//   Reusable GSAP helpers for the cinematic redesign
// ═══════════════════════════════════════════════════════════

interface FlashRevealOptions {
  delay?: number;
  stagger?: number;
  duration?: number;
  goldColor?: string;
  finalColor?: string;
  scrollTrigger?: ScrollTrigger.Vars;
}

interface LineRevealOptions {
  delay?: number;
  stagger?: number;
  duration?: number;
  scrollTrigger?: ScrollTrigger.Vars;
}

interface ScaleEntranceOptions {
  delay?: number;
  stagger?: number;
  duration?: number;
  fromScale?: number;
  scrollTrigger?: ScrollTrigger.Vars;
}

interface Perspective3DEntranceOptions {
  delay?: number;
  stagger?: number;
  duration?: number;
  rotateX?: number;
  fromScale?: number;
  scrollTrigger?: ScrollTrigger.Vars;
}

/**
 * flashReveal — Character color flash reveal
 * Inspired by fourmula.ai: chars animate in with gold color burst, then settle to inherited color
 */
export function flashReveal(
  container: HTMLElement | null,
  options: FlashRevealOptions = {}
): gsap.core.Timeline | null {
  if (!container) return null;

  const chars = container.querySelectorAll(".flash-char");
  if (chars.length === 0) return null;

  const {
    delay = 0,
    stagger = 0.04,
    duration = 0.3,
    goldColor = "#b89d6f",
    finalColor = "inherit",
    scrollTrigger,
  } = options;

  const tl = gsap.timeline({ delay, scrollTrigger });

  // Phase 1: Chars slide up with gold color
  tl.fromTo(
    chars,
    { opacity: 0, yPercent: 40, color: goldColor },
    {
      opacity: 1,
      yPercent: 0,
      color: goldColor,
      duration,
      stagger,
      ease: "expo.out",
    }
  );

  // Phase 2: Color settles from gold to final (inherit)
  tl.to(
    chars,
    {
      color: finalColor,
      duration: 0.36,
      stagger: stagger * 0.5,
      ease: "power2.out",
    },
    `-=${duration * 0.3}`
  );

  return tl;
}

/**
 * lineReveal — Line-by-line overflow clip reveal
 * Inspired by PROPS/Studio Lumio: lines slide up from overflow-hidden wrappers
 */
export function lineReveal(
  lines: NodeListOf<Element> | Element[] | HTMLElement | null,
  options: LineRevealOptions = {}
): gsap.core.Tween | null {
  if (!lines) return null;

  const elements =
    lines instanceof HTMLElement
      ? lines.querySelectorAll(".line-reveal > *")
      : lines;

  if (!elements || (elements as NodeListOf<Element>).length === 0) return null;

  const {
    delay = 0,
    stagger = 0.12,
    duration = 0.85,
    scrollTrigger,
  } = options;

  return gsap.fromTo(
    elements,
    { yPercent: 110 },
    {
      yPercent: 0,
      duration,
      stagger,
      ease: "expo.out",
      delay,
      scrollTrigger,
    }
  );
}

/**
 * scaleEntrance — Scale up reveal (replaces generic fade-up)
 * Inspired by joinflowparty.com: bold scale-up entrances
 */
export function scaleEntrance(
  elements: gsap.TweenTarget,
  options: ScaleEntranceOptions = {}
): gsap.core.Tween | null {
  if (!elements) return null;

  const {
    delay = 0,
    stagger = 0,
    duration = 0.85,
    fromScale = 0.85,
    scrollTrigger,
  } = options;

  return gsap.fromTo(
    elements,
    { scale: fromScale, opacity: 0 },
    {
      scale: 1,
      opacity: 1,
      duration,
      stagger,
      ease: "expo.out",
      delay,
      scrollTrigger,
    }
  );
}

/**
 * perspective3DEntrance — 3D card grid entrance with rotateX
 * Inspired by fourmula.ai: 3D perspective scroll cards
 */
export function perspective3DEntrance(
  cards: gsap.TweenTarget,
  options: Perspective3DEntranceOptions = {}
): gsap.core.Tween | null {
  if (!cards) return null;

  const {
    delay = 0,
    stagger = 0.12,
    duration = 0.85,
    rotateX = -15,
    fromScale = 0.9,
    scrollTrigger,
  } = options;

  return gsap.fromTo(
    cards,
    { rotateX, scale: fromScale, opacity: 0 },
    {
      rotateX: 0,
      scale: 1,
      opacity: 1,
      duration,
      stagger,
      ease: "expo.out",
      delay,
      scrollTrigger,
    }
  );
}

/**
 * splitIntoChars — Utility to split a string into .flash-char span HTML
 */
export function splitIntoChars(text: string): string {
  return text
    .split("")
    .map(
      (char) =>
        `<span class="flash-char">${char === " " ? "&nbsp;" : char}</span>`
    )
    .join("");
}
