"use client";

import { useState, type ComponentProps, type MouseEvent, type ReactNode } from "react";
import { Accordion as AccordionPrimitive } from "radix-ui";

import { IconBookOpen, IconCheck, IconChevronDown, IconClipboardCheck, IconEye, IconLock, IconPlay } from "@rhs-ui/icons";
import { Badge } from "@rhs-ui/primitives/badge";
import { AS_CHILD } from "@rhs-ui/primitives/render-prop";
import { cn } from "@/lib/utils";

/** What kind of lesson it is. */
export type LessonType = "video" | "reading" | "quiz";

/**
 * Where a lesson stands for this learner. A lesson that is none of these is simply open and says nothing.
 * `current` is not a state: it is the lesson you pass as `current`, whatever else it is.
 */
export type LessonState = "available" | "completed" | "locked" | "preview";

/** One lesson of a module. */
export interface Lesson {
  /** A stable identity: the key of the row, and what `current` refers to. */
  id: string;
  /** Its title. */
  title: string;
  /** A video, something to read or a quiz: a glyph and a word. */
  type: LessonType;
  /** How long it takes, in minutes. Written "12 min", or "1 h 5 min" from an hour up, and added up in the header of its module. */
  minutes?: number;
  /** Where it stands: `completed`, `locked` (not a link, and it says why) or `preview` (free to look at before enrolling). Default "available". */
  state?: LessonState;
  /** Its page. The row becomes a link to it. */
  href?: string;
  /** Why a locked lesson is locked, in a sentence: "Finish the quiz of module 1 to unlock it.". It is written under the title. */
  reason?: string;
}

/** A group of lessons that folds open. */
export interface CurriculumModule {
  /** A stable identity: what `expanded` refers to. */
  id: string;
  /** Its title: "Module 2. Working with type". */
  title: string;
  /** Its lessons, in order. */
  lessons: readonly Lesson[];
}

/** The words the list uses, for translation. `{done}`, `{total}`, `{module}` and `{count}` are filled in. */
export interface CurriculumListLabels {
  /** How far a module is, in the header and as the name of its bar. Default "{done} of {total} lessons". */
  progress?: string;
  /** Hours in a length of time. Default "{count} h". */
  hours?: string;
  /** Minutes in a length of time. Default "{count} min". */
  minutes?: string;
  /** The three kinds of lesson. */
  types?: Partial<Record<LessonType, string>>;
  /** The words of the four states. `current` is the lesson you pass as `current`. */
  states?: Partial<Record<LessonState | "current", string>>;
  /** Read before the title of the lesson that is open now, as hidden text. Default "Current lesson". */
  currentLesson?: string;
}

export interface CurriculumListProps extends Omit<ComponentProps<"div">, "children" | "onSelect"> {
  /** The modules, in order. */
  modules: readonly CurriculumModule[];
  /** The `id` of the lesson the learner is on. Its row is marked with `aria-current`, says "Current" in words and, when `expanded` is left to the list, its module starts open. */
  current?: string;
  /** A lesson was pressed. With `lesson.href` it runs on the link, so a client-side router can call `preventDefault()` on the event; without an href the row becomes a button. A locked lesson is neither. */
  onSelect?: (lesson: Lesson, module: CurriculumModule, event: MouseEvent<HTMLElement>) => void;
  /** The `id`s of the modules that are open, controlled. */
  expanded?: readonly string[];
  /** The modules that start open, when you do not control `expanded`. Default: the module of `current`, or else the first. */
  defaultExpanded?: readonly string[];
  /** A module was opened or closed: the ids that are open now. */
  onExpandedChange?: (expanded: string[]) => void;
  /** Heading level of the module titles. Default 3. */
  headingLevel?: 2 | 3 | 4;
  /** The words the list uses, for translation. */
  labels?: CurriculumListLabels;
}

const DEFAULT_LABELS = { progress: "{done} of {total} lessons", hours: "{count} h", minutes: "{count} min", currentLesson: "Current lesson" };
const DEFAULT_TYPES: Record<LessonType, string> = { video: "Video", reading: "Reading", quiz: "Quiz" };
const DEFAULT_STATES: Record<LessonState | "current", string> = { available: "", completed: "Completed", locked: "Locked", preview: "Preview", current: "Current" };

