import { useId, type ComponentProps, type ReactNode } from "react";

import { IconCheck, IconInfo } from "@rhs-ui/icons";
import { Badge, type BadgeProps } from "@rhs-ui/primitives/badge";
import { cn } from "@/lib/utils";

export type RolloutOwner = "us" | "you" | "both";

export interface RolloutMilestone {
  /** When it happens, in the words a buyer uses: "Day 1", "Week 2", "Day 30". It is the row's time label. */
  when: string;
  /** What happens, in a few words: "Kickoff call". */
  title: string;
  /** One or two sentences on what is done, so the reader knows what to expect. */
  description: string;
  /** Who does the work: "us" (you, the seller), "you" (the buyer's team) or "both". It is always written out in words. */
  owner: RolloutOwner;
  /** Marks the milestone where the plan pays back. The last milestone is the outcome unless one is marked. */
  outcome?: boolean;
}

export interface RolloutPlanLabels {
  /** Said under the time label of the first milestone. */
  start: string;
  /** Said under the time label of the outcome milestone. */
  outcome: string;
  /** The small word before the owner of a milestone. */
  owner: string;
  /** The owner when your team does the work. */
  us: string;
  /** The owner when the buyer's team does the work. */
  you: string;
  /** The owner when both teams work on it. */
  both: string;
}

const LABELS: RolloutPlanLabels = { start: "Start", outcome: "Outcome", owner: "Owner", us: "Us", you: "You", both: "Both" };

export interface RolloutPlanProps extends Omit<ComponentProps<"section">, "title" | "children"> {
  /** The heading: "What happens after you sign". */
  title: string;
  /** One or two sentences under the heading. */
  description?: string;
  /** Four to six milestones in the order they happen. The first is marked as the start and the last as the outcome. */
  milestones: readonly RolloutMilestone[];
  /** Fine print on what the dates assume: "Timelines assume a signed order form by the 1st." It sits under the heading on a wide section and under the plan on a narrow one. */
  note?: ReactNode;
  /** The level of the heading: 2 by default. Each milestone's title sits one level below it. */
  headingLevel?: 2 | 3 | 4;
  /** Words for the fixed text, for a site that is not in English. */
  labels?: Partial<RolloutPlanLabels>;
}

/** You is the solid one: it is the owner a buyer hunts for ("what is asked of my team?"). */
const OWNER_VARIANT: Record<RolloutOwner, NonNullable<BadgeProps["variant"]>> = { us: "outline", you: "default", both: "secondary" };

/**
 * What happens after a buyer signs, told as a timeline: Day 1, Week 2, Day 30,
 * Day 90, each with a title, a sentence and who does the work (Us, You or
 * Both). Time is the axis, so a buyer of a bigger product sees when it pays back
 * and what is asked of their team. The first milestone is marked Start and the
 * last Outcome (or the one you flag), in words under the time label, and the
 * outcome gets a filled marker and a heavier title. The time labels and the
 * owners are text, never colour or an image, and the spine is drawn with a
 * border. It is an ordered list. On a wide section the heading sits beside the
 * plan and each row has the time label, the spine and the milestone in three
 * columns; on a phone the time label stacks above the title. Different from
 * numbered steps because the steps here sit on a clock, not in a sequence only.
 */
export function RolloutPlan({ title, description, milestones, note, headingLevel = 2, labels: custom, className, ...props }: RolloutPlanProps) {
  const labels = { ...LABELS, ...custom };
  const id = useId();
  const Heading = `h${headingLevel}` as "h2" | "h3" | "h4";
  const Step = `h${headingLevel + 1}` as "h3" | "h4" | "h5";
  const flagged = milestones.findIndex((milestone) => milestone.outcome);
  const outcomeAt = flagged >= 0 ? flagged : milestones.length - 1;
  const ownerWord: Record<RolloutOwner, string> = { us: labels.us, you: labels.you, both: labels.both };

  return (
    <section data-slot="rollout-plan" aria-labelledby={`${id}-title`} className={cn("@container w-full break-words", className)} {...props}>
      <div className="grid gap-x-20 gap-y-10 @4xl:grid-cols-[minmax(0,19rem)_minmax(0,1fr)] @4xl:grid-rows-[auto_1fr]">
        <div className="max-w-xl @4xl:max-w-none">
          <Heading id={`${id}-title`} className="text-3xl leading-[1.1] font-medium tracking-[-0.04em] text-balance @2xl:text-4xl">
            {title}
          </Heading>
          {description ? <p className="mt-4 text-base leading-relaxed text-pretty text-muted-foreground">{description}</p> : null}
        </div>

        {/* A container of its own: the rows follow the width of the plan, which is narrower than the section when the heading sits beside it. */}
        <ol role="list" className="@container grid gap-y-10 @4xl:col-start-2 @4xl:row-span-2 @4xl:row-start-1">
          {milestones.map((milestone, index) => {
            const isStart = index === 0;
            const isOutcome = index === outcomeAt;
            const isLast = index === milestones.length - 1;
            return (
              <li
                key={`${index}-${milestone.when}`}
                data-owner={milestone.owner}
                className="relative grid grid-cols-[1.5rem_minmax(0,1fr)] gap-x-4 @xl:grid-cols-[6.5rem_1.5rem_minmax(0,1fr)] @xl:gap-x-5"
              >
                <div className="col-start-2 row-start-1 mb-2 flex flex-wrap items-center gap-x-2.5 gap-y-1.5 @xl:col-start-1 @xl:mb-0 @xl:flex-col @xl:items-start">
                  <p className="text-sm leading-6 font-medium tabular-nums">{milestone.when}</p>
                  {isStart ? <Badge variant="outline">{labels.start}</Badge> : null}
                  {isOutcome ? <Badge>{labels.outcome}</Badge> : null}
                </div>

                {/* The spine: a hairline from this marker to the next one, and the marker itself. Decoration; the words carry the order. */}
                <div aria-hidden="true" className="relative col-start-1 row-span-2 row-start-1 @xl:col-start-2 @xl:row-span-1">
                  {isLast ? null : <span className="absolute top-3 -bottom-13 left-1/2 w-px -translate-x-1/2 bg-foreground/15" />}
                  <span
                    className={cn(
                      "absolute left-1/2 grid -translate-x-1/2 place-items-center rounded-full",
                      isOutcome ? "top-0 size-6 bg-foreground text-background" : isStart ? "top-1.5 size-3 bg-foreground" : "top-1.5 size-3 border-2 border-foreground/40 bg-background",
                    )}
                  >
                    {isOutcome ? <IconCheck size={14} /> : null}
                  </span>
                </div>

                <div className="col-start-2 row-start-2 min-w-0 @xl:col-start-3 @xl:row-start-1">
                  <Step className={cn("text-base leading-6 tracking-[-0.01em] text-balance", isOutcome ? "font-semibold" : "font-medium")}>{milestone.title}</Step>
                  <p className="mt-1.5 text-sm leading-relaxed text-pretty text-muted-foreground">{milestone.description}</p>
                  <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                    {labels.owner}
                    <Badge variant={OWNER_VARIANT[milestone.owner]}>{ownerWord[milestone.owner]}</Badge>
                  </p>
                </div>
              </li>
            );
          })}
        </ol>

        {note ? (
          <div className="flex max-w-xl gap-2.5 text-sm leading-relaxed text-pretty text-muted-foreground @4xl:col-start-1 @4xl:row-start-2 @4xl:self-start">
            <IconInfo aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            <div className="min-w-0">{note}</div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
