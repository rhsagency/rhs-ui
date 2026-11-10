"use client";

import { useId, useRef, useState, type ComponentProps } from "react";

import { AutoHeight } from "@rhs-ui/motion/auto-height";
import { Crossfade } from "@rhs-ui/motion/crossfade";
import { Avatar, AvatarFallback, AvatarImage, initialsOf } from "@rhs-ui/primitives/avatar";
import { Button } from "@rhs-ui/primitives/button";
import { ToggleGroup, ToggleGroupItem } from "@rhs-ui/primitives/toggle-group";
import { cn } from "@/lib/utils";

export interface RoleTestimonial {
  /** Identifies the quote in the grid. */
  id: string;
  /** What they said, without quotation marks: the grid adds them. */
  quote: string;
  /** Who said it. Also the source of the initials when there is no portrait. */
  name: string;
  /** Their job and company: "Staff engineer, Kestrel Studio". */
  role: string;
  /** Which group they belong to. It must equal one of the `groups`, or the quote shows only under All. */
  group: string;
  /** A portrait. Initials stand in until it loads, and when there is none. */
  avatar?: string;
}

export interface TestimonialsByRoleLabels {
  /** The first chip, which shows every quote. Default "All". */
  all: string;
  /** The name of the row of chips. Default "Show quotes from". */
  filter: string;
  /** The count under the chips, announced politely when it changes; `{shown}` and `{total}` are filled in. Default "{shown} of {total} quotes". */
  count: string;
  /** The line shown when a group has no quotes; `{group}` is filled in. Default "No quotes from {group} yet.". */
  empty: string;
  /** The button that clears the filter. Default "Show all quotes". */
  clear: string;
}

export interface TestimonialsByRoleProps extends Omit<ComponentProps<"section">, "title" | "children" | "defaultValue" | "onChange"> {
  /** The heading of the section. */
  title: string;
  /** One sentence under the title. */
  description?: string;
  /** All the quotes, six to twelve. The chips filter them by `group`. */
  testimonials: readonly RoleTestimonial[];
  /** The chips after All: "Founders", "Designers", "Engineers". Each is the `group` of the quotes it shows. */
  groups: readonly string[];
  /** The group that starts selected when you do not control `group`. Leave it out to start on All. */
  defaultGroup?: string;
  /** The selected group, or `null` for All. Pass it with `onGroupChange` to control the grid. */
  group?: string | null;
  /** Called with the group a chip chose, or `null` for All. */
  onGroupChange?: (group: string | null) => void;
  /** Words for the fixed text, for a site that is not in English. */
  labels?: Partial<TestimonialsByRoleLabels>;
}

const LABELS: TestimonialsByRoleLabels = {
  all: "All",
  filter: "Show quotes from",
  count: "{shown} of {total} quotes",
  empty: "No quotes from {group} yet.",
  clear: "Show all quotes",
};

const ALL = "all";

/** A template with `{name}` holes, filled in. */
const fill = (template: string, values: Record<string, string | number>): string => template.replace(/\{(\w+)\}/g, (hole, name: string) => String(values[name] ?? hole));

/** Chips are pills with a border, solid when pressed; the toggle group's own look is a joined bar. */
const CHIP = "h-9 rounded-full border-l px-4 first:rounded-full last:rounded-full";

/**
 * The columns by the number of quotes a filter leaves, written out so Tailwind
 * sees every class whole. A filter that leaves fewer quotes than columns would
 * hug the left of a centred section, so one quote sits in the middle at a
 * readable width, two and four fill two columns (four make two by two), and
 * three or more fill three from 1024px.
 */
const COLUMNS: Record<number, string> = {
  1: "mx-auto max-w-xl",
  2: "sm:columns-2",
  3: "sm:columns-2 lg:columns-3",
  4: "sm:columns-2",
};

const columnsFor = (count: number): string => COLUMNS[count] ?? COLUMNS[3]!;

/**
 * Let visitors hear from people like them: a row of chips (All, then a group
 * each: Founders, Designers, Engineers) narrows a grid of quotes in place. The
 * chips are one toggle group with exactly one pressed, and the arrow keys move
 * between them; the count under them ("4 of 12 quotes") is a polite live
 * region, so a screen reader hears what the filter did. The quotes sit in
 * balanced columns at their natural height (as many columns as the filter
 * leaves quotes for, so a short result is never left hugging one side) and
 * swap with a soft crossfade while the section glides to its new height, so
 * nothing jumps; under reduced motion the change is immediate. A group with no
 * quotes says so in one line and offers a button back to All. Controlled with
 * `group` and `onGroupChange`, or uncontrolled with `defaultGroup`.
 */
