"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import gsap from "gsap";
import Image from "next/image";
import { ProductCard } from "@/components/ui/ProductCard";
import { Button } from "@/components/ui/Button";
import { products, type Product } from "@/lib/data/products";
import { cn } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";

// ---------------------------------------------------------------------------
// Quiz Data
// ---------------------------------------------------------------------------

interface QuizStep {
  question: string;
  options: string[];
}

const quizSteps: QuizStep[] = [
  {
    question: "Which direction does your main living area face?",
    options: ["North", "East", "South", "West"],
  },
  {
    question: "What energy do you seek?",
    options: [
      "Peace & Meditation",
      "Prosperity & Growth",
      "Creativity & Expression",
      "Protection & Grounding",
    ],
  },
  {
    question: "Which room are you designing for?",
    options: ["Living Room", "Bedroom", "Study / Office", "Entrance / Foyer"],
  },
];

// ---------------------------------------------------------------------------
// Alignment Results
// ---------------------------------------------------------------------------

interface AlignmentResult {
  title: string;
  message: string;
  productIds: string[];
}

function getAlignmentResult(answers: Record<number, string>): AlignmentResult {
  const energy = answers[1] ?? "";
  const room = answers[2] ?? "";

  if (energy === "Peace & Meditation") {
    return {
      title: "The Path of Stillness",
      message:
        "Your space craves tranquility and centred awareness. Objects rooted in sacred geometry and meditative purpose will anchor the energy of your " +
        room.toLowerCase() +
        ", creating a sanctuary that invites inward reflection and deep calm.",
      productIds: ["align-001", "align-002", "align-005", "align-003"],
    };
  }

  if (energy === "Prosperity & Growth") {
    return {
      title: "The Path of Abundance",
      message:
        "Your space calls for objects that channel growth and generous energy. Warm materials, devotional forms, and luminous surfaces will transform your " +
        room.toLowerCase() +
        " into a space where abundance feels not just invited, but inevitable.",
      productIds: ["align-004", "align-006", "align-003", "align-002"],
    };
  }

  if (energy === "Creativity & Expression") {
    return {
      title: "The Path of Expression",
      message:
        "Your space is ready to become a vessel for creative energy. Sculptural forms, dynamic surfaces, and objects that celebrate imperfection will turn your " +
        room.toLowerCase() +
        " into a space where inspiration moves freely and ideas find form.",
      productIds: ["align-005", "align-001", "align-006", "align-002"],
    };
  }

  // Protection & Grounding
  return {
    title: "The Path of Grounding",
    message:
      "Your space needs anchoring — objects that connect earth to intention and create a protective threshold. Dense materials, ritual forms, and objects of daily devotion will transform your " +
      room.toLowerCase() +
      " into a space that feels both sheltered and spiritually alive.",
    productIds: ["align-003", "align-004", "align-001", "align-006"],
  };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AlignmentGuidePage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [showResult, setShowResult] = useState(false);

  // Refs for GSAP animations
  const headerSubtitleRef = useRef<HTMLParagraphElement>(null);
  const headerTitleRef = useRef<HTMLHeadingElement>(null);
  const headerDescRef = useRef<HTMLParagraphElement>(null);
  const stepWrapperRef = useRef<HTMLDivElement>(null);
  const resultWrapperRef = useRef<HTMLDivElement>(null);

  const handleSelect = (option: string) => {
    const newAnswers = { ...answers, [currentStep]: option };
    setAnswers(newAnswers);

    // Short delay for visual feedback before advancing
    setTimeout(() => {
      if (currentStep < quizSteps.length - 1) {
        setCurrentStep(currentStep + 1);
      } else {
        setShowResult(true);
      }
    }, 300);
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleRestart = () => {
    setCurrentStep(0);
    setAnswers({});
    setShowResult(false);
  };

  const result = useMemo(
    () => (showResult ? getAlignmentResult(answers) : null),
    [showResult, answers]
  );

  const recommendedProducts: Product[] = useMemo(() => {
    if (!result) return [];
    return result.productIds
      .map((id) => products.find((p) => p.id === id))
      .filter((p): p is Product => p !== undefined);
  }, [result]);

  // Header entrance animations on mount
  useEffect(() => {
    const ctx = gsap.context(() => {
      if (headerSubtitleRef.current) {
        gsap.fromTo(
          headerSubtitleRef.current,
          { opacity: 0, y: 10 },
          { opacity: 1, y: 0, duration: 0.5, ease: "expo.out" }
        );
      }
      if (headerTitleRef.current) {
        gsap.fromTo(
          headerTitleRef.current,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.8, ease: "expo.out" }
        );
      }
      if (headerDescRef.current) {
        gsap.fromTo(
          headerDescRef.current,
          { opacity: 0, y: 10 },
          { opacity: 1, y: 0, duration: 0.6, delay: 0.2, ease: "expo.out" }
        );
      }
    });

    return () => ctx.revert();
  }, []);

  // Step transition animation when currentStep changes
  useEffect(() => {
    if (!showResult && stepWrapperRef.current) {
      gsap.fromTo(
        stepWrapperRef.current,
        { opacity: 0, x: 40 },
        { opacity: 1, x: 0, duration: 0.4, ease: "expo.out" }
      );
    }
  }, [currentStep, showResult]);

  // Result entrance animation when showResult becomes true
  useEffect(() => {
    if (showResult && resultWrapperRef.current) {
      gsap.fromTo(
        resultWrapperRef.current,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.7, ease: "expo.out" }
      );
    }
  }, [showResult]);

  return (
    <section className="min-h-screen">
      {/* Header with background image */}
      <div className="relative py-24 md:py-32 overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=1920&q=80"
          alt="Serene meditation space"
          fill
          sizes="100vw"
          className="object-cover"
          priority
          quality={80}
        />
        <div className="absolute inset-0 bg-gik-canvas/80" />

        <div className="page-pad relative z-10">
          <div className="text-center">
            <p
              ref={headerSubtitleRef}
              className="text-[10px] tracking-[0.12em] uppercase text-gik-stone/50 font-body font-medium mb-4 opacity-0"
            >
              Experience
            </p>
            <h1
              ref={headerTitleRef}
              className="font-display text-h1 font-light text-gik-void mb-4 opacity-0"
            >
              Spiritual Alignment Guide
            </h1>
            <p
              ref={headerDescRef}
              className="font-display italic text-lg md:text-xl text-gik-stone opacity-0"
            >
              Discover objects that harmonize with your space
            </p>
          </div>
        </div>
      </div>

      <div
        className="page-pad"
        style={{ paddingTop: "var(--space-section)", paddingBottom: "var(--space-section)" }}
      >
        {/* Quiz Area */}
        <div className="max-w-2xl mx-auto">
          {!showResult ? (
            <div ref={stepWrapperRef} key={`step-${currentStep}`}>
              {/* Step Indicator */}
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  {currentStep > 0 && (
                    <button
                      onClick={handleBack}
                      className="flex items-center gap-2 font-body text-xs tracking-[0.05em] text-gik-stone hover:text-gik-void transition-colors duration-300"
                    >
                      <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
                      <span>Back</span>
                    </button>
                  )}
                </div>
                <p className="font-body text-xs tracking-[0.1em] text-gik-stone uppercase">
                  Step {currentStep + 1} of {quizSteps.length}
                </p>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-px bg-gik-stone/20 mb-12 relative">
                <div
                  className="absolute top-0 left-0 h-full bg-gik-gold transition-all duration-500 ease-out"
                  style={{
                    width: `${((currentStep + 1) / quizSteps.length) * 100}%`,
                  }}
                />
              </div>

              {/* Question */}
              <h2 className="font-display text-h2 font-light text-gik-void text-center mb-12">
                {quizSteps[currentStep].question}
              </h2>

              {/* Options - 2x2 Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {quizSteps[currentStep].options.map((option) => {
                  const isSelected = answers[currentStep] === option;

                  return (
                    <button
                      key={option}
                      onClick={() => handleSelect(option)}
                      className={cn(
                        "p-4 md:p-8 border text-left transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] transition-transform",
                        isSelected
                          ? "border-gik-void bg-gik-linen"
                          : "border-gik-stone/30 hover:border-gik-gold"
                      )}
                    >
                      <span className="font-body text-sm text-gik-void">
                        {option}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div ref={resultWrapperRef} className="opacity-0">
              {/* Result Header */}
              <div className="text-center mb-16">
                <p className="text-[10px] tracking-[0.12em] uppercase text-gik-stone/50 font-body font-medium mb-6">
                  Your Alignment
                </p>
                <h2 className="font-display text-h2 font-light text-gik-void mb-6">
                  {result?.title}
                </h2>
                <p className="font-body text-sm text-gik-stone leading-relaxed max-w-lg mx-auto">
                  {result?.message}
                </p>
              </div>

              {/* Recommended Products */}
              <div className="mb-16">
                <p className="text-[10px] tracking-[0.12em] uppercase text-gik-stone/50 font-body font-medium mb-8 text-center">
                  Recommended For You
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-12">
                  {recommendedProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button href="/shop/align" variant="primary">
                  SHOP YOUR ALIGNMENT
                </Button>
                <Button variant="ghost" onClick={handleRestart}>
                  Retake Guide
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
