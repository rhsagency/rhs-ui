"use client";

import { useId, type ComponentProps, type KeyboardEvent, type ReactNode } from "react";

import { IconArrowRight } from "@rhs-ui/icons";
import { Badge } from "@rhs-ui/primitives/badge";
import { Button } from "@rhs-ui/primitives/button";
import { cn } from "@/lib/utils";

/** One way to begin: a template, an import, an invite. It is a button when you give `onSelect` and a link when you give `href`. */
export interface FirstRunOption {
  /** A stable key, also what `recommendedId` points at. */
  id: string;
  /** What it is called: "Start from a template". */
  title: string;
  /** One line on what happens: "Pick a layout and fill in the blanks." */
  description: string;
  /** The picture on the card, drawn at 20px: an icon from `@rhs-ui/icons` or your own SVG. */
  icon?: ReactNode;
  /** Called when the card is chosen. On a link it runs before the browser follows `href`. */
  onSelect?: () => void;
  /** Makes the card a link to this address. */
  href?: string;
}

/** The words the state uses, for translation. */
export interface FirstRunStateLabels {
  /** The name of the group of cards for a screen reader, when the heading is not enough. Default "Ways to get started". */
  group?: string;
  /** The word on the recommended card. Default "Recommended". */
  recommended?: string;
  /** The quiet link under the cards. Default "Skip for now". */
  skip?: string;
}

export interface FirstRunStateProps extends Omit<ComponentProps<"section">, "children" | "title"> {
  /** The one promise, as the heading: "Welcome to Halcyon". */
  title: string;
  /** A line of context under it: what they get and that nothing is final. */
  description?: string;
  /** Two to four ways to begin. More than four is a menu, and fewer than two is an Empty State with one action. */
  options: readonly FirstRunOption[];
  /** The `id` of the option most people should pick. It carries the word "Recommended". */
  recommendedId?: string;
  /** Shows a quiet "Skip for now" under the cards and calls this when it is pressed. Leave it out when skipping makes no sense. */
  onSkip?: () => void;
  /** Heading level of the title. Default 2. */
  headingLevel?: 2 | 3 | 4;
  /** The words the state uses, for translation. */
  labels?: FirstRunStateLabels;
}

const DEFAULT_LABELS = {
  group: "Ways to get started",
  recommended: "Recommended",
  skip: "Skip for now",
} satisfies Required<FirstRunStateLabels>;

/** The columns for the number of cards, written out so Tailwind sees every class. Two and four cards sit in two columns, three in a row once there is room. */
const GRID: Record<number, string> = {
  1: "mx-auto max-w-sm",
  2: "@md:grid-cols-2",
  3: "@2xl:grid-cols-3",
  4: "@md:grid-cols-2",
};

/** Where the arrow keys go from the card that has focus: sideways through the cards in order, up and down to the nearest card in the row above or below. Null when the key is not an arrow. */
function target(items: HTMLElement[], from: HTMLElement, key: string, rtl: boolean): HTMLElement | undefined | null {
  const index = items.indexOf(from);
  if (key === "Home") return items[0];
  if (key === "End") return items[items.length - 1];
  if (key === "ArrowRight" || key === "ArrowLeft") {
    const forward = (key === "ArrowRight") !== rtl;
    return items[(index + (forward ? 1 : -1) + items.length) % items.length];
  }
  if (key !== "ArrowDown" && key !== "ArrowUp") return null;
  const box = from.getBoundingClientRect();
  const down = key === "ArrowDown";
  const rows = items
    .map((item) => ({ item, rect: item.getBoundingClientRect() }))
    .filter(({ rect }) => (down ? rect.top > box.top + 4 : rect.top < box.top - 4));
  if (!rows.length) return down ? items[0] : items[items.length - 1];
  const nearest = (down ? Math.min : Math.max)(...rows.map(({ rect }) => rect.top));
  const row = rows.filter(({ rect }) => Math.abs(rect.top - nearest) < 4);
  const centre = box.left + box.width / 2;
  return row.sort((a, b) => Math.abs(a.rect.left + a.rect.width / 2 - centre) - Math.abs(b.rect.left + b.rect.width / 2 - centre))[0]?.item;
}

