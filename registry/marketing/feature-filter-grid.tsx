"use client";

import { useEffect, useLayoutEffect, useRef, useState, type ComponentProps, type ReactNode } from "react";

import { IconArrowRight } from "@rhs-ui/icons";
import { Badge } from "@rhs-ui/primitives/badge";
import { SectionHeading } from "@rhs-ui/primitives/section-heading";
import { ToggleGroup, ToggleGroupItem } from "@rhs-ui/primitives/toggle-group";
import { cn } from "@/lib/utils";

export interface FilterFeature {
  /** A stable id for the feature. It keys the cell, so it must be unique. */
  id: string;
  /** A glyph from @rhs-ui/icons, drawn at 18px in a small tile. It is decoration: the title names the feature. Give every feature one, or none: the tiles are left out when no feature has an icon. */
  icon?: ReactNode;
  /** What the feature is called, in a few words: "Shared inboxes". */
  title: string;
  /** One or two lines on what it does for the reader. */
  description: string;
  /** The ids of the groups it belongs to. A feature can sit in several, such as a tool both founders and engineers use. One with none only shows under All. */
  groups?: readonly string[];
  /** Where to read more. The whole cell becomes a link, named by the title. */
  href?: string;
  /** A short mark beside the title, in words: "New", "Beta", "Business". */
  tag?: string;
}

export interface FeatureFilterGroup {
  /** The id that features list in `groups`. "all" is taken by the first chip. */
  id: string;
  /** The text of the chip: "Security", "Founders". */
  label: string;
}

export interface FeatureFilterGridLabels {
  /** The first chip, which shows every feature. */
  all: string;
  /** The word for one feature, used in the counts. */
  noun: string;
  /** The word for any other number of features. */
  nouns: string;
  /** Said, politely, when a chip narrows the grid. {shown}, {total} and {noun} stand for the two counts and the word. */
  showing: string;
  /** Said when nothing narrows the grid. {total} and {noun} stand for the count and the word. */
  showingAll: string;
}

export interface FeatureFilterGridProps extends Omit<ComponentProps<"section">, "title" | "children" | "defaultValue" | "onChange"> {
  /** The small line over the heading: "Everything in Halcyon". */
  eyebrow?: string;
  /** The heading. Without one the block starts with the chips. */
  title?: string;
  /** One or two sentences under the heading. */
  description?: string;
  /** Every feature, in the order the cells show them. */
  features: readonly FilterFeature[];
  /** The chips that follow All, in order. A group nothing belongs to is never offered. */
  groups: readonly FeatureFilterGroup[];
  /** The group shown at first, by id. All when left out, or when that group has no features. */
  defaultGroup?: string;
  /** The group shown, by id, when you control the block. "all" stands for the first chip. */
  group?: string;
  /** Called with the id of the group after a chip is chosen. "all" stands for the first chip. */
  onGroupChange?: (group: string) => void;
  /** Names the row of chips for assistive technology: "Filter features by area". */
  label?: string;
  /** The level of the heading: 2 by default. The title of each feature sits one level below. */
  headingLevel?: 2 | 3;
  /** Words for the fixed text, for a site that is not in English. */
  labels?: Partial<FeatureFilterGridLabels>;
}

const LABELS: FeatureFilterGridLabels = {
  all: "All",
  noun: "feature",
  nouns: "features",
  showing: "Showing {shown} of {total} {noun}",
  showingAll: "Showing all {total} {noun}",
};

const ALL = "all";

/**
 * The chips are separate pills, not the joined bar a ToggleGroup draws by default. The chosen one is filled; in
 * forced colours, where fills are dropped, it gets an outline as well.
 */
const CHIP =
  "h-8 gap-1.5 rounded-full border-l px-3.5 text-[0.8125rem] first:rounded-full last:rounded-full forced-colors:data-[state=on]:outline-2 forced-colors:data-[state=on]:-outline-offset-2 forced-colors:data-[state=on]:outline-solid";

const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Splits the last word off a title, so the arrow can be held to it and never wraps onto a line of its own. A last
 * word too long to hold (it may need to break to fit a narrow cell) is left in the head and the arrow simply follows.
 */
function splitLastWord(text: string): [head: string, tail: string] {
  const cut = text.trimEnd().lastIndexOf(" ") + 1;
  return text.length - cut > 18 ? [text, ""] : [text.slice(0, cut), text.slice(cut)];
}

