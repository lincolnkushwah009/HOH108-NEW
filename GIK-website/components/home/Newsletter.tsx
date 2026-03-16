"use client";

import { cn } from "@/lib/utils";
import { useState, useEffect, useRef, type FormEvent } from "react";
import { Check } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { MagneticElement } from "@/components/effects/MagneticElement";

gsap.registerPlugin(ScrollTrigger);

export default function Newsletter() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const successRef = useRef<HTMLDivElement>(null);
  const circleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".newsletter-animate",
        { y: 20, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.85,
          ease: "expo.out",
          stagger: 0.1,
          scrollTrigger: { trigger: sectionRef.current, start: "top 80%", once: true },
        }
      );
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email) return;

    if (formRef.current) {
      gsap.to(formRef.current, {
        opacity: 0,
        y: -20,
        duration: 0.4,
        ease: "expo.out",
        onComplete: () => {
          setSubmitted(true);
          if (successRef.current) {
            gsap.fromTo(successRef.current, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.85, ease: "expo.out" });
          }
          if (circleRef.current) {
            gsap.fromTo(circleRef.current, { scale: 0 }, { scale: 1, duration: 0.6, ease: "back.out(1.7)" });
          }
        },
      });
    } else {
      setSubmitted(true);
    }
  }

  return (
    <section ref={sectionRef} className="py-[var(--space-block)] page-pad content-auto">
      <div className="max-w-[1400px] mx-auto">
        <div className="relative overflow-hidden rounded-[24px] bg-gik-void p-8 md:p-12 lg:p-16">
          {/* Subtle gold glow */}
          <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 30% 50%, rgba(184,157,111,0.12) 0%, transparent 60%)" }} />

          {!submitted ? (
            <div ref={formRef} className="relative z-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center">
                <div>
                  <span className="newsletter-animate inline-flex items-center px-4 py-1.5 rounded-full text-[11px] tracking-[0.06em] uppercase text-white/60 border border-white/10 mb-6 opacity-0">
                    Stay Connected
                  </span>
                  <h2 className="newsletter-animate font-display text-h2 font-light text-white mb-4 opacity-0">
                    Join Our Community
                  </h2>
                  <p className="newsletter-animate text-white/40 leading-relaxed text-sm opacity-0">
                    Receive curated stories, early access to limited editions, and the GIK journal delivered to your inbox.
                  </p>
                </div>

                <div>
                  <form onSubmit={handleSubmit} className="newsletter-animate flex flex-col sm:flex-row items-stretch gap-3 opacity-0">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Your email address"
                      required
                      className={cn(
                        "flex-1 bg-transparent",
                        "border-0 border-b border-white/15",
                        "py-3 px-0",
                        "text-white placeholder:text-white/25",
                        "font-body text-sm",
                        "focus:outline-none focus:border-gik-gold",
                        "transition-colors duration-300"
                      )}
                    />
                    <MagneticElement>
                      <button
                        type="submit"
                        className="inline-flex items-center justify-center h-[42px] px-6 text-[12px] tracking-[0.06em] uppercase font-body font-medium rounded-full bg-white text-gik-void transition-all duration-300 hover:bg-gik-gold hover:text-white flex-shrink-0"
                      >
                        Subscribe
                      </button>
                    </MagneticElement>
                  </form>
                  <p className="newsletter-animate text-[10px] text-white/20 mt-4 font-body opacity-0">
                    By subscribing you agree to our{" "}
                    <a href="/privacy" className="underline underline-offset-2 hover:text-white/40 transition-colors duration-300">
                      privacy policy
                    </a>.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div ref={successRef} className="flex flex-col items-center py-8 opacity-0 relative z-10">
              <div ref={circleRef} className="w-16 h-16 rounded-full border border-gik-gold flex items-center justify-center mb-8 scale-0">
                <Check className="w-6 h-6 text-gik-gold" />
              </div>
              <h2 className="font-display text-h2 font-light text-white">Welcome</h2>
              <p className="text-white/50 mt-3">You&rsquo;re part of the community now.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
