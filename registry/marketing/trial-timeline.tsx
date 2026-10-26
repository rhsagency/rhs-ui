import { useId, type ComponentProps, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface TrialMoment {
  /** When it happens, in the words a reader uses: "Today", "Day 12", "Day 14". */
  day: string;
  /** What happens, in a few words: "Full access, no card". */
  title: string;
  /** One sentence that answers the worry behind this moment. */
  description: string;
  /** An icon for the moment, such as an IconMail. It is decoration: the title says it all. The step number shows when it is left out. */
  icon?: ReactNode;
}

export interface TrialTimelineProps extends Omit<ComponentProps<"section">, "title" | "children"> {
  /** The promise above the timeline: "No surprises. Here is your trial, day by day." */
  title: string;
  /** One sentence under the title. */
  description?: string;
  /** Three or four moments in the order they happen. The last one answers "what happens at the end?". */
  moments: readonly TrialMoment[];
  /** The action after the timeline: a Button or a link styled as one. */
  action?: ReactNode;
  /** The fine print under the action: "No credit card. Cancel in one click." */
  note?: string;
  /** The level of the title: 2 by default. */
  headingLevel?: 2 | 3 | 4;
}

/**
 * The classes that turn the column into a row, written out so Tailwind sees
 * every one. Up to three moments go side by side from 42rem of width, four need
 * 48rem to keep their sentences readable.
 */
const ROW = {
  few: {
    list: "@2xl:mt-14 @2xl:auto-cols-fr @2xl:grid-flow-col",
    item: "@2xl:flex-col @2xl:gap-5",
    rail: "@2xl:flex-row",
    line: "@2xl:mx-3 @2xl:my-0 @2xl:h-px @2xl:w-auto",
    body: "@2xl:pr-8 @2xl:pb-0",
    footer: "@2xl:mt-14",
  },
  many: {
    list: "@3xl:mt-14 @3xl:auto-cols-fr @3xl:grid-flow-col",
    item: "@3xl:flex-col @3xl:gap-5",
    rail: "@3xl:flex-row",
    line: "@3xl:mx-3 @3xl:my-0 @3xl:h-px @3xl:w-auto",
    body: "@3xl:pr-8 @3xl:pb-0",
    footer: "@3xl:mt-14",
  },
};

/**
 * A free trial told as it will happen: what you get today, when you are
 * reminded and what happens when the trial ends. Most trial drop-off comes
 * from one fear, "will I be charged?", and a row of ticks only asserts the
 * answer; a short timeline shows it. The moments are an ordered list laid out
 * in a row when the section has the room and in a column when it does not, so
 * it holds on a phone and in a sidebar. The connecting line is decoration. The
 * last moment is emphasised by weight, a filled marker and a heavier title,
 * never by colour, because it is the one that answers the fear.
 */
export function TrialTimeline({ title, description, moments, action, note, headingLevel = 2, className, ...props }: TrialTimelineProps) {
  const id = useId();
  const Heading = `h${headingLevel}` as "h2" | "h3" | "h4";
  const row = moments.length > 3 ? ROW.many : ROW.few;
  return (
    <section data-slot="trial-timeline" aria-labelledby={`${id}-title`} className={cn("@container w-full break-words", className)} {...props}>
      <div className="mx-auto max-w-2xl text-center">
        <Heading id={`${id}-title`} className="text-3xl leading-[1.1] font-medium tracking-[-0.04em] text-balance @2xl:text-4xl">
          {title}
        </Heading>
        {description ? <p className="mt-4 text-base leading-relaxed text-balance text-muted-foreground">{description}</p> : null}
      </div>

      <ol role="list" className={cn("mt-10 grid", row.list)}>
        {moments.map((moment, index) => {
          const last = index === moments.length - 1;
          return (
            <li key={`${moment.day}-${moment.title}`} className={cn("flex gap-4", row.item)}>
              <div aria-hidden="true" className={cn("flex flex-col items-center", row.rail)}>
                <span
                  className={cn(
                    "grid size-10 shrink-0 place-items-center rounded-full border text-sm font-medium tabular-nums [&_svg]:size-[1.125rem]",
                    last ? "border-foreground bg-foreground text-background" : "border-border bg-card text-foreground",
                  )}
                >
                  {moment.icon ?? index + 1}
                </span>
                {last ? null : <span className={cn("my-2 w-px flex-1 bg-border", row.line)} />}
              </div>
              <div className={cn("min-w-0", row.body, !last && "pb-9")}>
                <p className={cn("text-xs font-medium tracking-[0.14em] uppercase tabular-nums", last ? "text-foreground" : "text-muted-foreground")}>{moment.day}</p>
                <p className={cn("mt-2 text-base leading-snug tracking-[-0.01em] text-balance", last ? "font-semibold" : "font-medium")}>{moment.title}</p>
                <p className="mt-2 text-sm leading-relaxed text-pretty text-muted-foreground">{moment.description}</p>
              </div>
            </li>
          );
        })}
      </ol>

      {action || note ? (
        <div className={cn("mt-10 flex flex-col items-center gap-3 text-center", row.footer)}>
          {action}
          {note ? <p className="text-sm text-muted-foreground">{note}</p> : null}
        </div>
      ) : null}
    </section>
  );
}