/**
 * The title as the cell's link. The arrow sits in the text, after the last word, so a title that wraps ends in its
 * arrow instead of leaving it at the far edge of the cell. It shows on hover and focus, and always on a touch screen.
 */
function TitleLink({ href, title }: { href: string; title: string }): React.JSX.Element {
  const [head, tail] = splitLastWord(title);
  return (
    <a href={href} className="rounded-sm outline-none after:absolute after:inset-0 after:rounded-lg after:ring-ring/40 focus-visible:after:ring-[3px]">
      {head}
      <span className="whitespace-nowrap">
        {tail}
        <IconArrowRight
          aria-hidden="true"
          className="ml-1.5 inline-block size-3.5 align-[-0.15em] -translate-x-1 opacity-0 transition-[opacity,translate] duration-150 group-focus-within/cell:translate-x-0 group-focus-within/cell:opacity-100 group-hover/cell:translate-x-0 group-hover/cell:opacity-100 motion-reduce:transition-none [@media(hover:none)]:translate-x-0 [@media(hover:none)]:opacity-60"
        />
      </span>
    </a>
  );
}

/**
 * Keeps the grid as tall as it was while its cells change, then lets it settle to its new height: the page below
 * never jumps. `hold` is called just before the cells change and remembers the height they have; `trigger` is
 * the number that changes with the cells. Under reduced motion nothing is held and the grid changes at once.
 */
function useSettledHeight(trigger: number) {
  const frame = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const held = useRef<number | null>(null);
  const finish = useRef<(() => void) | null>(null);

  const hold = () => {
    held.current = frame.current && !prefersReducedMotion() ? frame.current.getBoundingClientRect().height : null;
  };

  useLayoutEffect(() => {
    // A settle that is still running ends here, so the next one starts from the height on screen.
    finish.current?.();
    const from = held.current;
    held.current = null;
    const box = frame.current;
    const cells = list.current;
    if (trigger === 0 || from === null || !box || !cells) return;
    const to = cells.getBoundingClientRect().height;
    if (Math.abs(from - to) < 1) return;

    box.style.overflow = "clip";
    box.style.height = `${from}px`;
    void box.offsetHeight;
    // A beat at the old height while the new cells arrive, then an even, unhurried settle.
    box.style.transition = "height 360ms cubic-bezier(0.4, 0, 0.2, 1) 60ms";
    box.style.height = `${to}px`;

    const done = () => {
      box.removeEventListener("transitionend", onEnd);
      window.clearTimeout(timer);
      box.style.height = "";
      box.style.overflow = "";
      box.style.transition = "";
      finish.current = null;
    };
    const onEnd = (event: TransitionEvent) => {
      if (event.target === box && event.propertyName === "height") done();
    };
    const timer = window.setTimeout(done, 560);
    box.addEventListener("transitionend", onEnd);
    finish.current = done;
  }, [trigger]);

  useEffect(() => () => finish.current?.(), []);

  return { frame, list, hold };
}

/**
 * A grid of many features with chips to filter it by area or by role. For a product with enough features that a
 * plain grid turns into a wall, and for pitching one product to several roles without a page per role. The chips
 * are a toggle group (arrow keys move between them, Tab leaves) and each shows how many features it holds; a group
 * nothing belongs to is never offered. Choosing one filters in place and says, politely, "Showing 7 of 24
 * features". The grid keeps the height it had while the new cells arrive and then settles to its own, so the page
 * below does not jump; under reduced motion it simply changes. A feature with an href is a whole-cell link, named
 * by its title, whose arrow shows on hover and focus and always on a touch screen. The cells are a list, so the
 * count is read out. The cells come in 1, 2 or 3 columns by the width of the block, not of the screen.
 */
