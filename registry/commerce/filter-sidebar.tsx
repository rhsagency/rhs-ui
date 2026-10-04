"use client";

import { useId } from "react";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@rhs-ui/primitives/accordion";
import { Checkbox } from "@rhs-ui/primitives/checkbox";
import { cn } from "@/lib/utils";

export interface FacetOption {
  value: string;
  label: string;
  /** Products left if this is ticked; 0 shows the option disabled. */
  count: number;
}

export interface Facet {
  id: string;
  label: string;
  options: readonly FacetOption[];
}

export interface FilterSidebarProps {
  facets: readonly Facet[];
  /** Ticked values per facet. */
  value: Readonly<Record<string, readonly string[]>>;
  onValueChange: (value: Record<string, string[]>) => void;
  /** Results with the current filters, announced as it changes. */
  results: number;
  className?: string;
}

/**
 * The filter column of a product listing: facets as collapsible groups of
 * checkboxes with the count each would leave, options that lead nowhere
 * disabled rather than hidden, a count of ticked filters per group and one
 * "clear all". The result count is announced as filters change.
 */
export function FilterSidebar({ facets, value, onValueChange, results, className }: FilterSidebarProps) {
  const id = useId();
  const active = Object.values(value).reduce((sum, list) => sum + list.length, 0);
  const toggle = (facet: string, option: string, on: boolean) => {
    const current = value[facet] ?? [];
    onValueChange({ ...Object.fromEntries(Object.entries(value).map(([k, v]) => [k, [...v]])), [facet]: on ? [...current, option] : current.filter((v) => v !== option) });
  };
  return (
    <aside data-slot="filter-sidebar" aria-label="Filters" className={cn("grid gap-2", className)}>
      <div className="flex items-baseline justify-between">
        <p role="status" className="text-sm"><span className="font-medium tabular-nums">{results}</span> {results === 1 ? "product" : "products"}</p>
        {active ? <button type="button" onClick={() => onValueChange({})} className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground">Clear all ({active})</button> : null}
      </div>
      <Accordion type="multiple" defaultValue={facets.slice(0, 2).map((facet) => facet.id)} className="border-t border-border">
        {facets.map((facet) => {
          const ticked = value[facet.id]?.length ?? 0;
          return (
            <AccordionItem key={facet.id} value={facet.id}>
              <AccordionTrigger className="py-3.5">
                <span>{facet.label}{ticked ? <span className="ml-2 rounded-full bg-foreground px-1.5 text-[11px] text-background tabular-nums">{ticked}</span> : null}</span>
              </AccordionTrigger>
              <AccordionContent>
                <ul className="grid gap-2">
                  {facet.options.map((option) => {
                    const checked = value[facet.id]?.includes(option.value) ?? false;
                    const optionId = `${id}-${facet.id}-${option.value}`;
                    return (
                      <li key={option.value} className={cn("flex items-center gap-2.5 text-sm", option.count === 0 && !checked && "opacity-40")}>
                        <Checkbox id={optionId} checked={checked} disabled={option.count === 0 && !checked} onCheckedChange={(on) => toggle(facet.id, option.value, on === true)} />
                        <label htmlFor={optionId} className="flex-1 text-foreground">{option.label}</label>
                        <span className="text-xs text-muted-foreground tabular-nums">{option.count}</span>
                      </li>
                    );
                  })}
                </ul>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </aside>
  );
}
