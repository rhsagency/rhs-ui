import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

/**
 * A field with something attached: a currency sign, a unit, an icon, a
 * button. The group draws the field surface and takes the focus ring when
 * anything inside it has focus, so the input and its addons read as one.
 */
export function InputGroup({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="input-group"
      className={cn(
        "flex h-9 w-full min-w-0 items-center rounded-md border border-input bg-background text-sm shadow-xs transition-[border-color,box-shadow] duration-150",
        "has-[input:focus-visible]:border-ring has-[input:focus-visible]:ring-[3px] has-[input:focus-visible]:ring-ring/40",
        "has-[[aria-invalid=true]]:border-destructive has-[input:disabled]:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

/** Text or an icon at either end: "https://", "EUR", "kg", a search glyph. Decorative by default; the input's label says what to type. */
export function InputGroupAddon({ className, ...props }: ComponentProps<"span">) {
  return <span data-slot="input-group-addon" className={cn("flex h-full shrink-0 items-center gap-1.5 px-3 text-muted-foreground select-none first:pr-0 last:pl-0 [&_svg]:size-4", className)} {...props} />;
}

/** The input inside a group: no surface of its own. Pair it with <Label htmlFor>. */
export function InputGroupInput({ className, ...props }: ComponentProps<"input">) {
  return <input data-slot="input-group-input" className={cn("h-full min-w-0 flex-1 bg-transparent px-3 outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed", className)} {...props} />;
}
