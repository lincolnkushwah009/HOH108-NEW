"use client";

import {
  useState,
  useRef,
  useEffect,
  type ChangeEvent,
  type FormEvent,
} from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { FlashReveal } from "@/components/effects/FlashReveal";
import { scaleEntrance } from "@/lib/animations";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

gsap.registerPlugin(ScrollTrigger);

// ---------------------------------------------------------------------------
// Contact Info Data
// ---------------------------------------------------------------------------

const contactSections = [
  {
    heading: "GENERAL INQUIRIES",
    items: [{ label: "hello@godiskind.in", href: "mailto:hello@godiskind.in" }],
  },
  {
    heading: "TRADE PROGRAM",
    items: [{ label: "trade@godiskind.in", href: "mailto:trade@godiskind.in" }],
  },
  {
    heading: "CUSTOM ORDERS",
    items: [
      { label: "custom@godiskind.in", href: "mailto:custom@godiskind.in" },
    ],
  },
  {
    heading: "FOLLOW US",
    items: [
      { label: "Instagram", href: "https://instagram.com/godiskind.in" },
      { label: "Pinterest", href: "https://pinterest.com/godiskind" },
      { label: "LinkedIn", href: "https://linkedin.com/company/godiskind" },
    ],
  },
];

// ---------------------------------------------------------------------------
// Textarea Component (matches Input style)
// ---------------------------------------------------------------------------

