"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ShoppingBag, ArrowUpRight } from "lucide-react";
import gsap from "gsap";
import { cn } from "@/lib/utils";
import { MagneticElement } from "@/components/effects/MagneticElement";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Shop", href: "/shop" },
  { label: "Story", href: "/story" },
  { label: "Journal", href: "/journal" },
  { label: "Sustainability", href: "/sustainability" },
];

function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const overlayRef = useRef<HTMLDivElement>(null);
  const menuLinksRef = useRef<(HTMLDivElement | null)[]>([]);
  const menuBottomRef = useRef<HTMLDivElement>(null);
  const line1Ref = useRef<HTMLSpanElement>(null);
  const line2Ref = useRef<HTMLSpanElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const lastScrollY = useRef(0);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      setIsScrolled(currentY > 50);
      if (isMenuOpen) { setIsVisible(true); lastScrollY.current = currentY; return; }
      if (currentY > 200 && currentY > lastScrollY.current + 5) setIsVisible(false);
      else if (currentY < lastScrollY.current - 5 || currentY <= 100) setIsVisible(true);
      lastScrollY.current = currentY;
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isMenuOpen]);

  useEffect(() => {
    if (!navRef.current) return;
    gsap.to(navRef.current, { yPercent: isVisible ? 0 : -100, duration: 0.35, ease: "expo.out" });
  }, [isVisible]);

  useEffect(() => {
    if (!overlayRef.current) return;
    if (isMenuOpen) {
      document.body.style.overflow = "hidden";
      gsap.to(line1Ref.current, { rotate: 45, y: 0, duration: 0.4, ease: "expo.out" });
      gsap.to(line2Ref.current, { rotate: -45, y: 0, duration: 0.4, ease: "expo.out" });
      gsap.fromTo(overlayRef.current, { clipPath: "circle(0% at 24px 28px)" }, {
        clipPath: "circle(150% at 24px 28px)", duration: 0.8, ease: "expo.out",
        onStart: () => { if (overlayRef.current) overlayRef.current.style.pointerEvents = "auto"; },
      });
      gsap.fromTo(menuLinksRef.current.filter(Boolean), { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: "expo.out", stagger: 0.06, delay: 0.3 });
      gsap.fromTo(menuBottomRef.current, { opacity: 0 }, { opacity: 1, duration: 0.5, ease: "power2.out", delay: 0.6 });
    } else {
      document.body.style.overflow = "";
      gsap.to(line1Ref.current, { rotate: 0, y: -3, duration: 0.4, ease: "expo.out" });
      gsap.to(line2Ref.current, { rotate: 0, y: 3, duration: 0.4, ease: "expo.out" });
      gsap.to(overlayRef.current, { clipPath: "circle(0% at 24px 28px)", duration: 0.5, ease: "expo.inOut",
        onComplete: () => { if (overlayRef.current) overlayRef.current.style.pointerEvents = "none"; },
      });
    }
    return () => { document.body.style.overflow = ""; };
  }, [isMenuOpen]);

  const closeMenu = useCallback(() => setIsMenuOpen(false), []);
  const isActivePath = (href: string) => href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      <nav
        ref={navRef}
        className={cn("fixed top-0 left-0 right-0 z-50 will-change-transform transition-all", isScrolled ? "border-b border-gik-void/[0.06]" : "border-b border-transparent")}
        style={{
          transitionDuration: "var(--duration-slow)",
          ...(isScrolled ? { backdropFilter: "blur(16px) saturate(180%)", WebkitBackdropFilter: "blur(16px) saturate(180%)", backgroundColor: "rgba(255, 255, 255, 0.9)" } : { backgroundColor: "transparent" }),
        }}
      >
        <div className="flex h-[64px] md:h-[72px] items-center justify-between page-pad max-w-[1400px] mx-auto">
          {/* Left — Hamburger (mobile) + Logo */}
          <div className="flex items-center gap-4">
            <button
              type="button"
              aria-label={isMenuOpen ? "Close menu" : "Open menu"}
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden relative flex flex-col items-center justify-center w-6 h-6 gap-[5px]"
            >
              <span ref={line1Ref} className="absolute block bg-gik-void" style={{ width: 18, height: 1.5, transform: "translateY(-3px)" }} />
              <span ref={line2Ref} className="absolute block bg-gik-void" style={{ width: 18, height: 1.5, transform: "translateY(3px)" }} />
            </button>
            <Link href="/" className="flex items-center gap-2">
              <Image src="/logo.png" alt="GIK" width={400} height={400} className="h-14 md:h-24 w-auto" priority />
            </Link>
          </div>

          {/* Center — Nav Links (desktop) */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <MagneticElement key={link.href} strength={0.15} radius={60}>
                <Link
                  href={link.href}
                  className={cn(
                    "text-[14px] font-body transition-colors duration-300",
                    isActivePath(link.href) ? "text-gik-void font-medium" : "text-gik-stone hover:text-gik-void"
                  )}
                >
                  {link.label}
                </Link>
              </MagneticElement>
            ))}
          </div>

          {/* Right — CTA + Cart */}
          <div className="flex items-center gap-3">
            <MagneticElement strength={0.15} radius={60}>
              <Link href="/contact" className="hidden md:inline-flex items-center gap-2 bg-gik-void text-white text-[13px] font-medium px-5 py-2.5 rounded-full transition-all duration-300 hover:bg-gik-earth group">
                <span className="w-1.5 h-1.5 rounded-full bg-gik-gold" />
                Shop Now
                <ArrowUpRight size={14} className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
            </MagneticElement>
            <MagneticElement strength={0.2} radius={60}>
              <Link href="/cart" aria-label="Cart" className="relative text-gik-void hover:text-gik-earth transition-colors duration-300">
                <ShoppingBag size={18} strokeWidth={1.5} />
              </Link>
            </MagneticElement>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <div ref={overlayRef} className="fixed inset-0 z-40 bg-white flex flex-col justify-between pointer-events-none" style={{ clipPath: "circle(0% at 24px 28px)" }}>
        <div className="flex flex-col justify-center flex-1 page-pad pt-20">
          <nav className="flex flex-col gap-1">
            {[...navLinks, { label: "Contact", href: "/contact" }, { label: "Account", href: "/account" }].map((link, i) => (
              <div key={link.href} ref={(el) => { menuLinksRef.current[i] = el; }} className="opacity-0">
                <Link href={link.href} onClick={closeMenu}
                  className="block font-display text-[clamp(2rem,5vw,3.5rem)] font-light tracking-[-0.02em] leading-[1.4] text-gik-void">
                  {link.label}
                </Link>
              </div>
            ))}
          </nav>
        </div>
        <div ref={menuBottomRef} className="page-pad pb-8 opacity-0">
          <a href="mailto:hello@godiskind.in" className="block text-[12px] tracking-[0.06em] uppercase text-gik-stone">hello@godiskind.in</a>
        </div>
      </div>
    </>
  );
}

export { Navbar };
export default Navbar;
