"use client";

import { createContext, useCallback, useContext, useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type ComponentProps, type ReactNode } from "react";

import { IconChevronLeft, IconChevronRight } from "@rhs-ui/icons";
import { DEFAULT_LABELS, clean, fill, reconcile, type Entry, type ViewDefinition, type ViewRegistry, type ViewStackLabels } from "@rhs-ui/application/view-stack/stack";
import { Button } from "@rhs-ui/primitives/button";
import { cn } from "@/lib/utils";

export type { ViewDefinition, ViewRegistry, ViewStackLabels } from "@rhs-ui/application/view-stack/stack";

/** What a view can do with the stack it is in, from `useViewStack()`. */
export interface ViewStackApi {
  /** The ids of the views that are open, root first. */
  stack: readonly string[];
  /** The id of the view on top. */
  current: string;
  /** Opens a view on top. Pass the element that was pressed so focus returns to it on Back; without one it is the element that has focus. */
  push: (id: string, opener?: Element | null) => void;
  /** Closes the view on top, or `count` views. The root stays. */
  pop: (count?: number) => void;
  /** Closes everything above the root. */
  reset: () => void;
}

const ViewStackContext = createContext<ViewStackApi | null>(null);

/** The stack the calling view is in: push and pop from a button, a form that was saved, a link. */
export function useViewStack(): ViewStackApi {
  const api = useContext(ViewStackContext);
  if (!api) throw new Error("useViewStack must be used inside a <ViewStack>.");
  return api;
}

const useBrowserLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

/** How long a view takes to slide, and a little more: when a view that was closed is removed from the page. */
const LEAVE_MS = 360;

export interface ViewStackProps extends Omit<ComponentProps<"div">, "children" | "defaultValue" | "onChange"> {
  /** The views, by id: `{ settings: { title: "Settings", content: … }, email: { … } }`. The first is the root. */
  views: ViewRegistry;
  /** The ids of the open views, root first, when you control the stack. Pair it with `onStackChange`. */
  stack?: readonly string[];
  /** The ids of the open views at the start, when the stack keeps them itself. Default the root alone. */
  defaultStack?: readonly string[];
  /** The stack changed through a push, a pop or Back, with the ids that are open now. */
  onStackChange?: (stack: string[]) => void;
  /** The level of the headings: 2 (the default), 3 or 4, so they fit the page they are in. */
  headingLevel?: 2 | 3 | 4;
  /** The words the stack says, for translation. */
  labels?: ViewStackLabels;
}

/**
 * A navigation stack for small spaces: a menu that leads to submenus without
 * opening more layers, as in the settings of a phone, inside a popover, a sheet
 * or a card. Every view has a title; one that sits above another shows a Back
 * button named after the title it returns to. A view pushed on top slides in
 * from the side (the views cross-fade under reduced motion), focus moves to its
 * heading, and on Back it returns to the row that opened it. The views below
 * stay mounted but are inert, so a screen reader and the Tab key only meet the
 * one on top, and the height of the stack follows the view on top, so a popover
 * resizes instead of jumping. Views push and pop through `useViewStack()`, or
 * with `ViewStackRow`; keep the stack yourself with `stack` and `onStackChange`.
 */
