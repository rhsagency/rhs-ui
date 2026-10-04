"use client";

import { IconSort } from "@rhs-ui/icons";
import { DropdownMenu, DropdownMenuContent, DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger } from "@rhs-ui/primitives/dropdown-menu";
import { cn } from "@/lib/utils";

export interface SortOption {
  value: string;
  label: string;
}

export interface SortMenuProps {
  options: readonly SortOption[];
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
}

/**
 * "Sort by" above a product grid or a list: a compact trigger that reads
 * the current order ("Sort: Newest"), a menu of radio items with the chosen
 * one checked. The house dropdown, never a native select.
 */
export function SortMenu({ options, value, onValueChange, className }: SortMenuProps) {
  const current = options.find((option) => option.value === value);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger data-slot="sort-menu" className={cn("inline-flex h-9 items-center gap-2 rounded-lg border border-border px-3 text-sm outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/40 [&_svg]:size-4", className)}>
        <IconSort aria-hidden="true" />
        <span><span className="text-muted-foreground">Sort:</span> {current?.label}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel>Sort by</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={value} onValueChange={onValueChange}>
          {options.map((option) => <DropdownMenuRadioItem key={option.value} value={option.value}>{option.label}</DropdownMenuRadioItem>)}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
