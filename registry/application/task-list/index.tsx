import { useId, type ComponentProps, type MouseEvent } from "react";

import { IconChevronRight, IconLock } from "@rhs-ui/icons";
import { DEFAULT_LABELS, statusWord, summaryOf, tally, type TaskListLabels, type TaskSection, type TaskStatus } from "@rhs-ui/application/task-list/tasks";
import { Badge, type BadgeProps } from "@rhs-ui/primitives/badge";
import { cn } from "@/lib/utils";

export type { TaskListLabels, TaskSection, TaskStatus } from "@rhs-ui/application/task-list/tasks";

export interface TaskListProps extends Omit<ComponentProps<"section">, "children" | "title"> {
  /** The parts of the job, in the order they are best done. */
  sections: readonly TaskSection[];
  /** A heading over the list: "Your application". It names the region. Without one the region is named "Sections". */
  heading?: string;
  /** The level of the heading, so it fits the page. Default 2. */
  headingLevel?: 2 | 3 | 4;
  /** The line "3 of 6 sections complete" and a bar of one segment per section, above the list. Default true. */
  showSummary?: boolean;
  /** A section's link was followed. Call `event.preventDefault()` to route it yourself, with a client-side router. */
  onNavigate?: (section: TaskSection, event: MouseEvent<HTMLAnchorElement>) => void;
  /** The language the numbers in the summary are written in. Default "en-US". */
  locale?: string;
  /** The words the list says, for translation. */
  labels?: TaskListLabels;
}

/** The ink of "Needs attention". The plain destructive red is short of AA for small type on a tinted pill, so it is pulled a little toward the text colour, which darkens it in light mode and lightens it in dark mode. */
const ATTENTION_INK = "text-[color-mix(in_oklch,var(--destructive),var(--foreground)_22%)]";

/** The pill of each status. Shape and words carry the meaning; tone only adds to it. */
const PILL: Record<Exclude<TaskStatus, "cannot-start">, { variant: BadgeProps["variant"]; className: string }> = {
  completed: { variant: "outline", className: "text-foreground" },
  "in-progress": { variant: "secondary", className: "" },
  "not-started": { variant: "outline", className: "border-dashed text-muted-foreground" },
  "needs-attention": { variant: "destructive", className: ATTENTION_INK },
};

