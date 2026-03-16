"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";
import type { Product } from "@/lib/data/products";

const categoryLabels: Record<string, string> = {
  utility: "GIK Utility",
  align: "GIK Align",
  panel: "GIK Panel",
};

function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

interface ProductCardProps {
  product: Product;
  className?: string;
}

export default function ProductCard({ product, className }: ProductCardProps) {
  return (
    <div
      className={cn(
        "group transition-transform duration-500",
        "hover:-translate-y-1",
        className
      )}
      style={{ transitionTimingFunction: "var(--ease-out-expo)" }}
    >
      <Link href={`/shop/${product.category}/${product.slug}`} className="block">
        {/* Image Container */}
        <div
          className="relative aspect-[4/5] overflow-hidden bg-gik-linen transition-shadow duration-500 group-hover:shadow-[0_20px_60px_rgba(27,24,22,0.12)]"
        >
          {product.images[0] ? (
            <>
              {/* Primary Image */}
              <Image
                src={product.images[0]}
                alt={product.name}
                fill
                sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 33vw"
                className={cn(
                  "object-cover",
                  "transition-transform duration-[850ms]",
                  "group-hover:scale-[1.04]"
                )}
                style={{ transitionTimingFunction: "var(--ease-out-expo)" }}
              />

              {/* Secondary Image — crossfade on hover */}
              {product.images[1] && (
                <Image
                  src={product.images[1]}
                  alt={`${product.name} — alternate view`}
                  fill
                  sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 33vw"
                  className={cn(
                    "object-cover absolute inset-0",
                    "opacity-0 group-hover:opacity-100",
                    "transition-opacity duration-[600ms] ease-out"
                  )}
                />
              )}

              {/* Quick View label — hover-slide dual-layer */}
              <div
                className={cn(
                  "absolute inset-x-0 bottom-0",
                  "flex items-end justify-center pb-5",
                  "bg-gradient-to-t from-gik-void/30 via-transparent to-transparent",
                  "opacity-0 group-hover:opacity-100",
                  "transition-opacity duration-500 ease-out",
                  "pointer-events-none"
                )}
              >
                <span className="hover-slide text-[10px] tracking-[0.1em] uppercase text-white/90 font-body font-medium">
                  <span className="hover-slide__primary">Quick View</span>
                  <span className="hover-slide__clone" aria-hidden="true">Quick View</span>
                </span>
              </div>
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-gik-stone/50 text-[10px] tracking-[0.15em] uppercase font-body">
                {product.name}
              </span>
            </div>
          )}
        </div>

        {/* Product Details */}
        <div className="mt-3 space-y-0.5">
          <p className="text-[10px] tracking-[0.08em] uppercase text-gik-stone font-body font-medium">
            {categoryLabels[product.category] || product.category}
            {product.isLimited && (
              <span className="ml-2 text-gik-earth">Limited Edition</span>
            )}
          </p>
          <h3 className="font-body text-[13px] font-medium text-gik-void leading-snug">
            {product.name}
          </h3>
          <p className="text-[13px] text-gik-stone font-body">
            {formatPrice(product.price)}
          </p>
        </div>
      </Link>
    </div>
  );
}

export { ProductCard };
