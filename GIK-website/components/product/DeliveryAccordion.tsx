"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Container } from "@/components/ui/Container";
import { ChevronDown } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface DeliveryAccordionProps {
  careInstructions: string;
}

interface AccordionItemData {
  title: string;
  content: string;
}

function AccordionItem({ item, isOpen, onToggle }: { item: AccordionItemData; isOpen: boolean; onToggle: () => void }) {
  const contentRef = useRef<HTMLDivElement>(null);
  const chevronRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (contentRef.current) {
      if (isOpen) {
        gsap.to(contentRef.current, { height: "auto", opacity: 1, duration: 0.4, ease: "expo.out" });
      } else {
        gsap.to(contentRef.current, { height: 0, opacity: 0, duration: 0.3, ease: "expo.out" });
      }
    }
    if (chevronRef.current) {
      gsap.to(chevronRef.current, { rotate: isOpen ? 180 : 0, duration: 0.4, ease: "expo.out" });
    }
  }, [isOpen]);

  return (
    <div className="border-b border-gik-linen">
      <button
        onClick={onToggle}
        className={cn(
          "w-full flex items-center justify-between py-5",
          "text-left transition-colors duration-200",
          "focus:outline-none focus-visible:ring-1 focus-visible:ring-gik-void focus-visible:ring-offset-2",
          "group"
        )}
        aria-expanded={isOpen}
      >
        <span className="text-sm font-body font-medium text-gik-void tracking-wide transition-colors duration-300 group-hover:text-gik-earth">
          {item.title}
        </span>
        <span ref={chevronRef} className="flex-shrink-0 ml-4 will-change-transform">
          <ChevronDown size={16} strokeWidth={1.5} className="text-gik-stone transition-colors duration-300 group-hover:text-gik-earth" />
        </span>
      </button>
      <div ref={contentRef} className="overflow-hidden" style={{ height: 0, opacity: 0 }}>
        <div className="pb-5">
          <p className="text-sm text-gik-void/70 font-body leading-[1.8]">{item.content}</p>
        </div>
      </div>
    </div>
  );
}

export function DeliveryAccordion({ careInstructions }: DeliveryAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const itemsRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);

  const items: AccordionItemData[] = [
    {
      title: "Shipping & Delivery",
      content:
        "All GIK products are handcrafted to order with love and precision. Standard delivery takes 5\u20137 business days across India. We ship via our trusted logistics partners with full tracking and insurance. All orders include complimentary shipping. International shipping is available on request \u2014 please reach out to us directly for a custom quote.",
    },
    { title: "Care Instructions", content: careInstructions },
    {
      title: "Return Policy",
      content:
        "We stand behind every piece we create. If your GIK product arrives damaged or is not as described, we offer a full replacement or refund within 14 days of delivery. Due to the handcrafted nature of our products, slight variations in colour, grain, and texture are inherent and not considered defects. Custom and limited-edition pieces are non-returnable.",
    },
  ];

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Title entrance
      if (titleRef.current) {
        gsap.fromTo(
          titleRef.current,
          { opacity: 0, y: 15 },
          {
            opacity: 1,
            y: 0,
            duration: 0.7,
            ease: "expo.out",
            scrollTrigger: {
              trigger: sectionRef.current,
              start: "top 85%",
              once: true,
            },
          }
        );
      }

      // Accordion items stagger entrance
      if (itemsRef.current) {
        const accordionItems = itemsRef.current.children;
        gsap.fromTo(
          accordionItems,
          { opacity: 0, y: 20, x: -10 },
          {
            opacity: 1,
            y: 0,
            x: 0,
            duration: 0.6,
            ease: "expo.out",
            stagger: 0.1,
            scrollTrigger: {
              trigger: sectionRef.current,
              start: "top 80%",
              once: true,
            },
            delay: 0.15,
          }
        );
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="py-16 content-auto">
      <Container>
        <div className="max-w-2xl mx-auto">
          {/* Section divider with gold accent */}
          <div ref={titleRef} className="flex items-center gap-4 mb-8 opacity-0">
            <div className="w-6 h-px bg-gik-gold" />
            <p className="text-caption text-gik-stone font-body">Details</p>
          </div>

          <div ref={itemsRef}>
            {items.map((item, index) => (
              <AccordionItem
                key={item.title}
                item={item}
                isOpen={openIndex === index}
                onToggle={() => setOpenIndex((prev) => (prev === index ? null : index))}
              />
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
