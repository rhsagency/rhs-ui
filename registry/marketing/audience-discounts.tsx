import { useId, type ComponentProps, type ReactNode } from "react";

import { IconArrowRight, IconCheck, IconShieldCheck } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { cn } from "@/lib/utils";

export interface DiscountAction {
  /** Name the group, so the button makes sense out of context: "Apply for the student discount". */
  label: string;
  /** Where the application lives. The action is a link when this is set and a button when it is not. */
  href?: string;
  /** Called when the action is pressed, for an application that opens in a dialog. A function needs a client component around the section. */
  onClick?: () => void;
}

export interface DiscountProgram {
  /** A stable key: "students". */
  id: string;
  /** Who it is for: "Startups". */
  audience: string;
  /** The saving as the dominant figure, in real text: "50% off", "Free". */
  discount: string;
  /** How long it lasts, under the figure: "for your first year". */
  duration?: string;
  /** Who qualifies, a line each. Two or three scan best. */
  eligibility: readonly string[];
  /** How to apply. */
  action: DiscountAction;
  /** An icon for the group, such as an IconGraduationCap. Decoration: the audience is written out. */
  icon?: ReactNode;
}

export interface AudienceDiscountsLabels {
  /** The small line above each list of conditions. */
  qualifies: string;
}

export interface AudienceDiscountsProps extends Omit<ComponentProps<"section">, "title" | "children"> {
  /** The heading: "Pay less while you are building something small". */
  title: string;
  /** One or two sentences under the heading. */
  description?: string;
  /** Two to four groups. */
  programs: readonly DiscountProgram[];
  /** How you check, under the cards: "We check with a student email or a letter from your school." */
  note?: string;
  /** The level of the heading: 2 by default. */
  headingLevel?: 2 | 3 | 4;
  /** Words for the fixed text, for a site that is not in English. */
  labels?: Partial<AudienceDiscountsLabels>;
}

const LABELS: AudienceDiscountsLabels = { qualifies: "Who qualifies" };

/** Columns by how many cards there are, written out so Tailwind sees every class. A count that does not divide the row never leaves a lonely card: three go from one column straight to three, four from two to four. */
const COLUMNS = [
  "mx-auto max-w-md",
  "mx-auto max-w-md",
  "mx-auto max-w-3xl @2xl:grid-cols-2",
  "mx-auto max-w-xl @4xl:max-w-none @4xl:grid-cols-3",
  "mx-auto max-w-xl @2xl:max-w-none @2xl:grid-cols-2 @5xl:grid-cols-4",
];

function ActionButton({ action }: { action: DiscountAction }) {
  const content = (
    <>
      <span className="min-w-0">{action.label}</span>
      <IconArrowRight aria-hidden="true" className="transition-transform duration-150 group-hover/button:translate-x-0.5 motion-reduce:transition-none" />
    </>
  );
  // A long label wraps instead of spilling out of a narrow card.
  const style = "h-auto min-h-9 w-full whitespace-normal py-2 text-center leading-snug";
  if (action.href) {
    return (
      <Button asChild variant="outline" className={style}>
        <a href={action.href} onClick={action.onClick}>
          {content}
        </a>
      </Button>
    );
  }
  return (
    <Button type="button" variant="outline" className={style} onClick={action.onClick}>
      {content}
    </Button>
  );
}

/**
 * Discounts for the groups who ask: startups, students, nonprofits, open
 * source. One card per group with who it is for, how much off as the biggest
 * thing on the card, a short list of who qualifies and an action that names the
 * group, then one line on how you check. It saves the email thread that begins
 * "do you have a discount for...", and puts the conditions where a pricing page
 * or the end of a billing screen can show them. Cards are articles in a list, the
 * saving is real text, and the columns follow the count so no card is ever left
 * alone in a row: three go from one column to three, four from two to four. The rows
 * of every card in a line are shared, so the figures, the dividers, the lists and
 * the buttons line up from one card to the next.
 */
export function AudienceDiscounts({ title, description, programs, note, headingLevel = 2, labels: custom, className, ...props }: AudienceDiscountsProps) {
  const labels = { ...LABELS, ...custom };
  const id = useId();
  const Heading = `h${headingLevel}` as "h2" | "h3" | "h4";
  const Name = `h${headingLevel + 1}` as "h3" | "h4" | "h5";
  return (
    <section data-slot="audience-discounts" aria-labelledby={`${id}-title`} className={cn("@container w-full break-words", className)} {...props}>
      <div className="mx-auto max-w-2xl text-center">
        <Heading id={`${id}-title`} className="text-3xl leading-[1.1] font-medium tracking-[-0.04em] text-balance @2xl:text-4xl">
          {title}
        </Heading>
        {description ? <p className="mt-4 text-base leading-relaxed text-balance text-muted-foreground">{description}</p> : null}
      </div>

      {/* Every card spans four rows of this grid and passes them on (subgrid), so the rows are as tall as the tallest card needs. */}
      <ul role="list" className={cn("mt-10 grid gap-5 @3xl:mt-12", COLUMNS[Math.min(programs.length, 4)])}>
        {programs.map((program) => (
          <li key={program.id} className="row-span-4 grid min-w-0 grid-rows-subgrid gap-y-0">
            <article aria-labelledby={`${id}-${program.id}`} className="row-span-4 grid min-w-0 grid-rows-subgrid gap-y-0 rounded-2xl border border-border bg-card p-6 shadow-xs">
              <div className="flex items-center gap-3">
                {program.icon ? (
                  <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-lg border border-border bg-background [&_svg]:size-[1.125rem]">
                    {program.icon}
                  </span>
                ) : null}
                <Name id={`${id}-${program.id}`} className="text-base leading-snug font-medium tracking-[-0.01em]">
                  {program.audience}
                </Name>
              </div>

              <div className="mt-7">
                <p className="text-[2.5rem] leading-none font-medium tracking-[-0.05em] text-balance tabular-nums">{program.discount}</p>
                {program.duration ? <p className="mt-2.5 text-sm leading-snug text-pretty text-muted-foreground">{program.duration}</p> : null}
              </div>

              {/* A group with no conditions keeps its row, empty, so the rows of its neighbours still line up. */}
              <div className={cn("mt-6", program.eligibility.length > 0 && "border-t border-border pt-5")}>
                {program.eligibility.length > 0 ? (
                  <>
                    <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">{labels.qualifies}</p>
                    <ul role="list" className="mt-3.5 grid gap-3">
                      {program.eligibility.map((line) => (
                        <li key={line} className="flex items-start gap-2.5 text-sm leading-snug">
                          <IconCheck aria-hidden="true" className="mt-px size-4 shrink-0" />
                          <span className="min-w-0 text-pretty">{line}</span>
                        </li>
                      ))}
                    </ul>
                  </>
                ) : null}
              </div>

              {/* The row is as tall as the tallest button in the line, and every button fills it. */}
              <div className="mt-7 flex">
                <ActionButton action={program.action} />
              </div>
            </article>
          </li>
        ))}
      </ul>

      {note ? (
        <p className="mx-auto mt-8 max-w-2xl text-center text-sm leading-relaxed text-pretty text-muted-foreground">
          <IconShieldCheck aria-hidden="true" className="mr-2 inline-block size-4 align-[-0.2em]" />
          {note}
        </p>
      ) : null}
    </section>
  );
}
