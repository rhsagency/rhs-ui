"use client";

import { useEffect, useLayoutEffect, useRef, useState, type ComponentProps, type CSSProperties, type KeyboardEvent } from "react";

import { IconCheck, IconSpinner, IconXCircle } from "@rhs-ui/icons";
import { cn } from "@/lib/utils";

export interface PathStage {
  /** What `current` and `onStageChange` speak. Unique among the stages. */
  id: string;
  /** The name on the chevron: "Qualified". */
  label: string;
  /** When the stage was reached or is due, already written the way you want it: "12 Oct". It sits under the label. */
  date?: string;
  /** A short remark about the stage: "Waiting on legal". It is written under the path while this is the current stage. */
  note?: string;
}

/** The words a screen reader hears, for another language or your own wording. */
export interface StagePathLabels {
  /** The name of each stage; `{n}`, `{total}`, `{label}` and `{state}` are filled in. Default "Stage {n} of {total}: {label}, {state}". */
  stage: string;
  /** `{state}` for a finished stage. Default "done". */
  done: string;
  /** `{state}` for the stage the item is at. Default "current". */
  current: string;
  /** `{state}` for a stage not reached yet. Default "not reached". */
  upcoming: string;
  /** The name of the terminal outcome; `{label}` is `lostLabel`. Default "Outcome: {label}". */
  outcome: string;
  /** Said politely once the item has moved; `{label}`, `{n}` and `{total}` are filled in. Default "{label}, stage {n} of {total}". */
  moved: string;
  /** Said politely once the item has ended in the terminal outcome; `{label}` is `lostLabel`, `{n}` and `{total}` are the last stage it reached. Default "{label} at stage {n} of {total}". */
  lost: string;
  /** Said while your callback is still working; `{label}` is the stage asked for. Default "Moving to {label}". */
  moving: string;
}

/** What `onStageChange` may give back: nothing, or a promise, so the path can show the stage as busy until it settles. */
export type StageChangeResult = void | boolean | Promise<void | boolean>;

export interface StagePathProps extends Omit<ComponentProps<"div">, "children"> {
  /** The stages in order, first to last. */
  stages: readonly PathStage[];
  /** The `id` of the stage the item is at, or null before the first. Finished stages are those before it. */
  current: string | null;
  /** Called with the stage asked for (or "lost" for the terminal outcome) and the one it is at now. The path never moves by itself: change `current` when you accept. Return a promise to have the stage shown as busy meanwhile. */
  onStageChange?: (id: string, from: string | null) => StageChangeResult;
  /** Draws the path without buttons, for a record you may only look at. Without `onStageChange` it is read-only anyway. */
  readOnly?: boolean;
  /** Let people go back to a finished stage. Off by default: a finished stage stays finished. */
  allowBackward?: boolean;
  /** Adds a terminal outcome after the path, such as "Closed lost". It is a button that calls `onStageChange` with the id "lost". */
  lostLabel?: string;
  /** The item ended in the terminal outcome. `current` is then the last stage it reached. */
  lost?: boolean;
  /** `sm`, `md` or `lg`: a chevron 32, 40 or 56px tall. Default "md". */
  size?: "sm" | "md" | "lg";
  /** The name of the group for assistive technology. Default "Stage". */
  label?: string;
  /** The words a screen reader hears. */
  labels?: Partial<StagePathLabels>;
}

const WORDS: StagePathLabels = {
  stage: "Stage {n} of {total}: {label}, {state}",
  done: "done",
  current: "current",
  upcoming: "not reached",
  outcome: "Outcome: {label}",
  moved: "{label}, stage {n} of {total}",
  lost: "{label} at stage {n} of {total}",
  moving: "Moving to {label}",
};

/** The height of a chevron, the depth of its point and the size of its check, written out so Tailwind sees the classes. */
const SIZES = {
  sm: { height: "32px", notch: "10px", icon: 12, text: "text-xs" },
  md: { height: "40px", notch: "12px", icon: 14, text: "text-sm" },
  lg: { height: "56px", notch: "16px", icon: 16, text: "text-sm" },
} as const;

const fill = (template: string, values: Record<string, string>): string => template.replace(/\{(\w+)\}/g, (whole, key: string) => values[key] ?? whole);

const N = "var(--stage-n)";
const E = "var(--edge)";
const G = "var(--stage-ring)";

/** The outline of a chevron pulled in by `by` all round: the constants are how far the slanted sides move sideways for an inset that is `by` thick perpendicular to them. */
function inset(first: boolean, last: boolean, by: string): string {
  const points = [
    first ? `${by} ${by}` : `calc(${by} * 1.77) ${by}`,
    last ? `calc(100% - ${by}) ${by}` : `calc(100% - ${N} - ${by} * 0.57) ${by}`,
    last ? null : `calc(100% - ${by} * 1.17) 50%`,
    last ? `calc(100% - ${by}) calc(100% - ${by})` : `calc(100% - ${N} - ${by} * 0.57) calc(100% - ${by})`,
    first ? `${by} calc(100% - ${by})` : `calc(${by} * 1.77) calc(100% - ${by})`,
    first ? null : `calc(${N} + ${by} * 1.17) 50%`,
  ].filter(Boolean);
  return `polygon(${points.join(", ")})`;
}

