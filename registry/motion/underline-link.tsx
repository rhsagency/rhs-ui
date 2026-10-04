import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

export interface UnderlineLinkProps extends ComponentProps<"a"> {
  /** Grow from the left (default), from the centre, or swap: the line leaves right and returns from the left. */
  effect?: "grow" | "center" | "swap";
}

/**
 * A text link whose underline draws itself on hover and keyboard focus. The
 * line is a background, so it follows wrapped lines and the text colour;
 * reduced motion shows it without the draw.
 */
export function UnderlineLink({ effect = "grow", className, ...props }: UnderlineLinkProps) {
  return (
    <a
      data-slot="underline-link"
      data-effect={effect}
      className={cn(
        "box-decoration-clone bg-[linear-gradient(currentColor,currentColor)] bg-no-repeat pb-0.5 outline-none transition-[background-size] duration-300 ease-out motion-reduce:transition-none focus-visible:rounded-sm focus-visible:ring-[3px] focus-visible:ring-ring/40",
        "[background-size:0%_1px] hover:[background-size:100%_1px] focus-visible:[background-size:100%_1px]",
        effect === "grow" && "[background-position:0_100%]",
        effect === "center" && "[background-position:50%_100%]",
        effect === "swap" && "[background-position:100%_100%] hover:[background-position:0_100%] focus-visible:[background-position:0_100%]",
        className,
      )}
      {...props}
    />
  );
}
