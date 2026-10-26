"use client";

import { useEffect, useId, useRef, useState, type ComponentProps, type MouseEvent, type ReactNode } from "react";

import { IconListChecks } from "@rhs-ui/icons";
import { Avatar, AvatarFallback, AvatarImage, initialsOf } from "@rhs-ui/primitives/avatar";
import { Checkbox } from "@rhs-ui/primitives/checkbox";
import { DueDateLabel } from "@rhs-ui/primitives/due-date-label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@rhs-ui/primitives/tooltip";
import { cn } from "@/lib/utils";

type DateInput = Date | string | number;

/** How much a task matters, as bars: one, two or three filled, or a solid square with an exclamation mark for urgent. */
export type TaskPriority = "low" | "medium" | "high" | "urgent";

/** The task a row shows. */
export interface TaskRowTask {
  /** A stable identity. */
  id: string;
  /** What has to be done. One line in a wide row and up to two in a narrow one; the full text opens in a tooltip when it is cut. */
  title: string;
  /** The task's own page. The title becomes a link and the whole row opens it. */
  href?: string;
  /** Completed. Strikes the title through and announces "Completed" when it changes. */
  done?: boolean;
  /** When it was completed, for "Done on 12 Oct" in place of the due date. */
  completedAt?: DateInput;
  /** When it is due: a Date, a timestamp or an ISO string. A date-only string such as "2026-10-28" is a calendar day and never shifts with the time zone. */
  due?: DateInput | null;
  /** Who is on it. */
  assignee?: {
    /** Their name, read before "Assigned to" and drawn as initials. */
    name: string;
    /** A picture. Initials stand in while it loads, or when there is none. */
    image?: string;
  };
  /** How many subtasks are done out of how many. */
  subtasks?: {
    /** How many are finished. */
    done: number;
    /** How many there are. */
    total: number;
  };
  /** How much it matters, as a mark in the row: one to three bars, or a solid square for urgent. It is named in words for screen readers and in a title. */
  priority?: TaskPriority;
}

export interface TaskRowLabels {
  /** Announced when a task is completed, followed by its title. Default "Completed". */
  completed?: string;
  /** Announced when it is reopened. Default "Marked as not done". */
  reopened?: string;
  /** Read before the assignee's name. Default "Assigned to". */
  assignedTo?: string;
  /** The subtask count in words. `{done}` and `{total}` are filled in. Default "{done} of {total} subtasks done". */
  subtasks?: string;
  /** The priority marks in words. */
  priority?: Partial<Record<TaskPriority, string>>;
}

export interface TaskRowProps extends Omit<ComponentProps<"li">, "children" | "onToggle"> {
  /** The task to show. */
  task: TaskRowTask;
  /** The checkbox was pressed, with the state it asks for. Update `task.done`. It is its own control: it never opens the task. */
  onToggle?: (done: boolean) => void;
  /** The row was opened. With `task.href` it runs on the link and receives the event, so a client-side router can call `preventDefault()`. Without an href it makes the row a button. */
  onOpen?: (event: MouseEvent<HTMLElement>) => void;
  /** The task whose details are open elsewhere: a filled surface, a bar on the left edge and `aria-current`. */
  selected?: boolean;
  /** `compact` tightens the rows for long lists. Default "comfortable". */
  density?: "comfortable" | "compact";
  /** Buttons at the end of the row: a menu, a start button. Each is its own tab stop above the row's link. */
  actions?: ReactNode;
  /** The moment due dates are compared with. Leave it out to use the browser's clock, read once the page is live; pass it to get the words in server HTML, in tests and in previews. */
  now?: DateInput;
  /** The language of the dates. Default "en-US". */
  locale?: string;
  /** The time zone whose calendar days are compared, so the server and the browser agree. Default "UTC". */
  timeZone?: string;
  /** The words the row uses, for translation. */
  labels?: TaskRowLabels;
}

const LEVELS: Record<Exclude<TaskPriority, "urgent">, number> = { low: 1, medium: 2, high: 3 };
const PRIORITY_WORDS: Record<TaskPriority, string> = { low: "Low priority", medium: "Medium priority", high: "High priority", urgent: "Urgent" };

