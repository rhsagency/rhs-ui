"use client";

import { useId, type ComponentProps, type MouseEvent, type ReactNode } from "react";

import { IconListChecks } from "@rhs-ui/icons";
import { Avatar, AvatarFallback, AvatarGroup, AvatarGroupCount, AvatarImage, initialsOf } from "@rhs-ui/primitives/avatar";
import { Badge } from "@rhs-ui/primitives/badge";
import { DueDateLabel } from "@rhs-ui/primitives/due-date-label";
import { Progress } from "@rhs-ui/primitives/progress";
import { Skeleton } from "@rhs-ui/primitives/skeleton";
import { cn } from "@/lib/utils";

type DateInput = Date | string | number;

/** A person on a task. */
export interface TaskCardAssignee {
  /** Their name, read after "Assigned to" and drawn as initials. */
  name: string;
  /** A picture. Initials stand in while it loads, or when there is none. */
  image?: string;
}

/** The task a card shows. */
export interface TaskCardTask {
  /** A stable identity: the key of the card in its column. */
  id: string;
  /** What has to be done. Three lines at most. */
  title: string;
  /** The task's own page. The title becomes a link and the whole card opens it. */
  href?: string;
  /** A picture across the top of the card: a mock-up, a photo, a screenshot. Give it an alt, or `alt=""` when the title says it. */
  cover?: {
    /** The picture's address. A `data:` URI works. */
    src: string;
    /** What the picture shows, or "" when the title already says it. */
    alt: string;
  };
  /** When it is due: a Date, a timestamp or an ISO string. A date-only string such as "2026-10-28" is a calendar day and never shifts with the time zone. */
  due?: DateInput | null;
  /** Finished. A finished card shows "Done on 12 Oct" in place of the due date, when `completedAt` is given. */
  done?: boolean;
  /** When it was finished. A finished card shows "Done on 12 Oct" in place of the due date. */
  completedAt?: DateInput;
  /** Who is on it. The first few are drawn as a stack, the rest as "+2". */
  assignees?: readonly TaskCardAssignee[];
  /** How many subtasks are done out of how many, as a count and a thin bar. */
  subtasks?: {
    /** How many are finished. */
    done: number;
    /** How many there are. */
    total: number;
  };
}

/** A chip above a card's title. */
export interface TaskCardLabel {
  /** A stable identity. */
  id: string;
  /** The label's text: "Design", "Bug", "Blocked". The chip is an outline, so labels differ by their words, not by colour. */
  label: string;
}

export interface TaskCardMessages {
  /** Read before the assignees' names. Default "Assigned to". */
  assignedTo?: string;
  /** The subtask count in words. `{done}` and `{total}` are filled in. Default "{done} of {total} subtasks done". */
  subtasks?: string;
  /** The name of the list of labels. Default "Labels". */
  labels?: string;
  /** Read by a skeleton. Default "Loading task". */
  loading?: string;
}

export interface TaskCardProps extends Omit<ComponentProps<"li">, "children"> {
  /** The task to show. */
  task: TaskCardTask;
  /** Chips above the title. */
  labels?: readonly TaskCardLabel[];
  /** The card was opened. With `task.href` it runs on the link, so a client-side router can call `preventDefault()` on the event. Without an href it makes the whole card a button. */
  onOpen?: (task: TaskCardTask, event: MouseEvent<HTMLElement>) => void;
  /** The card is being dragged: lifted by a stronger border, a shadow and a small rise, never a glow. The drag itself is your library's. */
  dragging?: boolean;
  /** The card whose details are open elsewhere: a firm outline and `aria-current`. */
  selected?: boolean;
  /** At the foot of the card, opposite the assignees: a comment count, an attachment count, a menu. Controls here are their own tab stops above the card's link. */
  footer?: ReactNode;
  /** How many assignees are drawn before "+N". Default 3. */
  maxAssignees?: number;
  /** The moment the due date is compared with. Leave it out to use the browser's clock, read once the page is live; pass it to get the words in server HTML, in tests and in previews. */
  now?: DateInput;
  /** The language of the dates. Default "en-US". */
  locale?: string;
  /** The time zone whose calendar days are compared, so the server and the browser agree. Default "UTC". */
  timeZone?: string;
  /** The words the card uses, for translation. */
  messages?: TaskCardMessages;
}

