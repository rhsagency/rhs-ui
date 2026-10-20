"use client";

import { useRef, useState, type ComponentProps, type ReactNode } from "react";

import { IconCheck, IconPlusCircle } from "@rhs-ui/icons";
import { Badge } from "@rhs-ui/primitives/badge";
import { Button } from "@rhs-ui/primitives/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@rhs-ui/primitives/command";
import { Popover, PopoverContent, PopoverTrigger } from "@rhs-ui/primitives/popover";
import { Separator } from "@rhs-ui/primitives/separator";
import { cn } from "@/lib/utils";

export interface FacetOption {
  /** What `value` holds for this option. */
  value: string;
  /** What people read. */
  label: string;
  /** How many rows choosing this option would leave, given the other filters. An option at 0 stays in the list, dimmed, so the list never reshuffles while people click. */
  count?: number;
  /** A small icon before the label: `<IconCircleDot />`. */
  icon?: ReactNode;
}

export interface FacetFilterProps extends Omit<ComponentProps<"button">, "title" | "value" | "defaultValue" | "children" | "onChange"> {
  /** What is being filtered, "Status". It is the button's label and names the filter for screen readers. */
  title: string;
  /** The choices, in the order they are listed. */
  options: readonly FacetOption[];
  /** The chosen option values, for controlled use. */
  value?: readonly string[];
  /** The chosen option values to start from when you do not control them. */
  defaultValue?: readonly string[];
  /** Called with every chosen value after a pick or a clear. */
  onValueChange?: (value: string[]) => void;
  /** A search field above the options. Turn it off for a short list: arrows and Space then work on the list itself. */
  searchable?: boolean;
  /** BCP 47 locale for the counts. */
  locale?: string;
  /** The button at the foot of the panel. */
  clearLabel?: string;
  /** Open on first render, for a panel that is already in view. Focus then stays where it was. */
  defaultOpen?: boolean;
  /** Whether the panel is open, for controlled use. */
  open?: boolean;
  /** Called when the panel opens or closes. Pair it with `open` to control the panel. */
  onOpenChange?: (open: boolean) => void;
  /** The button's height: the default matches Input and Select, sm is for a dense toolbar. */
  size?: "sm" | "default";
}

/**
 * The filter above a data table: a dashed button labelled "Status" that opens
 * a searchable checklist, each option with the number of rows it would leave.
 * The button says what is chosen: nothing shows only the label, one or two
 * picks show their names as chips, more show "4 selected". Its accessible
 * name lists them too ("Status filter, 2 selected: Open, Pending"). Options
 * with no rows stay in place, dimmed. "Clear filter" sits at the foot, and
 * Escape closes the panel and returns focus to the button.
 */
