import type { ComponentProps } from "react";

import { IconArrowDown, IconArrowUp, IconChevronsUpDown } from "@rhs-ui/icons";
import { cn } from "@/lib/utils";

/**
 * A real <table>: a caption that names it, header cells, and its own scroll
 * container so a wide table scrolls sideways instead of the page. Sorting and
 * selection stay in your hands: give a TableHead `sort` and `onSort`, and a
 * selected row `data-state="selected"`.
 */
export function Table({ className, ...props }: ComponentProps<"table">) {
  return (
    <div data-slot="table-container" className="relative w-full overflow-x-auto">
      <table data-slot="table" className={cn("w-full caption-bottom border-collapse text-sm", className)} {...props} />
    </div>
  );
}

export function TableHeader({ className, ...props }: ComponentProps<"thead">) {
  return <thead data-slot="table-header" className={cn("[&_tr]:border-b [&_tr]:hover:bg-transparent", className)} {...props} />;
}

export function TableBody({ className, ...props }: ComponentProps<"tbody">) {
  return <tbody data-slot="table-body" className={cn("[&_tr:last-child]:border-0", className)} {...props} />;
}

export function TableFooter({ className, ...props }: ComponentProps<"tfoot">) {
  return <tfoot data-slot="table-footer" className={cn("border-t border-border bg-muted/50 font-medium [&>tr]:last:border-b-0", className)} {...props} />;
}

export function TableRow({ className, ...props }: ComponentProps<"tr">) {
  return (
    <tr
      data-slot="table-row"
      className={cn("border-b border-border transition-colors duration-150 hover:bg-muted/50 data-[state=selected]:bg-muted", className)}
      {...props}
    />
  );
}

export type TableSort = "ascending" | "descending" | "none";

export interface TableHeadProps extends ComponentProps<"th"> {
  /** Makes the header a sort button and sets aria-sort on the cell. */
  sort?: TableSort;
  onSort?: () => void;
}

export function TableHead({ className, sort, onSort, children, ...props }: TableHeadProps) {
  const sortable = sort !== undefined && onSort !== undefined;
  const SortIcon = sort === "ascending" ? IconArrowUp : sort === "descending" ? IconArrowDown : IconChevronsUpDown;
  return (
    <th
      data-slot="table-head"
      aria-sort={sortable ? sort : undefined}
      className={cn(
        "h-10 px-3 text-left align-middle font-medium whitespace-nowrap text-muted-foreground [&:has([role=checkbox])]:w-px [&:has([role=checkbox])]:pr-0",
        className,
      )}
      {...props}
    >
      {sortable ? (
        <button
          type="button"
          onClick={onSort}
          data-sorted={sort !== "none" || undefined}
          className="-mx-2 inline-flex h-8 items-center gap-1.5 rounded-md px-2 font-medium transition-colors duration-150 outline-none hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40 data-[sorted]:text-foreground"
        >
          {children}
          <SortIcon size={14} aria-hidden="true" />
        </button>
      ) : (
        children
      )}
    </th>
  );
}

export function TableCell({ className, ...props }: ComponentProps<"td">) {
  return <td data-slot="table-cell" className={cn("px-3 py-2.5 align-middle [&:has([role=checkbox])]:w-px [&:has([role=checkbox])]:pr-0", className)} {...props} />;
}

export function TableCaption({ className, ...props }: ComponentProps<"caption">) {
  return <caption data-slot="table-caption" className={cn("mt-4 text-sm text-muted-foreground", className)} {...props} />;
}