const OPEN = "block w-full text-start outline-none after:absolute after:inset-0 after:content-['']";

/**
 * The unit of a kanban board, without the board: an optional cover, label
 * chips, the title, the due date in words, a subtask count with a thin bar
 * and the people on it. It has four looks that differ in border and shadow
 * rather than colour (resting, hover, selected, dragging), and the whole card
 * is one link or button, so a keyboard user opens it with Enter and sees a
 * ring around all of it. It renders as a plain `li`, spreading every prop and
 * the ref onto it, so any drag library can wrap it; controls in the footer sit
 * above the card's link. `TaskCardSkeleton` holds the place of a card while a
 * column loads. Put the cards in a `ul`.
 */
export function TaskCard({
  task,
  labels,
  onOpen,
  dragging = false,
  selected = false,
  footer,
  maxAssignees = 3,
  now,
  locale = "en-US",
  timeZone = "UTC",
  messages,
  className,
  ...props
}: TaskCardProps) {
  const text = { assignedTo: "Assigned to", subtasks: "{done} of {total} subtasks done", labels: "Labels", ...messages };
  const titleId = useId();
  const interactive = Boolean(task.href || onOpen);
  const done = Boolean(task.done);
  const showDue = done ? task.completedAt !== undefined : task.due !== undefined && task.due !== null;
  // A task with no subtasks at all has no count and no bar to show.
  const subtasks = task.subtasks && task.subtasks.total > 0 ? task.subtasks : undefined;
  const progress = subtasks ? Math.round(Math.min(1, Math.max(0, subtasks.done / subtasks.total)) * 100) : 0;
  const people = task.assignees ?? [];
  const shown = people.slice(0, Math.max(0, maxAssignees));
  const rest = people.length - shown.length;

  const heading = <span className="line-clamp-3 [overflow-wrap:anywhere]">{task.title}</span>;

  return (
    <li
      data-slot="task-card"
      data-dragging={dragging ? "" : undefined}
      data-selected={selected ? "" : undefined}
      aria-current={selected ? "true" : undefined}
      className={cn(
        "group/task-card relative flex min-w-0 flex-col overflow-hidden rounded-xl border bg-card text-card-foreground shadow-xs transition-[border-color,box-shadow,translate,scale] duration-150 motion-reduce:transition-none",
        "has-[[data-slot=task-card-open]:focus-visible]:border-ring has-[[data-slot=task-card-open]:focus-visible]:ring-[3px] has-[[data-slot=task-card-open]:focus-visible]:ring-ring/40",
        dragging
          ? "z-10 -translate-y-1 rotate-[1.5deg] scale-[1.02] cursor-grabbing border-foreground/40 shadow-sm"
          : selected
            ? "border-foreground ring-1 ring-foreground"
            : cn("border-border", interactive && "hover:border-foreground/30 hover:shadow-sm"),
        className,
      )}
      {...props}
    >
      {task.cover ? (
        <div className="relative aspect-[16/9] w-full shrink-0 overflow-hidden bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element -- framework-neutral; the cover is yours to optimise */}
          <img src={task.cover.src} alt={task.cover.alt} loading="lazy" decoding="async" className="size-full object-cover" />
        </div>
      ) : null}

      <div className="flex flex-1 flex-col gap-2.5 p-3">
        {labels?.length ? (
          <ul aria-label={text.labels} className="flex flex-wrap gap-1">
            {labels.map((label) => (
              <li key={label.id}>
                <Badge variant="outline" className="h-[1.125rem] px-1.5 text-[0.6875rem]">
                  {label.label}
                </Badge>
              </li>
            ))}
          </ul>
        ) : null}

        <h3 id={titleId} className={cn("text-sm leading-snug font-medium", done && "font-normal text-muted-foreground")}>
          {task.href ? (
            <a data-slot="task-card-open" href={task.href} onClick={(event) => onOpen?.(task, event)} className={OPEN}>
              {heading}
            </a>
          ) : onOpen ? (
            <button data-slot="task-card-open" type="button" onClick={(event) => onOpen(task, event)} className={cn(OPEN, "cursor-pointer")}>
              {heading}
            </button>
          ) : (
            heading
          )}
        </h3>

        {showDue || subtasks ? (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs">
            {showDue ? <DueDateLabel date={task.due ?? null} doneAt={done ? task.completedAt : undefined} now={now} locale={locale} timeZone={timeZone} tooltip={false} className={cn(done && "text-muted-foreground")} /> : null}
            {subtasks ? (
              <span className="inline-flex items-center gap-1.5 text-muted-foreground tabular-nums">
                <IconListChecks aria-hidden="true" className="size-3.5 shrink-0" />
                <span aria-hidden="true">
                  {subtasks.done}/{subtasks.total}
                </span>
                <Progress value={progress} aria-label={text.subtasks.replace("{done}", String(subtasks.done)).replace("{total}", String(subtasks.total))} className="h-1 w-10" />
              </span>
            ) : null}
          </div>
        ) : null}

        {people.length || footer ? (
          <div className="mt-0.5 flex items-center justify-between gap-2">
            {people.length ? (
              <span className="inline-flex">
                <AvatarGroup aria-hidden="true" className="-space-x-px *:data-[slot=avatar]:ring-card">
                  {shown.map((person, index) => (
                    <Avatar key={`${person.name}-${index}`} size="sm" className="data-[size=sm]:size-6">
                      {person.image ? <AvatarImage src={person.image} alt="" /> : null}
                      <AvatarFallback className="text-[0.625rem]">{initialsOf(person.name)}</AvatarFallback>
                    </Avatar>
                  ))}
                  {rest > 0 ? <AvatarGroupCount className="size-6 text-[0.625rem] ring-card">+{rest}</AvatarGroupCount> : null}
                </AvatarGroup>
                <span className="sr-only">
                  {text.assignedTo} {people.map((person) => person.name).join(", ")}
                </span>
              </span>
            ) : (
              <span />
            )}
            {footer ? <div className="relative z-10 flex items-center gap-1 text-xs text-muted-foreground">{footer}</div> : null}
          </div>
        ) : null}
      </div>
    </li>
  );
}

