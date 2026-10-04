import { cn } from "@/lib/utils";

export interface SkipLinkProps {
  /** The id of the main content, without #. */
  target?: string;
  label?: string;
  className?: string;
}

/**
 * The first thing in the page for keyboard users: "Skip to content", hidden
 * until it gets focus, then shown top left above everything, and it moves
 * focus to the main content (give that element tabIndex={-1}). WCAG 2.4.1,
 * in one line at the top of your layout.
 */
export function SkipLink({ target = "main", label = "Skip to content", className }: SkipLinkProps) {
  return (
    <a
      data-slot="skip-link"
      href={`#${target}`}
      className={cn(
        "fixed top-3 left-3 z-[100] -translate-y-[200%] rounded-lg bg-foreground px-4 py-2.5 text-sm font-medium text-background shadow-lg outline-none transition-transform focus:translate-y-0 focus-visible:ring-[3px] focus-visible:ring-ring/50 motion-reduce:transition-none",
        className,
      )}
    >
      {label}
    </a>
  );
}
