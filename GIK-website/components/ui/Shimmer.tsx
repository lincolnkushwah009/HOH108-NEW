import { cn } from "@/lib/utils";

interface ShimmerProps {
  className?: string;
}

export function Shimmer({ className }: ShimmerProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden bg-gik-linen",
        className
      )}
    >
      <div
        className="absolute inset-0 animate-shimmer"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, rgba(247, 245, 240, 0.6) 50%, transparent 100%)",
          backgroundSize: "200% 100%",
        }}
      />
      <style jsx>{`
        @keyframes shimmer {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }
        .animate-shimmer {
          animation: shimmer 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
