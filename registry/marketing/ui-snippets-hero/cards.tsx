import { IconCalendar, IconCheck, IconSend } from "@rhs-ui/icons";
import { Avatar, AvatarFallback, AvatarImage, initialsOf } from "@rhs-ui/primitives/avatar";
import { Badge } from "@rhs-ui/primitives/badge";
import { Checkbox } from "@rhs-ui/primitives/checkbox";
import { cn } from "@/lib/utils";

export interface SnippetPerson {
  /** The name; it gives the initials. */
  name: string;
  /** A portrait. The initials show when it is left out or fails to load. */
  src?: string;
}

/** A task row: a check, a title, a label, the day it is due and who has it. */
export interface TaskSnippet {
  /** Tells the card kinds apart. */
  kind: "task";
  /** What is to be done: "Draft the Q4 launch brief". */
  title: string;
  /** Who it is assigned to. */
  assignee: SnippetPerson;
  /** The due date as you want it written: "Fri 14". */
  due: string;
  /** Draws the check as ticked and the title struck through. */
  done?: boolean;
  /** A word for the project or the kind of work: "Marketing". */
  label?: string;
}

/** A comment with a reply field under it. */
export interface CommentSnippet {
  /** Tells the card kinds apart. */
  kind: "comment";
  /** Who wrote it. */
  author: SnippetPerson;
  /** What they said, in a sentence or two. */
  text: string;
  /** How long ago, as you want it written: "2m". */
  time?: string;
  /** The placeholder of the reply field. "Reply to" followed by the author's first name when left out. */
  replyPlaceholder?: string;
}

/** A small activity toast: something that just happened. */
export interface ActivitySnippet {
  /** Tells the card kinds apart. */
  kind: "activity";
  /** What happened, as a whole sentence: "Priya completed Design handoff". */
  text: string;
  /** When, as you want it written: "just now". */
  time?: string;
}

/** A status card: a name, where it stands and how far along it is. */
export interface StatusSnippet {
  /** Tells the card kinds apart. */
  kind: "status";
  /** What the status is of: "Sprint 24". */
  title: string;
  /** Where it stands, in a word or two: "On track". */
  status: string;
  /** How far along, from 0 to 100. */
  progress: number;
  /** A line under the bar: "18 of 25 tasks done". */
  detail?: string;
}

export type Snippet = TaskSnippet | CommentSnippet | ActivitySnippet | StatusSnippet;

function Person({ person, size = "sm" }: { person: SnippetPerson; size?: "sm" | "default" }) {
  return (
    <Avatar size={size} className="ring-2 ring-card">
      {person.src ? <AvatarImage src={person.src} alt="" /> : null}
      <AvatarFallback>{initialsOf(person.name)}</AvatarFallback>
    </Avatar>
  );
}

/** What a screen reader hears for one card. The cards themselves are drawings, so this is all there is of them. */
export function describeSnippet(snippet: Snippet): string {
  switch (snippet.kind) {
    case "task":
      return `A task, ${snippet.title}, ${snippet.done ? "done, " : ""}assigned to ${snippet.assignee.name}, due ${snippet.due}.`;
    case "comment":
      return `${snippet.author.name} comments: ${snippet.text}`;
    case "activity":
      return `${snippet.text}.`;
    case "status":
      return `${snippet.title} is ${snippet.status.toLowerCase()}, ${Math.round(snippet.progress)} percent done.`;
  }
}

const SURFACE = "w-full rounded-xl border border-border bg-card p-3.5 text-start text-sm leading-snug text-card-foreground shadow-sm";

/** One drawn card. It is made of the same checkbox, badge and avatar a product would use, so it looks like the product and nothing else. */
export function SnippetCard({ snippet, className }: { snippet: Snippet; className?: string }) {
  if (snippet.kind === "task") {
    return (
      <div className={cn(SURFACE, className)}>
        <div className="flex items-start gap-2.5">
          <Checkbox checked={Boolean(snippet.done)} tabIndex={-1} className="mt-0.5" />
          <p className={cn("min-w-0 flex-1 font-medium text-pretty", snippet.done && "text-muted-foreground line-through decoration-muted-foreground/60")}>{snippet.title}</p>
        </div>
        <div className="mt-3 flex items-center gap-2 ps-7">
          {snippet.label ? <Badge variant="outline">{snippet.label}</Badge> : null}
          <span className="inline-flex items-center gap-1 text-xs whitespace-nowrap text-muted-foreground tabular-nums">
            <IconCalendar className="size-3.5" />
            {snippet.due}
          </span>
          <span className="ms-auto">
            <Person person={snippet.assignee} />
          </span>
        </div>
      </div>
    );
  }
  if (snippet.kind === "comment") {
    const first = snippet.author.name.split(/\s+/)[0] ?? snippet.author.name;
    return (
      <div className={cn(SURFACE, className)}>
        <div className="flex items-center gap-2.5">
          <Person person={snippet.author} />
          <p className="min-w-0 truncate font-medium">{snippet.author.name}</p>
          {snippet.time ? <p className="ms-auto text-xs whitespace-nowrap text-muted-foreground">{snippet.time}</p> : null}
        </div>
        <p className="mt-2.5 text-pretty text-card-foreground/90">{snippet.text}</p>
        <div className="mt-3 flex items-center gap-2 rounded-md border border-input bg-background py-1.5 pe-1.5 ps-2.5 text-xs text-muted-foreground shadow-xs">
          <span className="min-w-0 flex-1 truncate">{snippet.replyPlaceholder ?? `Reply to ${first}`}</span>
          <span className="grid size-6 shrink-0 place-items-center rounded bg-primary text-primary-foreground">
            <IconSend className="size-3" />
          </span>
        </div>
      </div>
    );
  }
  if (snippet.kind === "activity") {
    return (
      <div className={cn(SURFACE, "flex items-center gap-3 py-3 pe-4 ps-3", className)}>
        <span className="grid size-7 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
          <IconCheck className="size-3.5" />
        </span>
        <p className="min-w-0">
          <span className="block font-medium text-pretty">{snippet.text}</span>
          {snippet.time ? <span className="block text-xs text-muted-foreground">{snippet.time}</span> : null}
        </p>
      </div>
    );
  }
  const progress = Math.min(100, Math.max(0, snippet.progress));
  return (
    <div className={cn(SURFACE, className)}>
      <div className="flex items-center justify-between gap-3">
        <p className="min-w-0 truncate font-medium">{snippet.title}</p>
        <Badge variant="secondary">
          <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
          {snippet.status}
        </Badge>
      </div>
      <div className="mt-3.5 h-1.5 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary" style={{ width: `${progress}%` }} />
      </div>
      <p className="mt-2 flex justify-between gap-3 text-xs text-muted-foreground tabular-nums">
        <span>{snippet.detail}</span>
        <span>{Math.round(progress)}%</span>
      </p>
    </div>
  );
}
