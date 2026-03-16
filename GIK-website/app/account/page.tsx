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
import { cn } from "@/lib/utils";

gsap.registerPlugin(ScrollTrigger);

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Tab = "signin" | "create";

// ---------------------------------------------------------------------------
// Account Page
// ---------------------------------------------------------------------------

export default function AccountPage() {
  const [activeTab, setActiveTab] = useState<Tab>("signin");

  const heroRef = useRef<HTMLDivElement>(null);
  const heroContentRef = useRef<HTMLDivElement>(null);

  const formSectionRef = useRef<HTMLDivElement>(null);
  const formWrapperRef = useRef<HTMLDivElement>(null);

  // Sign In form state
  const [signInData, setSignInData] = useState({
    email: "",
    password: "",
  });

  // Create Account form state
  const [createData, setCreateData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    agreeTerms: false,
  });

  // ── Hero entrance via ScrollTrigger ──
  useEffect(() => {
    const el = heroContentRef.current;
    if (!el) return;

    gsap.set(el, { opacity: 0, y: 24 });

    const trigger = ScrollTrigger.create({
      trigger: heroRef.current,
      start: "top 85%",
      once: true,
      onEnter: () => {
        gsap.to(el, {
          opacity: 1,
          y: 0,
          duration: 0.9,
          ease: "expo.out",
        });
      },
    });

    return () => {
      trigger.kill();
    };
  }, []);

  // ── Form section entrance via ScrollTrigger ──
  useEffect(() => {
    const el = formSectionRef.current;
    if (!el) return;

    gsap.set(el, { opacity: 0, y: 30 });

    const trigger = ScrollTrigger.create({
      trigger: el,
      start: "top 85%",
      once: true,
      onEnter: () => {
        gsap.to(el, {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: "expo.out",
        });
      },
    });

    return () => {
      trigger.kill();
    };
  }, []);

  // ── Tab switch: animate form wrapper ──
  useEffect(() => {
    const el = formWrapperRef.current;
    if (!el) return;

    gsap.fromTo(
      el,
      { opacity: 0, y: 16 },
      { opacity: 1, y: 0, duration: 0.5, ease: "expo.out" }
    );
  }, [activeTab]);

  const handleSignInChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSignInData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleCreateChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setCreateData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSignIn = (e: FormEvent) => {
    e.preventDefault();
    // Handle sign in logic
  };

  const handleCreate = (e: FormEvent) => {
    e.preventDefault();
    // Handle account creation logic
  };

  return (
    <section className="min-h-screen bg-gik-canvas">
      {/* ── Hero Header ── */}
      <div
        ref={heroRef}
        className="page-pad"
        style={{
          paddingTop: "var(--space-section)",
          paddingBottom: "calc(var(--space-section) * 0.4)",
        }}
      >
        <div ref={heroContentRef} className="text-center">
          <p className="text-[10px] tracking-[0.12em] uppercase text-gik-stone/50 font-body font-medium mb-5">
            Your Account
          </p>
          <h1 className="font-display text-hero font-light text-gik-void">
            Account
          </h1>
        </div>
      </div>

      {/* ── Form Section ── */}
      <div
        ref={formSectionRef}
        className="page-pad"
        style={{ paddingBottom: "var(--space-section)" }}
      >
        <div className="max-w-md mx-auto">
          {/* ── Pill Tab Switcher ── */}
          <div className="flex items-center justify-center mb-14">
            <div className="relative inline-flex bg-gik-linen rounded-full p-1">
              {/* Active pill background */}
              <span
                className="absolute top-1 bottom-1 bg-gik-void rounded-full transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)]"
                style={{
                  left: activeTab === "signin" ? "4px" : "50%",
                  right: activeTab === "create" ? "4px" : "50%",
                }}
              />

              {(["signin", "create"] as Tab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "relative z-10 px-6 py-2.5 text-[10px] tracking-[0.12em] uppercase font-body font-medium transition-colors duration-300",
                    "rounded-full",
                    activeTab === tab
                      ? "text-gik-canvas"
                      : "text-gik-stone hover:text-gik-void"
                  )}
                >
                  {tab === "signin" ? "Sign In" : "Create Account"}
                </button>
              ))}
            </div>
          </div>

          {/* ── Forms ── */}
          <div ref={formWrapperRef}>
            {activeTab === "signin" ? (
              <form onSubmit={handleSignIn} className="space-y-8">
                <Input
                  label="Email Address"
                  name="email"
                  type="email"
                  required
                  value={signInData.email}
                  onChange={handleSignInChange}
                />
                <Input
                  label="Password"
                  name="password"
                  type="password"
                  required
                  value={signInData.password}
                  onChange={handleSignInChange}
                />

                <div className="pt-6">
                  <Button type="submit" className="w-full rounded-full">
                    Sign In
                  </Button>
                </div>

                <div className="text-center">
                  <button
                    type="button"
                    className="font-body text-xs tracking-[0.05em] text-gik-stone hover:text-gik-void transition-colors duration-300"
                  >
                    <span className="link-hover">Forgot password?</span>
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleCreate} className="space-y-8">
                <Input
                  label="Full Name"
                  name="fullName"
                  required
                  value={createData.fullName}
                  onChange={handleCreateChange}
                />
                <Input
                  label="Email Address"
                  name="email"
                  type="email"
                  required
                  value={createData.email}
                  onChange={handleCreateChange}
                />
                <Input
                  label="Phone Number"
                  name="phone"
                  type="tel"
                  value={createData.phone}
                  onChange={handleCreateChange}
                />
                <Input
                  label="Password"
                  name="password"
                  type="password"
                  required
                  value={createData.password}
                  onChange={handleCreateChange}
                />

                {/* Terms Checkbox */}
                <label className="flex items-start gap-3 cursor-pointer group">
                  <div className="relative mt-0.5">
                    <input
                      type="checkbox"
                      name="agreeTerms"
                      checked={createData.agreeTerms}
                      onChange={handleCreateChange}
                      className="sr-only peer"
                    />
                    <div
                      className={cn(
                        "w-5 h-5 rounded-sm border transition-all duration-300",
                        createData.agreeTerms
                          ? "bg-gik-void border-gik-void"
                          : "border-gik-stone group-hover:border-gik-earth"
                      )}
                    >
                      <svg
                        className={cn(
                          "w-full h-full text-gik-canvas p-0.5 transition-all duration-200",
                          createData.agreeTerms
                            ? "opacity-100 scale-100"
                            : "opacity-0 scale-50"
                        )}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={3}
                      >
                        <path d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                  <span className="font-body text-sm text-gik-stone leading-relaxed">
                    I agree to the{" "}
                    <span className="text-gik-void link-hover">
                      Terms &amp; Privacy Policy
                    </span>
                  </span>
                </label>

                <div className="pt-6">
                  <Button type="submit" className="w-full rounded-full">
                    Create Account
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
