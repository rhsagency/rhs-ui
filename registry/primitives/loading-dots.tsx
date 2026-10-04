import { cn } from "@/lib/utils";

export interface LoadingDotsProps {
  /** What is loading, for screen readers: "Loading messages". */
  label?: string;
  size?: "sm" | "md";
  className?: string;
}

/**
 * Three dots that pulse in turn, for "someone is typing" and short waits.
 * Plain CSS with staggered delays; under reduced motion the dots stand
 * still at half strength. Announces its label once as a status.
 */
export function LoadingDots({ label = "Loading", size = "md", className }: LoadingDotsProps) {
  const dot = cn("rounded-full bg-current motion-safe:animate-pulse motion-reduce:opacity-50", size === "sm" ? "size-1" : "size-1.5");
  return (
    <span data-slot="loading-dots" role="status" className={cn("inline-flex items-center gap-1 text-muted-foreground", className)}>
      <span className={dot} style={{ animationDelay: "0ms" }} />
      <span className={dot} style={{ animationDelay: "200ms" }} />
      <span className={dot} style={{ animationDelay: "400ms" }} />
      <span className="sr-only">{label}</span>
    </span>
  );
}
