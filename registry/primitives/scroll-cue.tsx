import { IconChevronDown } from "@rhs-ui/icons";
import { cn } from "@/lib/utils";

export interface ScrollCueProps {
  /** The id of the section below, without the hash. */
  target: string;
  label?: string;
  className?: string;
}

/**
 * The hint at the bottom of a full-height hero that there is more below: a
 * small word and a chevron that drifts down, as a real link to the next
 * section so it also works as a skip. The drift stops for reduced motion.
 */
export function ScrollCue({ target, label = "Scroll", className }: ScrollCueProps) {
  return (
    <a href={`#${target}`} data-slot="scroll-cue" className={cn("inline-flex flex-col items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium tracking-[.16em] text-muted-foreground uppercase outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40", className)}>
      {label}
      <span aria-hidden="true" className="inline-flex h-9 w-6 justify-center rounded-full border border-current pt-1.5">
        <IconChevronDown className="size-3.5 motion-safe:animate-bounce" />
      </span>
    </a>
  );
}
