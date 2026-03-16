"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { MagneticElement } from "@/components/effects/MagneticElement";
import { ArrowUp } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

const footerSections = [
  {
    title: "SHOP",
    links: [
      { label: "Utility", href: "/shop/utility" },
      { label: "Align", href: "/shop/align" },
      { label: "Panel", href: "/shop/panel" },
      { label: "All Products", href: "/shop" },
    ],
  },
  {
    title: "ABOUT",
    links: [
      { label: "Story", href: "/story" },
      { label: "Sustainability", href: "/sustainability" },
      { label: "Journal", href: "/journal" },
      { label: "Trade Program", href: "/trade" },
    ],
  },
  {
    title: "SUPPORT",
    links: [
      { label: "Contact", href: "/contact" },
      { label: "Shipping", href: "/shipping" },
      { label: "Returns", href: "/returns" },
      { label: "FAQ", href: "/faq" },
    ],
  },
  {
    title: "CONNECT",
    links: [
      { label: "Instagram", href: "https://instagram.com", external: true },
      { label: "Pinterest", href: "https://pinterest.com", external: true },
      { label: "LinkedIn", href: "https://linkedin.com", external: true },
      { label: "Email", href: "mailto:hello@godiskind.in", external: true },
    ],
  },
];

function FooterLink({
  href,
  external,
  children,
}: {
  href: string;
  external?: boolean;
  children: React.ReactNode;
}) {
  const className =
    "group relative inline-block text-[13px] text-gik-stone transition-colors hover:text-gik-void";

  const content = (
    <span className="hover-slide">
      <span className="hover-slide__primary">{children}</span>
      <span className="hover-slide__clone" aria-hidden="true">{children}</span>
    </span>
  );

  if (external) {
    return (
      <MagneticElement strength={0.25} radius={60}>
        <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
          {content}
        </a>
      </MagneticElement>
    );
  }

  return (
    <MagneticElement strength={0.25} radius={60}>
      <Link href={href} className={className}>
        {content}
      </Link>
    </MagneticElement>
  );
}

function Footer() {
  const footerRef = useRef<HTMLElement>(null);
  const columnsRef = useRef<HTMLDivElement>(null);
  const backToTopRef = useRef<HTMLButtonElement>(null);
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".footer-animate",
        { y: 20, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.85,
          ease: "expo.out",
          scrollTrigger: { trigger: footerRef.current, start: "top 90%", once: true },
          delay: 0.2,
        }
      );

      if (columnsRef.current) {
        gsap.fromTo(
          columnsRef.current.children,
          { y: 30, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.7,
            ease: "expo.out",
            stagger: 0.1,
            scrollTrigger: { trigger: columnsRef.current, start: "top 90%", once: true },
          }
        );
      }

      ScrollTrigger.create({
        trigger: footerRef.current,
        start: "top 80%",
        onEnter: () => setShowBackToTop(true),
        onLeaveBack: () => setShowBackToTop(false),
      });
    }, footerRef);

    return () => ctx.revert();
  }, []);

  useEffect(() => {
    if (!backToTopRef.current) return;
    gsap.to(backToTopRef.current, {
      opacity: showBackToTop ? 1 : 0,
      scale: showBackToTop ? 1 : 0.8,
      duration: 0.3,
      ease: "expo.out",
      pointerEvents: showBackToTop ? "auto" : "none",
    });
  }, [showBackToTop]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer ref={footerRef} className="relative bg-gik-void text-gik-canvas overflow-hidden">
      <div className="relative z-10 page-pad pt-[var(--space-section)] pb-8 max-w-[1400px] mx-auto">
        {/* Brand + Contact */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <Link href="/" className="block">
              <Image
                src="/logo.png"
                alt="God Is Kind 108"
                width={400}
                height={400}
                className="h-28 md:h-36 w-auto brightness-0 invert"
              />
            </Link>
            <p className="footer-animate font-display italic text-base text-white/30 mt-3 opacity-0">
              Where sustainability meets the sacred
            </p>
          </div>

          <div className="footer-animate opacity-0">
            <a
              href="mailto:hello@godiskind.in"
              className="block text-[13px] text-white/40 hover:text-gik-gold transition-colors duration-300 mb-1"
            >
              hello@godiskind.in
            </a>
            <p className="text-[12px] text-white/20">Made with intention in India</p>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-white/[0.06] my-12 md:my-14" />

        {/* Link Grid */}
        <div ref={columnsRef} className="grid grid-cols-2 md:grid-cols-4 gap-y-8 gap-x-6">
          {footerSections.map((section) => (
            <div key={section.title}>
              <h4 className="text-[11px] tracking-[0.12em] uppercase text-white/30 mb-3 font-medium">
                {section.title}
              </h4>
              <ul className="flex flex-col gap-2.5">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <FooterLink
                      href={link.href}
                      external={"external" in link && (link as { external?: boolean }).external}
                    >
                      {link.label}
                    </FooterLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center pt-12 pb-4 gap-3 border-t border-white/[0.04] mt-12">
          <p className="text-[11px] text-white/20">&copy; 2025 God Is Kind</p>
          <div className="flex items-center gap-4">
            <a href="/privacy" className="text-[11px] text-white/20 hover:text-white/40 transition-colors duration-300">Privacy Policy</a>
            <a href="/terms" className="text-[11px] text-white/20 hover:text-white/40 transition-colors duration-300">Terms</a>
          </div>
        </div>
      </div>

      {/* Back-to-top */}
      <MagneticElement strength={0.3} radius={80}>
        <button
          ref={backToTopRef}
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 z-50 w-12 h-12 rounded-full bg-gik-void text-white border border-white/10 flex items-center justify-center opacity-0 hover:bg-gik-gold hover:border-gik-gold transition-all duration-300 shadow-lg"
          style={{ pointerEvents: "none" }}
          aria-label="Back to top"
        >
          <ArrowUp className="w-5 h-5" strokeWidth={1.5} />
        </button>
      </MagneticElement>
    </footer>
  );
}

export { Footer };
export default Footer;