function PriorityMark({ level, label }: { level: TaskPriority; label: string }) {
  return (
    <span data-slot="task-row-priority" data-priority={level} title={label} className="inline-flex size-4 shrink-0 items-center justify-center text-foreground">
      {level === "urgent" ? (
        <svg viewBox="0 0 16 16" aria-hidden="true" className="size-4">
          <rect x="1.5" y="1.5" width="13" height="13" rx="3.5" fill="currentColor" />
          <path d="M8 4.6v4.1" strokeWidth="1.7" strokeLinecap="round" className="stroke-background" />
          <circle cx="8" cy="11.3" r="1" className="fill-background" />
        </svg>
      ) : (
        <svg viewBox="0 0 16 16" aria-hidden="true" className="size-4">
          {[0, 1, 2].map((index) => (
            <rect key={index} x={2 + index * 4.5} y={10 - index * 3} width="3" height={4 + index * 3} rx="0.8" fill="currentColor" opacity={index < LEVELS[level] ? 1 : 0.3} />
          ))}
        </svg>
      )}
      <span className="sr-only">{label}</span>
    </span>
  );
}

const OVERLAY = "absolute inset-0 z-0 outline-none focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-ring/50";

/**
 * The row of a to-do or project list: a checkbox, the title, and what you
 * need to decide what to do next: priority, subtask count, the due date in
 * words ("Due tomorrow", "Overdue by 2 days", marked by text and an icon as
 * well as weight) and who is on it. The checkbox is its own control, so a
 * keyboard user completes a task without opening it, and completing it
 * strikes the title and says "Completed" to screen readers. The rest of the
 * row is one link or button to the task, laid under the checkbox and the
 * actions. A long title stays on one line in a wide row (two in a narrow one)
 * and the whole of it appears in a tooltip on hover and keyboard focus. On a wide
 * row everything sits on one line in fixed columns; on a narrow one the details
 * wrap under the title.
 * Put the rows in a `ul`.
 */
