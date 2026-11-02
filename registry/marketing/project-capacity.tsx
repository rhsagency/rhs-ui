import { useId, type ComponentProps } from "react";

import { IconArrowRight } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { cn } from "@/lib/utils";

export interface CapacityMonth {
  /** The month as you want it written: "November". Add the year when the row crosses one: "January 2027". */
  label: string;
  /** How many projects you take that month. */
  total: number;
  /** How many of them are already booked. */
  taken: number;
}

export interface CapacityAction {
  /** The button's text: "Reserve a slot". */
  label: string;
  /** Where the button goes. The button is a link when this is set and a button when it is not. */
  href?: string;
  /** Called when the button is pressed. */
  onClick?: () => void;
}

export interface ProjectCapacityLabels {
  /** What a month with places left says. {open} and {total} stand for the numbers. */
  open: string;
  /** What a month with no place left says. */
  full: string;
  /** The link on a full month. */
  waitlist: string;
  /** What a screen reader adds to the link of a full month. {month} stands for the month. */
  waitlistFor: string;
  /** The button when every month is full: it becomes the waiting list. */
  allFull: string;
}

const LABELS: ProjectCapacityLabels = {
  open: "{open} of {total} open",
  full: "Full",
  waitlist: "Join the waiting list",
  waitlistFor: "for {month}",
  allFull: "Join the waiting list",
};

export interface ProjectCapacityProps extends Omit<ComponentProps<"section">, "title" | "children"> {
  /** The heading: "Where we have room". */
  title: string;
  /** One or two sentences under the heading. */
  description?: string;
  /** The coming months, three to six, soonest first. The numbers are real and yours: that is what makes the scarcity honest. Up to 24 places a month are drawn as dots; more are said in words only. */
  months: readonly CapacityMonth[];
  /** The button that reserves a slot. When every month is full it becomes the waiting list. */
  action: CapacityAction;
  /** Where the waiting list is. Every full month links to it, and so does the button when nothing is open. */
  waitlistHref: string;
  /** A line beside the button on how a slot is confirmed: "Slots are confirmed after a short intro call. Nothing is charged until then." */
  note?: string;
  /** The level of the heading: 2 by default. */
  headingLevel?: 2 | 3 | 4;
  /** Words for the fixed text, for a site that is not in English. */
  labels?: Partial<ProjectCapacityLabels>;
}

const text = (template: string, values: Record<string, string | number>): string => template.replace(/\{(\w+)\}/g, (marker, key: string) => String(values[key] ?? marker));

/** More places than this are not drawn as dots: a hundred dots say nothing a sentence does not. The words always say it. */
const MAX_DOTS = 24;

/** Columns by how many months there are, written out so Tailwind sees every class: five or six never leave a lonely tile in a row. */
const COLUMNS = ["", "", "@xl:grid-cols-2", "@xl:grid-cols-3", "@xl:grid-cols-2 @3xl:grid-cols-4", "@xl:grid-cols-3 @4xl:grid-cols-5", "@xl:grid-cols-3 @4xl:grid-cols-6"];

/**
 * How many places are left in the coming months, shown honestly: a tile per month with a row of dots (a filled dot
 * is a booked place, an outlined one is open) and the same thing in words, such as 1 of 3 open or Full. The dots
 * are decoration and hidden from assistive technology; the words carry the meaning, so colour is never the only
 * signal. Full months stay visible, flagged with a link to the waiting list, and the button reserves a slot, or
 * becomes the waiting list when nothing is open. Because the numbers come from you and are real, the scarcity is
 * honest. For agencies, freelancers, coaches and craftspeople who work in a limited number of slots.
 */
