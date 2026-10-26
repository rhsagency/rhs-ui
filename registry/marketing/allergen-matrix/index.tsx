"use client";

import { useCallback, useEffect, useId, useRef, useState, type ComponentProps, type ReactNode } from "react";

import { IconClock, IconClose, IconInfo } from "@rhs-ui/icons";
import { EU_ALLERGENS, type Allergen } from "@rhs-ui/marketing/allergen-matrix/allergens";
import { Button } from "@rhs-ui/primitives/button";
import { Label } from "@rhs-ui/primitives/label";
import { Switch } from "@rhs-ui/primitives/switch";
import { TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@rhs-ui/primitives/table";
import { ToggleGroup, ToggleGroupItem } from "@rhs-ui/primitives/toggle-group";
import { cn } from "@/lib/utils";

export type { Allergen } from "@rhs-ui/marketing/allergen-matrix/allergens";

export interface AllergenDish {
  /** The dish as the menu names it. It is the row's heading. */
  name: string;
  /** The course it belongs to: "Starters", "Mains". Dishes are grouped by it, in the order the courses first appear. */
  course: string;
  /** The ids of the allergens that are in the recipe. */
  contains?: readonly string[];
  /** The ids of the allergens that are not in the recipe but may be present: shared equipment, a supplier's warning. A dish that contains an allergen is never also marked May contain for it. */
  mayContain?: readonly string[];
}

export interface AllergenMatrixLabels {
  /** The head of the dish column. */
  dishColumn: string;
  /** The label above the chips. */
  avoid: string;
  /** The label of the switch that also hides dishes that only may contain what was picked. */
  hideTraces: string;
  /** The button that clears the chips. */
  clear: string;
  /** The key to the solid mark, and the words read out in a cell that has it. */
  contains: string;
  /** The key to the ring, and the words read out in a cell that has it. */
  mayContain: string;
  /** The noun after a count of one. */
  dish: string;
  /** The noun after any other count. */
  dishes: string;
  /** Said as the chips narrow the list. {shown}, {total} and {noun} stand for the two counts and the noun. */
  shown: string;
  /** Said when nothing is picked. {total} and {noun} stand for the count and the noun. */
  all: string;
  /** Said when there are no dishes at all. */
  noDishes: string;
  /** Said when every dish is hidden. */
  empty: string;
  /** The button that appears with that message. */
  showAll: string;
  /** The words before the date the table was last checked. */
  updated: string;
  /** The accessible name of the scrolling table, when no `caption` is given. */
  region: string;
}

export interface AllergenMatrixProps extends Omit<ComponentProps<"section">, "title" | "children" | "defaultValue" | "onChange"> {
  /** The dishes, in the order you want them. They are grouped by course. */
  dishes: readonly AllergenDish[];
  /** The columns. The fourteen EU allergens by default (EU_ALLERGENS, from the item's allergens file). */
  allergens?: readonly Allergen[];
  /** The ids of the allergens the reader cannot eat, for a controlled matrix. */
  value?: readonly string[];
  /** The same, to start from when the matrix keeps its own state. */
  defaultValue?: readonly string[];
  /** Called with the ids of the picked allergens each time a chip is toggled or the chips are cleared. */
  onValueChange?: (value: string[]) => void;
  /** Whether a dish that only may contain a picked allergen is hidden too. On by default: when in doubt, leave it out. The reader can switch it off. */
  defaultHideMayContain?: boolean;
  /** Extra words about the marks: what May contain means in your kitchen. Shown under the table. */
  legend?: ReactNode;
  /** When the table was last checked against the recipes, as an ISO date: "2026-10-12". */
  updated?: string;
  /** A note the reader must not miss: tell your server about an allergy, the kitchen handles every allergen. Set in a panel under the table. */
  note?: ReactNode;
  /** The matrix's own heading, when the page has no other: "Allergens". */
  title?: string;
  /** One or two sentences under the title. */
  description?: string;
  /** The level of the title. */
  headingLevel?: 1 | 2 | 3;
  /** The table's name: the caption screen readers announce on arrival and the name of the scrolling region. */
  caption?: string;
  /** Words for the fixed text, for a site that is not in English. */
  labels?: Partial<AllergenMatrixLabels>;
  /** Locale for numbers and the date. */
  locale?: string;
  /** Time zone for an updated date that carries a time; a date without one is never shifted. */
  timeZone?: string;
}

const LABELS: AllergenMatrixLabels = {
  dishColumn: "Dish",
  avoid: "I cannot eat",
  hideTraces: "Also hide dishes that may contain them",
  clear: "Clear",
  contains: "Contains",
  mayContain: "May contain",
  dish: "dish",
  dishes: "dishes",
  shown: "{shown} of {total} {noun} shown",
  all: "{total} {noun}",
  noDishes: "No dishes are listed yet.",
  empty: "Every dish contains, or may contain, something you picked.",
  showAll: "Show every dish",
  updated: "Checked",
  region: "Allergens by dish",
};

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

function formatDate(value: string, locale: string, timeZone: string): string {
  const time = Date.parse(value);
  if (Number.isNaN(time)) return value;
  return new Intl.DateTimeFormat(locale, { dateStyle: "long", timeZone: DATE_ONLY.test(value) ? "UTC" : timeZone }).format(time);
}

/** Puts values into a sentence: {shown} becomes the number. Words stay plain strings, so they can cross from a Server Component. */
const fill = (template: string, values: Record<string, string | number>) => template.replace(/\{(\w+)\}/g, (match, key: string) => String(values[key] ?? match));

const has = (ids: readonly string[] | undefined, id: string) => ids?.includes(id) ?? false;

/**
 * Hands focus to the first chip. The button that clears the chips leaves the page with them, and focus would
 * otherwise fall to the top of the document, so a keyboard reader would have to tab through everything again.
 */
const focusFirstChip = (from: HTMLElement) => from.closest("section")?.querySelector<HTMLElement>('[data-slot="toggle-group-item"]')?.focus();

/**
 * The key and the cells draw the same two marks: a solid disc for Contains, a ring for May contain. Shape, not
 * colour, tells them apart. In forced colours (Windows high contrast) a background is dropped, so the disc gets
 * a border as thick as its radius there, which keeps it solid.
 */
const DISC = "block size-3.5 rounded-full bg-foreground forced-colors:border-[7px]";
const RING = "block size-3.5 rounded-full border-[1.5px] border-foreground";

/** A soft shade along the edge of the table that still has more behind it: the cue that it scrolls. */
const EDGE = "pointer-events-none absolute z-10 transition-opacity duration-150 motion-reduce:transition-none";

/**
 * The chips are separate pills, not the joined bar a ToggleGroup draws by default. A picked chip is filled; in
 * forced colours, where fills are dropped, it gets a second outline instead, as pressed buttons do elsewhere.
 */
const CHIP =
  "h-8 rounded-full border-l px-3.5 text-[0.8125rem] first:rounded-full last:rounded-full forced-colors:aria-pressed:outline-2 forced-colors:aria-pressed:-outline-offset-2 forced-colors:aria-pressed:outline-solid";

/** The switch's thumb is a background too, so in forced colours it is drawn as a border as thick as its radius: the side it sits on still shows the state. */
const SWITCH = "forced-colors:[&>span]:border-[9px]";

/**
 * Every dish against the fourteen allergens, as the real table food
 * businesses in the EU have to publish. Dishes are the row headings, grouped
 * by course; allergens are the columns. A cell says Contains or May contain in
 * words for assistive technology and draws a solid disc or a ring for
 * everyone else, so the two never depend on colour. A row of toggle chips
 * lets a reader pick what they cannot eat and hides every dish that contains
 * it (and, unless they switch that off, every dish that may), announcing how
 * many are left. The first column and the header row stay in place while the
 * table scrolls inside its own region, so a phone keeps the dish name and the
 * allergen in view, and a soft shade along the right and bottom edge shows
 * while there is more behind it. Column heads use short names; the full name
 * is the accessible one. Set `--matrix-max-height` on the component (it is
 * 40rem by default, and never more than 80% of the screen) to change how tall
 * the table gets before it scrolls.
 */
export function AllergenMatrix({
  dishes,
  allergens = EU_ALLERGENS,
  value,
  defaultValue = [],
  onValueChange,
  defaultHideMayContain = true,
  legend,
  updated,
  note,
  title,
  description,
  headingLevel = 2,
  caption,
  labels: custom,
  locale = "en-US",
  timeZone = "UTC",
  className,
  ...props
}: AllergenMatrixProps) {
  const labels = { ...LABELS, ...custom };
  const id = useId();
  const Title = `h${headingLevel}` as "h1" | "h2" | "h3";
  const [own, setOwn] = useState<readonly string[]>(defaultValue);
  const [hideMayContain, setHideMayContain] = useState(defaultHideMayContain);
  const numbers = new Intl.NumberFormat(locale);
  const scroller = useRef<HTMLDivElement>(null);
  const [more, setMore] = useState({ right: false, bottom: false });

  // Whether the table has more to show to the right or below, so the edge cue appears only while it is true.
  const measure = useCallback(() => {
    const element = scroller.current;
    if (!element) return;
    const right = element.scrollWidth - element.scrollLeft - element.clientWidth > 2;
    const bottom = element.scrollHeight - element.scrollTop - element.clientHeight > 2;
    setMore((previous) => (previous.right === right && previous.bottom === bottom ? previous : { right, bottom }));
  }, []);

  const known = new Set(allergens.map((allergen) => allergen.id));
  const active = (value ?? own).filter((allergenId) => known.has(allergenId));
  const picked = new Set(active);
  const setSelected = (next: string[]) => {
    if (value === undefined) setOwn(next);
    onValueChange?.(next);
  };

  const visible = dishes.filter((dish) => !active.some((allergenId) => has(dish.contains, allergenId) || (hideMayContain && has(dish.mayContain, allergenId))));
  const courses: { name: string; dishes: AllergenDish[] }[] = [];
  for (const dish of visible) {
    let course = courses.find((entry) => entry.name === dish.course);
    if (!course) {
      course = { name: dish.course, dishes: [] };
      courses.push(course);
    }
    course.dishes.push(dish);
  }

  useEffect(() => {
    const element = scroller.current;
    if (!element) return;
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    if (element.firstElementChild) observer.observe(element.firstElementChild);
    return () => observer.disconnect();
  }, [measure, visible.length, allergens.length]);

  const total = dishes.length;
  const noun = (count: number) => (count === 1 ? labels.dish : labels.dishes);
  const status = active.length
    ? fill(labels.shown, { shown: numbers.format(visible.length), total: numbers.format(total), noun: noun(total) })
    : fill(labels.all, { total: numbers.format(total), noun: noun(total) });
  const hasFooter = Boolean(legend || updated || note);

  const header =
    title || description ? (
      <header className="mb-8 max-w-2xl">
        {title ? <Title className="text-4xl leading-[1.05] font-medium tracking-[-0.04em] text-balance sm:text-5xl">{title}</Title> : null}
        {description ? <p className={cn("text-base leading-relaxed text-pretty text-muted-foreground sm:text-lg", title && "mt-4")}>{description}</p> : null}
      </header>
    ) : null;

  if (total === 0) {
    return (
      <section data-slot="allergen-matrix" className={cn("w-full break-words", className)} {...props}>
        {header}
        <p className="rounded-xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">{labels.noDishes}</p>
      </section>
    );
  }

  return (
    <section data-slot="allergen-matrix" className={cn("w-full break-words", className)} {...props}>
      {header}

      <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
        {/* Clear is always in this row and only hidden until something is picked, so the first chip moves nothing. Its negative margin keeps the row as tall as the label. */}
        <div className="flex items-center justify-between gap-3">
          <p id={`${id}-avoid`} className="text-sm font-medium">
            {labels.avoid}
          </p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={active.length === 0}
            className={cn("-my-1.5", active.length === 0 && "invisible")}
            onClick={(event) => {
              setSelected([]);
              focusFirstChip(event.currentTarget);
            }}
          >
            <IconClose aria-hidden="true" />
            {labels.clear}
          </Button>
        </div>
        <ToggleGroup
          type="multiple"
          size="sm"
          aria-labelledby={`${id}-avoid`}
          value={[...active]}
          onValueChange={setSelected}
          className="mt-3 flex w-full flex-wrap gap-2 rounded-none data-[variant=outline]:shadow-none"
        >
          {allergens.map((allergen) => (
            <ToggleGroupItem key={allergen.id} value={allergen.id} aria-label={allergen.name} className={CHIP}>
              {allergen.short ?? allergen.name}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <div className="mt-4 flex items-center gap-3 border-t border-border pt-4">
          <Switch id={`${id}-traces`} checked={hideMayContain} onCheckedChange={setHideMayContain} className={SWITCH} />
          <Label htmlFor={`${id}-traces`} className="leading-snug font-normal">
            {labels.hideTraces}
          </Label>
        </div>
      </div>

      {/* On a phone the count has a line of its own in both states: "14 dishes" and "3 of 14 dishes shown" would otherwise sit on one line or two depending on the screen, and the table would move as the reader picks. */}
      <div className="mt-6 mb-3 flex flex-col gap-y-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-x-6">
        <ul role="list" aria-hidden="true" className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm text-muted-foreground">
          <li className="flex items-center gap-2">
            <span className={DISC} />
            {labels.contains}
          </li>
          <li className="flex items-center gap-2">
            <span className={RING} />
            {labels.mayContain}
          </li>
        </ul>
        <p role="status" aria-live="polite" className="text-sm text-muted-foreground tabular-nums">
          {status}
        </p>
      </div>

      {visible.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border px-4 py-12 text-center">
          <p className="mx-auto max-w-md text-sm leading-relaxed text-muted-foreground">{labels.empty}</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={(event) => {
              setSelected([]);
              focusFirstChip(event.currentTarget);
            }}
          >
            {labels.showAll}
          </Button>
        </div>
      ) : (
        <div className="relative">
          <div
            ref={scroller}
            onScroll={measure}
            role="region"
            tabIndex={0}
            aria-label={caption ?? title ?? labels.region}
            className="relative isolate max-h-[min(var(--matrix-max-height,40rem),80dvh)] overflow-auto rounded-xl border border-border bg-card outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40"
          >
            <table className="w-max min-w-full border-separate border-spacing-0 text-sm">
              <TableCaption className="sr-only">{caption ?? title ?? labels.region}</TableCaption>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead scope="col" className="sticky top-0 left-0 z-30 h-auto w-36 min-w-36 border-r border-b border-border bg-card px-3 py-3 text-left text-xs tracking-[0.12em] text-muted-foreground uppercase sm:w-56 sm:min-w-56 sm:px-4">
                    {labels.dishColumn}
                  </TableHead>
                  {allergens.map((allergen) => {
                    const short = allergen.short ?? allergen.name;
                    return (
                      <TableHead
                        key={allergen.id}
                        scope="col"
                        className={cn(
                          "sticky top-0 z-20 h-auto min-w-[4.25rem] border-b bg-card px-1 py-3 text-center text-[0.6875rem] leading-tight font-medium whitespace-normal text-foreground",
                          picked.has(allergen.id) ? "border-b-2 border-foreground" : "border-border",
                        )}
                      >
                        <span aria-hidden="true">{short}</span>
                        <span className="sr-only">{allergen.name}</span>
                      </TableHead>
                    );
                  })}
                </TableRow>
              </TableHeader>
              {courses.map((course) => (
                <TableBody key={course.name} className="[&:last-of-type>tr:last-child>*]:border-b-0">
                  <TableRow className="hover:bg-transparent">
                    <TableHead scope="rowgroup" colSpan={allergens.length + 1} className="h-auto border-b border-border bg-muted p-0 text-left">
                      <span className="sticky left-0 inline-block px-3 py-2 text-xs font-medium tracking-[0.12em] uppercase sm:px-4">
                        {course.name}
                        <span aria-hidden="true" className="ml-2 text-muted-foreground tabular-nums">
                          {numbers.format(course.dishes.length)}
                        </span>
                        <span className="sr-only">
                          , {numbers.format(course.dishes.length)} {noun(course.dishes.length)}
                        </span>
                      </span>
                    </TableHead>
                  </TableRow>
                  {course.dishes.map((dish, index) => (
                    <TableRow key={`${dish.name}-${index}`} className="group/row hover:bg-transparent">
                      <TableHead
                        scope="row"
                        className="sticky left-0 z-10 h-auto w-36 min-w-36 border-r border-b border-border bg-card px-3 py-3 text-left text-[0.8125rem] leading-snug font-medium whitespace-normal text-foreground transition-colors duration-150 group-hover/row:bg-muted sm:text-sm motion-reduce:transition-none sm:w-56 sm:min-w-56 sm:px-4"
                      >
                        {dish.name}
                      </TableHead>
                      {allergens.map((allergen) => {
                        const contains = has(dish.contains, allergen.id);
                        const may = !contains && has(dish.mayContain, allergen.id);
                        return (
                          <TableCell key={allergen.id} className="h-auto border-b border-border bg-card px-1 py-3 text-center transition-colors duration-150 group-hover/row:bg-muted motion-reduce:transition-none">
                            {contains ? (
                              <>
                                <span aria-hidden="true" className={cn(DISC, "mx-auto")} />
                                <span className="sr-only">{labels.contains}</span>
                              </>
                            ) : may ? (
                              <>
                                <span aria-hidden="true" className={cn(RING, "mx-auto")} />
                                <span className="sr-only">{labels.mayContain}</span>
                              </>
                            ) : (
                              <span aria-hidden="true" className="mx-auto block h-px w-2 bg-border" />
                            )}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              ))}
            </table>
          </div>
          <div
            aria-hidden="true"
            className={cn(EDGE, "inset-y-px right-px w-5 rounded-r-xl shadow-[inset_-14px_0_12px_-12px_color-mix(in_oklch,var(--foreground)_18%,transparent)]", more.right ? "opacity-100" : "opacity-0")}
          />
          <div
            aria-hidden="true"
            className={cn(EDGE, "inset-x-px bottom-px h-5 rounded-b-xl shadow-[inset_0_-14px_12px_-12px_color-mix(in_oklch,var(--foreground)_18%,transparent)]", more.bottom ? "opacity-100" : "opacity-0")}
          />
        </div>
      )}

      {hasFooter ? (
        <div className="mt-5 grid gap-4">
          {legend ? <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground [&_a]:rounded-sm [&_a]:text-foreground [&_a]:underline [&_a]:decoration-foreground/40 [&_a]:underline-offset-4 [&_a]:outline-none [&_a:hover]:decoration-foreground [&_a:focus-visible]:ring-[3px] [&_a:focus-visible]:ring-ring/40">{legend}</p> : null}
          {updated ? (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <IconClock aria-hidden="true" className="size-4 shrink-0" />
              <span>
                {labels.updated} <time dateTime={updated}>{formatDate(updated, locale, timeZone)}</time>
              </span>
            </p>
          ) : null}
          {note ? (
            <div className="flex gap-3 rounded-xl border border-border bg-muted/40 p-4 text-sm leading-relaxed">
              <IconInfo aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
              <div className="min-w-0 [&_a]:rounded-sm [&_a]:text-foreground [&_a]:underline [&_a]:decoration-foreground/40 [&_a]:underline-offset-4 [&_a]:outline-none [&_a:hover]:decoration-foreground [&_a:focus-visible]:ring-[3px] [&_a:focus-visible]:ring-ring/40">{note}</div>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