export interface TaskCardSkeletonProps extends ComponentProps<"li"> {
  /** Reserves the 16:9 cover, for a column of cards that have one. */
  cover?: boolean;
  /** The words a screen reader gets. Default "Loading task". */
  label?: string;
}

/** A card-shaped placeholder for a column that is still loading: label chips, a two-line title, a due date and a stack of avatars, in the footprint of a real card. */
export function TaskCardSkeleton({ cover = false, label = "Loading task", className, ...props }: TaskCardSkeletonProps) {
  return (
    <li data-slot="task-card-skeleton" aria-busy="true" className={cn("flex min-w-0 flex-col overflow-hidden rounded-xl border border-border bg-card shadow-xs", className)} {...props}>
      <span className="sr-only">{label}</span>
      {cover ? <Skeleton className="aspect-[16/9] w-full rounded-none" /> : null}
      <div className="flex flex-col gap-2.5 p-3">
        <div className="flex gap-1">
          <Skeleton className="h-[1.125rem] w-12 rounded-full" />
          <Skeleton className="h-[1.125rem] w-16 rounded-full" delay={80} />
        </div>
        <div className="grid gap-1.5">
          <Skeleton className="h-3.5 w-full" delay={160} />
          <Skeleton className="h-3.5 w-3/5" delay={240} />
        </div>
        <Skeleton className="h-3 w-28" delay={320} />
        <div className="mt-0.5 flex -space-x-1.5">
          {[0, 1, 2].map((index) => (
            <Skeleton key={index} className="size-6 rounded-full ring-2 ring-card" delay={400 + index * 80} />
          ))}
        </div>
      </div>
    </li>
  );
}