/**
 * The outline of a chevron and, one border-width inside it, the shape that fills it. Two layers draw the border because
 * a clip-path cuts a real border off at the point; the inner polygon is the outer one pulled in by `--edge`. `ring` is
 * pulled in by `--stage-ring`: only the current stage uses it, to leave a gap of page colour between its focus ring and
 * its fill, which are both as dark as each other.
 */
function shapesOf(first: boolean, last: boolean): { outer: string; inner: string; ring: string } {
  const outer = ["0 0", last ? "100% 0" : `calc(100% - ${N}) 0`, last ? null : "100% 50%", last ? "100% 100%" : `calc(100% - ${N}) 100%`, "0 100%", first ? null : `${N} 50%`].filter(Boolean);
  return { outer: `polygon(${outer.join(", ")})`, inner: inset(first, last, E), ring: inset(first, last, G) };
}

/** Border, fill and text of a chevron by state, and what a button of it does on hover and focus. */
const EDGE = {
  done: "bg-border",
  current: "bg-primary",
  upcoming: "bg-[color-mix(in_oklch,var(--border),var(--foreground)_18%)]",
} as const;
const FILL = {
  done: "bg-muted group-data-[act=true]/stage:group-hover/stage:bg-[color-mix(in_oklch,var(--muted),var(--foreground)_7%)]",
  current: "bg-primary",
  upcoming: "bg-background group-data-[act=true]/stage:group-hover/stage:bg-muted",
} as const;
const TEXT = {
  done: "text-foreground",
  current: "text-primary-foreground",
  upcoming: "text-muted-foreground group-data-[act=true]/stage:group-hover/stage:text-foreground",
} as const;

/**
 * The stage tracker of a CRM, a hiring pipeline or an application: arrow-shaped steps joined edge to edge, finished
 * stages marked with a check, the current one filled and the rest outlined. Give it `onStageChange` and every stage
 * you may go to becomes a button that asks your callback before anything moves (going back only when you allow it),
 * and shows itself busy while the promise you return is pending. `lostLabel` adds the terminal outcome ("Closed
 * lost") as a button of its own. When a press made with the keyboard or a pointer moves the item, focus follows it to
 * the stage it is at, which is no longer a button, so nobody loses their place; the arrow keys pass through that stage.
 * A screen reader hears an ordered list ("Stage 3 of 5: Proposal, current"), so the shape is never the only signal; the
 * check and the words carry it. In a narrow box only the current stage keeps its name and the others shrink to a check
 * or a number.
 */
