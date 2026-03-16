"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface CategoryData {
  name: string;
  images: { src: string; x: string; y: string; w: number; h: number; rotate: number }[];
}

const categories: CategoryData[] = [
  {
    name: "GIK UTILITY",
    images: [
      { src: "https://images.unsplash.com/photo-1594040226829-7f251ab46d80?w=600&q=75", x: "5%", y: "8%", w: 180, h: 220, rotate: -8 },
      { src: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&q=75", x: "22%", y: "2%", w: 150, h: 200, rotate: 5 },
      { src: "https://images.unsplash.com/photo-1449247709967-d4461a6a6103?w=600&q=75", x: "72%", y: "5%", w: 200, h: 250, rotate: 7 },
      { src: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&q=75", x: "88%", y: "15%", w: 160, h: 210, rotate: -5 },
      { src: "https://images.unsplash.com/photo-1533090161767-e6ffed986c88?w=600&q=75", x: "2%", y: "55%", w: 170, h: 230, rotate: 6 },
      { src: "https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=600&q=75", x: "18%", y: "62%", w: 140, h: 180, rotate: -10 },
      { src: "https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=600&q=75", x: "55%", y: "58%", w: 190, h: 240, rotate: 4 },
      { src: "https://images.unsplash.com/photo-1556909172-89cf0b8fdc9f?w=600&q=75", x: "78%", y: "55%", w: 160, h: 200, rotate: -7 },
      { src: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=600&q=75", x: "40%", y: "10%", w: 130, h: 170, rotate: 3 },
      { src: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&q=75", x: "60%", y: "65%", w: 145, h: 190, rotate: -4 },
    ],
  },
  {
    name: "GIK ALIGN",
    images: [
      { src: "https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=600&q=75", x: "8%", y: "5%", w: 190, h: 250, rotate: -6 },
      { src: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&q=75", x: "25%", y: "0%", w: 160, h: 210, rotate: 8 },
      { src: "https://images.unsplash.com/photo-1615529182904-14819c35db37?w=600&q=75", x: "68%", y: "3%", w: 200, h: 260, rotate: -4 },
      { src: "https://images.unsplash.com/photo-1602192509154-0b900ee1f851?w=600&q=75", x: "85%", y: "20%", w: 170, h: 220, rotate: 6 },
      { src: "https://images.unsplash.com/photo-1574739782594-db4ead022697?w=600&q=75", x: "3%", y: "52%", w: 155, h: 200, rotate: 9 },
      { src: "https://images.unsplash.com/photo-1618220179428-22790b461013?w=600&q=75", x: "20%", y: "60%", w: 180, h: 230, rotate: -8 },
      { src: "https://images.unsplash.com/photo-1631679706909-1844bbd07221?w=600&q=75", x: "52%", y: "55%", w: 170, h: 220, rotate: 5 },
      { src: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=600&q=75", x: "75%", y: "58%", w: 150, h: 195, rotate: -6 },
      { src: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=75", x: "42%", y: "8%", w: 140, h: 180, rotate: 3 },
      { src: "https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=600&q=75", x: "62%", y: "62%", w: 135, h: 175, rotate: -3 },
    ],
  },
  {
    name: "GIK PANEL",
    images: [
      { src: "https://images.unsplash.com/photo-1572025442646-866d16c84a54?w=600&q=75", x: "6%", y: "6%", w: 195, h: 255, rotate: -7 },
      { src: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=600&q=75", x: "24%", y: "1%", w: 165, h: 215, rotate: 6 },
      { src: "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=600&q=75", x: "70%", y: "4%", w: 185, h: 240, rotate: -5 },
      { src: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&q=75", x: "86%", y: "18%", w: 155, h: 205, rotate: 8 },
      { src: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=600&q=75", x: "1%", y: "54%", w: 175, h: 225, rotate: 7 },
      { src: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&q=75", x: "19%", y: "58%", w: 160, h: 210, rotate: -9 },
      { src: "https://images.unsplash.com/photo-1594040226829-7f251ab46d80?w=600&q=75", x: "54%", y: "56%", w: 180, h: 235, rotate: 4 },
      { src: "https://images.unsplash.com/photo-1572025442646-866d16c84a54?w=600&q=75", x: "76%", y: "52%", w: 165, h: 215, rotate: -6 },
      { src: "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=600&q=75", x: "43%", y: "6%", w: 145, h: 185, rotate: 5 },
      { src: "https://images.unsplash.com/photo-1556909172-54557c7e4fb7?w=600&q=75", x: "58%", y: "64%", w: 140, h: 180, rotate: -4 },
    ],
  },
];

export default function CategoryShowcase() {
  const sectionRef = useRef<HTMLElement>(null);
  const titleRefs = useRef<(HTMLHeadingElement | null)[]>([]);
  const imageGroupRefs = useRef<(HTMLDivElement | null)[]>([]);
  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: () => `+=${window.innerHeight * 5}`,
          scrub: 1,
          pin: true,
          anticipatePin: 1,
        },
      });

      const navItems = navRef.current?.querySelectorAll(".cat-nav-item");

      categories.forEach((cat, i) => {
        const title = titleRefs.current[i];
        const imageGroup = imageGroupRefs.current[i];
        if (!title || !imageGroup) return;

        const images = imageGroup.querySelectorAll(".scatter-img");
        const sectionStart = i * 2;

        // Activate nav item
        if (navItems?.[i]) {
          tl.to(
            navItems[i],
            { color: "#ffffff", fontWeight: 700, duration: 0.01 },
            sectionStart
          );
          // Deactivate previous nav
          if (i > 0 && navItems[i - 1]) {
            tl.to(
              navItems[i - 1],
              { color: "#555555", fontWeight: 400, duration: 0.01 },
              sectionStart
            );
          }
        }

        // Fade in title
        tl.fromTo(
          title,
          { opacity: 0, scale: 0.85 },
          { opacity: 1, scale: 1, duration: 0.4, ease: "power2.out" },
          sectionStart
        );

        // Scatter images in from center with stagger
        tl.fromTo(
          images,
          {
            opacity: 0,
            scale: 0.15,
            x: () => `${(Math.random() - 0.5) * 100}px`,
            y: () => `${(Math.random() - 0.5) * 100}px`,
          },
          {
            opacity: 1,
            scale: 1,
            x: 0,
            y: 0,
            duration: 0.8,
            stagger: 0.04,
            ease: "power3.out",
          },
          sectionStart + 0.1
        );

        // Hold visible
        tl.to({}, { duration: 0.4 }, sectionStart + 1);

        // Fade out (except last)
        if (i < categories.length - 1) {
          tl.to(
            title,
            { opacity: 0, scale: 1.1, duration: 0.3, ease: "power2.in" },
            sectionStart + 1.5
          );
          tl.to(
            images,
            {
              opacity: 0,
              scale: 0.3,
              duration: 0.4,
              stagger: 0.02,
              ease: "power2.in",
            },
            sectionStart + 1.4
          );
        }
      });
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative h-screen overflow-hidden bg-[#0A0A0A]"
    >
      {/* Image layers per category */}
      {categories.map((cat, catIdx) => (
        <div
          key={cat.name}
          ref={(el) => { imageGroupRefs.current[catIdx] = el; }}
          className="absolute inset-0 pointer-events-none"
          style={{ perspective: "1200px" }}
        >
          {cat.images.map((img, imgIdx) => (
            <div
              key={`${catIdx}-${imgIdx}`}
              className="scatter-img absolute opacity-0 overflow-hidden rounded-md"
              style={{
                left: img.x,
                top: img.y,
                width: img.w,
                height: img.h,
                transform: `rotate(${img.rotate}deg)`,
                zIndex: imgIdx % 2 === 0 ? 1 : 2,
              }}
            >
              <Image
                src={img.src}
                alt=""
                fill
                sizes="200px"
                className="object-cover grayscale"
              />
            </div>
          ))}
        </div>
      ))}

      {/* Center titles */}
      {categories.map((cat, i) => (
        <h2
          key={cat.name}
          ref={(el) => { titleRefs.current[i] = el; }}
          className="absolute inset-0 flex items-center justify-center font-display font-bold uppercase text-white opacity-0 pointer-events-none select-none"
          style={{
            fontSize: "clamp(2.5rem, 9vw, 9rem)",
            letterSpacing: "-0.03em",
            lineHeight: 0.95,
            zIndex: 10,
            textShadow: "0 0 80px rgba(0,0,0,0.8)",
          }}
        >
          {cat.name}
        </h2>
      ))}

      {/* Bottom nav */}
      <div
        ref={navRef}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 z-20"
      >
        {categories.map((cat, i) => (
          <span
            key={cat.name}
            className="cat-nav-item text-[11px] md:text-[13px] tracking-[0.12em] uppercase font-body transition-colors duration-300"
            style={{
              color: i === 0 ? "#ffffff" : "#555555",
              fontWeight: i === 0 ? 700 : 400,
            }}
          >
            {cat.name}
          </span>
        ))}
      </div>
    </section>
  );
}
