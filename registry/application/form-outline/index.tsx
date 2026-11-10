"use client";

import { useEffect, useId, useRef, useState, type ComponentProps, type MouseEvent } from "react";

import { IconChevronDown } from "@rhs-ui/icons";
import {
  DEFAULT_LABELS,
  fill,
  focusHeading,
  problemsOf,
  scrollParentOf,
  scrollToSection,
  sectionInView,
  type FormOutlineLabels,
  type OutlineSection,
  type OutlineStatus,
} from "@rhs-ui/application/form-outline/outline";
import { Progress } from "@rhs-ui/primitives/progress";
import { cn } from "@/lib/utils";

export type { FormOutlineLabels, OutlineSection, OutlineStatus } from "@rhs-ui/application/form-outline/outline";

export interface FormOutlineProps extends Omit<ComponentProps<"nav">, "children" | "onSelect"> {
  /** The sections of the form, in order. Each `id` is the id of an element on the page that holds the section. */
  sections: readonly OutlineSection[];
  /** The section marked as the one in view, when you decide it. Without it the outline follows the scroll. */
  activeId?: string;
  /** The section marked to begin with, while the outline follows the scroll itself. Default the first. */
  defaultActiveId?: string;
  /** Called with the id of the section whose link was followed, before the page scrolls to it. */
  onNavigate?: (id: string) => void;
  /** Keep the outline in view while the form scrolls: in the side column on a wide screen, as the bar at the top on a phone. Default true. */
  sticky?: boolean;
  /** Mark the section in view as the page scrolls. Ignored when you pass `activeId`. Default true. */
  track?: boolean;
  /** How far under the top of the view a section's heading comes to rest, in px: the height of a sticky header you have. Default 24. */
  scrollOffset?: number;
  /** Names the navigation landmark. Default "Form sections". */
  label?: string;
  /** The words the outline says, for translation. */
  labels?: FormOutlineLabels;
}

/** The ink of a problem count. The plain destructive red is 4.2:1 on the grey of the current row, short of AA for small type, so it is pulled a little toward the text colour, which darkens it in light mode and lightens it in dark mode. */
const PROBLEM_INK = "text-[color-mix(in_oklch,var(--destructive),var(--foreground)_22%)]";

