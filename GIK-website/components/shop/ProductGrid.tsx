"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { ProductCard } from "@/components/ui/ProductCard";
import type { Product } from "@/lib/data/products";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { perspective3DEntrance } from "@/lib/animations";

gsap.registerPlugin(ScrollTrigger);

interface ProductGridProps {
  products: Product[];
  columns?: 2 | 3;
}

export default function ProductGrid({ products, columns = 3 }: ProductGridProps) {
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!gridRef.current) return;

    const ctx = gsap.context(() => {
      const items = gridRef.current!.children;
      perspective3DEntrance(items, {
        rotateX: -10,
        fromScale: 0.92,
        stagger: 0.08,
        scrollTrigger: {
          trigger: gridRef.current,
          start: "top 85%",
          once: true,
        },
      });
    }, gridRef);

    return () => ctx.revert();
  }, [products, columns]);

  return (
    <div
      ref={gridRef}
      key={products.map((p) => p.id).join(",")}
      className={cn(
        "grid grid-cols-2 gap-x-3 md:gap-x-6 gap-y-8 md:gap-y-10",
        columns === 3 && "lg:grid-cols-3",
        columns === 2 && "lg:grid-cols-2"
      )}
      style={{ perspective: "1200px" }}
    >
      {products.map((product) => (
        <div key={product.id} style={{ opacity: 0 }}>
          <ProductCard product={product} />
        </div>
      ))}
    </div>
  );
}

export { ProductGrid };
