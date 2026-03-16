import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  title: string;
  subtitle?: string;
  align?: "left" | "center";
}

export function SectionHeading({
  title,
  subtitle,
  align = "center",
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "mb-12",
        align === "center" && "text-center",
        align === "left" && "text-left"
      )}
    >
      <p className="text-xs tracking-[0.15em] uppercase text-gik-stone font-medium font-body mb-4">
        {title}
      </p>
      {subtitle && (
        <h2 className="font-display text-3xl md:text-4xl lg:text-5xl text-gik-void font-light leading-tight">
          {subtitle}
        </h2>
      )}
    </div>
  );
}