const TYPE_GLYPH: Record<LessonType, ReactNode> = { video: <IconPlay />, reading: <IconBookOpen />, quiz: <IconClipboardCheck /> };

const fill = (template: string, values: Record<string, string | number>) => template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ""));

/** "12 min", "1 h", "1 h 5 min": a length of time from minutes, in the words of two templates. */
function lengthText(minutes: number, hours: string, minute: string): string {
  const whole = Math.floor(minutes / 60);
  const rest = Math.round(minutes % 60);
  return [whole > 0 ? fill(hours, { count: whole }) : "", rest > 0 || whole === 0 ? fill(minute, { count: rest }) : ""].filter(Boolean).join(" ");
}

const ROW =
  "relative grid w-full grid-cols-[2rem_minmax(0,1fr)] items-start gap-x-3.5 px-5 py-3 text-left outline-none @sm:grid-cols-[2rem_minmax(0,1fr)_auto] focus-visible:z-10 focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:ring-inset";

interface RowProps {
  lesson: Lesson;
  module: CurriculumModule;
  isCurrent: boolean;
  text: typeof DEFAULT_LABELS;
  types: Record<LessonType, string>;
  states: Record<LessonState | "current", string>;
  onSelect?: CurriculumListProps["onSelect"];
}

function LessonRow({ lesson, module, isCurrent, text, types, states, onSelect }: RowProps) {
  const state = lesson.state ?? "available";
  const locked = state === "locked";
  const done = state === "completed";
  const word = isCurrent ? states.current : states[state];
  const interactive = !locked && Boolean(lesson.href || onSelect);

  const body = (
    <>
      <span aria-hidden="true" className={cn("grid size-8 place-items-center rounded-lg border [&_svg]:size-4", isCurrent ? "border-primary bg-primary text-primary-foreground" : "border-border bg-muted text-muted-foreground")}>
        {TYPE_GLYPH[lesson.type]}
      </span>
      <span className="min-w-0">
        <span className={cn("block text-sm leading-5 [overflow-wrap:anywhere]", isCurrent ? "font-semibold text-foreground" : locked ? "font-medium text-muted-foreground" : "font-medium text-foreground")}>
          {isCurrent ? <span className="sr-only">{text.currentLesson}: </span> : null}
          {lesson.title}
        </span>
        <span className="mt-0.5 block text-[0.8125rem] leading-5 text-muted-foreground tabular-nums">
          {types[lesson.type]}
          {lesson.minutes !== undefined ? <> · {lengthText(lesson.minutes, text.hours, text.minutes)}</> : null}
        </span>
        {locked && lesson.reason ? <span className="mt-1 block text-[0.8125rem] leading-5 text-muted-foreground [overflow-wrap:anywhere]">{lesson.reason}</span> : null}
      </span>
      {/* Beside the title on a wide list, under it on a narrow one, so a sidebar never squeezes a title into a column of letters. */}
      {word ? (
        <span className="col-start-2 mt-1.5 flex min-h-5 items-center justify-start self-start pt-px @sm:col-start-3 @sm:row-start-1 @sm:mt-0 @sm:justify-end">
          <Badge variant={isCurrent ? "default" : done ? "secondary" : state === "preview" ? "outline" : "muted"}>
            {isCurrent ? null : done ? <IconCheck /> : locked ? <IconLock /> : state === "preview" ? <IconEye /> : null}
            {word}
          </Badge>
        </span>
      ) : null}
    </>
  );

  const current = isCurrent ? ({ "aria-current": lesson.href ? "page" : "true" } as const) : {};
  const mark = isCurrent ? "bg-muted/60 before:absolute before:inset-y-0 before:left-0 before:w-0.5 before:bg-foreground before:content-['']" : "";

  return (
    <li data-slot="lesson" data-state={state} data-current={isCurrent || undefined}>
      {interactive && lesson.href ? (
        <a href={lesson.href} onClick={(event) => onSelect?.(lesson, module, event)} className={cn(ROW, mark, "transition-colors duration-150 hover:bg-muted/60 motion-reduce:transition-none")} {...current}>
          {body}
        </a>
      ) : interactive ? (
        <button type="button" onClick={(event) => onSelect?.(lesson, module, event)} className={cn(ROW, mark, "cursor-pointer transition-colors duration-150 hover:bg-muted/60 motion-reduce:transition-none")} {...current}>
          {body}
        </button>
      ) : (
        <div className={cn(ROW, mark)} {...current}>
          {body}
        </div>
      )}
    </li>
  );
}

