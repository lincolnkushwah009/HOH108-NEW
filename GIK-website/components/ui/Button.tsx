"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";

interface ButtonProps {
  variant?: "primary" | "secondary" | "ghost";
  size?: "small" | "default" | "large";
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
  href?: string;
  type?: "button" | "submit" | "reset";
}

export function Button({
  variant = "primary",
  size = "default",
  children,
  className,
  disabled,
  onClick,
  href,
  type = "button",
}: ButtonProps) {
  const baseStyles =
    "relative inline-flex items-center justify-center font-body font-medium transition-all";

  const sizes = {
    small: "h-[max(32px,2.2rem)] px-5 text-[10px] tracking-[0.08em] uppercase",
    default: "h-[max(38px,2.8rem)] px-7 text-[11px] tracking-[0.08em] uppercase",
    large: "h-[max(44px,3.2rem)] px-9 text-[12px] tracking-[0.08em] uppercase",
  };

  const variants = {
    primary:
      "bg-gik-void text-gik-canvas rounded-full overflow-hidden hover:bg-gik-earth",
    secondary:
      "border border-gik-earth/25 text-gik-void rounded-full overflow-hidden hover:bg-gik-void hover:text-gik-canvas hover:border-gik-void",
    ghost: "bg-transparent text-gik-void p-0 h-auto",
  };

  const transitionStyle = {
    transitionDuration: "var(--duration-slow)",
    transitionTimingFunction: "var(--ease-out-expo)",
  };

  /* Primary & Secondary: text-slide effect via CSS class */
  /* Ghost: animated underline via .link-hover from globals.css */
  const content =
    variant === "ghost" ? (
      <span className="link-hover">{children}</span>
    ) : (
      <>
        <span
          className="btn-text block transition-transform"
          style={transitionStyle}
        >
          {children}
        </span>
        <span
          className="btn-text-hover absolute inset-0 flex items-center justify-center translate-y-full transition-transform"
          style={transitionStyle}
        >
          {children}
        </span>
      </>
    );

  const classes = cn(
    baseStyles,
    variant !== "ghost" && sizes[size],
    variants[variant],
    variant !== "ghost" && "btn-text-slide",
    disabled && "opacity-40 pointer-events-none",
    className
  );

  if (href) {
    return (
      <Link href={href} className={classes} style={variant !== "ghost" ? transitionStyle : undefined}>
        {content}
      </Link>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={classes}
      style={variant !== "ghost" ? transitionStyle : undefined}
    >
      {content}
    </button>
  );
}

export default Button;
