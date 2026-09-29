import type { ComponentProps } from "react";
import { Slot } from "radix-ui";

import { IconChevronLeft, IconChevronRight, IconMoreHorizontal } from "@rhs-ui/icons";
import { buttonVariants } from "@rhs-ui/primitives/button";
import { cn } from "@/lib/utils";

/**
 * The pages to draw: the first and last, the current one with `siblings` on
 * each side, and "ellipsis" for a gap. paginationRange(6, 12) gives
 * [1, "ellipsis", 5, 6, 7, "ellipsis", 12]. The row always has the same
 * length (siblings * 2 + 5), so it never jumps while you page, and a gap of
 * one page shows that page instead of an ellipsis.
 */
export function paginationRange(current: number, total: number, siblings = 1): (number | "ellipsis")[] {
  const pages = (from: number, to: number): number[] => Array.from({ length: to - from + 1 }, (_, i) => from + i);
  if (total <= 0) return [];
  const slots = siblings * 2 + 5;
  if (total <= slots) return pages(1, total);
  const page = Math.min(Math.max(1, Math.round(current)), total);
  const left = Math.max(page - siblings, 1);
  const right = Math.min(page + siblings, total);
  const leftGap = left > 3;
  const rightGap = right < total - 2;
  if (!leftGap) return [...pages(1, slots - 2), "ellipsis", total];
  if (!rightGap) return [1, "ellipsis", ...pages(total - slots + 3, total)];
  return [1, "ellipsis", ...pages(left, right), "ellipsis", total];
}

/**
 * Links between the pages of a list. The current page carries
 * aria-current="page"; Previous and Next keep their words for screen readers
 * when a phone hides them. Pass `asChild` to render your router's link.
 */
export function Pagination({ className, ...props }: ComponentProps<"nav">) {
  return <nav aria-label="Pagination" data-slot="pagination" className={cn("mx-auto flex w-full justify-center", className)} {...props} />;
}

export function PaginationContent({ className, ...props }: ComponentProps<"ul">) {
  return <ul data-slot="pagination-content" className={cn("flex flex-row items-center gap-1", className)} {...props} />;
}

export function PaginationItem(props: ComponentProps<"li">) {
  return <li data-slot="pagination-item" {...props} />;
}

export interface PaginationLinkProps extends ComponentProps<"a"> {
  isActive?: boolean;
  asChild?: boolean;
  size?: "icon" | "default";
}

export function PaginationLink({ className, isActive, asChild = false, size = "icon", ...props }: PaginationLinkProps) {
  const Comp = asChild ? Slot.Root : "a";
  return (
    <Comp
      data-slot="pagination-link"
      data-active={isActive || undefined}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        buttonVariants({ variant: isActive ? "outline" : "ghost", size }),
        "tabular-nums aria-disabled:pointer-events-none aria-disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export function PaginationPrevious({ className, children = "Previous", ...props }: PaginationLinkProps) {
  return (
    <PaginationLink aria-label="Go to the previous page" size="default" className={cn("gap-1 px-2.5 sm:pl-2", className)} {...props}>
      <IconChevronLeft size={16} />
      <span className="hidden sm:block">{children}</span>
    </PaginationLink>
  );
}

export function PaginationNext({ className, children = "Next", ...props }: PaginationLinkProps) {
  return (
    <PaginationLink aria-label="Go to the next page" size="default" className={cn("gap-1 px-2.5 sm:pr-2", className)} {...props}>
      <span className="hidden sm:block">{children}</span>
      <IconChevronRight size={16} />
    </PaginationLink>
  );
}

export function PaginationEllipsis({ className, ...props }: ComponentProps<"span">) {
  return (
    <span aria-hidden="true" data-slot="pagination-ellipsis" className={cn("flex size-9 items-center justify-center text-muted-foreground", className)} {...props}>
      <IconMoreHorizontal size={16} />
    </span>
  );
}