export function TaskRow({ task, onToggle, onOpen, selected = false, density = "comfortable", actions, now, locale = "en-US", timeZone = "UTC", labels, className, ...props }: TaskRowProps) {
  const text = { completed: "Completed", reopened: "Marked as not done", assignedTo: "Assigned to", subtasks: "{done} of {total} subtasks done", ...labels };
  const priorityWords = { ...PRIORITY_WORDS, ...labels?.priority };
  const titleId = useId();
  const title = useRef<HTMLParagraphElement>(null);
  const timer = useRef<number | undefined>(undefined);
  const [cut, setCut] = useState(false);
  const [tip, setTip] = useState(false);
  const [said, setSaid] = useState("");

  const done = Boolean(task.done);
  const compact = density === "compact";
  const interactive = Boolean(task.href || onOpen);

  // Whether the title is cut, by the edge or by its second line: only then is there anything for the tooltip to add.
  useEffect(() => {
    const element = title.current;
    if (!element) return;
    const measure = () => setCut(element.scrollWidth > element.clientWidth + 1 || element.scrollHeight > element.clientHeight + 1);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [task.title]);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  function toggle(next: boolean) {
    onToggle?.(next);
    setSaid(`${next ? text.completed : text.reopened}: ${task.title}`);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setSaid(""), 3000);
  }

  const overlay = task.href ? (
    <a href={task.href} aria-labelledby={titleId} onClick={onOpen} className={OVERLAY} />
  ) : onOpen ? (
    <button type="button" aria-labelledby={titleId} onClick={onOpen} className={cn(OVERLAY, "block size-full cursor-pointer")} />
  ) : null;

  // A task with no subtasks at all has no count to show.
  const subtasks = task.subtasks && task.subtasks.total > 0 ? task.subtasks : undefined;
  // A finished task shows when it was done; an open one shows its due date, and one without a date shows nothing.
  const showDue = done ? task.completedAt !== undefined : task.due !== undefined && task.due !== null;

  return (
    <li
      data-slot="task-row"
      data-state={done ? "done" : "open"}
      data-density={density}
      aria-current={selected ? "true" : undefined}
      className={cn("@container group/task-row relative transition-colors duration-150 motion-reduce:transition-none", selected ? "bg-muted" : interactive && "hover:bg-muted/60", className)}
      {...props}
    >
      {overlay ? (
        <TooltipProvider delayDuration={400}>
          <Tooltip open={cut && tip} onOpenChange={setTip}>
            <TooltipTrigger asChild>{overlay}</TooltipTrigger>
            <TooltipContent side="top" align="start" className="max-w-sm text-pretty">
              {task.title}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : null}
      {selected ? <span aria-hidden="true" className="absolute inset-y-0 start-0 w-0.5 bg-foreground" /> : null}

      <div className={cn("grid grid-cols-[auto_minmax(0,1fr)_auto] items-start px-3 @xl:grid-cols-[auto_minmax(0,1fr)_auto_auto] @xl:items-center", compact ? "py-1.5" : "py-2.5")}>
        <span className="relative z-10 col-start-1 row-start-1 me-3 grid size-5 place-items-center">
          {/* The hit area is the checkbox's own, so a press anywhere in it is a press on the checkbox. */}
          <Checkbox checked={done} onCheckedChange={(value) => toggle(value === true)} aria-labelledby={titleId} className="relative after:absolute after:-inset-2 after:content-['']" />
        </span>

        <p
          id={titleId}
          ref={title}
          className={cn("col-start-2 row-start-1 line-clamp-2 leading-5 font-medium [overflow-wrap:anywhere] transition-colors duration-200 motion-reduce:transition-none @xl:block @xl:truncate", compact ? "text-[0.8125rem]" : "text-sm", done && "font-normal text-muted-foreground line-through decoration-muted-foreground/70")}
        >
          {task.title}
        </p>

        {task.priority || subtasks || showDue || task.assignee ? (
          <div className="col-span-2 col-start-2 row-start-2 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs @xl:col-span-1 @xl:col-start-3 @xl:row-start-1 @xl:mt-0 @xl:ms-4 @xl:flex-nowrap @xl:gap-x-4">
            {task.priority ? <PriorityMark level={task.priority} label={priorityWords[task.priority]} /> : <span aria-hidden="true" className="hidden @xl:block @xl:size-4" />}
            {subtasks ? (
              <span className="inline-flex items-center gap-1 text-muted-foreground tabular-nums @xl:w-12">
                <IconListChecks aria-hidden="true" className="size-3.5 shrink-0" />
                <span aria-hidden="true">
                  {subtasks.done}/{subtasks.total}
                </span>
                <span className="sr-only">{text.subtasks.replace("{done}", String(subtasks.done)).replace("{total}", String(subtasks.total))}</span>
              </span>
            ) : (
              <span aria-hidden="true" className="hidden @xl:block @xl:w-12" />
            )}
            {showDue ? (
              <DueDateLabel date={task.due ?? null} doneAt={done ? task.completedAt : undefined} now={now} locale={locale} timeZone={timeZone} tooltip={false} className={cn("@xl:w-36", done && "text-muted-foreground")} />
            ) : (
              <span aria-hidden="true" className="hidden @xl:block @xl:w-36" />
            )}
            {task.assignee ? (
              <span className="ms-auto inline-flex @xl:ms-0" title={task.assignee.name}>
                {/* On the selected row the surface is the avatar's own grey, so the circle is drawn in the page colour to stay a circle. */}
                <Avatar size="sm" aria-hidden="true" className={cn("data-[size=sm]:size-6", selected && "bg-background")}>
                  {task.assignee.image ? <AvatarImage src={task.assignee.image} alt="" /> : null}
                  <AvatarFallback className={cn("text-[0.625rem]", selected && "bg-background")}>{initialsOf(task.assignee.name)}</AvatarFallback>
                </Avatar>
                <span className="sr-only">
                  {text.assignedTo} {task.assignee.name}
                </span>
              </span>
            ) : (
              <span aria-hidden="true" className="hidden @xl:block @xl:size-6" />
            )}
          </div>
        ) : null}

        {actions ? <div className="relative z-10 col-start-3 row-start-1 -my-1 ms-3 flex items-center gap-1 @xl:col-start-4 @xl:my-0">{actions}</div> : null}
      </div>
      <p role="status" className="sr-only">
        {said}
      </p>
    </li>
  );
}