/** The mark of a status, on a 16 unit grid: a disc with a check for completed, a ring half filled for in progress, a dashed ring for not started, a disc with an exclamation mark for needs attention. The shapes differ, so they read without colour. */
function StatusMark({ status }: { status: Exclude<TaskStatus, "cannot-start"> }) {
  return (
    <svg data-slot="task-list-mark" data-status={status} viewBox="0 0 16 16" fill="none" aria-hidden="true" focusable="false">
      {status === "completed" ? (
        <>
          <circle cx="8" cy="8" r="7" fill="currentColor" />
          <path d="M4.9 8.3l2.3 2.3 3.9-4.6" stroke="var(--background)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </>
      ) : null}
      {status === "in-progress" ? (
        <>
          <circle cx="8" cy="8" r="6.25" stroke="currentColor" strokeWidth="1.5" />
          <path d="M8 1.75a6.25 6.25 0 0 0 0 12.5z" fill="currentColor" />
        </>
      ) : null}
      {status === "not-started" ? <circle cx="8" cy="8" r="6.25" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2.3 2.3" /> : null}
      {status === "needs-attention" ? (
        <>
          <circle cx="8" cy="8" r="7" fill="currentColor" />
          <path d="M8 4.4v4.2" stroke="var(--background)" strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="8" cy="11.4" r="1" fill="var(--background)" />
        </>
      ) : null}
    </svg>
  );
}

/** The status as it sits in a row: a pill, or for a section that cannot start yet, plain text with a lock. */
function Status({ status, text }: { status: TaskStatus; text: Required<TaskListLabels> }) {
  const word = statusWord(status, text);
  if (status === "cannot-start") {
    return (
      <span data-slot="task-list-status" data-status={status} className="inline-flex items-center gap-1.5 text-xs leading-5 font-medium text-muted-foreground">
        <IconLock aria-hidden="true" className="size-3.5 shrink-0" />
        {word}
      </span>
    );
  }
  const pill = PILL[status];
  return (
    <Badge data-slot="task-list-status" data-status={status} variant={pill.variant} className={cn("h-6 gap-1.5 px-2.5 [&>svg]:size-3.5", pill.className)}>
      <StatusMark status={status} />
      {word}
    </Badge>
  );
}

/** The layout of a row, shared by links and by the one kind of row that is not a link. Below 28rem of room the status sits under the title; from there it is a column of its own, so the statuses line up. */
const ROW =
  "group/row relative grid min-h-14 grid-cols-[minmax(0,1fr)_auto] grid-rows-[auto_auto_auto] items-center gap-x-4 px-4 py-3 text-start sm:px-5 @md:grid-cols-[minmax(0,1fr)_auto_1rem] @md:grid-rows-[auto_auto]";

function RowBody({ section, text, link }: { section: TaskSection; text: Required<TaskListLabels>; link: boolean }) {
  return (
    <>
      <span className={cn("col-start-1 row-start-1 min-w-0 text-sm leading-5 font-medium text-pretty [overflow-wrap:anywhere]", section.status === "cannot-start" ? "text-muted-foreground" : "text-foreground")}>{section.title}</span>
      {/* The name of the row is read in order: "Business details, In progress, 3 of 5 documents added". The grid only moves things around. */}
      <span className="sr-only">, </span>
      <span className="col-start-1 row-start-2 mt-1.5 justify-self-start @md:col-start-2 @md:row-span-2 @md:row-start-1 @md:mt-0 @md:self-center">
        <Status status={section.status} text={text} />
      </span>
      {section.hint ? (
        <>
          <span className="sr-only">, </span>
          <span className="col-start-1 row-start-3 mt-1 min-w-0 text-xs leading-5 text-pretty [overflow-wrap:anywhere] text-muted-foreground @md:row-start-2 @md:mt-0.5">{section.hint}</span>
        </>
      ) : null}
      {link ? (
        <IconChevronRight
          aria-hidden="true"
          className="col-start-2 row-span-3 row-start-1 size-4 shrink-0 self-center text-muted-foreground transition-transform duration-150 group-hover/row:translate-x-0.5 group-focus-visible/row:translate-x-0.5 motion-reduce:transition-none @md:col-start-3 @md:row-span-2 rtl:rotate-180 rtl:group-hover/row:-translate-x-0.5 rtl:group-focus-visible/row:-translate-x-0.5"
        />
      ) : null}
    </>
  );
}

/**
 * The hub of a long application: a list of the parts of a job (a visa
 * application, a mortgage pack, business verification), each row a link to the
 * place where that part is done, with where it stands in words and a shape:
 * Completed, In progress, Not started, Needs attention, or Cannot start yet,
 * which is plain text with the reason instead of a link. Above it sit the
 * heading and a summary ("3 of 6 sections complete") with a bar of one
 * segment per section, all in one labelled region. Rows are at least 56px
 * tall for a thumb, the status is part of each link's name ("Business
 * details, In progress, 3 of 5 documents added") and nothing on this page is
 * ticked: it only leads to the work. It needs no client code of its own, so a
 * Server Component can render it.
 */
export function TaskList({ sections, heading, headingLevel = 2, showSummary = true, onNavigate, locale = "en-US", labels, className, ...props }: TaskListProps) {
  const text: Required<TaskListLabels> = { ...DEFAULT_LABELS, ...labels };
  const headingId = useId();
  const Heading = `h${headingLevel}` as "h2" | "h3" | "h4";
  const { total } = tally(sections);

  return (
    <section
      data-slot="task-list"
      aria-labelledby={heading ? headingId : undefined}
      aria-label={heading ? undefined : text.list}
      className={cn("@container w-full min-w-0", className)}
      {...props}
    >
      {heading || showSummary ? (
        <div className="mb-4 grid gap-1.5">
          {heading ? (
            <Heading id={headingId} className="text-base leading-6 font-semibold tracking-[-0.02em] text-balance">
              {heading}
            </Heading>
          ) : null}
          {showSummary ? (
            <>
              <p className="text-sm leading-5 text-muted-foreground tabular-nums">{summaryOf(sections, text, locale)}</p>
              {total > 0 ? (
                <div aria-hidden="true" data-slot="task-list-bar" className="mt-1 flex gap-1">
                  {sections.map((section) => (
                    <span
                      key={section.id}
                      className={cn(
                        "h-1.5 min-w-0 flex-1 rounded-full",
                        section.status === "completed" && "bg-foreground",
                        section.status === "in-progress" && "bg-foreground/40",
                        section.status === "needs-attention" && "bg-destructive",
                        (section.status === "not-started" || section.status === "cannot-start") && "bg-foreground/12",
                      )}
                    />
                  ))}
                </div>
              ) : null}
            </>
          ) : null}
        </div>
      ) : null}

      <ul role="list" className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-xs">
        {sections.map((section) => {
          // A section that cannot start, and one with nowhere to go, is text: there is nothing to follow.
          const link = section.status !== "cannot-start" && section.href !== undefined;
          return (
            <li key={section.id}>
              {link ? (
                <a
                  href={section.href}
                  onClick={onNavigate ? (event) => onNavigate(section, event) : undefined}
                  className={cn(ROW, "outline-none transition-colors duration-150 hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:ring-inset motion-reduce:transition-none")}
                >
                  <RowBody section={section} text={text} link />
                </a>
              ) : (
                <div className={ROW}>
                  <RowBody section={section} text={text} link={false} />
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