export function ViewStack({ views, stack: controlled, defaultStack, onStackChange, headingLevel = 2, labels, className, style, ...props }: ViewStackProps) {
  const words = { ...DEFAULT_LABELS, ...labels };
  const base = useId();
  const [own, setOwn] = useState<readonly string[]>(defaultStack ?? []);
  const stack = clean(controlled ?? own, views);
  const stackKey = stack.join("\u0000");

  // What is drawn: the open views, and the ones that were just closed and are still sliding away.
  const counter = useRef(0);
  const nextUid = () => counter.current++;
  const [trail, setTrail] = useState<Entry[]>(() => stack.map((id, level) => ({ uid: counter.current++, id, level, leaving: false, enter: "none" })));
  const [seen, setSeen] = useState(stackKey);
  if (seen !== stackKey) {
    setSeen(stackKey);
    setTrail((previous) => reconcile(previous, stack, nextUid));
  }

  // A view that has slid away is taken out of the page.
  useEffect(() => {
    if (!trail.some((entry) => entry.leaving)) return;
    const timer = window.setTimeout(() => setTrail((previous) => previous.filter((entry) => !entry.leaving)), LEAVE_MS);
    return () => window.clearTimeout(timer);
  }, [trail]);

  const top = trail.filter((entry) => !entry.leaving).at(-1);
  const root = useRef<HTMLDivElement>(null);
  const topElement = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number>();

  // The height follows the view on top: measured before the browser paints, and again when what it holds changes size.
  useBrowserLayoutEffect(() => {
    const element = topElement.current;
    if (!element) return;
    const measure = () => setHeight(Math.ceil(element.getBoundingClientRect().height));
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [top?.uid]);

  // Focus follows a push or a pop that the stack's own API made: to the new view's heading, or back to the row that opened the view that closed.
  const expected = useRef<string | null>(null);
  const openers = useRef(new Map<number, Element>());
  const before = useRef(stack);
  useBrowserLayoutEffect(() => {
    const previous = before.current;
    before.current = stack;
    if (expected.current !== stackKey) return;
    expected.current = null;
    const heading = root.current?.querySelector<HTMLElement>('[data-state="active"] [data-view-heading]');
    const shrank = stack.length < previous.length && stack.every((id, at) => previous[at] === id);
    const opener = shrank ? openers.current.get(stack.length) : undefined;
    for (const level of [...openers.current.keys()]) if (level >= stack.length) openers.current.delete(level);
    const target = opener instanceof HTMLElement && opener.isConnected && root.current?.contains(opener) ? opener : heading;
    target?.focus({ preventScroll: true });
  }, [stackKey]);

  const commit = useCallback(
    (next: string[]) => {
      expected.current = next.join("\u0000");
      if (controlled === undefined) setOwn(next);
      onStackChange?.(next);
    },
    [controlled, onStackChange],
  );

  const api = useMemo<ViewStackApi>(
    () => ({
      stack,
      current: stack[stack.length - 1] ?? "",
      push: (id, opener) => {
        if (!Object.hasOwn(views, id)) return;
        const from = opener ?? (document.activeElement !== document.body ? document.activeElement : null);
        if (from) openers.current.set(stack.length, from);
        commit([...stack, id]);
      },
      pop: (count = 1) => {
        if (stack.length > 1) commit(stack.slice(0, Math.max(1, stack.length - Math.max(1, count))));
      },
      reset: () => {
        if (stack.length > 1) commit(stack.slice(0, 1));
      },
    }),
    [stackKey, views, commit],
  );

  const Heading = `h${headingLevel}` as "h2" | "h3" | "h4";

  return (
    <ViewStackContext.Provider value={api}>
      <div
        ref={root}
        data-slot="view-stack"
        data-depth={stack.length}
        className={cn("relative grid min-w-0 overflow-hidden bg-inherit transition-[height] duration-[280ms] ease-[cubic-bezier(0.2,0.7,0.2,1)] motion-reduce:transition-none", className)}
        style={{ ...style, height }}
        {...props}
      >
        {trail.map((entry) => {
          const view = views[entry.id];
          if (!view) return null;
          const state = entry.leaving ? "leaving" : entry.uid === top?.uid ? "active" : "covered";
          // The title of the view below, for the Back button. A view that is leaving keeps its button, so the header does not change height as it slides out.
          const returnsTo = entry.level > 0 ? views[stack[entry.level - 1] ?? stack[stack.length - 1] ?? ""] : undefined;
          return (
            <div
              key={entry.uid}
              ref={state === "active" ? topElement : undefined}
              role="group"
              aria-labelledby={`${base}-${entry.uid}`}
              data-slot="view-stack-view"
              data-state={state}
              inert={state !== "active"}
              className={cn(
                "relative col-start-1 row-start-1 flex max-h-[inherit] min-w-0 flex-col self-start overflow-y-auto overscroll-contain bg-inherit",
                "transition-[translate,opacity] duration-[280ms] ease-[cubic-bezier(0.2,0.7,0.2,1)] motion-reduce:duration-150",
                state === "active" && "translate-x-0 opacity-100",
                state === "covered" && "pointer-events-none -translate-x-1/4 opacity-0 motion-reduce:translate-x-0",
                state === "leaving" && "pointer-events-none translate-x-full opacity-0 motion-reduce:translate-x-0",
                entry.enter === "forward" && "motion-safe:animate-rhs-view-in motion-reduce:animate-rhs-view-fade",
                entry.enter === "fade" && "animate-rhs-view-fade",
              )}
            >
              <div data-slot="view-stack-header" className="sticky top-0 z-10 flex shrink-0 flex-col items-start gap-0.5 bg-inherit px-4 pt-3 pb-2">
                {returnsTo ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    aria-label={fill(words.back, { title: returnsTo.title })}
                    onClick={() => api.pop()}
                    className="-ml-2.5 h-7 max-w-full gap-1 px-2 text-[0.8125rem] font-normal text-muted-foreground hover:text-foreground"
                  >
                    <IconChevronLeft aria-hidden="true" className="-ml-0.5 size-3.5" />
                    <span className="truncate">{returnsTo.title}</span>
                  </Button>
                ) : null}
                <Heading id={`${base}-${entry.uid}`} tabIndex={-1} data-view-heading="" className="max-w-full truncate text-base leading-7 font-semibold tracking-[-0.02em] outline-none">
                  {view.title}
                </Heading>
              </div>
              <div data-slot="view-stack-content" className="min-h-0 px-2 pb-2">
                {view.content}
              </div>
            </div>
          );
        })}
      </div>
    </ViewStackContext.Provider>
  );
}

export interface ViewStackRowProps extends Omit<ComponentProps<"button">, "children"> {
  /** The id of the view the row opens. */
  to: string;
  /** An icon at the start of the row. */
  icon?: ReactNode;
  /** What is chosen now, muted at the end of the row: "Daily digest". */
  detail?: ReactNode;
  /** What the row is called. */
  children: ReactNode;
}

/**
 * A row that opens a view: an icon, a name, what is set today and a chevron,
 * the way a settings list reads. It pushes `to` onto the stack it is in, and
 * is the element focus returns to when someone comes Back.
 */
export function ViewStackRow({ to, icon, detail, children, className, onClick, ...props }: ViewStackRowProps) {
  const { push } = useViewStack();
  return (
    <button
      type="button"
      data-slot="view-stack-row"
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) push(to, event.currentTarget);
      }}
      className={cn(
        "flex min-h-11 w-full items-center gap-3 rounded-md px-2.5 py-2 text-left text-sm outline-none transition-colors duration-150",
        "hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/40 [&_svg]:shrink-0",
        className,
      )}
      {...props}
    >
      {icon ? <span aria-hidden="true" className="grid size-8 shrink-0 place-items-center rounded-md bg-muted text-foreground [&_svg]:size-4">{icon}</span> : null}
      <span className="min-w-0 flex-1 truncate font-medium">{children}</span>
      {detail ? <span className="min-w-0 max-w-[45%] truncate text-xs text-muted-foreground">{detail}</span> : null}
      <IconChevronRight aria-hidden="true" className="size-4 text-muted-foreground" />
    </button>
  );
}
