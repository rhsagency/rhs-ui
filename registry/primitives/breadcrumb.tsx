import type { ComponentProps } from "react";
import { Slot } from "radix-ui";

import { IconChevronRight, IconMoreHorizontal } from "@rhs-ui/icons";
import { cn } from "@/lib/utils";

/**
 * Where this page sits: an ordered list of links ending in the current page,
 * which carries aria-current and is not a link. Separators are hidden from
 * screen readers; the list already says there is an order. Pass `asChild` on
 * a link to render your router's link.
 */
export function Breadcrumb(props: ComponentProps<"nav">) {
  return <nav aria-label="Breadcrumb" data-slot="breadcrumb" {...props} />;
}

export function BreadcrumbList({ className, ...props }: ComponentProps<"ol">) {
  return (
    <ol
      data-slot="breadcrumb-list"
      className={cn("flex flex-wrap items-center gap-1.5 text-sm break-words text-muted-foreground sm:gap-2", className)}
      {...props}
    />
  );
}

export function BreadcrumbItem({ className, ...props }: ComponentProps<"li">) {
  return <li data-slot="breadcrumb-item" className={cn("inline-flex items-center gap-1.5", className)} {...props} />;
}

export function BreadcrumbLink({ className, asChild = false, ...props }: ComponentProps<"a"> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "a";
  return (
    <Comp
      data-slot="breadcrumb-link"
      className={cn("rounded-sm transition-colors duration-150 outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40", className)}
      {...props}
    />
  );
}

export function BreadcrumbPage({ className, ...props }: ComponentProps<"span">) {
  return <span data-slot="breadcrumb-page" aria-current="page" className={cn("font-medium text-foreground", className)} {...props} />;
}

export function BreadcrumbSeparator({ className, children, ...props }: ComponentProps<"li">) {
  return (
    <li data-slot="breadcrumb-separator" role="presentation" aria-hidden="true" className={cn("[&>svg]:size-3.5", className)} {...props}>
      {children ?? <IconChevronRight />}
    </li>
  );
}

/** Stands in for the middle crumbs on a deep path; make it the trigger of a menu that lists them. */
export function BreadcrumbEllipsis({ className, ...props }: ComponentProps<"span">) {
  return (
    <span data-slot="breadcrumb-ellipsis" className={cn("flex size-6 items-center justify-center", className)} {...props}>
      <IconMoreHorizontal size={16} aria-hidden="true" />
      <span className="sr-only">More pages</span>
    </span>
  );
}