export function ProjectCapacity({ title, description, months, action, waitlistHref, note, headingLevel = 2, labels: custom, className, ...props }: ProjectCapacityProps) {
  const labels = { ...LABELS, ...custom };
  const id = useId();
  const Heading = `h${headingLevel}` as "h2" | "h3" | "h4";

  const rows = months.map((month) => {
    const total = Math.max(0, Math.floor(month.total));
    const taken = Math.min(Math.max(0, Math.floor(month.taken)), total);
    return { label: month.label, total, taken, open: total - taken };
  });
  const nothingOpen = rows.length > 0 && rows.every((row) => row.open === 0);
  const arrow = <IconArrowRight aria-hidden="true" className="transition-transform duration-150 group-hover/button:translate-x-0.5 motion-reduce:transition-none" />;
  const link = "rounded-sm text-sm font-medium text-foreground underline decoration-foreground/40 underline-offset-4 outline-none transition-colors duration-150 hover:decoration-current focus-visible:ring-[3px] focus-visible:ring-ring/40 motion-reduce:transition-none";

  return (
    <section data-slot="project-capacity" aria-labelledby={`${id}-title`} className={cn("@container w-full break-words", className)} {...props}>
      <div className="max-w-2xl">
        <Heading id={`${id}-title`} className="text-3xl leading-[1.1] font-medium tracking-[-0.04em] text-balance @2xl:text-4xl">
          {title}
        </Heading>
        {description ? <p className="mt-4 text-base leading-relaxed text-pretty text-muted-foreground">{description}</p> : null}
      </div>

      <ul role="list" className={cn("mt-8 grid gap-3 @2xl:mt-10", COLUMNS[Math.min(rows.length, 6)])}>
        {rows.map((row, index) => (
          <li
            key={`${index}-${row.label}`}
            data-state={row.open === 0 ? "full" : "open"}
            className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] content-start items-baseline gap-x-4 gap-y-3 rounded-xl border border-border bg-card p-4 shadow-xs @xl:grid-cols-1 @xl:gap-y-4 @xl:p-5"
          >
            <p className="text-base leading-snug font-medium tracking-[-0.01em]">{row.label}</p>
            {/* The dots are the picture of the numbers beside them. Filled is booked, outlined is open. Up to six sit in one row; more are split into two even rows, so a single dot never wraps alone. */}
            {row.total > 0 && row.total <= MAX_DOTS ? (
              <div aria-hidden="true" className="col-span-2 row-start-2 grid justify-start gap-1.5 @xl:col-span-1 @xl:row-start-auto" style={{ gridTemplateColumns: `repeat(${row.total <= 6 ? row.total : Math.ceil(row.total / 2)}, 0.875rem)` }}>
                {Array.from({ length: row.total }, (_, slot) => (
                  <span key={slot} className={cn("size-3.5 rounded-full border", slot < row.taken ? "border-foreground bg-foreground" : "border-foreground/40 bg-transparent")} />
                ))}
              </div>
            ) : null}
            <p className={cn("col-start-2 row-start-1 text-sm leading-snug tabular-nums @xl:col-start-auto @xl:row-start-auto", row.open === 0 ? "font-medium" : "text-muted-foreground")}>
              {row.open === 0 ? labels.full : text(labels.open, { open: row.open, total: row.total })}
            </p>
            {row.open === 0 ? (
              <a href={waitlistHref} className={cn(link, "col-span-2 w-fit @xl:col-span-1")}>
                {labels.waitlist}
                <span className="sr-only"> {text(labels.waitlistFor, { month: row.label })}</span>
              </a>
            ) : null}
          </li>
        ))}
      </ul>

      <div className="mt-8 flex flex-col gap-x-6 gap-y-4 @xl:flex-row @xl:items-center">
        {nothingOpen ? (
          <Button asChild size="lg" className="w-full @xl:w-auto">
            <a href={waitlistHref}>
              {labels.allFull}
              {arrow}
            </a>
          </Button>
        ) : action.href ? (
          <Button asChild size="lg" className="w-full @xl:w-auto">
            <a href={action.href} onClick={action.onClick}>
              {action.label}
              {arrow}
            </a>
          </Button>
        ) : (
          <Button type="button" size="lg" onClick={action.onClick} className="w-full @xl:w-auto">
            {action.label}
            {arrow}
          </Button>
        )}
        {note ? <p className="max-w-md text-sm leading-relaxed text-pretty text-muted-foreground">{note}</p> : null}
      </div>
    </section>
  );
}
