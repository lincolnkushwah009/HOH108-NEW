"use client";

import dynamic from "next/dynamic";
import { AmbientGradient } from "@/components/effects/AmbientGradient";
import type { Category } from "@/lib/data/products";

const ParticleField = dynamic(
  () => import("@/components/effects/ParticleField").then((m) => m.ParticleField),
  { ssr: false }
);

interface CategoryConfig {
  particleColor: string;
  particleCount: number;
  videoSrc: string;
  videoPoster: string;
  gradientColors: string[];
  mood: string;
}

const categoryConfigs: Record<Category, CategoryConfig> = {
  utility: {
    particleColor: "#5a5147",
    particleCount: 400,
    videoSrc: "https://cdn.coverr.co/videos/coverr-hands-of-a-potter-making-a-clay-pot-1901/1080p.mp4",
    videoPoster: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1920&q=80",
    gradientColors: ["#5a5147", "#9f9689", "#4d3d30"],
    mood: "industrial-minimal",
  },
  align: {
    particleColor: "#b89d6f",
    particleCount: 500,
    videoSrc: "https://cdn.coverr.co/videos/coverr-burning-incense-stick-2391/1080p.mp4",
    videoPoster: "https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=1920&q=80",
    gradientColors: ["#b89d6f", "#4d3d30", "#9f9689"],
    mood: "sacred-spiritual",
  },
  panel: {
    particleColor: "#2c2824",
    particleCount: 400,
    videoSrc: "https://cdn.coverr.co/videos/coverr-hands-of-a-potter-making-a-clay-pot-1901/1080p.mp4",
    videoPoster: "https://images.unsplash.com/photo-1572025442646-866d16c84a54?w=1920&q=80",
    gradientColors: ["#2c2824", "#b89d6f", "#4d3d30"],
    mood: "art-deco-bold",
  },
};

interface CategoryEnvironmentProps {
  category: Category;
  className?: string;
}

export function CategoryEnvironment({ category, className }: CategoryEnvironmentProps) {
  const config = categoryConfigs[category];
  if (!config) return null;

  return (
    <div className={className || "absolute inset-0 pointer-events-none"}>
      <AmbientGradient
        colors={config.gradientColors}
        speed={0.0003}
        opacity={0.12}
      />
      <ParticleField
        color={config.particleColor}
        count={config.particleCount}
        speed={0.015}
        className="pointer-events-none absolute inset-0 three-desktop-only"
      />
    </div>
  );
}

export { categoryConfigs };
export type { CategoryConfig };
