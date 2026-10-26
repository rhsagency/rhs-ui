"use client";

import { useId, type ComponentProps, type MouseEvent, type ReactNode } from "react";

import { IconArchive, IconCheck, IconCircle, IconCircleDot, IconMoreHorizontal, IconPause, IconStar } from "@rhs-ui/icons";
import { Avatar, AvatarFallback, AvatarGroup, AvatarGroupCount, AvatarImage, initialsOf } from "@rhs-ui/primitives/avatar";
import { Button } from "@rhs-ui/primitives/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@rhs-ui/primitives/dropdown-menu";
import { DueDateLabel } from "@rhs-ui/primitives/due-date-label";
import { Progress } from "@rhs-ui/primitives/progress";
import { Skeleton } from "@rhs-ui/primitives/skeleton";
import { StatusBadge, type StatusDefinition } from "@rhs-ui/primitives/status-badge";
import { cn } from "@/lib/utils";

type DateInput = Date | string | number;

/** Where a project stands. Each has its own word, mark and weight, so none depends on colour. */
export type ProjectStatus = "planning" | "active" | "on-hold" | "completed" | "archived";

/** The project a card shows. */
export interface ProjectCardProject {
  /** A stable identity: the key of the card in its grid. */
  id: string;
  /** The project's name. Up to three lines, then cut with an ellipsis. */
  name: string;
  /** A sentence or two about it. Clamped to two lines. */
  description?: string;
  /** Where it stands, in a badge with its own word, mark and weight. */
  status: ProjectStatus;
  /** How far along it is, from 0 to 100. Shown as a bar and in numbers. */
  progress: number;
  /** The people on it. The first few are drawn as a stack, the rest as "+2". */
  members?: readonly { name: string; image?: string }[];
  /** When it is due: a Date, a timestamp or an ISO string. A date-only string such as "2026-11-14" is a calendar day and never shifts with the time zone. A completed or archived project shows no due date, so a finished project never reads as overdue. */
  due?: DateInput | null;
  /** When a completed project was finished. It shows "Done on 12 Oct" in place of the due date. Only read when the status is `completed`. */
  completedAt?: DateInput;
  /** An icon element for the tile, drawn at 20px. Without one the tile shows the first letter of the name. */
  icon?: ReactNode;
  /** The project's page. The name becomes a link and the whole card opens it. */
  href?: string;
}

/** One entry of a card's overflow menu. */
export interface ProjectCardAction {
  /** A stable identity. */
  id: string;
  /** What the entry says. */
  label: string;
  /** An icon element, drawn at 16px. */
  icon?: ReactNode;
  /** Red, and set apart under a rule: Delete. */
  destructive?: boolean;
  /** Greyed out and skipped by the keyboard. */
  disabled?: boolean;
  /** The entry was chosen. */
  onSelect: () => void;
}

export interface ProjectCardLabels {
  /** The star button's name, followed by the project. Default "Star". */
  star?: string;
  /** The menu button's name, followed by "for" and the project. Default "More actions". */
  more?: string;
  /** The progress in words. `{percent}` is filled in. Default "{percent}% complete". */
  progress?: string;
  /** Read before the members' names. Default "Members". */
  members?: string;
  /** Read by a skeleton. Default "Loading project". */
  loading?: string;
  /** The five statuses, by their words. */
  statuses?: Partial<Record<ProjectStatus, string>>;
}

export interface ProjectCardProps extends Omit<ComponentProps<"article">, "children"> {
  /** The project to show. */
  project: ProjectCardProject;
  /** The card was opened. With `project.href` it runs on the link, so a client-side router can call `preventDefault()` on the event. Without an href it makes the whole card a button. */
  onOpen?: (project: ProjectCardProject, event: MouseEvent<HTMLElement>) => void;
  /** The overflow menu: rename, duplicate, archive. A destructive action is set apart at the end. Leave it out for no menu. */
  menu?: readonly ProjectCardAction[];
  /** Whether the project is starred. The star is a toggle with `aria-pressed`, filled when on. Leave out `onStar` for no star. */
  starred?: boolean;
  /** The star was pressed, with the state it asks for. Update `starred`. */
  onStar?: (starred: boolean) => void;
  /** How many members are drawn before "+N". Default 4. */
  maxMembers?: number;
  /** The moment the due date is compared with. Leave it out to use the browser's clock, read once the page is live; pass it to get the words in server HTML, in tests and in previews. */
  now?: DateInput;
  /** The language of the dates. Default "en-US". */
  locale?: string;
  /** The time zone whose calendar days are compared, so the server and the browser agree. Default "UTC". */
  timeZone?: string;
  /** The words the card uses, for translation. */
  labels?: ProjectCardLabels;
}

