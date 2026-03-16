"use client";

import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Minus, Plus, Heart, Share2, Check } from "lucide-react";
import type { Product } from "@/lib/data/products";

const categoryLabels: Record<string, string> = {
  utility: "GIK UTILITY",
  align: "GIK ALIGN\u2122",
  panel: "GIK PANEL",
};

function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

interface ProductInfoProps {
  product: Product;
}

export function ProductInfo({ product }: ProductInfoProps) {
  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const handleAddToCart = useCallback(() => {
    if (isAdded) return;
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  }, [isAdded]);

  const handleShare = useCallback(() => {
    if (typeof navigator !== "undefined" && navigator.share) {
      navigator.share({ title: product.name, text: product.description, url: window.location.href });
    } else if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
    }
  }, [product.name, product.description]);

  return (
    <div className="lg:sticky lg:top-24 max-w-lg">
      <div className="space-y-0">
        {/* Category + Limited badge */}
        <p className="text-caption text-gik-stone font-body font-medium mb-3">
          {categoryLabels[product.category] || product.category.toUpperCase()}
          {product.isLimited && product.limitedEdition && (
            <span className="ml-3 text-gik-earth">Limited Edition &mdash; {product.limitedEdition} pieces</span>
          )}
        </p>

        <h1 className="font-display text-h2 font-light text-gik-void mb-3">{product.name}</h1>
        <p className="font-display italic text-gik-stone text-base md:text-lg leading-relaxed">{product.description}</p>

        <div className="border-b border-gik-linen my-6" />

        {/* Price */}
        <p className="text-xl font-display font-light text-gik-void">{formatPrice(product.price)}</p>
        <p className="text-[11px] text-gik-stone/70 font-body mt-1.5 tracking-[0.02em] mb-8">
          Tax included. Complimentary shipping.
        </p>

        {/* Product details grid */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          <div className="bento-card-sm bg-gik-linen/50 p-3">
            <p className="text-[10px] text-gik-stone uppercase tracking-[0.06em] font-body mb-1">Material</p>
            <p className="text-[13px] text-gik-void font-body line-clamp-2">{product.material.split(" with")[0]}</p>
          </div>
          <div className="bento-card-sm bg-gik-linen/50 p-3">
            <p className="text-[10px] text-gik-stone uppercase tracking-[0.06em] font-body mb-1">Origin</p>
            <p className="text-[13px] text-gik-void font-body">{product.origin.replace("Crafted in ", "")}</p>
          </div>
          <div className="bento-card-sm bg-gik-linen/50 p-3">
            <p className="text-[10px] text-gik-stone uppercase tracking-[0.06em] font-body mb-1">Dimensions</p>
            <p className="text-[13px] text-gik-void font-body">
              {product.dimensions.length} &times; {product.dimensions.width} &times; {product.dimensions.height} cm
            </p>
          </div>
          <div className="bento-card-sm bg-gik-linen/50 p-3">
            <p className="text-[10px] text-gik-stone uppercase tracking-[0.06em] font-body mb-1">Weight</p>
            <p className="text-[13px] text-gik-void font-body">{product.dimensions.weight} kg</p>
          </div>
        </div>

        {/* Quantity selector */}
        <div className="flex items-center mb-5">
          <div className="inline-flex items-center border border-gik-earth/20 rounded-full overflow-hidden">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className={cn(
                "w-11 h-11 flex items-center justify-center text-gik-void transition-colors hover:bg-gik-linen focus:outline-none disabled:opacity-30 disabled:pointer-events-none"
              )}
              style={{ transitionDuration: "var(--duration-fast)", transitionTimingFunction: "var(--ease-out-expo)" }}
              disabled={quantity <= 1}
              aria-label="Decrease quantity"
            >
              <Minus size={13} strokeWidth={1.5} />
            </button>
            <span className="w-11 h-11 flex items-center justify-center text-[13px] font-body font-medium text-gik-void select-none border-x border-gik-earth/20">
              {quantity}
            </span>
            <button
              onClick={() => setQuantity((q) => Math.min(10, q + 1))}
              className={cn(
                "w-11 h-11 flex items-center justify-center text-gik-void transition-colors hover:bg-gik-linen focus:outline-none disabled:opacity-30 disabled:pointer-events-none"
              )}
              style={{ transitionDuration: "var(--duration-fast)", transitionTimingFunction: "var(--ease-out-expo)" }}
              disabled={quantity >= 10}
              aria-label="Increase quantity"
            >
              <Plus size={13} strokeWidth={1.5} />
            </button>
          </div>
        </div>

        {/* Add to Cart — full-width gold rounded button */}
        <button
          onClick={handleAddToCart}
          disabled={!product.inStock}
          className={cn(
            "w-full h-[50px] rounded-full font-body font-medium text-[12px] tracking-[0.08em] uppercase transition-all duration-500",
            "flex items-center justify-center",
            product.inStock
              ? "bg-gik-gold text-gik-void hover:bg-gik-earth hover:text-gik-canvas"
              : "bg-gik-stone/20 text-gik-stone cursor-not-allowed"
          )}
          style={{ transitionTimingFunction: "var(--ease-out-expo)" }}
        >
          {isAdded ? (
            <span className="inline-flex items-center gap-2"><Check size={15} strokeWidth={2} />Added to Cart</span>
          ) : product.inStock ? "Add to Cart" : "Out of Stock"}
        </button>

        {/* Save / Share */}
        <div className="flex items-center gap-6 mt-5">
          <button
            onClick={() => setIsSaved((s) => !s)}
            className={cn(
              "inline-flex items-center gap-2 text-[13px] font-body transition-colors",
              isSaved ? "text-gik-earth" : "text-gik-stone hover:text-gik-void"
            )}
            style={{ transitionDuration: "var(--duration-fast)", transitionTimingFunction: "var(--ease-out-expo)" }}
          >
            <Heart size={15} strokeWidth={1.5} className={cn(isSaved && "fill-gik-earth")} />
            {isSaved ? "Saved" : "Save"}
          </button>
          <button
            onClick={handleShare}
            className="inline-flex items-center gap-2 text-[13px] text-gik-stone font-body transition-colors hover:text-gik-void"
            style={{ transitionDuration: "var(--duration-fast)", transitionTimingFunction: "var(--ease-out-expo)" }}
          >
            <Share2 size={15} strokeWidth={1.5} />
            Share
          </button>
        </div>

        <div className="border-b border-gik-linen my-6" />

        {/* Status */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className={cn("w-1.5 h-1.5 rounded-full", product.inStock ? "bg-gik-success" : "bg-gik-error")} />
            <span className="text-[13px] font-body text-gik-void/70">{product.inStock ? "In Stock" : "Out of Stock"}</span>
          </div>
          <p className="text-[13px] text-gik-void/70 font-body">Estimated delivery: 5&ndash;7 business days</p>
          <p className="text-[11px] text-gik-stone/60 font-body tracking-[0.02em]">SKU: {product.sku}</p>
        </div>
      </div>
    </div>
  );
}

export default ProductInfo;
