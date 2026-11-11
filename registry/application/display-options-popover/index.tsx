"use client";

import { useState, type ComponentProps, type ReactNode } from "react";

import { IconLayout } from "@rhs-ui/icons";
import { DisplayOptionsPanel } from "@rhs-ui/application/display-options-popover/panel";
import {
  changedSections,
  DEFAULT_LABELS,
  defaultDisplay,
  fill,
  readDisplay,
  type DisplayField,
  type DisplayLayout,
  type DisplayOptions,
  type DisplayOptionsLabels,
  type DisplayProperty,
  type DisplayValue,
} from "@rhs-ui/application/display-options-popover/options";
import { Badge } from "@rhs-ui/primitives/badge";
import { Button } from "@rhs-ui/primitives/button";
import { Popover, PopoverContent, PopoverTrigger } from "@rhs-ui/primitives/popover";
import { cn } from "@/lib/utils";

export type {
  DisplayDirection,
  DisplayField,
  DisplayLayout,
  DisplayOptionsLabels,
  DisplayProperty,
  DisplaySection,
  DisplayValue,
} from "@rhs-ui/application/display-options-popover/options";
export { DisplayOptionsPanel, type DisplayOptionsPanelProps } from "@rhs-ui/application/display-options-popover/panel";

export interface DisplayOptionsPopoverProps extends Omit<ComponentProps<"div">, "children" | "defaultValue" | "onChange" | "onReset"> {
  /** The ways to lay the list out, as small icon tiles: an id, a label and, if you like, an icon element. */
  layouts: readonly DisplayLayout[];
  /** What the rows can be grouped by. Include an entry that means none, such as "No grouping". */
  groupings: readonly DisplayField[];
  /** What the rows can be ordered by. */
  orderings: readonly DisplayField[];
  /** The fields of a row that can be shown or hidden, each with whether it shows in the defaults. */
  properties: readonly DisplayProperty[];
  /** What is chosen, when you control the popover. Pair it with `onValueChange`. */
  value?: DisplayValue;
  /** What is chosen to begin with, when the popover keeps it itself. Default: the defaults. */
  defaultValue?: DisplayValue;
  /** What counts as unchanged, and what Reset returns to. Default: the first layout, grouping and ordering, ascending, and the properties that are not marked hidden. */
  defaults?: DisplayValue;
  /** Something was changed. It receives the whole value, and applies at once: this is a view setting, not a form. */
  onValueChange?: (next: DisplayValue) => void;
  /** Reset was pressed, after `onValueChange` received the defaults. */
  onReset?: () => void;
  /** Replaces the button. One element that takes a ref and props, such as a `Button`. */
  trigger?: ReactNode;
  /** Which edge of the button the panel lines up with. Default "end". */
  align?: "start" | "center" | "end";
  /** Whether the panel is open, when you control it. */
  open?: boolean;
  /** Whether the panel is open to begin with. */
  defaultOpen?: boolean;
  /** Called when the panel opens or closes. */
  onOpenChange?: (open: boolean) => void;
  /** The words the button and the panel say, for translation. */
  labels?: DisplayOptionsLabels;
}

/**
 * The Display button of a list view: choose how rows are laid out, grouped and ordered, and which properties show on them.
 * Everything applies at once, because this is a view setting and not a form, and the button says how many of the four
 * settings differ from the defaults ("Display, 2 changed"). Layout is a small icon tile group, grouping and ordering use the
 * house select with a button that turns the ordering round, and properties are chips that show and hide fields. Reset puts
 * it all back and says so politely. The panel keeps inside the window and scrolls inside itself at 320 pixels.
 */
export function DisplayOptionsPopover({
  layouts,
  groupings,
  orderings,
  properties,
  value,
  defaultValue,
  defaults,
  onValueChange,
  onReset,
  trigger,
  align = "end",
  open,
  defaultOpen = false,
  onOpenChange,
  labels,
  className,
  ...props
}: DisplayOptionsPopoverProps) {
  const words = { ...DEFAULT_LABELS, ...labels };
  const options: DisplayOptions = { layouts, groupings, orderings, properties };
  const base = defaults ?? defaultDisplay(options);
  const [own, setOwn] = useState<DisplayValue | undefined>(defaultValue);
  const [ownOpen, setOwnOpen] = useState(defaultOpen);
  const isOpen = open ?? ownOpen;
  // A panel that is open from the start (a preview, a first-run tip) never takes focus from the page: that is only for a panel somebody opened.
  const [wasOpen, setWasOpen] = useState(isOpen);
  const [fresh, setFresh] = useState(isOpen);
  if (isOpen !== wasOpen) {
    setWasOpen(isOpen);
    if (!isOpen) setFresh(false);
  }
  const current = readDisplay(value ?? own, options, base);
  const count = changedSections(current, base).length;

  function setOpen(next: boolean) {
    if (open === undefined) setOwnOpen(next);
    onOpenChange?.(next);
  }

  return (
    <div data-slot="display-options-popover" data-changed={count || undefined} className={cn("inline-flex max-w-full min-w-0", className)} {...props}>
      <Popover open={isOpen} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          {trigger ?? (
            <Button type="button" variant="outline" className="gap-2">
              <IconLayout aria-hidden="true" />
              {words.trigger}
              {count > 0 ? (
                <Badge aria-hidden="true" className="-me-1 h-5 min-w-5 justify-center px-1.5 tabular-nums">
                  {count}
                </Badge>
              ) : null}
              {count > 0 ? <span className="sr-only">, {fill(words.changed, { count })}</span> : null}
            </Button>
          )}
        </PopoverTrigger>
        <PopoverContent
          align={align}
          collisionPadding={8}
          aria-label={words.title}
          onOpenAutoFocus={(event) => {
            // Radix would focus the first thing it finds, the Reset button in the header, and one press of Enter would put everything back: start on the layout instead.
            event.preventDefault();
            if (fresh) return;
            const panel = event.currentTarget;
            const first = panel instanceof HTMLElement ? panel.querySelector<HTMLElement>("[data-slot='toggle-group-item'][data-state='on']") : null;
            first?.focus({ preventScroll: true });
          }}
          className="flex max-h-[min(36rem,var(--radix-popover-content-available-height))] w-[min(21rem,calc(100vw-1rem))] flex-col overflow-hidden p-0"
        >
          <DisplayOptionsPanel
            layouts={layouts}
            groupings={groupings}
            orderings={orderings}
            properties={properties}
            value={current}
            defaults={base}
            onValueChange={(next) => {
              if (value === undefined) setOwn(next);
              onValueChange?.(next);
            }}
            onReset={onReset}
            labels={labels}
            className="min-h-0 flex-1"
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