const STATUSES: Readonly<Record<ProjectStatus, StatusDefinition>> = {
  planning: { label: "Planning", glyph: <IconCircle />, emphasis: "outline", className: "border-dashed" },
  active: { label: "Active", glyph: <IconCircleDot />, emphasis: "strong" },
  "on-hold": { label: "On hold", glyph: <IconPause />, emphasis: "soft" },
  completed: { label: "Completed", glyph: <IconCheck />, emphasis: "soft" },
  archived: { label: "Archived", glyph: <IconArchive />, emphasis: "quiet" },
};

const OPEN = "rounded-sm outline-none after:absolute after:inset-0 after:rounded-xl after:content-['']";

/**
 * A project at a glance, for an index of projects: an icon or initial tile,
 * the name, a two-line description, a status badge, a progress bar with the
 * percentage in words, a stack of members and the due date. The card is one
 * stretched link (or button) with a ring around all of it when it has focus;
 * the star toggle and the overflow menu are separate controls above it, so
 * pressing them never opens the project. An archived project is dimmed by
 * its surface and its tile, never by opacity, so it stays easy to read and
 * says "Archived" in words. It fits a responsive grid and has a skeleton in
 * the same footprint.
 */
export function ProjectCard({ project, onOpen, menu, starred = false, onStar, maxMembers = 4, now, locale = "en-US", timeZone = "UTC", labels, className, ...props }: ProjectCardProps) {
  const text = { star: "Star", more: "More actions", progress: "{percent}% complete", members: "Members", ...labels };
  const nameId = useId();
  const archived = project.status === "archived";
  const percent = Math.round(Math.min(100, Math.max(0, Number.isFinite(project.progress) ? project.progress : 0)));
  const members = project.members ?? [];
  const shown = members.slice(0, Math.max(0, maxMembers));
  const rest = members.length - shown.length;
  const statuses = labels?.statuses ? (Object.fromEntries((Object.keys(STATUSES) as ProjectStatus[]).map((key) => [key, { ...STATUSES[key], label: labels.statuses?.[key] ?? STATUSES[key].label }])) as Record<ProjectStatus, StatusDefinition>) : STATUSES;
  const completed = project.status === "completed";
  // A project that is finished or shelved is never late: it shows when it was done, or no date at all.
  const showDue = completed ? project.completedAt !== undefined : !archived && project.due !== undefined && project.due !== null;
  const plain = menu?.filter((action) => !action.destructive) ?? [];
  const danger = menu?.filter((action) => action.destructive) ?? [];

  const name = <span className="line-clamp-3 [overflow-wrap:anywhere]">{project.name}</span>;

  return (
    <article
      data-slot="project-card"
      data-status={project.status}
      aria-labelledby={nameId}
      className={cn(
        "group/project-card relative flex min-w-0 flex-col gap-3.5 rounded-xl border p-4 text-card-foreground shadow-xs transition-[border-color,box-shadow,background-color] duration-150 motion-reduce:transition-none",
        "has-[[data-slot=project-card-open]:focus-visible]:border-ring has-[[data-slot=project-card-open]:focus-visible]:ring-[3px] has-[[data-slot=project-card-open]:focus-visible]:ring-ring/40",
        archived ? "border-dashed border-border bg-muted/40 hover:border-foreground/30" : "border-border bg-card hover:border-foreground/30 hover:shadow-sm",
        className,
      )}
      {...props}
    >
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className={cn("grid size-10 shrink-0 place-items-center rounded-lg border border-border text-base font-semibold [&_svg]:size-5", archived ? "bg-background text-muted-foreground" : "bg-muted text-foreground")}
        >
          {project.icon ?? project.name.trim().charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <h3 id={nameId} className={cn("text-[0.9375rem] leading-snug font-semibold tracking-[-0.01em]", archived && "text-muted-foreground")}>
            {project.href ? (
              <a data-slot="project-card-open" href={project.href} onClick={(event) => onOpen?.(project, event)} className={OPEN}>
                {name}
              </a>
            ) : onOpen ? (
              <button data-slot="project-card-open" type="button" onClick={(event) => onOpen(project, event)} className={cn(OPEN, "block w-full cursor-pointer text-start")}>
                {name}
              </button>
            ) : (
              name
            )}
          </h3>
          <StatusBadge status={project.status} statuses={statuses} size="sm" className="mt-1.5" />
        </div>
        {onStar || menu?.length ? (
          <div className="relative z-10 -mt-1.5 -me-1.5 flex shrink-0 items-center">
            {onStar ? (
              <Button type="button" variant="ghost" size="icon-sm" aria-pressed={starred} aria-label={`${text.star} ${project.name}`} onClick={() => onStar(!starred)} className={cn("size-7 text-muted-foreground hover:text-foreground", starred && "text-foreground")}>
                <IconStar className={cn(starred && "fill-current")} />
              </Button>
            ) : null}
            {menu?.length ? (
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <Button type="button" variant="ghost" size="icon-sm" aria-label={`${text.more} for ${project.name}`} className="size-7 text-muted-foreground hover:text-foreground">
                    <IconMoreHorizontal />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-44">
                  {plain.map((action) => (
                    <DropdownMenuItem key={action.id} disabled={action.disabled} onSelect={action.onSelect}>
                      {action.icon}
                      {action.label}
                    </DropdownMenuItem>
                  ))}
                  {danger.length && plain.length ? <DropdownMenuSeparator /> : null}
                  {danger.map((action) => (
                    <DropdownMenuItem key={action.id} variant="destructive" disabled={action.disabled} onSelect={action.onSelect}>
                      {action.icon}
                      {action.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}
          </div>
        ) : null}
      </div>

      {project.description ? <p className="line-clamp-2 min-h-[2.5rem] text-sm leading-5 text-muted-foreground [overflow-wrap:anywhere]">{project.description}</p> : null}

      <div className="mt-auto grid gap-1.5">
        <span aria-hidden="true" className={cn("text-xs font-medium tabular-nums", archived && "text-muted-foreground")}>
          {text.progress.replace("{percent}", String(percent))}
        </span>
        <Progress value={percent} aria-label={text.progress.replace("{percent}", String(percent))} className={cn("h-1.5", archived && "bg-border *:bg-muted-foreground")} />
      </div>

      <div className="flex items-center justify-between gap-3">
        {members.length ? (
          <span className="inline-flex">
            <AvatarGroup aria-hidden="true" className={cn("-space-x-px", archived ? "*:data-[slot=avatar]:ring-muted" : "*:data-[slot=avatar]:ring-card")}>
              {shown.map((member, index) => (
                <Avatar key={`${member.name}-${index}`} size="sm" className="data-[size=sm]:size-6">
                  {member.image ? <AvatarImage src={member.image} alt="" /> : null}
                  <AvatarFallback className="text-[0.625rem]">{initialsOf(member.name)}</AvatarFallback>
                </Avatar>
              ))}
              {rest > 0 ? <AvatarGroupCount className={cn("size-6 text-[0.625rem]", archived ? "ring-muted" : "ring-card")}>+{rest}</AvatarGroupCount> : null}
            </AvatarGroup>
            <span className="sr-only">
              {text.members}: {members.map((member) => member.name).join(", ")}
            </span>
          </span>
        ) : (
          <span />
        )}
        {showDue ? <DueDateLabel date={project.due ?? null} doneAt={completed ? project.completedAt : undefined} now={now} locale={locale} timeZone={timeZone} tooltip={false} className="text-xs" /> : null}
      </div>
    </article>
  );
}

export interface ProjectCardSkeletonProps extends ComponentProps<"div"> {
  /** The words a screen reader gets. Default "Loading project". */
  label?: string;
}

/** A card-shaped placeholder for a grid that is still loading: tile, name, status, two lines of description, a progress bar and a stack of members, in the footprint of a real card. */
export function ProjectCardSkeleton({ label = "Loading project", className, ...props }: ProjectCardSkeletonProps) {
  return (
    <div data-slot="project-card-skeleton" aria-busy="true" className={cn("flex min-w-0 flex-col gap-3.5 rounded-xl border border-border bg-card p-4 shadow-xs", className)} {...props}>
      <span className="sr-only">{label}</span>
      <div className="flex items-start gap-3">
        <Skeleton className="size-10 shrink-0 rounded-lg" />
        <div className="grid flex-1 gap-2 pt-0.5">
          <Skeleton className="h-4 w-2/3" delay={80} />
          <Skeleton className="h-5 w-16 rounded-full" delay={160} />
        </div>
      </div>
      <div className="grid min-h-[2.5rem] gap-2">
        <Skeleton className="h-3.5 w-full" delay={240} />
        <Skeleton className="h-3.5 w-4/5" delay={320} />
      </div>
      <div className="mt-auto grid gap-2">
        <Skeleton className="h-3 w-24" delay={400} />
        <Skeleton className="h-1.5 w-full rounded-full" delay={480} />
      </div>
      <div className="flex items-center justify-between">
        <div className="flex -space-x-1.5">
          {[0, 1, 2].map((index) => (
            <Skeleton key={index} className="size-6 rounded-full ring-2 ring-card" delay={560 + index * 80} />
          ))}
        </div>
        <Skeleton className="h-3.5 w-24" delay={800} />
      </div>
    </div>
  );
}