/** The mark of a section, on a 16 unit grid: a disc with a check cut out of it for done, a ring with an exclamation mark for needs attention, a dashed ring for not started. The shapes differ, so they read without colour. */
function Mark({ status, className }: { status: OutlineStatus; className?: string }) {
  const mask = useId().replace(/[^\w-]/g, "");
  return (
    <svg
      data-slot="form-outline-mark"
      data-status={status}
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      focusable="false"
      className={cn("size-4 shrink-0", status === "done" ? "text-foreground" : status === "attention" ? "text-destructive" : "text-muted-foreground", className)}
    >
      {status === "done" ? (
        <>
          <mask id={mask} maskUnits="userSpaceOnUse" x="0" y="0" width="16" height="16">
            <rect width="16" height="16" fill="white" />
            <path d="M5.1 8.2l2 2 3.8-4.2" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </mask>
          <circle cx="8" cy="8" r="7" fill="currentColor" mask={`url(#${mask})`} />
        </>
      ) : (
        <>
          <circle cx="8" cy="8" r="6.25" stroke="currentColor" strokeWidth="1.5" strokeDasharray={status === "todo" ? "1.9 2.03" : undefined} />
          {status === "attention" ? <path d="M8 4.9v3.7M8 11.1h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /> : null}
        </>
      )}
    </svg>
  );
}

/**
 * The jump list of a long application form: every section as a link with a
 * mark and a word for where it stands (Done, Needs attention with its count in
 * text, Not started), the section in view marked with `aria-current`, and a
 * thin line that counts the sections done. Following a link scrolls to the
 * section and moves focus to its heading, so a screen reader reads where it
 * landed. The outline follows the scroll by itself, in the page or in any
 * scrolling container that holds the sections, or you set `activeId`. It is a
 * navigation landmark labelled "Form sections". Beside the form on a wide
 * screen it is a sticky list; on a phone it folds into a bar that stays at
 * the top and says "Section 3 of 6", and opens the list.
 */
export function FormOutline({
  sections,
  activeId,
  defaultActiveId,
  onNavigate,
  sticky = true,
  track = true,
  scrollOffset = 24,
  label = "Form sections",
  labels,
  className,
  ...props
}: FormOutlineProps) {
  const text = { ...DEFAULT_LABELS, ...labels };
  const base = useId();
  const panelId = `${base}-panel`;
  const nav = useRef<HTMLElement>(null);
  const bar = useRef<HTMLButtonElement>(null);
  const barBox = useRef<HTMLDivElement>(null);
  const settle = useRef(0);
  const [own, setOwn] = useState(defaultActiveId ?? sections[0]?.id ?? "");
  const [open, setOpen] = useState(false);
  const active = activeId ?? own;
  const position = Math.max(0, sections.findIndex((section) => section.id === active));
  const here = sections[position];
  const done = sections.filter((section) => section.status === "done").length;
  const progress = fill(text.progress, { done, total: sections.length });
  const ids = sections.map((section) => section.id).join("\u0000");
  // A phone's bar is pinned over the top of the view, so a section has to stop under it: its height counts as part of the offset. It is 0 while the bar is hidden.
  const lift = () => (sticky ? (barBox.current?.offsetHeight ?? 0) : 0);

  // The outline follows the scroll of the page or of whatever scrolls the sections. A scroll event does not bubble, so it is caught on the way down.
  useEffect(() => {
    if (activeId !== undefined || !track) return;
    const list = ids.split("\u0000");
    let frame = 0;
    const update = () => {
      frame = 0;
      // While a link's own scroll is under way the sections pass by; marking each of them would make the mark flicker.
      if (performance.now() < settle.current) return;
      const first = list.map((id) => document.getElementById(id)).find((element) => element !== null) ?? null;
      const seen = sectionInView(list, scrollOffset + lift(), scrollParentOf(first));
      if (seen) setOwn(seen);
    };
    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    document.addEventListener("scroll", schedule, { capture: true, passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      document.removeEventListener("scroll", schedule, { capture: true });
      window.removeEventListener("resize", schedule);
      window.cancelAnimationFrame(frame);
    };
  }, [ids, scrollOffset, track, activeId]);

  // The phone's list closes on Escape, with focus back on the bar, and on a press outside.
  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => {
      if (!nav.current?.contains(event.target as Node)) setOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      bar.current?.focus();
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);

  function follow(event: MouseEvent<HTMLAnchorElement>, id: string) {
    onNavigate?.(id);
    setOpen(false);
    if (activeId === undefined) setOwn(id);
    // A new tab or window keeps the plain link; so does a section the page does not have.
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    const section = document.getElementById(id);
    if (!section) return;
    event.preventDefault();
    const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    settle.current = performance.now() + (smooth ? 900 : 120);
    scrollToSection(section, scrollOffset + lift(), smooth);
    focusHeading(section);
  }

  const word: Record<OutlineStatus, string> = { done: text.done, attention: text.attention, todo: text.todo };
  const herProblems = here ? problemsOf(here, text) : null;

  return (
    <nav ref={nav} data-slot="form-outline" aria-label={label} className={cn("relative", sticky && "sticky top-0 z-20 lg:top-6 lg:z-auto lg:self-start", className)} {...props}>
      {/* A phone: the bar that says where you are and opens the list. */}
      {here ? (
        <div ref={barBox} className="border-b border-border bg-background lg:hidden">
          <button
            ref={bar}
            type="button"
            aria-expanded={open}
            aria-controls={panelId}
            onClick={() => setOpen((now) => !now)}
            className="flex w-full items-center gap-3 px-4 py-3 text-left outline-none transition-colors duration-150 hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset motion-reduce:transition-none"
          >
            <Mark status={here.status} />
            <span className="grid min-w-0 flex-1 gap-0.5">
              <span className="text-xs leading-4 text-muted-foreground tabular-nums">{fill(text.position, { current: position + 1, total: sections.length })}</span>
              <span className="truncate text-sm leading-5 font-medium">{here.label}</span>
            </span>
            {herProblems ? <span className={cn("shrink-0 text-xs font-medium", PROBLEM_INK)}>{herProblems}</span> : null}
            <IconChevronDown aria-hidden="true" className={cn("size-4 shrink-0 text-muted-foreground transition-transform duration-200 motion-reduce:transition-none", open && "rotate-180")} />
          </button>
          <Progress value={done} max={Math.max(1, sections.length)} aria-label={progress} getValueLabel={() => progress} className="h-0.5 rounded-none" />
        </div>
      ) : null}

      {/* The list: always there beside the form, and a panel under the bar on a phone. */}
      <div
        id={panelId}
        className={cn(
          "relative max-lg:absolute max-lg:inset-x-0 max-lg:top-full max-lg:z-30 max-lg:max-h-[min(70dvh,26rem)] max-lg:overflow-y-auto max-lg:border-b max-lg:border-border max-lg:bg-background max-lg:p-2 max-lg:shadow-sm",
          "max-lg:transition-[opacity,translate,visibility] max-lg:duration-150 motion-reduce:transition-none",
          open ? "max-lg:visible max-lg:translate-y-0 max-lg:opacity-100" : "max-lg:invisible max-lg:-translate-y-1 max-lg:opacity-0",
        )}
      >
        <div className="mb-3 grid gap-2 px-2.5 max-lg:hidden">
          <p id={`${base}-progress`} className="text-xs font-medium text-muted-foreground tabular-nums">
            {progress}
          </p>
          <Progress value={done} max={Math.max(1, sections.length)} aria-labelledby={`${base}-progress`} getValueLabel={() => progress} className="h-1" />
        </div>
        <ol role="list" className="grid gap-0.5">
          {sections.map((section) => {
            const problems = problemsOf(section, text);
            const current = section.id === active;
            return (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  aria-current={current ? "location" : undefined}
                  onClick={(event) => follow(event, section.id)}
                  className="group/link flex items-start gap-3 rounded-lg px-2.5 py-2 outline-none transition-colors duration-150 hover:bg-muted/60 focus-visible:ring-[3px] focus-visible:ring-ring/40 aria-[current=location]:bg-muted motion-reduce:transition-none"
                >
                  <Mark status={section.status} className="mt-0.5" />
                  <span className="grid min-w-0 gap-0.5">
                    <span className="text-sm leading-5 font-medium text-muted-foreground transition-colors duration-150 group-hover/link:text-foreground group-aria-[current=location]/link:text-foreground motion-reduce:transition-none">
                      {section.label}
                      {current ? <span className="sr-only"> ({text.current})</span> : null}
                    </span>
                    <span className="flex flex-wrap items-center gap-x-1.5 text-xs leading-4 text-muted-foreground">
                      <span className="sr-only">. </span>
                      <span>{word[section.status]}</span>
                      {problems ? (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className={cn("font-medium", PROBLEM_INK)}>{problems}</span>
                        </>
                      ) : null}
                    </span>
                  </span>
                </a>
              </li>
            );
          })}
        </ol>
      </div>
    </nav>
  );
}
