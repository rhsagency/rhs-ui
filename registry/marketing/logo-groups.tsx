import { useId, type ComponentProps } from "react";

import { IconArrowRight } from "@rhs-ui/icons";
import type { Logo } from "@rhs-ui/marketing/logo-cloud";
import { cn } from "@/lib/utils";

export interface LogoGroup {
  /** The sector: "Retail". It is the heading of the group. */
  title: string;
  /** How many customers the sector has, as you want it written: "38 customers". */
  count: string;
  /** The marks shown for it, three to six. A mark is an SVG or an image in `mark`; its `name` is what a screen reader says. Give a mark `href` to link it. */
  logos: readonly Logo[];
  /** The list of that sector's customers. When set, the count becomes a link to it. */
  href?: string;
}

export interface LogoGroupsLabels {
  /** Said after a linked count, so the link names its sector; `{group}` is filled in. Default "in {group}". */
  inGroup: string;
}

export interface LogoGroupsProps extends Omit<ComponentProps<"section">, "title" | "children"> {
  /** The heading: the question the groups answer, as a statement. */
  title: string;
  /** One sentence under the title. */
  description?: string;
  /** Two to six sectors. Four sit in two columns of two; an odd last one spans both. */
  groups: readonly LogoGroup[];
  /** Words for the fixed text, for a site that is not in English. */
  labels?: Partial<LogoGroupsLabels>;
}

const LABELS: LogoGroupsLabels = { inGroup: "in {group}" };

/** Every mark is drawn at one height, whatever shape it comes in; the width follows. */
const MARK = "inline-flex items-center [&_img]:h-6 [&_img]:w-auto [&_img]:max-w-full [&_svg]:h-6 [&_svg]:w-auto [&_svg]:max-w-full";

/** The odd last group spans both columns from 640px: the same test as the `last:odd` classes on the item. */
const spansRow = (index: number, count: number): boolean => index === count - 1 && count % 2 === 1;

/** A picture mark cannot take the text colour, so it is greyed and dimmed, and comes to full strength with the mark it belongs to. */
const PICTURE = "[&_img]:opacity-70 [&_img]:grayscale [&_img]:transition-[opacity,filter] [&_img]:duration-150 motion-reduce:[&_img]:transition-none";

/**
 * Customers grouped by sector, for the buyer who asks "do you work with
 * companies like mine?" and cannot tell from one flat wall of logos. Each
 * group has a heading, how many customers it stands for ("38 customers")
 * and a row of marks in the muted text colour, all drawn at one height; the
 * count becomes a link to that sector's customer list when you give it an
 * address. The groups sit in two columns on a desktop and one on a phone, cut
 * apart by hairlines, and a mark reaches full strength on hover and focus. On a
 * desktop the marks of every group sit on the same two-column grid, so four
 * make a tidy two by two and the groups line up with each other. Every mark
 * keeps its company name for screen readers. No state of its own, so it
 * renders on the server.
 */
export function LogoGroups({ title, description, groups, labels, className, ...props }: LogoGroupsProps) {
  const words = { ...LABELS, ...labels };
  const heading = useId();

  return (
    <section data-slot="logo-groups" aria-labelledby={heading} className={cn("py-16 sm:py-24", className)} {...props}>
      <header className="mx-auto max-w-2xl text-center">
        <h2 id={heading} className="text-3xl font-medium tracking-[-0.04em] text-balance sm:text-4xl">
          {title}
        </h2>
        {description ? <p className="mt-3 text-base leading-relaxed text-pretty text-muted-foreground">{description}</p> : null}
      </header>
      <ul role="list" className="mt-12 grid border-t border-border sm:mt-16 sm:grid-cols-2">
        {groups.map((group, index) => (
          <li key={group.title} className="border-b border-border py-8 sm:px-8 sm:py-10 sm:odd:border-r sm:last:odd:col-span-2 sm:last:odd:border-r-0">
            <div className="flex items-baseline justify-between gap-4">
              <h3 className="text-base font-medium tracking-[-0.01em]">{group.title}</h3>
              {group.href ? (
                <a
                  href={group.href}
                  className="group/count inline-flex items-center gap-1.5 rounded-sm text-sm text-muted-foreground tabular-nums underline-offset-4 transition-colors duration-150 outline-none hover:text-foreground hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/40 motion-reduce:transition-none"
                >
                  {group.count}
                  <span className="sr-only"> {words.inGroup.replace("{group}", group.title)}</span>
                  <IconArrowRight aria-hidden="true" className="size-4 transition-transform duration-150 motion-safe:group-hover/count:translate-x-0.5 motion-reduce:transition-none" />
                </a>
              ) : (
                <p className="text-sm text-muted-foreground tabular-nums">{group.count}</p>
              )}
            </div>
            {/* A row that wraps leaves a lone mark and nothing lines up between sectors, so from 1024px (where a column is wide enough for the widest wordmark) the marks sit on a two-column grid; a group that spans the row gets twice the columns. */}
            <ul role="list" className={cn("mt-6 flex flex-wrap items-center gap-x-8 gap-y-5 sm:mt-7 lg:grid", spansRow(index, groups.length) ? "lg:grid-cols-4" : "lg:grid-cols-2")}>
              {group.logos.map((logo) => {
                const body = logo.mark ? (
                  <span aria-hidden="true" className={cn(MARK, PICTURE)}>
                    {logo.mark}
                  </span>
                ) : (
                  <span className="text-base font-semibold tracking-[-0.02em]">{logo.name}</span>
                );
                return (
                  <li key={logo.name} className="flex max-w-full min-w-0 items-center text-foreground/65 transition-colors duration-200 focus-within:text-foreground hover:text-foreground motion-reduce:transition-none [&:hover_img]:opacity-100 [&:focus-within_img]:opacity-100">
                    {logo.href ? (
                      <a href={logo.href} aria-label={logo.name} className="inline-flex max-w-full rounded-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40">
                        {body}
                      </a>
                    ) : (
                      <>
                        {body}
                        {logo.mark ? <span className="sr-only">{logo.name}</span> : null}
                      </>
                    )}
                  </li>
                );
              })}
            </ul>
          </li>
        ))}
      </ul>
    </section>
  );
}
