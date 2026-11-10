"use client";

import { useState, type ComponentProps, type ReactNode } from "react";

import { IconSliders } from "@rhs-ui/icons";
import { FilterPanel, type FilterPanelProps } from "@rhs-ui/application/filter-popover/panel";
import { DEFAULT_LABELS, countActive, fill, plural, sameFilters, type FilterGroup, type FilterPopoverLabels, type FilterValue } from "@rhs-ui/application/filter-popover/filters";
import { Badge } from "@rhs-ui/primitives/badge";
import { Button } from "@rhs-ui/primitives/button";
import { Popover, PopoverContent, PopoverTrigger } from "@rhs-ui/primitives/popover";
import { cn } from "@/lib/utils";

export type {
  CheckboxFilter,
  FilterGroup,
  FilterOption,
  FilterPopoverLabels,
  FilterValue,
  RadioFilter,
  RangeFilter,
  ToggleFilter,
} from "@rhs-ui/application/filter-popover/filters";

export interface FilterPopoverProps extends Omit<ComponentProps<"div">, "children" | "onChange" | "defaultValue"> {
  /** The groups of filters, in the order they are listed. Each is a checkbox list, a radio list, a range or a switch. */
  groups: readonly FilterGroup[];
  /** The filters that are applied, when you control them. Pair it with `onApply`. A group that is not filtering is left out. */
  value?: FilterValue;
  /** The filters that are applied at the start, when the popover keeps them itself. */
  defaultValue?: FilterValue;
  /** The person pressed Apply and something changed. It receives the filters that are on. The popover closes and focus returns to the button. */
  onApply?: (next: FilterValue) => void;
  /** The person pressed Reset: the draft in the panel is empty, and nothing is applied until Apply. */
  onReset?: () => void;
  /** Counts what a draft would leave, for the button: "Show 128 results". It may be asynchronous. */
  resultCount?: FilterPanelProps["resultCount"];
  /** Replaces the button. One element that takes a ref and props, such as a `Button`. */
  trigger?: ReactNode;
  /** Which edge of the button the panel lines up with. Default "start". */
  align?: "start" | "center" | "end";
  /** Whether the panel is open, when you control it. */
  open?: boolean;
  /** Whether the panel is open to begin with. */
  defaultOpen?: boolean;
  /** Called when the panel opens or closes. */
  onOpenChange?: (open: boolean) => void;
  /** The language of the numbers and of "1 result" against "2 results". Default "en-US". */
  locale?: string;
  /** The words the filters say, for translation. */
  labels?: FilterPopoverLabels;
}

/**
 * The Filters button of a list or a table with several filters. It reads
 * "Filters" with a count of the groups that are on, and opens a panel of grouped
 * options. What is chosen in the panel is a draft: closing without Apply throws
 * it away, and the one button at the foot names what it will do, "Show 128
 * results" when you give it `resultCount`. Groups fold, a long list of options
 * gets a search field, Reset empties the draft, and Apply closes the panel,
 * puts focus back on the button and announces "3 filters applied". At 320
 * pixels the panel stays inside the window and scrolls inside itself.
 */
export function FilterPopover({
  groups,
  value,
  defaultValue = {},
  onApply,
  onReset,
  resultCount,
  trigger,
  align = "start",
  open,
  defaultOpen = false,
  onOpenChange,
  locale = "en-US",
  labels,
  className,
  ...props
}: FilterPopoverProps) {
  const words: Required<FilterPopoverLabels> = { ...DEFAULT_LABELS, ...labels };
  const [own, setOwn] = useState<FilterValue>(defaultValue);
  const [ownOpen, setOwnOpen] = useState(defaultOpen);
  const [message, setMessage] = useState("");
  const applied = value ?? own;
  const isOpen = open ?? ownOpen;
  const active = countActive(groups, applied);

  function setOpen(next: boolean) {
    // The last announcement is cleared on the way in, so the same words are read again after the next Apply.
    if (next) setMessage("");
    if (open === undefined) setOwnOpen(next);
    onOpenChange?.(next);
  }

  function apply(next: FilterValue) {
    if (!sameFilters(groups, applied, next)) {
      if (value === undefined) setOwn(next);
      onApply?.(next);
      const count = countActive(groups, next);
      setMessage(count === 0 ? words.appliedNone : fill(plural(count, words.appliedOne, words.appliedMany, locale), { count: new Intl.NumberFormat(locale).format(count) }));
    }
    setOpen(false);
  }

  return (
    <div data-slot="filter-popover" data-active={active || undefined} className={cn("inline-flex max-w-full min-w-0", className)} {...props}>
      <Popover open={isOpen} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          {trigger ?? (
            <Button type="button" variant="outline" className="gap-2">
              <IconSliders aria-hidden="true" />
              {words.trigger}
              {active > 0 ? (
                <Badge aria-hidden="true" className="-me-1 h-5 min-w-5 justify-center px-1.5 tabular-nums">
                  {active}
                </Badge>
              ) : null}
              {active > 0 ? <span className="sr-only">, {fill(words.active, { count: active })}</span> : null}
            </Button>
          )}
        </PopoverTrigger>
        <PopoverContent
          align={align}
          collisionPadding={8}
          aria-label={words.title}
          // Radix would focus the first thing it finds, the Reset button in the header, and one press of Enter would empty the draft: start on the first group instead.
          onOpenAutoFocus={(event) => {
            const panel = event.currentTarget;
            const first = panel instanceof HTMLElement ? panel.querySelector<HTMLElement>("[data-slot='filter-panel-groups'] button") : null;
            if (!first) return;
            event.preventDefault();
            first.focus({ preventScroll: true });
          }}
          // Escape empties a search field that has words in it, and only then closes the panel: the field's own handler does the emptying.
          onEscapeKeyDown={(event) => {
            const field = event.target;
            if (field instanceof HTMLInputElement && field.type === "search" && field.value !== "") event.preventDefault();
          }}
          className="flex max-h-[min(34rem,var(--radix-popover-content-available-height))] w-[min(22rem,calc(100vw-1rem))] flex-col overflow-hidden p-0"
        >
          <FilterPanel groups={groups} value={applied} onApply={apply} onReset={onReset} resultCount={resultCount} locale={locale} labels={labels} className="min-h-0 flex-1" />
        </PopoverContent>
      </Popover>
      {/* Kept in the page when empty, and outside the panel: the panel is gone when the words are said. */}
      <p role="status" aria-live="polite" className="sr-only">
        {message}
      </p>
    </div>
  );
}