/**
 * A course outline, for a course page, a lesson sidebar or a training portal:
 * modules that fold open to their lessons. A module's header says how far
 * the learner is ("3 of 5 lessons", with a thin bar that shows it) and how
 * long the module takes in all; each lesson has a glyph and
 * a word for its kind (video, reading, quiz), its length, and a state in
 * words: Completed, Current, Preview (free to look at before enrolling) or
 * Locked. The current lesson is marked with `aria-current`, and a locked one
 * is not a link and says why. Several modules can be open at once, and the
 * module of the current lesson starts open.
 */
export function CurriculumList({
  modules,
  current,
  onSelect,
  expanded: controlled,
  defaultExpanded,
  onExpandedChange,
  headingLevel = 3,
  labels,
  className,
  ...props
}: CurriculumListProps) {
  const text = { ...DEFAULT_LABELS, ...labels };
  const types = { ...DEFAULT_TYPES, ...labels?.types };
  const states = { ...DEFAULT_STATES, ...labels?.states };
  const Heading = `h${headingLevel}` as "h2" | "h3" | "h4";
  const start = defaultExpanded ?? [modules.find((module) => module.lessons.some((lesson) => lesson.id === current))?.id ?? modules[0]?.id ?? ""].filter(Boolean);
  const [own, setOwn] = useState<string[]>([...start]);
  const open = controlled ? [...controlled] : own;

  return (
    <div data-slot="curriculum-list" className={cn("@container overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-xs", className)} {...props}>
      <AccordionPrimitive.Root
        type="multiple"
        value={open}
        onValueChange={(next) => {
          if (!controlled) setOwn(next);
          onExpandedChange?.(next);
        }}
        className="divide-y divide-border"
      >
        {modules.map((module) => {
          const total = module.lessons.length;
          const done = module.lessons.filter((lesson) => lesson.state === "completed").length;
          const minutes = module.lessons.reduce((sum, lesson) => sum + (lesson.minutes ?? 0), 0);
          const progress = fill(text.progress, { done, total });
          return (
            <AccordionPrimitive.Item key={module.id} value={module.id} data-slot="curriculum-module">
              <AccordionPrimitive.Header {...AS_CHILD}>
                <Heading className="m-0">
                  <AccordionPrimitive.Trigger className="group/module flex w-full items-start gap-4 px-5 py-4 text-left outline-none transition-colors duration-150 hover:bg-muted/50 focus-visible:z-10 focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:ring-inset motion-reduce:transition-none">
                    <span className="min-w-0 flex-1">
                      <span className="block text-[0.9375rem] leading-snug font-semibold tracking-[-0.02em] [overflow-wrap:anywhere]">{module.title}</span>
                      <span className="mt-1 block text-[0.8125rem] leading-5 text-muted-foreground tabular-nums">
                        {progress}
                        {minutes > 0 ? <> · {lengthText(minutes, text.hours, text.minutes)}</> : null}
                      </span>
                      {/* The words above are the information; the bar only shows it. */}
                      <span aria-hidden="true" className="mt-3 block h-1 overflow-hidden rounded-full bg-muted">
                        <span className="block h-full rounded-full bg-primary transition-[width] duration-300 motion-reduce:transition-none" style={{ width: `${total ? (done / total) * 100 : 0}%` }} />
                      </span>
                    </span>
                    <IconChevronDown className="mt-1 size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[state=open]/module:rotate-180 motion-reduce:transition-none" />
                  </AccordionPrimitive.Trigger>
                </Heading>
              </AccordionPrimitive.Header>
              <AccordionPrimitive.Content className="overflow-hidden motion-safe:data-[state=closed]:animate-rhs-lessons-up motion-safe:data-[state=open]:animate-rhs-lessons-down">
                <ul className="py-1.5">
                  {module.lessons.map((lesson) => (
                    <LessonRow key={lesson.id} lesson={lesson} module={module} isCurrent={lesson.id === current} text={text} types={types} states={states} onSelect={onSelect} />
                  ))}
                </ul>
              </AccordionPrimitive.Content>
            </AccordionPrimitive.Item>
          );
        })}
      </AccordionPrimitive.Root>
    </div>
  );
}
