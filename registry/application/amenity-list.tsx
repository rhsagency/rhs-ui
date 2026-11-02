"use client";

import { useId, useState, type ComponentProps, type ReactNode } from "react";

import { IconCheck, IconChevronDown } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { cn } from "@/lib/utils";

/** One thing a place offers. */
export interface Amenity {
  /** A stable identity: the key of the item in its list. */
  id: string;
  /** What it is: "Wi-Fi", "Dishwasher". */
  label: string;
  /** An icon element, drawn at 20px: `<IconWifi />`. Without one the item shows a check, or a dash when it is not included. */
  icon?: ReactNode;
  /** Whether it is there. An amenity that is not there is struck through and says "Not included". Default true. */
  available?: boolean;
  /** One line of detail under the label: "Fibre, 500 Mbps", "Shared with the building". */
  note?: string;
  /** The `id` of the group it belongs to. Only read when the list has `groups`. */
  group?: string;
}

/** A heading the amenities are sorted under. */
export interface AmenityGroup {
  /** The id that `Amenity.group` refers to. */
  id: string;
  /** The heading: "Bathroom". */
  label: string;
}

/** The words the list uses, for translation. `{count}` is filled in. */
export interface AmenityListLabels {
  /** Said, and written under the label, for an amenity that is not there. Default "Not included". */
  notIncluded?: string;
  /** The toggle while the long tail is hidden; `{count}` is every amenity, not only the hidden ones. Default "Show all {count} amenities". */
  showAll?: string;
  /** The toggle while everything is shown. Default "Show fewer". */
  showFewer?: string;
  /** The heading of the amenities that name no group, when there are groups. Default "Other". */
  other?: string;
}

export interface AmenityListProps extends Omit<ComponentProps<"div">, "children"> {
  /** Everything the place offers, in the order you want it. With `groups` they are sorted under the headings and keep their order inside each. */
  amenities: readonly Amenity[];
  /** How many amenities show before the toggle; the rest sit behind "Show all 24 amenities". With no more than this many there is no toggle. Default 8. */
  visibleCount?: number;
  /** Headings to sort the amenities under, in order: Bathroom, Kitchen, Outdoor. A heading with nothing to show yet is not drawn. */
  groups?: readonly AmenityGroup[];
  /** Whether everything is shown, controlled. */
  expanded?: boolean;
  /** Whether everything starts shown, when you do not control `expanded`. */
  defaultExpanded?: boolean;
  /** The toggle was pressed, with the state it asks for. */
  onExpandedChange?: (expanded: boolean) => void;
  /** Heading level of the group headings. Default 3. */
  headingLevel?: 2 | 3 | 4;
  /** The words the list uses, for translation. */
  labels?: AmenityListLabels;
}

const DEFAULT_LABELS = { notIncluded: "Not included", showAll: "Show all {count} amenities", showFewer: "Show fewer", other: "Other" };

const fill = (template: string, values: Record<string, string | number>) => template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ""));

function Item({ amenity, notIncluded }: { amenity: Amenity; notIncluded: string }) {
  const there = amenity.available !== false;
  return (
    <li data-slot="amenity" data-available={there} className="flex items-start gap-3.5">
      <span aria-hidden="true" className={cn("mt-px grid size-6 shrink-0 place-items-center [&_svg]:size-5", there ? "text-foreground" : "text-muted-foreground/70")}>
        {amenity.icon ?? <IconCheck />}
      </span>
      <span className="min-w-0">
        <span className={cn("block text-sm leading-6 [overflow-wrap:anywhere]", there ? "text-foreground" : "text-muted-foreground line-through decoration-muted-foreground/70")}>{amenity.label}</span>
        {there ? null : <span className="sr-only">, {notIncluded}</span>}
        {there ? (
          amenity.note ? (
            <span className="block text-[0.8125rem] leading-5 text-muted-foreground [overflow-wrap:anywhere]">{amenity.note}</span>
          ) : null
        ) : (
          // The words "Not included" are said above as hidden text, so here they are for the eye only; the note after them is for everyone.
          <span className="block text-[0.8125rem] leading-5 text-muted-foreground [overflow-wrap:anywhere]">
            <span aria-hidden="true">{notIncluded}</span>
            {amenity.note ? (
              <>
                <span aria-hidden="true"> · </span>
                <span>{amenity.note}</span>
              </>
            ) : null}
          </span>
        )}
      </span>
    </li>
  );
}

/**
 * What a place offers, as a grid of amenities for a hotel, a rental, a venue
 * or a vehicle: each one an icon and a label in a real list. One that is
 * not there is struck through and reads "Not included", in words for the eye
 * and for a screen reader alike, never by colour alone. The first few show;
 * the long tail sits behind a toggle that says how many there are in all
 * ("Show all 24 amenities") and reports `aria-expanded`. Given `groups`, the
 * amenities are sorted under headings (Bathroom, Kitchen, Outdoor), and a
 * heading appears as soon as there is something to put under it.
 */
export function AmenityList({
  amenities,
  visibleCount = 8,
  groups,
  expanded: controlled,
  defaultExpanded = false,
  onExpandedChange,
  headingLevel = 3,
  labels,
  className,
  ...props
}: AmenityListProps) {
  const text = { ...DEFAULT_LABELS, ...labels };
  const listId = useId();
  const [own, setOwn] = useState(defaultExpanded);
  const open = controlled ?? own;
  const Heading = `h${headingLevel}` as "h2" | "h3" | "h4";

  const known = new Set((groups ?? []).map((group) => group.id));
  const sections: { id: string; label: string | null; items: readonly Amenity[] }[] = groups
    ? [
        ...groups.map((group) => ({ id: group.id, label: group.label, items: amenities.filter((amenity) => amenity.group === group.id) })),
        { id: "", label: text.other, items: amenities.filter((amenity) => !amenity.group || !known.has(amenity.group)) },
      ]
    : [{ id: "all", label: null, items: amenities }];

  // The first `visibleCount` in reading order are the ones on show until the list is opened.
  const shown = new Set((open ? amenities : sections.flatMap((section) => section.items).slice(0, Math.max(0, visibleCount))).map((amenity) => amenity.id));
  const hidden = amenities.length > Math.max(0, visibleCount);

  return (
    <div data-slot="amenity-list" data-expanded={open} className={cn("@container grid gap-6", className)} {...props}>
      <div id={listId} className="grid gap-7">
        {sections.map((section) => {
          const items = section.items.filter((amenity) => shown.has(amenity.id));
          if (!items.length) return null;
          const headingId = `${listId}-${section.id || "other"}`;
          return (
            <section key={section.id} aria-labelledby={section.label ? headingId : undefined} className="grid gap-3.5">
              {section.label ? (
                <Heading id={headingId} className="text-sm font-semibold tracking-[-0.02em]">
                  {section.label}
                </Heading>
              ) : null}
              <ul className="grid gap-x-8 gap-y-3.5 @md:grid-cols-2">
                {items.map((amenity) => (
                  <Item key={amenity.id} amenity={amenity} notIncluded={text.notIncluded} />
                ))}
              </ul>
            </section>
          );
        })}
      </div>
      {hidden ? (
        <div>
          <Button
            type="button"
            variant="outline"
            aria-expanded={open}
            aria-controls={listId}
            onClick={() => {
              if (controlled === undefined) setOwn(!open);
              onExpandedChange?.(!open);
            }}
          >
            {open ? text.showFewer : fill(text.showAll, { count: amenities.length })}
            <IconChevronDown className={cn("transition-transform duration-200 motion-reduce:transition-none", open && "rotate-180")} />
          </Button>
        </div>
      ) : null}
    </div>
  );
}
