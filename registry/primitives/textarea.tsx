import type { ComponentProps } from "react";

import { fieldSurface } from "@rhs-ui/primitives/input";
import { cn } from "@/lib/utils";

/**
 * A multi-line field on the same surface as Input. Where the browser supports
 * `field-sizing: content` it grows with the text up to max-h and then
 * scrolls; elsewhere `rows` sets the height and the handle resizes it.
 */
export function Textarea({ className, rows = 3, ...props }: ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      rows={rows}
      className={cn(
        fieldSurface,
        "flex min-h-20 w-full min-w-0 resize-y px-3 py-2 leading-relaxed field-sizing-content max-h-80",
        "placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground",
        className,
      )}
      {...props}
    />
  );
}