export function FeatureFilterGrid({
  eyebrow,
  title,
  description,
  features,
  groups,
  defaultGroup,
  group,
  onGroupChange,
  label = "Filter features",
  headingLevel = 2,
  labels: custom,
  className,
  ...props
}: FeatureFilterGridProps) {
  const labels = { ...LABELS, ...custom };
  // Only groups that have something in them, and never one that would shadow the All chip.
  const offered = groups.filter((entry) => entry.id !== ALL && features.some((feature) => feature.groups?.includes(entry.id)));
  const known = (id: string | undefined): id is string => id === ALL || offered.some((entry) => entry.id === id);
  const [own, setOwn] = useState(known(defaultGroup) ? defaultGroup : ALL);
  const requested = group ?? own;
  const current = known(requested) ? requested : ALL;
  // Counts every time the cells change, so each change plays its own entrance and the first paint plays none.
  const [changes, setChanges] = useState(0);
  const { frame, list, hold } = useSettledHeight(changes);

  const shown = current === ALL ? features : features.filter((feature) => feature.groups?.includes(current));
  const hasIcons = features.some((feature) => feature.icon);
  const noun = (count: number) => (count === 1 ? labels.noun : labels.nouns);
  const message = (shown.length === features.length ? labels.showingAll : labels.showing)
    .replace("{shown}", String(shown.length))
    .replace("{total}", String(features.length))
    .replace("{noun}", noun(features.length));
  const CellTitle = `h${headingLevel + 1}` as "h3" | "h4";

  const choose = (next: string) => {
    // Pressing the chosen chip again would clear a single choice; the grid always has one.
    if (!next || next === current) return;
    hold();
    setChanges((count) => count + 1);
    if (group === undefined) setOwn(next);
    onGroupChange?.(next);
  };

  // The count is a shade lighter than the chip's word, but not by much: at 80% it still clears 4.5:1 on a light chip.
  const chipCount = (total: number) => (
    <>
      <span aria-hidden="true" className="tabular-nums opacity-80">
        {total}
      </span>
      <span className="sr-only">
        , {total} {noun(total)}
      </span>
    </>
  );

  return (
    <section data-slot="feature-filter-grid" className={cn("@container w-full break-words", className)} {...props}>
      {title ? <SectionHeading eyebrow={eyebrow} title={title} description={description} as={headingLevel === 3 ? "h3" : "h2"} /> : null}

      {offered.length ? (
        <div className={cn("flex flex-col gap-4 @2xl:flex-row @2xl:items-center @2xl:justify-between @2xl:gap-8", title && "mt-8 @3xl:mt-10")}>
          <ToggleGroup
            type="single"
            size="sm"
            aria-label={label}
            value={current}
            onValueChange={choose}
            className="flex w-full flex-wrap gap-2 rounded-none data-[variant=outline]:shadow-none @2xl:w-auto"
          >
            <ToggleGroupItem value={ALL} className={CHIP}>
              {labels.all}
              {chipCount(features.length)}
            </ToggleGroupItem>
            {offered.map((entry) => (
              <ToggleGroupItem key={entry.id} value={entry.id} className={CHIP}>
                {entry.label}
                {chipCount(features.filter((feature) => feature.groups?.includes(entry.id)).length)}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          {/* The status has a line of its own on a phone, and sits at the right on a wide block: it is the same words either way. */}
          <p role="status" aria-live="polite" className="shrink-0 text-sm text-muted-foreground tabular-nums">
            {message}
          </p>
        </div>
      ) : null}

      <div ref={frame} className={cn(offered.length || title ? "mt-8 @3xl:mt-10" : "")}>
        <ul ref={list} role="list" className="grid gap-x-10 @xl:grid-cols-2 @4xl:grid-cols-3">
          {shown.map((feature, index) => (
            <li
              key={`${changes}-${feature.id}`}
              style={changes > 0 ? { animationDelay: `${Math.min(index, 11) * 18}ms` } : undefined}
              className={cn(
                "group/cell relative flex gap-4 border-t border-border py-6 transition-colors duration-150 motion-reduce:transition-none",
                feature.href && "hover:border-foreground/40",
                changes > 0 && "motion-safe:animate-rhs-feature-in",
              )}
            >
              {/* When some features have an icon, one without gets a blank space of the same size, so every title starts at the same place. When none has, there are no tiles. */}
              {hasIcons ? (
                <span aria-hidden="true" className={cn("grid size-9 shrink-0 place-items-center rounded-lg [&_svg]:size-[1.125rem]", feature.icon && "border border-border bg-card text-foreground")}>
                  {feature.icon}
                </span>
              ) : null}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
                  <CellTitle className="min-w-0 text-[0.9375rem] leading-snug font-medium tracking-[-0.01em] text-pretty">
                    {feature.href ? <TitleLink href={feature.href} title={feature.title} /> : feature.title}
                  </CellTitle>
                  {feature.tag ? (
                    <Badge variant="outline" className="shrink-0">
                      {feature.tag}
                    </Badge>
                  ) : null}
                </div>
                <p className="mt-1.5 text-sm leading-relaxed text-pretty text-muted-foreground">{feature.description}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
