"use client";

import { useEffect, useId, useState, type ComponentProps, type ReactNode } from "react";

import { IconArrowDown, IconArrowUp, IconBoard, IconCalendar, IconCheck, IconGrid, IconLayout, IconList, IconTable } from "@rhs-ui/icons";
import {
  changedSections,
  DEFAULT_LABELS,
  defaultDisplay,
  readDisplay,
  type DisplayField,
  type DisplayLayout,
  type DisplayOptions,
  type DisplayOptionsLabels,
  type DisplayProperty,
  type DisplaySection,
  type DisplayValue,
} from "@rhs-ui/application/display-options-popover/options";
import { Button } from "@rhs-ui/primitives/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@rhs-ui/primitives/select";
import { Toggle } from "@rhs-ui/primitives/toggle";
import { ToggleGroup, ToggleGroupItem } from "@rhs-ui/primitives/toggle-group";
import { cn } from "@/lib/utils";

export interface DisplayOptionsPanelProps extends Omit<ComponentProps<"div">, "children" | "defaultValue" | "onChange" | "onReset"> {
  /** The ways to lay the list out, as small icon tiles: an id, a label and, if you like, an icon element. */
  layouts: readonly DisplayLayout[];
  /** What the rows can be grouped by. Include an entry that means none, such as "No grouping". */
  groupings: readonly DisplayField[];
  /** What the rows can be ordered by. */
  orderings: readonly DisplayField[];
  /** The fields of a row that can be shown or hidden, each with whether it shows in the defaults. */
  properties: readonly DisplayProperty[];
  /** What is chosen, when you control the panel. Pair it with `onValueChange`. */
  value?: DisplayValue;
  /** What is chosen to begin with, when the panel keeps it itself. Default: the defaults. */
  defaultValue?: DisplayValue;
  /** What counts as unchanged, and what Reset returns to. Default: the first layout, grouping and ordering, ascending, and the properties that are not marked hidden. */
  defaults?: DisplayValue;
  /** Something was changed. It receives the whole value, and applies at once: this is a view setting, not a form. */
  onValueChange?: (next: DisplayValue) => void;
  /** Reset was pressed, after `onValueChange` received the defaults. */
  onReset?: () => void;
  /** The words the panel says, for translation. */
  labels?: DisplayOptionsLabels;
}

/** What a layout draws when you give it no icon: a drawing chosen from its id. */
const LAYOUT_ICONS: Record<string, ReactNode> = {
  list: <IconList />,
  board: <IconBoard />,
  table: <IconTable />,
  grid: <IconGrid />,
  gallery: <IconGrid />,
  cards: <IconGrid />,
  calendar: <IconCalendar />,
};

function Section({ id, title, aside, children }: { id: string; title: string; aside?: string; children: ReactNode }) {
  return (
    <div className="grid gap-2">
      <div className="flex items-baseline justify-between gap-3">
        <p id={id} className="text-xs font-medium text-muted-foreground">
          {title}
        </p>
        {aside ? <span className="text-[0.6875rem] text-muted-foreground">{aside}</span> : null}
      </div>
      {children}
    </div>
  );
}

/**
 * The inside of the display popover, on its own, for a sheet on a phone: the layout as small icon tiles, grouping and
 * ordering in the house select (with a button that turns the ordering round), and the properties as chips that show and hide
 * fields on every row. Everything applies the moment it is touched, because this is a view setting and not a form. A heading
 * whose setting differs from the defaults says so, and Reset puts everything back and says it politely.
 */
