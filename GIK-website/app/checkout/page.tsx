"use client";

import { useState, useCallback, useRef, useEffect, type ChangeEvent, type FormEvent } from "react";
import gsap from "gsap";
import Image from "next/image";
import { Check, Lock, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { products, type Product } from "@/lib/data/products";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const GSAP_EASE = "expo.out";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CartItem {
  product: Product;
  quantity: number;
}

interface InformationForm {
  email: string;
  phone: string;
}

interface ShippingForm {
  fullName: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  pinCode: string;
}

type PaymentMethod = "upi" | "card" | "netbanking" | "wallet";

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const STEPS = [
  { number: 1, label: "INFORMATION" },
  { number: 2, label: "SHIPPING" },
  { number: 3, label: "PAYMENT" },
] as const;

const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Delhi",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
];

const PAYMENT_OPTIONS: { id: PaymentMethod; label: string; description: string }[] = [
  { id: "upi", label: "UPI", description: "Google Pay, PhonePe, Paytm UPI" },
  { id: "card", label: "Credit / Debit Card", description: "Visa, Mastercard, RuPay" },
  { id: "netbanking", label: "Net Banking", description: "All major Indian banks" },
  { id: "wallet", label: "Wallet", description: "Paytm, Amazon Pay, MobiKwik" },
];

const GST_RATE = 0.18;

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
// Step Indicator
// ---------------------------------------------------------------------------

function StepIndicator({
  stepNumber,
  label,
  isActive,
  isCompleted,
  onClick,
}: {
  stepNumber: number;
  label: string;
  isActive: boolean;
  isCompleted: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 transition-all duration-300",
        isActive || isCompleted ? "opacity-100" : "opacity-40"
      )}
      aria-current={isActive ? "step" : undefined}
    >
      <span
        className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center text-xs font-body font-medium transition-all duration-300",
          isActive
            ? "bg-gik-void text-gik-canvas"
            : isCompleted
              ? "bg-gik-gold text-gik-canvas"
              : "border border-gik-stone text-gik-stone"
        )}
      >
        {isCompleted ? <Check className="w-3.5 h-3.5" strokeWidth={2} /> : stepNumber}
      </span>
      <span
        className={cn(
          "text-[10px] tracking-[0.12em] uppercase font-body font-medium hidden sm:block",
          isActive ? "text-gik-void" : isCompleted ? "text-gik-gold" : "text-gik-stone"
        )}
      >
        {label}
      </span>
      {stepNumber < 3 && (
        <div className="hidden sm:block w-8 h-px bg-gik-stone/30" />
      )}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Step 1 - Information
// ---------------------------------------------------------------------------