export function TestimonialsByRole({ title, description, testimonials, groups, defaultGroup, group, onGroupChange, labels, className, ...props }: TestimonialsByRoleProps) {
  const words = { ...LABELS, ...labels };
  const heading = useId();
  const chips = useRef<HTMLDivElement>(null);
  const [own, setOwn] = useState<string | null>(defaultGroup ?? null);
  const picked = group !== undefined ? group : own;
  // A group the chips do not know is All, so the grid never filters on a label nobody can see.
  const active = picked !== null && groups.includes(picked) ? picked : null;
  const shown = active === null ? testimonials : testimonials.filter((item) => item.group === active);
  const valueOf = (label: string | null): string => (label === null ? ALL : `g${groups.indexOf(label)}`);

  const choose = (next: string | null) => {
    if (group === undefined) setOwn(next);
    onGroupChange?.(next);
  };

  const clear = () => {
    choose(null);
    // The button leaves with the empty message: hand focus to the first chip so it is not lost.
    chips.current?.querySelector<HTMLElement>('[data-slot="toggle-group-item"]')?.focus();
  };

  return (
    <section data-slot="testimonials-by-role" aria-labelledby={heading} className={cn("py-16 sm:py-24", className)} {...props}>
      <header className="mx-auto max-w-2xl text-center">
        <h2 id={heading} className="text-3xl font-medium tracking-[-0.04em] text-balance sm:text-4xl">
          {title}
        </h2>
        {description ? <p className="mt-3 text-base leading-relaxed text-pretty text-muted-foreground">{description}</p> : null}
      </header>

      <div className="mt-10 grid justify-items-center gap-4 sm:mt-12">
        <ToggleGroup
          ref={chips}
          type="single"
          aria-label={words.filter}
          value={valueOf(active)}
          onValueChange={(value) => {
            // Pressing the pressed chip would leave none pressed: keep the one that is.
            if (!value) return;
            choose(value === ALL ? null : (groups[Number(value.slice(1))] ?? null));
          }}
          className="flex w-full flex-wrap justify-center gap-2 data-[variant=outline]:shadow-none"
        >
          <ToggleGroupItem value={ALL} className={CHIP}>
            {words.all}
          </ToggleGroupItem>
          {groups.map((label, index) => (
            <ToggleGroupItem key={label} value={`g${index}`} className={CHIP}>
              {label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <p role="status" className="text-sm text-muted-foreground tabular-nums">
          {fill(words.count, { shown: shown.length, total: testimonials.length })}
        </p>
      </div>

      <AutoHeight className="mt-8 sm:mt-10">
        <Crossfade activeKey={valueOf(active)}>
          {shown.length ? (
            <ul role="list" className={cn("columns-1 gap-4 [&>li]:mb-4 [&>li]:break-inside-avoid", columnsFor(shown.length))}>
              {shown.map((item) => (
                <li key={item.id}>
                  <figure className="flex flex-col gap-6 rounded-xl border border-border bg-card p-6 text-card-foreground">
                    <blockquote>
                      <p className="text-base leading-relaxed text-pretty">&ldquo;{item.quote}&rdquo;</p>
                    </blockquote>
                    <figcaption className="flex items-center gap-3">
                      <Avatar>
                        {item.avatar ? <AvatarImage src={item.avatar} alt="" /> : null}
                        <AvatarFallback>{initialsOf(item.name)}</AvatarFallback>
                      </Avatar>
                      <div className="grid min-w-0 text-sm leading-snug">
                        <cite className="font-medium not-italic">{item.name}</cite>
                        <span className="text-muted-foreground">{item.role}</span>
                      </div>
                    </figcaption>
                  </figure>
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex flex-col items-start justify-between gap-4 rounded-xl border border-dashed border-border p-6 sm:flex-row sm:items-center">
              <p className="text-sm text-muted-foreground">{fill(words.empty, { group: active ?? "" })}</p>
              <Button type="button" variant="outline" size="sm" onClick={clear}>
                {words.clear}
              </Button>
            </div>
          )}
        </Crossfade>
      </AutoHeight>
    </section>
  );
}