export function StagePath({ stages, current, onStageChange, readOnly = false, allowBackward = false, lostLabel, lost = false, size = "md", label = "Stage", labels, className, ...props }: StagePathProps) {
  const words = { ...WORDS, ...labels };
  const metrics = SIZES[size];
  const total = stages.length;
  const index = current === null ? -1 : stages.findIndex((stage) => stage.id === current);
  const interactive = Boolean(onStageChange) && !readOnly;
  const [pending, setPending] = useState<string | null>(null);
  const alive = useRef(true);
  const list = useRef<HTMLOListElement>(null);
  /** The stage a press made from inside the path asked for, so focus can follow it: the pressed button is replaced when the item gets there. */
  const asked = useRef<string | null>(null);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const stateOf = (position: number): "done" | "current" | "upcoming" => (lost ? (position <= index ? "done" : "upcoming") : position < index ? "done" : position === index ? "current" : "upcoming");
  const finished = !lost && total > 0 && index === total - 1;
  /** The stage that keeps its name in a narrow box: where the item is, or the first one before it starts. */
  const focus = Math.max(index, 0);
  const canGo = (position: number): boolean => interactive && (lost ? allowBackward || position >= index : position > index || (position < index && allowBackward));

  function go(id: string) {
    if (pending || !onStageChange) return;
    // Noted before the callback runs: if focus is inside the path now, it follows the item once it has moved.
    asked.current = list.current?.contains(document.activeElement) ? id : null;
    // Called here, not inside a promise: a callback that throws is an error in the click, as it would be anywhere else.
    const result = onStageChange(id, current);
    if (result && typeof (result as Promise<unknown>).then === "function") {
      setPending(id);
      // Whatever goes wrong is for the caller to show; the path only stops being busy.
      void Promise.resolve(result)
        .catch(() => undefined)
        .then(() => {
          if (alive.current) setPending(null);
        });
    }
  }

  /** What is said politely: the move once it is done, and while it is being made, the stage asked for. */
  const target = pending === "lost" ? lostLabel : stages.find((stage) => stage.id === pending)?.label;
  const settled = lost ? (lostLabel ?? "") : (stages[index]?.label ?? "");
  const message = pending ? fill(words.moving, { label: target ?? "" }) : settled ? fill(lost ? words.lost : words.moved, { label: settled, n: String(index + 1), total: String(total) }) : "";
  const before = useRef(message);
  const [said, setSaid] = useState("");
  useEffect(() => {
    if (before.current === message) return;
    before.current = message;
    setSaid(message);
  }, [message]);

  // The stage that was pressed stops being a button once the item is there, and a removed element drops focus to the page.
  // So when what was asked for has come to pass, focus goes to the stage the item is at (or the outcome), where it rests.
  const seen = useRef({ current, lost });
  useLayoutEffect(() => {
    const was = seen.current;
    seen.current = { current, lost };
    const wanted = asked.current;
    if (wanted === null || (was.current === current && was.lost === lost)) return;
    asked.current = null;
    const arrived = wanted === "lost" ? lost : !lost && stages[index]?.id === wanted;
    if (!arrived) return;
    const active = document.activeElement;
    // Focus the person has moved elsewhere in the meantime stays there.
    if (active && active !== document.body && !list.current?.contains(active)) return;
    list.current?.querySelector<HTMLElement>("[data-here]")?.focus();
    // `stages` and `index` are read from the render that changed the stage.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, lost]);

  function keys(event: KeyboardEvent<HTMLOListElement>) {
    // The buttons that can be pressed and the stage focus rests on after a move: it is no button, but the arrows pass through it.
    const stops = Array.from(event.currentTarget.querySelectorAll<HTMLElement>("button:not([aria-disabled='true']), [data-here]"));
    const at = stops.indexOf(document.activeElement as HTMLElement);
    if (at === -1) return;
    const next = event.key === "ArrowRight" ? at + 1 : event.key === "ArrowLeft" ? at - 1 : event.key === "Home" ? 0 : event.key === "End" ? stops.length - 1 : null;
    if (next === null) return;
    event.preventDefault();
    stops[Math.min(stops.length - 1, Math.max(0, next))]?.focus();
  }

  if (!total) return null;

  const note = lost ? undefined : stages[index]?.note;
  const vars = { "--stage-h": metrics.height, "--stage-n": metrics.notch, "--stage-gap": "3px" } as CSSProperties;

  return (
    <div data-slot="stage-path" data-size={size} role="group" aria-label={label} className={cn("@container grid gap-2.5", className)} {...props}>
      <ol ref={list} onKeyDown={keys} aria-busy={pending ? true : undefined} style={vars} className={cn("flex items-stretch @max-xs:flex-wrap", metrics.text)}>
        {stages.map((stage, position) => {
          const state = stateOf(position);
          const grows = position === focus;
          const isFirst = position === 0;
          const isLast = position === total - 1;
          const asButton = canGo(position);
          /** Where focus rests when the item arrives here: not a tab stop, so Tab still goes from stage to stage you can press. */
          const here = interactive && state === "current";
          const busy = pending === stage.id;
          const { outer, inner, ring } = shapesOf(isFirst, isLast);
          const showCheck = state === "done" || (finished && isLast);
          const name = fill(words.stage, { n: String(position + 1), total: String(total), label: stage.label, state: words[state] }) + (stage.date ? `, ${stage.date}` : "");
          const body = (
            <>
              {/* The border layer is the element itself; this one is the fill, a border-width inside it. */}
              {here ? (
                // In light mode the ring is as black as the current stage, so a gap of page colour keeps the ring visible: ring, gap, fill.
                <span aria-hidden="true" className={cn("absolute inset-0 hidden bg-background group-focus-visible/stage:block", isFirst && "rounded-l-[6px]", isLast && "rounded-r-[6px]")} style={{ clipPath: ring }} />
              ) : null}
              <span aria-hidden="true" className={cn("absolute inset-0 transition-colors duration-150 motion-reduce:transition-none", isFirst && "rounded-l-[7px]", isLast && "rounded-r-[7px]", FILL[state])} style={{ clipPath: inner }} />
              <span
                aria-hidden="true"
                className={cn(
                  "relative z-10 flex h-full min-w-0 items-center justify-center gap-1.5 transition-colors duration-150 motion-reduce:transition-none",
                  isFirst ? "pl-3" : "pl-[calc(var(--stage-n)+0.25rem)]",
                  isLast ? "pr-3" : "pr-[calc(var(--stage-n)+0.25rem)]",
                  TEXT[state],
                  busy && "opacity-70",
                )}
              >
                {busy ? <IconSpinner size={metrics.icon} className="shrink-0" /> : showCheck ? <IconCheck size={metrics.icon} strokeWidth={2.25} className="shrink-0" /> : null}
                {state === "upcoming" && !grows ? <span className="hidden text-xs font-medium tabular-nums @max-md:inline">{position + 1}</span> : null}
                <span className={cn("grid min-w-0 text-center leading-tight font-medium", !grows && "@max-md:hidden")}>
                  <span className="truncate">{stage.label}</span>
                  {stage.date ? <span className="truncate text-[0.6875rem] font-normal opacity-80">{stage.date}</span> : null}
                </span>
              </span>
              <span className="sr-only">{name}</span>
            </>
          );
          const shape = cn(
            "group/stage pointer-events-auto relative block h-(--stage-h) w-full min-w-0 text-left outline-none select-none [--edge:1px]",
            isFirst && "rounded-l-lg",
            isLast && "rounded-r-lg",
            EDGE[state],
          );
          return (
            <li
              key={stage.id}
              // The boxes of neighbours overlap where a point sits in a notch; only the clipped shapes inside take the pointer.
              // Paint containment makes the browser lay each chevron on whole pixels, so its hairlines on top and bottom are as crisp as each other wherever the page puts the path: at a half pixel they smear into two soft rows.
              className={cn("pointer-events-none flex min-w-0 [contain:paint]", !isFirst && "ml-[calc(var(--stage-gap)-var(--stage-n))]", grows ? "flex-1" : "flex-1 @max-md:w-[calc(var(--stage-n)*2+0.75rem)] @max-md:flex-none")}
            >
              {asButton ? (
                <button
                  type="button"
                  data-act="true"
                  data-state={state}
                  title={stage.note}
                  aria-disabled={pending ? true : undefined}
                  onClick={() => go(stage.id)}
                  className={cn(shape, "cursor-pointer focus-visible:bg-ring focus-visible:[--edge:2px] aria-disabled:cursor-progress")}
                  style={{ clipPath: outer }}
                >
                  {body}
                </button>
              ) : (
                <div
                  data-state={state}
                  data-here={here || undefined}
                  tabIndex={here ? -1 : undefined}
                  title={stage.note}
                  aria-current={state === "current" ? "step" : undefined}
                  className={cn(shape, here && "[--stage-ring:2px] focus-visible:bg-ring focus-visible:[--edge:4px]")}
                  style={{ clipPath: outer }}
                >
                  {body}
                </div>
              )}
            </li>
          );
        })}
        {lostLabel ? (
          <li className="pointer-events-none ml-3 flex flex-none @max-xs:mt-2 @max-xs:ml-0 @max-xs:basis-full">
            {(() => {
              const name = fill(words.outcome, { label: lostLabel });
              const look = cn(
                "pointer-events-auto inline-flex h-(--stage-h) items-center justify-center gap-1.5 rounded-lg border px-3 font-medium whitespace-nowrap outline-none select-none @max-md:w-(--stage-h) @max-md:px-0 @max-xs:w-full @max-xs:px-3",
                "transition-colors duration-150 motion-reduce:transition-none",
                lost ? "border-transparent bg-destructive text-destructive-foreground" : "border-destructive/35 bg-background text-destructive",
              );
              return interactive && !lost ? (
                <button
                  type="button"
                  aria-label={name}
                  aria-disabled={pending ? true : undefined}
                  onClick={() => go("lost")}
                  className={cn(look, "cursor-pointer hover:bg-destructive/8 focus-visible:ring-[3px] focus-visible:ring-destructive/30 aria-disabled:cursor-progress")}
                >
                  {pending === "lost" ? <IconSpinner size={metrics.icon} className="shrink-0" /> : <IconXCircle size={metrics.icon} className="shrink-0" />}
                  <span className="@max-md:hidden @max-xs:inline">{lostLabel}</span>
                </button>
              ) : (
                <span
                  data-here={(lost && interactive) || undefined}
                  tabIndex={lost && interactive ? -1 : undefined}
                  aria-current={lost ? "step" : undefined}
                  className={cn(look, lost && interactive && "focus-visible:ring-[3px] focus-visible:ring-destructive/30")}
                >
                  <IconXCircle size={metrics.icon} className="shrink-0" />
                  <span aria-hidden="true" className="@max-md:hidden @max-xs:inline">
                    {lostLabel}
                  </span>
                  <span className="sr-only">{lost ? `${name}, ${words.current}` : name}</span>
                </span>
              );
            })()}
          </li>
        ) : null}
      </ol>
      {note ? (
        <p className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{stages[index]?.label}</span>
          <span aria-hidden="true"> · </span>
          <span className="sr-only">: </span>
          {note}
        </p>
      ) : null}
      <span role="status" className="sr-only">
        {said}
      </span>
    </div>
  );
}