function InformationStep({
  form,
  onChange,
  onNext,
}: {
  form: InformationForm;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onNext: () => void;
}) {
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onNext();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-8"
    >
      <div>
        <h2 className="font-display text-h3 font-light text-gik-void mb-1">
          Contact Information
        </h2>
        <p className="text-sm text-gik-stone font-body">
          We will use these details to keep you informed about your order.
        </p>
      </div>

      <div className="space-y-6">
        <Input
          label="Email Address"
          name="email"
          type="email"
          required
          value={form.email}
          onChange={onChange}
        />
        <Input
          label="Phone Number"
          name="phone"
          type="tel"
          required
          value={form.phone}
          onChange={onChange}
        />
      </div>

      <div className="pt-4">
        <Button variant="primary" size="default" type="submit" className="w-full sm:w-auto">
          CONTINUE
        </Button>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Step 2 - Shipping
// ---------------------------------------------------------------------------

function ShippingStep({
  form,
  onChange,
  onStateChange,
  onNext,
  onBack,
}: {
  form: ShippingForm;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onStateChange: (value: string) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onNext();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-8"
    >
      <div>
        <h2 className="font-display text-h3 font-light text-gik-void mb-1">
          Shipping Address
        </h2>
        <p className="text-sm text-gik-stone font-body">
          Where should we deliver your selection?
        </p>
      </div>

      <div className="space-y-6">
        <Input
          label="Full Name"
          name="fullName"
          required
          value={form.fullName}
          onChange={onChange}
        />
        <Input
          label="Address Line 1"
          name="address1"
          required
          value={form.address1}
          onChange={onChange}
        />
        <Input
          label="Address Line 2"
          name="address2"
          value={form.address2}
          onChange={onChange}
        />
        <Input
          label="City"
          name="city"
          required
          value={form.city}
          onChange={onChange}
        />

        {/* State Dropdown (styled as bottom-border to match Input) */}
        <div className="relative">
          <select
            name="state"
            value={form.state}
            onChange={(e) => onStateChange(e.target.value)}
            required
            className={cn(
              "w-full h-14 bg-transparent border-0 border-b px-0 pt-5 pb-2",
              "font-body text-sm text-gik-void",
              "outline-none transition-colors duration-300 appearance-none cursor-pointer",
              form.state
                ? "border-gik-void"
                : "border-gik-stone focus:border-gik-void"
            )}
          >
            <option value="" disabled>
              Select State
            </option>
            {INDIAN_STATES.map((state) => (
              <option key={state} value={state}>
                {state}
              </option>
            ))}
          </select>
          <label
            className={cn(
              "absolute left-0 font-body transition-all duration-300 pointer-events-none",
              form.state
                ? "top-1 text-[10px] tracking-[0.1em] uppercase text-gik-void"
                : "top-1 text-[10px] tracking-[0.1em] uppercase text-gik-stone"
            )}
          >
            State *
          </label>
          <ChevronRight
            className="absolute right-1 top-1/2 -translate-y-1/2 w-4 h-4 text-gik-stone rotate-90 pointer-events-none"
            strokeWidth={1.5}
          />
        </div>

        <Input
          label="PIN Code"
          name="pinCode"
          type="text"
          required
          value={form.pinCode}
          onChange={onChange}
        />
      </div>

      <div className="pt-4 flex flex-col sm:flex-row gap-4">
        <Button variant="primary" size="default" type="submit" className="w-full sm:w-auto">
          CONTINUE
        </Button>
        <Button variant="ghost" size="default" type="button" onClick={onBack}>
          Back
        </Button>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Step 3 - Payment
// ---------------------------------------------------------------------------

function PaymentStep({
  selectedMethod,
  onMethodChange,
  onPlaceOrder,
  onBack,
  isSubmitting,
}: {
  selectedMethod: PaymentMethod;
  onMethodChange: (method: PaymentMethod) => void;
  onPlaceOrder: () => void;
  onBack: () => void;
  isSubmitting: boolean;
}) {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-h3 font-light text-gik-void mb-1">
          Payment Method
        </h2>
        <p className="text-sm text-gik-stone font-body">
          Choose your preferred payment method.
        </p>
      </div>

      <div className="space-y-3">
        {PAYMENT_OPTIONS.map((option) => (
          <label
            key={option.id}
            className={cn(
              "flex items-center gap-4 p-5 border cursor-pointer transition-all duration-300",
              selectedMethod === option.id
                ? "border-gik-void bg-gik-linen"
                : "border-gik-stone/20 hover:border-gik-stone"
            )}
          >
            {/* Custom Radio */}
            <span
              className={cn(
                "w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-300",
                selectedMethod === option.id
                  ? "border-gik-gold"
                  : "border-gik-stone"
              )}
            >
              <span
                className={cn(
                  "w-2.5 h-2.5 rounded-full bg-gik-gold transition-transform duration-200 ease-out",
                  selectedMethod === option.id ? "scale-100" : "scale-0"
                )}
              />
            </span>
            <input
              type="radio"
              name="payment"
              value={option.id}
              checked={selectedMethod === option.id}
              onChange={() => onMethodChange(option.id)}
              className="sr-only"
            />
            <div>
              <span className="text-sm font-body font-medium text-gik-void block">
                {option.label}
              </span>
              <span className="text-xs text-gik-stone font-body">
                {option.description}
              </span>
            </div>
          </label>
        ))}
      </div>

      {/* Secure checkout badge */}
      <div className="flex items-center gap-2 text-xs text-gik-stone font-body">
        <Lock className="w-3.5 h-3.5" strokeWidth={1.5} />
        <span>Your payment information is encrypted and secure</span>
      </div>

      <div className="pt-4 flex flex-col sm:flex-row gap-4">
        <Button
          variant="primary"
          size="default"
          onClick={onPlaceOrder}
          disabled={isSubmitting}
          className="w-full sm:w-auto"
        >
          {isSubmitting ? "PROCESSING..." : "PLACE ORDER"}
        </Button>
        <Button variant="ghost" size="default" onClick={onBack}>
          Back
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Order Confirmation
// ---------------------------------------------------------------------------

function OrderConfirmation() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      gsap.fromTo(
        ref.current,
        { opacity: 0, scale: 0.96 },
        { opacity: 1, scale: 1, duration: 0.6, ease: GSAP_EASE }
      );
    }
  }, []);

  return (
    <div
      ref={ref}
      className="text-center py-16 lg:py-24"
      style={{ opacity: 0 }}
    >
      <div className="w-16 h-16 rounded-full bg-gik-gold flex items-center justify-center mx-auto mb-8">
        <Check className="w-7 h-7 text-gik-canvas" strokeWidth={2} />
      </div>
      <h2 className="font-display text-h2 font-light text-gik-void mb-3">
        Thank You
      </h2>
      <p className="text-sm text-gik-stone font-body max-w-md mx-auto leading-relaxed mb-2">
        Your order has been placed. We will send a confirmation to your email with
        tracking details shortly.
      </p>
      <p className="text-xs text-gik-stone/70 font-body mb-10">
        Order #GIK-{Math.random().toString(36).substring(2, 8).toUpperCase()}
      </p>
      <Button href="/shop" variant="primary">
        CONTINUE SHOPPING
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Order Summary Sidebar
// ---------------------------------------------------------------------------

function OrderSummary({ items }: { items: CartItem[] }) {
  const subtotal = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );
  const gst = Math.round(subtotal * GST_RATE);
  const total = subtotal + gst;

  return (
    <div className="bg-gik-linen p-8 lg:sticky lg:top-24">
      <h2 className="text-label text-gik-void mb-8">ORDER SUMMARY</h2>

      {/* Items */}
      <div className="space-y-5 mb-6">
        {items.map((item) => {
          const productImage = item.product.images?.[0];
          return (
            <div key={item.product.id} className="flex gap-4">
              {/* Product Image */}
              <div className="w-16 h-20 bg-gik-stone/10 flex-shrink-0 overflow-hidden relative">
                {productImage ? (
                  <Image
                    src={productImage}
                    alt={item.product.name}
                    width={64}
                    height={80}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-[9px] text-gik-stone/50 font-body uppercase tracking-wider">
                      GIK
                    </span>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-body font-medium text-gik-void leading-snug truncate">
                  {item.product.name}
                </p>
                <p className="text-xs text-gik-stone font-body mt-0.5">
                  Qty: {item.quantity}
                </p>
                <p className="text-sm font-body text-gik-void mt-1">
                  {formatPrice(item.product.price * item.quantity)}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Divider */}
      <div className="border-t border-gik-stone/20 pt-5 space-y-3">
        <div className="flex justify-between text-sm font-body">
          <span className="text-gik-stone">Subtotal</span>
          <span className="text-gik-void">{formatPrice(subtotal)}</span>
        </div>
        <div className="flex justify-between text-sm font-body">
          <span className="text-gik-stone">Shipping</span>
          <span className="text-gik-earth italic font-display">Complimentary</span>
        </div>
        <div className="flex justify-between text-sm font-body">
          <span className="text-gik-stone">GST (18%)</span>
          <span className="text-gik-void">{formatPrice(gst)}</span>
        </div>
        <div className="border-t border-gik-stone/30 pt-3">
          <div className="flex justify-between items-baseline">
            <span className="text-sm font-body font-medium text-gik-void">Total</span>
            <span className="font-body font-medium text-lg text-gik-void">
              {formatPrice(total)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Checkout Page
// ---------------------------------------------------------------------------

export default function CheckoutPage() {
  // Mock cart items (same as cart for demo)
  const [orderItems] = useState<CartItem[]>([
    { product: products[0], quantity: 1 },
    { product: products[6], quantity: 1 },
    { product: products[13], quantity: 2 },
  ]);

  // Step state
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [informationForm, setInformationForm] = useState<InformationForm>({
    email: "",
    phone: "",
  });

  const [shippingForm, setShippingForm] = useState<ShippingForm>({
    fullName: "",
    address1: "",
    address2: "",
    city: "",
    state: "",
    pinCode: "",
  });

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("upi");

  // Refs for GSAP animations
  const headerRef = useRef<HTMLDivElement>(null);
  const stepIndicatorRef = useRef<HTMLDivElement>(null);
  const stepContentRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);

  // --- Entrance animations (header, step indicator, sidebar) ----------------

  useEffect(() => {
    if (headerRef.current) {
      gsap.fromTo(
        headerRef.current,
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.6, ease: GSAP_EASE }
      );
    }
    if (stepIndicatorRef.current) {
      gsap.fromTo(
        stepIndicatorRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.5, delay: 0.15, ease: GSAP_EASE }
      );
    }
    if (sidebarRef.current) {
      gsap.fromTo(
        sidebarRef.current,
        { opacity: 0, y: 24 },
        { opacity: 1, y: 0, duration: 0.6, delay: 0.2, ease: GSAP_EASE }
      );
    }
  }, []);

  // --- Step transition animation --------------------------------------------

  useEffect(() => {
    if (stepContentRef.current) {
      gsap.fromTo(
        stepContentRef.current,
        { opacity: 0, x: 30, scale: 0.98 },
        { opacity: 1, x: 0, scale: 1, duration: 0.5, ease: GSAP_EASE }
      );
    }
  }, [currentStep]);

  // --- Form handlers ---------------------------------------------------------

  const handleInformationChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setInformationForm((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleShippingChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setShippingForm((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleStateChange = useCallback((value: string) => {
    setShippingForm((prev) => ({ ...prev, state: value }));
  }, []);

  const handlePlaceOrder = useCallback(() => {
    setIsSubmitting(true);
    // Simulate processing
    setTimeout(() => {
      setIsSubmitting(false);
      setOrderPlaced(true);
    }, 1800);
  }, []);

  const goToStep = useCallback(
    (step: 1 | 2 | 3) => {
      // Only allow going back or to completed steps
      if (step < currentStep) {
        setCurrentStep(step);
      }
    },
    [currentStep]
  );

  // --- Order placed state ----------------------------------------------------

  if (orderPlaced) {
    return (
      <section
        className="min-h-[80vh]"
        style={{ paddingTop: "var(--space-section)", paddingBottom: "var(--space-section)" }}
      >
        <div className="page-pad">
          <OrderConfirmation />
        </div>
      </section>
    );
  }

  // --- Checkout form ---------------------------------------------------------

  return (
    <section
      style={{ paddingTop: "var(--space-section)", paddingBottom: "var(--space-section)" }}
    >
      <div className="page-pad">
        {/* Header */}
        <div
          ref={headerRef}
          className="mb-12"
          style={{ opacity: 0 }}
        >
          <h1 className="font-display text-h1 font-light tracking-tight text-gik-void">
            Checkout
          </h1>
        </div>

        <div className="lg:grid lg:grid-cols-5 lg:gap-16">
          {/* ---- Left: Form (3 cols) ---- */}
          <div className="lg:col-span-3">
            {/* Step Indicators */}
            <div
              ref={stepIndicatorRef}
              className="flex items-center gap-2 sm:gap-4 mb-12 pb-8 border-b border-gik-linen"
              style={{ opacity: 0 }}
            >
              {STEPS.map((step) => (
                <StepIndicator
                  key={step.number}
                  stepNumber={step.number}
                  label={step.label}
                  isActive={currentStep === step.number}
                  isCompleted={currentStep > step.number}
                  onClick={() => goToStep(step.number as 1 | 2 | 3)}
                />
              ))}
            </div>

            {/* Form Steps */}
            <div ref={stepContentRef}>
              {currentStep === 1 && (
                <InformationStep
                  form={informationForm}
                  onChange={handleInformationChange}
                  onNext={() => setCurrentStep(2)}
                />
              )}
              {currentStep === 2 && (
                <ShippingStep
                  form={shippingForm}
                  onChange={handleShippingChange}
                  onStateChange={handleStateChange}
                  onNext={() => setCurrentStep(3)}
                  onBack={() => setCurrentStep(1)}
                />
              )}
              {currentStep === 3 && (
                <PaymentStep
                  selectedMethod={paymentMethod}
                  onMethodChange={setPaymentMethod}
                  onPlaceOrder={handlePlaceOrder}
                  onBack={() => setCurrentStep(2)}
                  isSubmitting={isSubmitting}
                />
              )}
            </div>
          </div>

          {/* ---- Right: Order Summary (2 cols) ---- */}
          <div
            ref={sidebarRef}
            className="lg:col-span-2 mt-16 lg:mt-0"
            style={{ opacity: 0 }}
          >
            <OrderSummary items={orderItems} />

            {/* Trust signals */}
            <p className="text-xs text-gik-stone text-center mt-6 font-body leading-relaxed">
              Secure checkout &middot; Free returns &middot; SSL encrypted
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