export function FacetFilter({
  title,
  options,
  value,
  defaultValue = [],
  onValueChange,
  searchable = true,
  locale = "en-US",
  clearLabel = "Clear filter",
  defaultOpen,
  open,
  onOpenChange,
  size = "default",
  className,
  ...props
}: FacetFilterProps) {
  const [own, setOwn] = useState<readonly string[]>(defaultValue);
  const [ownOpen, setOwnOpen] = useState(defaultOpen ?? false);
  // A panel that was open from the start must not pull focus; one the reader opened should.
  const askedFor = useRef(false);
  const current = value ?? own;
  const chosen = new Set(current);
  const picked = options.filter((option) => chosen.has(option.value));
  const numbers = new Intl.NumberFormat(locale);
  const root = useRef<HTMLDivElement>(null);

  const set = (next: string[]): void => {
    if (value === undefined) setOwn(next);
    onValueChange?.(next);
  };
  const toggle = (item: string): void => set(chosen.has(item) ? current.filter((entry) => entry !== item) : [...current, item]);

  const name = `${title} filter${picked.length ? `, ${picked.length} selected: ${picked.map((option) => option.label).join(", ")}` : ""}`;

  return (
    <Popover
      open={open ?? ownOpen}
      onOpenChange={(next) => {
        if (next) askedFor.current = true;
        if (open === undefined) setOwnOpen(next);
        onOpenChange?.(next);
      }}
    >
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" size={size} {...props} data-slot="facet-filter" aria-label={name} className={cn("max-w-full min-w-0 shrink border-dashed", className)}>
          <IconPlusCircle aria-hidden="true" className="text-muted-foreground" />
          {title}
          {picked.length ? (
            <>
              <Separator orientation="vertical" className="mx-0.5 h-4" />
              {picked.length > 2 ? (
                <Badge variant="secondary" className="rounded-md px-1.5 font-normal">
                  {picked.length} selected
                </Badge>
              ) : (
                // On a narrow screen a long name gives way with an ellipsis instead of pushing the button out of its row.
                <span className="flex min-w-0 items-center gap-1">
                  {picked.map((option) => (
                    <Badge key={option.value} variant="secondary" className="min-w-0 shrink rounded-md px-1.5 font-normal">
                      <span className="truncate">{option.label}</span>
                    </Badge>
                  ))}
                </span>
              )}
            </>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        aria-label={`${title} options`}
        className="w-64 p-0"
        // Without a search field there is nothing to type in: focus the list so the arrow keys work at once.
        onOpenAutoFocus={(event) => {
          if (!askedFor.current) event.preventDefault();
          else if (!searchable) {
            event.preventDefault();
            root.current?.focus();
          }
        }}
        // Inside a modal sheet the page's scroll lock cancels wheel and touch moves it does not recognise, and this panel is outside the sheet. Stopping them here, before they reach the document, lets a long list scroll.
        ref={(node) => {
          if (!node) return;
          const keep = (event: Event): void => event.stopPropagation();
          node.addEventListener("wheel", keep, { passive: true });
          node.addEventListener("touchmove", keep, { passive: true });
          return () => {
            node.removeEventListener("wheel", keep);
            node.removeEventListener("touchmove", keep);
          };
        }}
      >
        <Command
          ref={root}
          label={`${title} options`}
          loop
          className="[&_[data-slot=command-input-wrapper]]:h-10 [&_[data-slot=command-input-wrapper]]:px-3 [&_[data-slot=command-input]]:h-9"
          onKeyDown={(event) => {
            if (searchable || event.key !== " ") return;
            event.preventDefault();
            root.current?.querySelector<HTMLElement>('[cmdk-item][data-selected="true"]')?.click();
          }}
        >
          {searchable ? <CommandInput placeholder={`Search ${title.toLowerCase()}`} /> : null}
          {/* A checklist, not a single choice: the list is named after the filter (cmdk would call it "Suggestions") and says more than one option can be checked. */}
          <CommandList label={`${title} options`} aria-multiselectable="true">
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => {
                // cmdk's aria-selected says which option is highlighted, so what is chosen is said with aria-checked.
                const checked = chosen.has(option.value);
                // Dimmed, not faded out: the label keeps 4.5:1 against the panel, and the count stays at full strength.
                const dim = option.count === 0 && !checked ? "opacity-60" : undefined;
                return (
                  <CommandItem key={option.value} value={option.value} keywords={[option.label]} aria-checked={checked} onSelect={() => toggle(option.value)} className="gap-2.5">
                    <span
                      aria-hidden="true"
                      className={cn(
                        "grid size-4 shrink-0 place-items-center rounded-[4px] border transition-colors duration-150 motion-reduce:transition-none",
                        checked ? "border-primary bg-primary [&_svg]:text-primary-foreground!" : "border-muted-foreground",
                        dim,
                      )}
                    >
                      {checked ? <IconCheck size={11} strokeWidth={2.5} /> : null}
                    </span>
                    {option.icon ? (
                      <span aria-hidden="true" className={cn("grid shrink-0 place-items-center", dim)}>
                        {option.icon}
                      </span>
                    ) : null}
                    <span className={cn("min-w-0 flex-1 truncate", dim)}>{option.label}</span>
                    {option.count !== undefined ? (
                      <>
                        <span aria-hidden="true" className="text-xs text-muted-foreground tabular-nums">
                          {numbers.format(option.count)}
                        </span>
                        <span className="sr-only">
                          , {numbers.format(option.count)} {option.count === 1 ? "result" : "results"}
                        </span>
                      </>
                    ) : null}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
          <div className="border-t border-border p-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-full"
              disabled={current.length === 0}
              onClick={() => {
                set([]);
                // The button disables itself now; keep focus inside the panel.
                (root.current?.querySelector<HTMLElement>("input") ?? root.current)?.focus();
              }}
            >
              {clearLabel}
            </Button>
          </div>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