function Textarea({
  label,
  name,
  required = false,
  value,
  onChange,
  className,
}: {
  label: string;
  name: string;
  required?: boolean;
  value: string;
  onChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  className?: string;
}) {
  const [focused, setFocused] = useState(false);
  const hasValue = value !== "";
  const isActive = focused || hasValue;

  return (
    <div className={cn("relative", className)}>
      <div className="relative">
        <textarea
          id={name}
          name={name}
          required={required}
          value={value}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          rows={4}
          className={cn(
            "peer w-full bg-transparent border-0 border-b px-0 pt-7 pb-2",
            "font-body text-sm text-gik-void",
            "outline-none transition-colors duration-300",
            "placeholder-transparent resize-none",
            "border-gik-stone focus:border-gik-void"
          )}
          placeholder={label}
          autoComplete="off"
        />
        <label
          htmlFor={name}
          className={cn(
            "absolute left-0 font-body transition-all duration-300 pointer-events-none",
            isActive
              ? "top-1 text-[10px] tracking-[0.1em] uppercase text-gik-void"
              : "top-5 text-sm text-gik-stone"
          )}
        >
          {label}
          {required && <span className="ml-0.5">*</span>}
        </label>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Contact Page
// ---------------------------------------------------------------------------

interface FormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export default function ContactPage() {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const heroRef = useRef<HTMLDivElement>(null);
  const heroInnerRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const infoRef = useRef<HTMLDivElement>(null);
  const successRef = useRef<HTMLDivElement>(null);
  const checkCircleRef = useRef<HTMLDivElement>(null);
  const checkIconRef = useRef<HTMLDivElement>(null);

  // ── ScrollTrigger animations for hero, form, info sections ──
  useEffect(() => {
    const ctx = gsap.context(() => {
      // Hero
      if (heroInnerRef.current) {
        scaleEntrance(heroInnerRef.current, {
          fromScale: 0.9,
          scrollTrigger: {
            trigger: heroRef.current,
            start: "top 85%",
            once: true,
          },
        });
      }

      // Form column
      if (formRef.current) {
        scaleEntrance(formRef.current, {
          fromScale: 0.85,
          scrollTrigger: {
            trigger: formRef.current,
            start: "top 85%",
            once: true,
          },
        });
      }

      // Info column
      if (infoRef.current) {
        scaleEntrance(infoRef.current, {
          fromScale: 0.85,
          delay: 0.15,
          scrollTrigger: {
            trigger: infoRef.current,
            start: "top 85%",
            once: true,
          },
        });
      }
    });

    return () => ctx.revert();
  }, []);

  // ── Success state animation ──
  useEffect(() => {
    if (!submitted) return;

    const ctx = gsap.context(() => {
      // Fade in + scale the success container
      if (successRef.current) {
        gsap.fromTo(
          successRef.current,
          { opacity: 0, scale: 0.95 },
          { opacity: 1, scale: 1, duration: 0.6, ease: "expo.out" }
        );
      }

      // Spring-like pop for the checkmark circle
      if (checkCircleRef.current) {
        gsap.fromTo(
          checkCircleRef.current,
          { scale: 0 },
          {
            scale: 1,
            duration: 0.6,
            delay: 0.2,
            ease: "back.out(1.7)",
          }
        );
      }

      // Fade in the check icon with rotation
      if (checkIconRef.current) {
        gsap.fromTo(
          checkIconRef.current,
          { opacity: 0, rotate: -90 },
          { opacity: 1, rotate: 0, duration: 0.4, delay: 0.5, ease: "expo.out" }
        );
      }
    });

    return () => ctx.revert();
  }, [submitted]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleTextareaChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <section className="min-h-screen bg-gik-canvas content-auto">
      {/* ── Hero ── */}
      <div
        ref={heroRef}
        className="page-pad"
        style={{
          paddingTop: "var(--space-section)",
          paddingBottom: "calc(var(--space-section) * 0.5)",
        }}
      >
        <div
          ref={heroInnerRef}
          className="text-center opacity-0"
          style={{ transform: "translateY(24px)" }}
        >
          <p className="text-[10px] tracking-[0.12em] uppercase text-gik-stone/50 font-body font-medium mb-5">
            Contact
          </p>
          <FlashReveal
            as="h1"
            className="font-display text-hero font-light text-gik-void"
          >
            Get in Touch
          </FlashReveal>
        </div>
      </div>

      {/* ── Content: Asymmetric 2-Column ── */}
      <div
        className="page-pad"
        style={{ paddingBottom: "var(--space-section)" }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-16 lg:gap-20">
          {/* ── Left Column: Form (60%) ── */}
          <div
            ref={formRef}
            className="lg:col-span-3 opacity-0"
            style={{ transform: "translateY(40px)" }}
          >
            {submitted ? (
              <div
                ref={successRef}
                className="flex flex-col items-center justify-center py-24 opacity-0"
              >
                {/* Animated gold-bordered checkmark circle */}
                <div
                  ref={checkCircleRef}
                  className="w-16 h-16 rounded-full border border-gik-gold flex items-center justify-center mb-8"
                  style={{ transform: "scale(0)" }}
                >
                  <div ref={checkIconRef} className="opacity-0">
                    <Check
                      className="w-7 h-7 text-gik-gold"
                      strokeWidth={1.5}
                    />
                  </div>
                </div>

                <p className="font-display text-h2 font-light text-gik-void mb-3">
                  Thank you.
                </p>
                <p className="text-sm text-gik-stone font-body">
                  We&rsquo;ll be in touch.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-8">
                <Input
                  label="Name"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                />

                <Input
                  label="Email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                />

                <Input
                  label="Subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                />

                <Textarea
                  label="Message"
                  name="message"
                  required
                  value={formData.message}
                  onChange={handleTextareaChange}
                />

                <div className="pt-6">
                  <Button type="submit">Send Message</Button>
                </div>
              </form>
            )}
          </div>

          {/* ── Right Column: Contact Info (40%) ── */}
          <div
            ref={infoRef}
            className="lg:col-span-2 lg:pl-8 opacity-0"
            style={{ transform: "translateY(40px)" }}
          >
            <div className="space-y-0">
              {contactSections.map((section, idx) => (
                <div key={section.heading}>
                  {/* Gold accent divider between sections */}
                  {idx > 0 && (
                    <div className="w-8 h-px bg-gik-gold/40 mb-8" />
                  )}
                  <div className={idx > 0 ? "mb-8" : "mb-8"}>
                    <p className="text-[10px] tracking-[0.12em] uppercase text-gik-stone/50 font-body font-medium mb-4">
                      {section.heading}
                    </p>
                    <div className="space-y-2">
                      {section.items.map((item) => (
                        <a
                          key={item.label}
                          href={item.href}
                          target={
                            item.href.startsWith("http") ? "_blank" : undefined
                          }
                          rel={
                            item.href.startsWith("http")
                              ? "noopener noreferrer"
                              : undefined
                          }
                          className={cn(
                            "block text-sm font-body text-gik-void",
                            "link-hover w-fit"
                          )}
                        >
                          {item.label}
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
