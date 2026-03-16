"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import gsap from "gsap";

interface ImageGalleryProps {
  images: string[];
  productName: string;
}

export default function ImageGallery({ images, productName }: ImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const mainImageRef = useRef<HTMLDivElement>(null);
  const lightboxRef = useRef<HTMLDivElement>(null);
  const lightboxImageRef = useRef<HTMLDivElement>(null);

  const galleryImages = images.length > 0 ? images : [];

  const openLightbox = useCallback(() => {
    setLightboxOpen(true);
    document.body.style.overflow = "hidden";
  }, []);

  const closeLightbox = useCallback(() => {
    if (lightboxRef.current) {
      gsap.to(lightboxRef.current, {
        opacity: 0,
        duration: 0.4,
        ease: "expo.out",
        onComplete: () => {
          setLightboxOpen(false);
          document.body.style.overflow = "";
        },
      });
    } else {
      setLightboxOpen(false);
      document.body.style.overflow = "";
    }
  }, []);

  const goToPrev = useCallback(() => {
    setSelectedIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);
  }, [galleryImages.length]);

  const goToNext = useCallback(() => {
    setSelectedIndex((prev) => (prev + 1) % galleryImages.length);
  }, [galleryImages.length]);

  // Animate lightbox open
  useEffect(() => {
    if (lightboxOpen && lightboxRef.current && lightboxImageRef.current) {
      gsap.fromTo(lightboxRef.current, { opacity: 0 }, { opacity: 1, duration: 0.4, ease: "expo.out" });
      gsap.fromTo(lightboxImageRef.current, { scale: 0.92, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.5, ease: "expo.out" });
    }
  }, [lightboxOpen]);

  // Animate image change
  useEffect(() => {
    if (mainImageRef.current) {
      gsap.fromTo(mainImageRef.current, { opacity: 0 }, { opacity: 1, duration: 0.5, ease: "expo.out" });
    }
  }, [selectedIndex]);

  return (
    <>
      <div className="flex flex-col gap-3">
        {/* Main Image Display */}
        <div
          className="relative aspect-[4/5] bg-gik-linen overflow-hidden cursor-crosshair group"
          onClick={openLightbox}
        >
          <div ref={mainImageRef} className="absolute inset-0">
            {galleryImages[selectedIndex] ? (
              <div
                className={cn(
                  "relative w-full h-full",
                  "transition-transform duration-[850ms]",
                  "group-hover:scale-[1.04]"
                )}
                style={{ transitionTimingFunction: "var(--ease-out-expo)" }}
              >
                <Image
                  src={galleryImages[selectedIndex]}
                  alt={`${productName} — Image ${selectedIndex + 1} of ${galleryImages.length}`}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover"
                  priority={selectedIndex === 0}
                />
              </div>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                <span className="text-gik-stone/40 text-[10px] tracking-[0.15em] uppercase font-body">
                  {productName}
                </span>
              </div>
            )}
          </div>

          <div className={cn("absolute bottom-4 right-4 z-10", "opacity-0 group-hover:opacity-100", "transition-opacity duration-300")}>
            <span className="text-[10px] tracking-[0.1em] uppercase text-white font-body bg-gik-void/50 backdrop-blur-sm px-3 py-1.5">
              Click to expand
            </span>
          </div>
        </div>

        {/* Thumbnail Strip */}
        {galleryImages.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {galleryImages.map((img, index) => (
              <button
                key={index}
                onClick={() => setSelectedIndex(index)}
                className={cn(
                  "relative flex-shrink-0 w-16 h-16 md:w-[72px] md:h-[72px] bg-gik-linen overflow-hidden",
                  "transition-all duration-300",
                  "focus:outline-none focus-visible:ring-1 focus-visible:ring-gik-void"
                )}
                aria-label={`View image ${index + 1} of ${galleryImages.length}`}
              >
                <Image src={img} alt={`${productName} — Thumbnail ${index + 1}`} fill sizes="80px" className="object-cover" />
                <div className={cn("absolute bottom-0 left-0 right-0 h-0.5 transition-all duration-300", selectedIndex === index ? "bg-gik-void" : "bg-transparent")} />
                <div className={cn("absolute inset-0 transition-opacity duration-300", selectedIndex === index ? "bg-transparent" : "bg-white/30")} />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Fullscreen Lightbox */}
      {lightboxOpen && galleryImages[selectedIndex] && (
        <div
          ref={lightboxRef}
          className="fixed inset-0 bg-gik-void/95 z-50 flex items-center justify-center"
          onClick={closeLightbox}
        >
          <button onClick={closeLightbox} className="absolute top-6 right-6 z-50 text-white/50 hover:text-white transition-colors duration-300" aria-label="Close lightbox">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1">
              <path d="M4 4l12 12M16 4L4 16" />
            </svg>
          </button>

          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50">
            <span className="text-[10px] tracking-[0.15em] uppercase text-white/40 font-body">
              {selectedIndex + 1} / {galleryImages.length}
            </span>
          </div>

          <div ref={lightboxImageRef} className="relative w-[90vw] h-[85vh] max-w-5xl" onClick={(e) => e.stopPropagation()}>
            <Image src={galleryImages[selectedIndex]} alt={`${productName} — Full view ${selectedIndex + 1}`} fill sizes="90vw" className="object-contain" />
          </div>

          {galleryImages.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); goToPrev(); }}
                className="absolute left-6 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors duration-300 z-50"
                aria-label="Previous image"
              >
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1">
                  <path d="M17 21l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); goToNext(); }}
                className="absolute right-6 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors duration-300 z-50"
                aria-label="Next image"
              >
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="currentColor" strokeWidth="1">
                  <path d="M11 7l7 7-7 7" />
                </svg>
              </button>
            </>
          )}
        </div>
      )}
    </>
  );
}

export { ImageGallery };
