"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import gsap from "gsap";
import Link from "next/link";
import Image from "next/image";
import { X, Minus, Plus, ShoppingBag, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { products, type Product } from "@/lib/data/products";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const EASE_OUT_EXPO = "expo.out";
const FREE_SHIPPING_THRESHOLD = 5000;
const GST_RATE = 0.18;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CartItem {
  product: Product;
  quantity: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const formatPrice = (amount: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

// ---------------------------------------------------------------------------
// Animated Price (simplified – plain span, no animation needed for cart)
// ---------------------------------------------------------------------------

function AnimatedPrice({ amount, className }: { amount: number; className?: string }) {
  return (
    <span className={cn("inline-block", className)}>
      {formatPrice(amount)}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Empty State
// ---------------------------------------------------------------------------

function EmptyCart() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      gsap.fromTo(
        ref.current,
        { opacity: 0, y: 24 },
        { opacity: 1, y: 0, duration: 0.6, ease: EASE_OUT_EXPO }
      );
    }
  }, []);

  return (
    <div
      ref={ref}
      className="flex flex-col items-center justify-center py-24 text-center opacity-0"
    >
      <div className="w-20 h-20 rounded-full bg-gik-linen flex items-center justify-center mb-8">
        <ShoppingBag className="w-8 h-8 text-gik-stone" strokeWidth={1.5} />
      </div>
      <h2 className="font-display text-h3 font-light text-gik-void mb-3">
        Your selection is empty.
      </h2>
      <p className="text-sm text-gik-stone font-body max-w-md mb-10 leading-relaxed">
        Each piece in our collection carries a story of reclaimed beauty and conscious craft.
        We invite you to explore.
      </p>
      <Button href="/shop" variant="primary" size="default">
        BEGIN EXPLORING
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Cart Item Row
// ---------------------------------------------------------------------------

interface CartItemRowProps {
  item: CartItem;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemove: (productId: string) => void;
}

function CartItemRow({ item, onUpdateQuantity, onRemove }: CartItemRowProps) {
  const { product, quantity } = item;

  const categoryLabel: Record<string, string> = {
    utility: "GIK Utility",
    align: "GIK Align",
    panel: "GIK Panel",
  };

  const productImage = product.images?.[0];

  return (
    <div className="flex gap-3 md:gap-8 py-6 md:py-8 border-b border-gik-linen transition-opacity duration-300">
      {/* Product Image */}
      <div className="w-20 h-24 md:w-24 md:h-28 flex-shrink-0 bg-gik-linen overflow-hidden relative rounded-lg">
        {productImage ? (
          <Image
            src={productImage}
            alt={product.name}
            width={96}
            height={112}
            className="object-cover w-full h-full"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-caption text-gik-stone/60 font-body">GIK</span>
          </div>
        )}
      </div>

      {/* Details */}
      <div className="flex-1 flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        {/* Name & Meta */}
        <div className="flex-1 min-w-0">
          <Link
            href={`/shop/${product.category}/${product.slug}`}
            className="font-body font-medium text-sm text-gik-void hover:text-gik-earth transition-colors duration-300 block"
          >
            {product.name}
          </Link>
          <span className="text-[10px] tracking-[0.12em] uppercase text-gik-stone/50 font-body font-medium mt-1 block">
            {categoryLabel[product.category] ?? product.category}
          </span>
          <span className="text-xs text-gik-stone/70 font-body mt-0.5 block">
            {product.sku}
          </span>
        </div>

        {/* Quantity Controls */}
        <div className="flex items-center gap-0 border border-gik-linen select-none shrink-0">
          <button
            onClick={() => onUpdateQuantity(product.id, Math.max(1, quantity - 1))}
            className="w-10 h-10 flex items-center justify-center text-gik-stone hover:text-gik-void transition-all duration-200 hover:bg-gik-linen active:scale-90"
            aria-label="Decrease quantity"
          >
            <Minus className="w-3.5 h-3.5" strokeWidth={1.5} />
          </button>
          <span className="qty-display w-10 h-10 flex items-center justify-center text-sm font-body font-medium text-gik-void border-x border-gik-linen transition-transform duration-200">
            {quantity}
          </span>
          <button
            onClick={() => onUpdateQuantity(product.id, quantity + 1)}
            className="w-10 h-10 flex items-center justify-center text-gik-stone hover:text-gik-void transition-all duration-200 hover:bg-gik-linen active:scale-90"
            aria-label="Increase quantity"
          >
            <Plus className="w-3.5 h-3.5" strokeWidth={1.5} />
          </button>
        </div>

        {/* Price & Remove */}
        <div className="flex items-center gap-6 md:flex-col md:items-end md:gap-2 shrink-0 md:min-w-[120px]">
          <AnimatedPrice
            amount={product.price * quantity}
            className="text-sm font-body font-medium text-gik-void"
          />
          <button
            onClick={() => onRemove(product.id)}
            className="text-gik-stone hover:text-gik-error transition-colors duration-200 flex items-center gap-1.5 group"
            aria-label={`Remove ${product.name}`}
          >
            <X className="w-4 h-4" strokeWidth={1.5} />
            <span className="text-xs font-body hidden sm:inline group-hover:text-gik-error transition-colors duration-200">
              Remove
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Cart Page
// ---------------------------------------------------------------------------

export default function CartPage() {
  // Pre-populate with demo items
  const [cartItems, setCartItems] = useState<CartItem[]>([
    { product: products[0], quantity: 1 },
    { product: products[6], quantity: 1 },
    { product: products[13], quantity: 2 },
  ]);

  const [couponCode, setCouponCode] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponError, setCouponError] = useState("");

  // --- Refs for GSAP animations -----------------------------------------------

  const emptyHeaderRef = useRef<HTMLHeadingElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const couponRef = useRef<HTMLDivElement>(null);
  const couponMsgRef = useRef<HTMLParagraphElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);

  // --- Cart operations -------------------------------------------------------

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    setCartItems((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  }, []);

  const removeItem = useCallback((productId: string) => {
    setCartItems((prev) => prev.filter((item) => item.product.id !== productId));
  }, []);

  const handleApplyCoupon = useCallback(() => {
    setCouponError("");
    if (couponCode.toUpperCase() === "GIK10") {
      setCouponApplied(true);
    } else {
      setCouponError("Invalid coupon code");
      setCouponApplied(false);
    }
  }, [couponCode]);

  // --- Calculations ----------------------------------------------------------

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  const discount = couponApplied ? Math.round(subtotal * 0.1) : 0;
  const afterDiscount = subtotal - discount;
  const isFreeShipping = afterDiscount >= FREE_SHIPPING_THRESHOLD;
  const shipping = isFreeShipping ? 0 : 500;
  const gst = Math.round(afterDiscount * GST_RATE);
  const total = afterDiscount + shipping + gst;

  // --- GSAP entrance animations for full cart view ---------------------------

  useEffect(() => {
    if (cartItems.length > 0) {
      if (headerRef.current) {
        gsap.fromTo(
          headerRef.current,
          { opacity: 0, y: 16 },
          { opacity: 1, y: 0, duration: 0.6, ease: EASE_OUT_EXPO }
        );
      }
      if (couponRef.current) {
        gsap.fromTo(
          couponRef.current,
          { opacity: 0 },
          { opacity: 1, duration: 0.5, delay: 0.3, ease: EASE_OUT_EXPO }
        );
      }
      if (sidebarRef.current) {
        gsap.fromTo(
          sidebarRef.current,
          { opacity: 0, y: 24 },
          { opacity: 1, y: 0, duration: 0.6, delay: 0.2, ease: EASE_OUT_EXPO }
        );
      }
    }
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- GSAP entrance for empty state header ----------------------------------

  useEffect(() => {
    if (cartItems.length === 0 && emptyHeaderRef.current) {
      gsap.fromTo(
        emptyHeaderRef.current,
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.6, ease: EASE_OUT_EXPO }
      );
    }
  }, [cartItems.length]);

  // --- GSAP entrance for coupon applied message ------------------------------

  useEffect(() => {
    if (couponApplied && couponMsgRef.current) {
      gsap.fromTo(
        couponMsgRef.current,
        { opacity: 0, y: 4 },
        { opacity: 1, y: 0, duration: 0.3, ease: EASE_OUT_EXPO }
      );
    }
  }, [couponApplied]);

  // --- Empty state -----------------------------------------------------------

  if (cartItems.length === 0) {
    return (
      <section
        className="min-h-[80vh]"
        style={{ paddingTop: "var(--space-section)", paddingBottom: "var(--space-section)" }}
      >
        <div className="page-pad">
          <h1
            ref={emptyHeaderRef}
            className="font-display text-h1 font-light tracking-tight text-gik-void mb-4 opacity-0"
          >
            Your Selection
          </h1>
          <EmptyCart />
        </div>
      </section>
    );
  }

  // --- Full cart --------------------------------------------------------------

  return (
    <section
      style={{ paddingTop: "var(--space-section)", paddingBottom: "var(--space-section)" }}
    >
      <div className="page-pad">
        {/* Header */}
        <div
          ref={headerRef}
          className="mb-12 opacity-0"
        >
          <h1 className="font-display text-h1 font-light tracking-tight text-gik-void">
            Your Selection
          </h1>
          <p className="text-sm text-gik-stone mt-2 font-body">
            {cartItems.length} {cartItems.length === 1 ? "item" : "items"} in your selection
          </p>
        </div>

        <div className="lg:grid lg:grid-cols-12 lg:gap-16">
          {/* ---- Left: Cart Items ---- */}
          <div className="lg:col-span-7">
            {cartItems.map((item) => (
              <CartItemRow
                key={item.product.id}
                item={item}
                onUpdateQuantity={updateQuantity}
                onRemove={removeItem}
              />
            ))}

            {/* Coupon Code */}
            <div
              ref={couponRef}
              className="mt-8 flex gap-3 items-end max-w-md opacity-0"
            >
              <div className="flex-1">
                <Input
                  label="Coupon Code"
                  name="coupon"
                  value={couponCode}
                  onChange={(e) => {
                    setCouponCode(e.target.value);
                    setCouponError("");
                    if (couponApplied) setCouponApplied(false);
                  }}
                  error={couponError}
                />
              </div>
              <Button
                variant="secondary"
                size="small"
                onClick={handleApplyCoupon}
                className="mb-[1px] shrink-0"
              >
                APPLY
              </Button>
            </div>
            {couponApplied && (
              <p
                ref={couponMsgRef}
                className="text-xs text-gik-success mt-2 font-body opacity-0"
              >
                Coupon GIK10 applied — 10% discount
              </p>
            )}

            {/* Continue Shopping */}
            <div className="mt-10">
              <Button href="/shop" variant="ghost">
                Continue Shopping <ArrowRight className="inline w-4 h-4 ml-1.5" />
              </Button>
            </div>
          </div>

          {/* ---- Right: Price Breakdown ---- */}
          <div
            ref={sidebarRef}
            className="lg:col-span-5 mt-12 lg:mt-0 opacity-0"
          >
            <div className="bg-gik-linen p-8 lg:sticky lg:top-24">
              <h2 className="text-label text-gik-void mb-8">ORDER SUMMARY</h2>

              {/* Line items summary */}
              <div className="space-y-3 mb-6">
                {cartItems.map((item) => (
                  <div
                    key={item.product.id}
                    className="flex items-start justify-between gap-4 text-sm font-body"
                  >
                    <span className="text-gik-void/80">
                      {item.product.name}
                      {item.quantity > 1 && (
                        <span className="text-gik-stone ml-1.5">&times; {item.quantity}</span>
                      )}
                    </span>
                    <AnimatedPrice
                      amount={item.product.price * item.quantity}
                      className="text-gik-void shrink-0"
                    />
                  </div>
                ))}
              </div>

              <div className="border-t border-gik-stone/20 pt-6 space-y-4">
                {/* Subtotal */}
                <div className="flex justify-between text-sm font-body">
                  <span className="text-gik-stone">Subtotal</span>
                  <AnimatedPrice amount={subtotal} className="text-gik-void" />
                </div>

                {/* Discount */}
                {couponApplied && discount > 0 && (
                  <div className="flex justify-between text-sm font-body">
                    <span className="text-gik-success">Discount (10%)</span>
                    <span className="text-gik-success">-{formatPrice(discount)}</span>
                  </div>
                )}

                {/* Shipping */}
                <div className="flex justify-between text-sm font-body">
                  <span className="text-gik-stone">Shipping</span>
                  <span className="text-gik-void">
                    {isFreeShipping ? (
                      <span className="text-gik-earth italic font-display">Complimentary</span>
                    ) : (
                      formatPrice(shipping)
                    )}
                  </span>
                </div>

                {/* GST */}
                <div className="flex justify-between text-sm font-body">
                  <span className="text-gik-stone">GST (18%)</span>
                  <AnimatedPrice amount={gst} className="text-gik-void" />
                </div>

                {/* Divider */}
                <div className="border-t border-gik-stone/30" />

                {/* Total */}
                <div className="flex justify-between items-baseline">
                  <span className="text-sm font-body font-medium text-gik-void">Total</span>
                  <AnimatedPrice
                    amount={total}
                    className="font-body font-medium text-lg text-gik-void"
                  />
                </div>
              </div>

              {/* CTA */}
              <div className="mt-8">
                <Button href="/checkout" variant="primary" size="large" className="w-full">
                  PROCEED TO CHECKOUT
                </Button>
              </div>

              {/* Trust signals */}
              <p className="text-xs text-gik-stone text-center mt-6 font-body leading-relaxed">
                Secure checkout &middot; Free returns &middot; SSL encrypted
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