export function DisplayOptionsPanel({
  layouts,
  groupings,
  orderings,
  properties,
  value,
  defaultValue,
  defaults,
  onValueChange,
  onReset,
  labels,
  className,
  ...props
}: DisplayOptionsPanelProps) {
  const words: Required<DisplayOptionsLabels> = { ...DEFAULT_LABELS, ...labels };
  const id = useId();
  const options: DisplayOptions = { layouts, groupings, orderings, properties };
  const base = defaults ?? defaultDisplay(options);
  const [own, setOwn] = useState<DisplayValue | undefined>(defaultValue);
  const current = readDisplay(value ?? own, options, base);
  const changed = changedSections(current, base);
  const [said, setSaid] = useState("");
  const [restored, setRestored] = useState(false);
  const shown = new Set(current.properties);
  const tag = (section: DisplaySection) => (changed.includes(section) ? words.changedTag : undefined);

  // The visible "Back to the defaults" goes by itself after a moment; the live region keeps the words until the next change.
  useEffect(() => {
    if (!restored) return;
    const timer = window.setTimeout(() => setRestored(false), 2600);
    return () => window.clearTimeout(timer);
  }, [restored]);

  function apply(next: DisplayValue) {
    if (value === undefined) setOwn(next);
    // Cleared on the way in, so the same words are read out again after the next Reset.
    setSaid("");
    setRestored(false);
    onValueChange?.(next);
  }

  function reset() {
    if (changed.length === 0) return;
    if (value === undefined) setOwn(base);
    onValueChange?.(base);
    onReset?.();
    setSaid(words.resetDone);
    setRestored(true);
  }

  function toggleProperty(propertyId: string, on: boolean) {
    const next = new Set(current.properties);
    if (on) next.add(propertyId);
    else next.delete(propertyId);
    apply({ ...current, properties: properties.filter((property) => next.has(property.id)).map((property) => property.id) });
  }

  return (
    <div data-slot="display-options-panel" className={cn("flex min-h-0 flex-col bg-popover text-popover-foreground", className)} {...props}>
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border py-2 pr-2.5 pl-4">
        <h2 className="text-sm font-semibold tracking-[-0.01em]">{words.title}</h2>
        <div className="flex items-center gap-1.5">
          {restored ? (
            <span aria-hidden="true" className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <IconCheck className="size-3.5" />
              {words.resetDone}
            </span>
          ) : null}
          {/* Not `disabled`: pressing Reset turns it off, and a disabled button would drop the focus it has. */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            aria-disabled={changed.length === 0 || undefined}
            onClick={reset}
            className="text-muted-foreground hover:text-foreground aria-disabled:pointer-events-none aria-disabled:opacity-50"
          >
            {words.reset}
          </Button>
        </div>
      </div>

      <div data-slot="display-options-body" className="relative min-h-0 flex-1 overflow-y-auto overscroll-contain [scrollbar-width:thin]">
        <div className="grid gap-5 p-4">
          <Section id={`${id}-layout`} title={words.layout} aside={tag("layout")}>
            <ToggleGroup
              type="single"
              variant="outline"
              value={current.layout}
              aria-labelledby={`${id}-layout`}
              // Pressing the tile that is already chosen would unchoose it: a layout is always one of the layouts.
              onValueChange={(next) => {
                if (next) apply({ ...current, layout: next });
              }}
              className="flex w-full"
            >
              {layouts.map((layout) => (
                <ToggleGroupItem
                  key={layout.id}
                  value={layout.id}
                  className="h-auto min-w-0 flex-1 flex-col gap-1.5 px-1 py-2.5 text-xs data-[state=on]:bg-muted data-[state=on]:text-foreground [&_svg:not([class*='size-'])]:size-5"
                >
                  {layout.icon ?? LAYOUT_ICONS[layout.id] ?? <IconLayout />}
                  <span className="max-w-full truncate">{layout.label}</span>
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </Section>

          <Section id={`${id}-grouping`} title={words.grouping} aside={tag("grouping")}>
            <Select value={current.grouping} onValueChange={(next) => apply({ ...current, grouping: next })}>
              <SelectTrigger size="sm" aria-labelledby={`${id}-grouping`} className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {groupings.map((field) => (
                  <SelectItem key={field.id} value={field.id} className="py-1.5">
                    {field.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Section>

          <Section id={`${id}-ordering`} title={words.ordering} aside={tag("ordering")}>
            <div className="flex items-center gap-2">
              <div className="min-w-0 flex-1">
                <Select value={current.ordering} onValueChange={(next) => apply({ ...current, ordering: next })}>
                  <SelectTrigger size="sm" aria-labelledby={`${id}-ordering`} className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {orderings.map((field) => (
                      <SelectItem key={field.id} value={field.id} className="py-1.5">
                        {field.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Toggle
                variant="outline"
                size="sm"
                pressed={current.direction === "desc"}
                onPressedChange={(on) => apply({ ...current, direction: on ? "desc" : "asc" })}
                aria-label={words.descending}
                title={words.descending}
                className="size-8 shrink-0 px-0 data-[state=on]:bg-muted data-[state=on]:text-foreground"
              >
                {current.direction === "desc" ? <IconArrowDown /> : <IconArrowUp />}
              </Toggle>
            </div>
          </Section>

          <Section id={`${id}-properties`} title={words.properties} aside={tag("properties") ?? words.propertiesHint}>
            <div role="group" aria-labelledby={`${id}-properties`} className="flex flex-wrap gap-1.5">
              {properties.map((property) => {
                const on = shown.has(property.id);
                return (
                  <Toggle
                    key={property.id}
                    pressed={on}
                    onPressedChange={(next) => toggleProperty(property.id, next)}
                    className={cn(
                      "h-7 min-w-0 gap-1 rounded-full border px-2.5 text-[0.8125rem]",
                      "border-dashed border-border bg-transparent text-muted-foreground",
                      "data-[state=on]:border-solid data-[state=on]:border-border data-[state=on]:bg-muted data-[state=on]:text-foreground",
                    )}
                  >
                    {on ? <IconCheck size={12} strokeWidth={2.5} /> : null}
                    {property.label}
                  </Toggle>
                );
              })}
            </div>
          </Section>
        </div>
      </div>

      {/* Kept in the page when empty: a live region that appears together with its message is often never read. */}
      <p role="status" aria-live="polite" className="sr-only">
        {said}
      </p>
    </div>
  );
}