/**
 * The empty state for a brand new account: one promise as a heading, a line of
 * context, then two to four ways to begin as cards (a template, an import, an
 * invite) and a quiet "Skip for now". It is deliberately not a checklist: pick
 * one and go. The cards are real buttons or links in one group, and the arrow
 * keys, Home and End move between them while Tab still reaches each. The option
 * most people should choose carries the word "Recommended". Use Empty State
 * when there is nothing to choose, and this when there are good ways to start.
 */
export function FirstRunState({ title, description, options, recommendedId, onSkip, headingLevel = 2, labels, className, ...props }: FirstRunStateProps) {
  const text: Required<FirstRunStateLabels> = { ...DEFAULT_LABELS, ...labels };
  const id = useId();
  const Heading = `h${headingLevel}` as "h2" | "h3" | "h4";
  const shown = options.slice(0, 4);

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    const from = (event.target as HTMLElement).closest<HTMLElement>("[data-option]");
    if (!from) return;
    const items = [...event.currentTarget.querySelectorAll<HTMLElement>("[data-option]")];
    const next = target(items, from, event.key, getComputedStyle(event.currentTarget).direction === "rtl");
    if (next === null) return;
    event.preventDefault();
    next?.focus();
  }

  const card = cn(
    "group/option relative flex h-full min-w-0 flex-col items-start gap-4 rounded-xl border border-border bg-card p-4 text-left text-card-foreground shadow-xs outline-none",
    "transition-[border-color,box-shadow,background-color] duration-150 motion-reduce:transition-none",
    "hover:border-foreground/30 hover:shadow-sm focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40 active:bg-muted/50",
  );

  return (
    <section data-slot="first-run-state" aria-labelledby={`${id}-title`} className={cn("@container w-full px-4 py-10 text-center sm:py-14", className)} {...props}>
      <Heading id={`${id}-title`} className="mx-auto max-w-xl text-2xl leading-tight font-semibold tracking-[-0.03em] text-balance sm:text-[1.75rem]">
        {title}
      </Heading>
      {description ? <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-balance text-muted-foreground">{description}</p> : null}

      <div role="group" aria-label={text.group} onKeyDown={onKeyDown} className={cn("mx-auto mt-8 grid max-w-3xl grid-cols-1 gap-3 text-left", GRID[shown.length])}>
        {shown.map((option, index) => {
          const recommended = option.id === recommendedId;
          const key = `${id}-option-${index}`;
          const body = (
            <>
              {option.icon || recommended ? (
                <span className="flex w-full items-start justify-between gap-2">
                  {option.icon ? (
                    <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-lg border border-border bg-muted text-foreground [&_svg]:size-5">
                      {option.icon}
                    </span>
                  ) : (
                    <span />
                  )}
                  {recommended ? (
                    <Badge id={`${key}-badge`} variant="default">
                      {text.recommended}
                    </Badge>
                  ) : null}
                </span>
              ) : null}
              <span className="grid min-w-0 gap-1 pr-6">
                <span id={`${key}-title`} className="text-sm leading-5 font-semibold tracking-[-0.01em]">
                  {option.title}
                </span>
                <span id={`${key}-text`} className="text-[0.8125rem] leading-5 text-muted-foreground">
                  {option.description}
                </span>
              </span>
              <IconArrowRight aria-hidden="true" className="absolute right-4 bottom-4 size-4 text-muted-foreground transition-[color,transform] duration-150 group-hover/option:translate-x-0.5 group-hover/option:text-foreground motion-reduce:transition-none rtl:rotate-180" />
            </>
          );
          const recommendedStyle = recommended ? "border-foreground/45" : "";
          // Named by the whole card, in the order it is read ("Recommended, Connect Google Sheets, Keep a live copy..."):
          // a name of the title alone left out words the card shows, which a voice user may say (WCAG 2.5.3).
          const names = {};
          return option.href ? (
            <a key={option.id} data-option="" href={option.href} onClick={option.onSelect} {...names} className={cn(card, recommendedStyle)}>
              {body}
            </a>
          ) : (
            <button key={option.id} data-option="" type="button" onClick={option.onSelect} {...names} className={cn(card, recommendedStyle)}>
              {body}
            </button>
          );
        })}
      </div>

      {onSkip ? (
        <Button type="button" variant="link" onClick={onSkip} className="mt-6 text-muted-foreground hover:text-foreground">
          {text.skip}
        </Button>
      ) : null}
    </section>
  );
}
