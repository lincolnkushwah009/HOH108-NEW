"use client";

import { cn } from "@/lib/utils";
import { useState, type ChangeEvent } from "react";

interface InputProps {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  value?: string;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  className?: string;
}

export function Input({
  label,
  name,
  type = "text",
  required = false,
  value,
  onChange,
  error,
  className,
}: InputProps) {
  const [focused, setFocused] = useState(false);
  const hasValue = value !== undefined && value !== "";
  const isActive = focused || hasValue;

  return (
    <div className={cn("relative", className)}>
      <div className="relative">
        <input
          id={name}
          name={name}
          type={type}
          required={required}
          value={value}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className={cn(
            "peer w-full h-14 bg-transparent border-0 border-b px-0 pt-5 pb-2",
            "font-body text-sm text-gik-void",
            "outline-none transition-colors duration-300",
            "placeholder-transparent",
            error
              ? "border-red-500"
              : "border-gik-stone focus:border-gik-void"
          )}
          placeholder={label}
          autoComplete="off"
        />
        <label
          htmlFor={name}
          className={cn(
            "absolute left-0 font-body transition-all duration-300 pointer-events-none",
            isActive
              ? "top-1 text-[10px] tracking-[0.1em] uppercase"
              : "top-1/2 -translate-y-1/2 text-sm",
            error
              ? "text-red-500"
              : isActive
                ? "text-gik-void"
                : "text-gik-stone"
          )}
        >
          {label}
          {required && <span className="ml-0.5">*</span>}
        </label>
      </div>

      {error && (
        <p className="mt-1.5 text-xs text-red-500 font-body">{error}</p>
      )}
    </div>
  );
}
