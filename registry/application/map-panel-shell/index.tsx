"use client";

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type ComponentProps, type KeyboardEvent, type PointerEvent, type ReactNode, type RefObject } from "react";

import { clamp, SNAPS, settleSnap, snapHeights, stepSnap, type MapPanelSnap } from "@rhs-ui/application/map-panel-shell/snap";
import { IconChevronDown, IconChevronLeft, IconChevronUp, IconList } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { ScrollArea } from "@rhs-ui/primitives/scroll-area";
import { cn } from "@/lib/utils";

export type { MapPanelSnap };

export interface MapPanelShellLabels {
  /** The panel's name: its landmark and the word in the buttons. Default "Results". */
  panel?: string;
  /** Brings the panel back after it was hidden. Default "Show results". */
  show?: string;
  /** Hides the panel on a wide screen. Default "Hide results". */
  hide?: string;
  /** Raises the sheet one step on a phone. Default "Show more results". */
  expand?: string;
  /** Lowers it from full. Default "Show fewer results". */
  collapse?: string;
  /** The grab handle's name. Default "Resize results". */
  resize?: string;
  /** The handle's value in words, per snap. Default Peek, Half and Full. */
  snaps?: Partial<Record<MapPanelSnap, string>>;
}

export interface MapPanelShellProps extends Omit<ComponentProps<"div">, "children"> {
  /** The map, or any view: it fills the whole shell and keeps taking pointer input around the panel. The block draws no map and loads nothing, so the provider is yours. */
  canvas: ReactNode;
  /** The results: a list of places, drivers, properties. It scrolls inside the panel. */
  panel: ReactNode;
  /** The top of the panel, and the only part of the sheet that shows when a phone is peeking: a search field in a 2.25rem-high row, or a headline. Focusing it on a phone lifts a peeking sheet to half. */
  search?: ReactNode;
  /** A row of filters under the search: toggle chips, a few buttons. On the card it wraps onto a second row when it does not fit; on a phone it scrolls sideways, and fades at the edge that has more to see. */
  filters?: ReactNode;
  /** Zoom, layers and the like, pinned to the top end (the right) of the map. On a phone they fold away while the sheet is at full height, and return when it is lowered. */
  controls?: ReactNode;
  /** Whether the panel is shown. Leave it out to let the shell keep it, and use `defaultOpen`. */
  open?: boolean;
  /** Whether the panel starts shown when the shell keeps it. Default true. */
  defaultOpen?: boolean;
  /** The panel was hidden or shown from inside the shell. A hidden panel leaves a "Show results" button on the map. */
  onOpenChange?: (open: boolean) => void;
  /** The height of the sheet on a phone: `peek`, `half` or `full`. Leave it out to let the shell keep it, and use `defaultSnap`. It has no effect on a wide screen. */
  snap?: MapPanelSnap;
  /** The snap the sheet starts at when the shell keeps it. Default "half". */
  defaultSnap?: MapPanelSnap;
  /** The sheet settled on a snap: by dragging, by the arrow keys on its handle or by the button. */
  onSnapChange?: (snap: MapPanelSnap) => void;
  /** The words the shell uses, for translation. */
  labels?: MapPanelShellLabels;
}

interface Drag {
  startY: number;
  startHeight: number;
  heights: Record<MapPanelSnap, number>;
  samples: { time: number; y: number }[];
  moved: boolean;
}

const useBrowserLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

/** The widest a fade at the end of the filters gets, in px: the width of what is still left to scroll in that direction, up to this much. */
const FADE = 24;

/**
 * Softens the ends of a row that scrolls sideways, only where there is more to
 * see: it writes how far the row can still go each way, up to FADE, into two
 * custom properties that the row's mask reads. A row that fits has no fade, and
 * the end of a row that has been scrolled to its end has none either, so nothing
 * is ever covered. It looks again when the row, a chip or the list of chips changes.
 */
function useEdgeFade(ref: RefObject<HTMLElement | null>, active: boolean) {
  useBrowserLayoutEffect(() => {
    const element = ref.current;
    if (!element || !active) return;
    const measure = () => {
      const position = Math.abs(element.scrollLeft);
      const left = Math.max(0, element.scrollWidth - element.clientWidth - position);
      element.style.setProperty("--fade-start", `${Math.min(FADE, Math.max(0, position - 1))}px`);
      element.style.setProperty("--fade-end", `${Math.min(FADE, Math.max(0, left - 1))}px`);
    };
    const resize = new ResizeObserver(measure);
    const watch = () => {
      resize.disconnect();
      resize.observe(element);
      for (const child of Array.from(element.children)) resize.observe(child);
      measure();
    };
    const mutation = new MutationObserver(watch);
    mutation.observe(element, { childList: true });
    element.addEventListener("scroll", measure, { passive: true });
    watch();
    return () => {
      resize.disconnect();
      mutation.disconnect();
      element.removeEventListener("scroll", measure);
    };
  }, [ref, active]);
}

/** The row of filters: on a phone it scrolls sideways, with the mask fading the ends that have more to see; on the card it wraps, so nothing is cut and nothing fades. The mask reads its direction from a variable, so a mirrored layout flips it and the card can still switch it off. */
const FILTERS = cn(
  "relative flex items-center gap-2 overflow-x-auto px-3 pt-1 pb-3 [scrollbar-width:none]",
  "[--fade-dir:to_right] rtl:[--fade-dir:to_left] [mask-image:linear-gradient(var(--fade-dir),transparent,#000_var(--fade-start,0px),#000_calc(100%-var(--fade-end,0px)),transparent)]",
  "@3xl:flex-wrap @3xl:overflow-visible @3xl:[mask-image:none]",
);

const PANEL = cn(
  "group/panel absolute z-20 flex min-h-0 flex-col border border-border bg-card text-card-foreground shadow-sm outline-none",
  // On a phone the panel is a sheet along the bottom edge, as high as its snap says.
  "inset-x-0 bottom-0 h-(--sheet-height) rounded-t-2xl border-b-0 transition-[height,translate] duration-300 ease-out motion-reduce:transition-none",
  "data-[snap=peek]:[--sheet-height:calc(4.5rem+env(safe-area-inset-bottom,0px))] data-[snap=half]:[--sheet-height:50%] data-[snap=full]:[--sheet-height:calc(100%-3.5rem)]",
  "data-[dragging=true]:transition-none data-[state=closed]:translate-y-full",
  // From 48rem it floats at the start (the left) as a 24rem card, and slides out toward that edge.
  "[--slide:-1] rtl:[--slide:1]",
  "@3xl:inset-x-auto @3xl:start-4 @3xl:top-4 @3xl:bottom-4 @3xl:h-auto @3xl:w-96 @3xl:rounded-xl @3xl:border-b",
  // Far enough to take the tab on its edge along: the card's margin (1rem) plus the tab that hangs 1rem outside it, and a little more.
  "@3xl:data-[state=closed]:translate-y-0 @3xl:data-[state=closed]:translate-x-[calc((100%+2.5rem)*var(--slide))]",
);

/**
 * A full-bleed map, or any view, with a panel for search and results over it.
 * On a wide screen the panel floats at the start (the left) as a 24rem card with a tab on
 * its edge that hides it, and the map keeps all the room; controls for zoom and
 * layers sit at the opposite corner. On a phone the same panel is a bottom sheet with
 * three snap heights, peek, half and full, that you move by dragging its handle,
 * with the arrow keys on the handle, or with the button beside the search, and
 * the map above it stays live: nothing dims it and nothing traps focus. At peek
 * only the search shows, and the rest steps out of the tab order until the
 * sheet is raised. For the keyboard and for screen readers the panel comes
 * first, then the controls, then the map. The block draws no map and loads
 * nothing, so you choose the provider. It suits store finders, delivery tracking
 * and property search, and it fills its container: it is as tall as the
 * viewport unless you give it a height.
 */
export function MapPanelShell({
  canvas,
  panel,
  search,
  filters,
  controls,
  open: openProp,
  defaultOpen = true,
  onOpenChange,
  snap: snapProp,
  defaultSnap = "half",
  onSnapChange,
  labels,
  className,
  ref,
  ...props
}: MapPanelShellProps) {
  const text = { panel: "Results", show: "Show results", hide: "Hide results", expand: "Show more results", collapse: "Show fewer results", resize: "Resize results", ...labels };
  const words = { peek: "Peek", half: "Half", full: "Full", ...labels?.snaps };
  const listId = useId();
  const root = useRef<HTMLDivElement | null>(null);
  const sheet = useRef<HTMLElement>(null);
  const pill = useRef<HTMLButtonElement>(null);
  const filterRow = useRef<HTMLDivElement>(null);
  const focusAfter = useRef<"panel" | "pill" | null>(null);
  const drag = useRef<Drag | null>(null);
  const [ownOpen, setOwnOpen] = useState(defaultOpen);
  const [ownSnap, setOwnSnap] = useState<MapPanelSnap>(defaultSnap);
  const [dragHeight, setDragHeight] = useState<number | null>(null);
  const [narrow, setNarrow] = useState(false);

  const open = openProp ?? ownOpen;
  const snap = snapProp ?? ownSnap;
  // Only a sheet that is peeking hides what it holds from the keyboard; on a wide screen nothing is ever hidden.
  const peeking = narrow && snap === "peek";
  // At full height the sheet reaches up under the controls: they fold away, and come back when the sheet is lowered.
  const folded = narrow && open && snap === "full";

  const rem = () => Number.parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;

  useEdgeFade(filterRow, Boolean(filters));

  // The shell measures itself, and a ref you pass still gets the element.
  const attach = useCallback(
    (element: HTMLDivElement | null) => {
      root.current = element;
      if (typeof ref === "function") ref(element);
      else if (ref) ref.current = element;
    },
    [ref],
  );

  // Whether the shell is narrower than 48rem, the width where the card takes over from the sheet.
  useBrowserLayoutEffect(() => {
    const element = root.current;
    if (!element) return;
    const measure = () => setNarrow(element.clientWidth < 48 * rem());
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  // A button that was pressed disappears with its panel or its pill: focus moves to the one that takes its place.
  useEffect(() => {
    const target = focusAfter.current;
    focusAfter.current = null;
    if (target === "panel" && open) sheet.current?.focus({ preventScroll: true });
    if (target === "pill" && !open) pill.current?.focus({ preventScroll: true });
  }, [open]);

  function setOpen(next: boolean, focus: "panel" | "pill") {
    focusAfter.current = focus;
    if (openProp === undefined) setOwnOpen(next);
    onOpenChange?.(next);
  }

  function setSnap(next: MapPanelSnap) {
    if (next === snap) return;
    if (snapProp === undefined) setOwnSnap(next);
    onSnapChange?.(next);
  }

  function down(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    const map = root.current;
    const element = sheet.current;
    if (!map || !element) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = {
      startY: event.clientY,
      startHeight: element.getBoundingClientRect().height,
      heights: snapHeights(map.clientHeight, rem()),
      samples: [{ time: event.timeStamp, y: event.clientY }],
      moved: false,
    };
  }

  function move(event: PointerEvent<HTMLDivElement>) {
    const current = drag.current;
    if (!current) return;
    if (Math.abs(event.clientY - current.startY) > 3) current.moved = true;
    if (!current.moved) return;
    current.samples = [...current.samples.slice(-4), { time: event.timeStamp, y: event.clientY }];
    setDragHeight(clamp(current.startHeight + (current.startY - event.clientY), current.heights.peek, current.heights.full));
  }

  function up(event: PointerEvent<HTMLDivElement>) {
    const current = drag.current;
    if (!current) return;
    drag.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    setDragHeight(null);
    // A tap on the handle moves one step, and from the top back to the bottom.
    if (!current.moved) {
      setSnap(snap === "full" ? "peek" : stepSnap(snap, 1));
      return;
    }
    const first = current.samples[0];
    const last = current.samples[current.samples.length - 1];
    const velocity = first && last && last.time > first.time ? (first.y - last.y) / (last.time - first.time) : 0;
    const height = clamp(current.startHeight + (current.startY - event.clientY), current.heights.peek, current.heights.full);
    setSnap(settleSnap(height, velocity, current.heights));
  }

  function key(event: KeyboardEvent<HTMLDivElement>) {
    const next = event.key === "ArrowUp" ? stepSnap(snap, 1) : event.key === "ArrowDown" ? stepSnap(snap, -1) : event.key === "Home" ? "peek" : event.key === "End" ? "full" : event.key === "Enter" || event.key === " " ? (snap === "full" ? "peek" : stepSnap(snap, 1)) : null;
    if (!next) return;
    event.preventDefault();
    setSnap(next);
  }

  return (
    <div ref={attach} data-slot="map-panel-shell" className={cn("@container relative isolate h-dvh min-w-0 overflow-hidden bg-muted text-foreground", className)} {...props}>
      {/* The order here is the order of the keyboard and of a screen reader: the panel, then the controls, then the map. Where each sits on the screen is the classes' business. */}
      <section
        ref={sheet}
        aria-label={text.panel}
        tabIndex={-1}
        inert={!open}
        data-slot="map-panel-shell-panel"
        data-state={open ? "open" : "closed"}
        data-snap={snap}
        data-dragging={dragHeight !== null ? "true" : undefined}
        style={dragHeight !== null ? { height: dragHeight } : undefined}
        className={PANEL}
      >
        <div className="shrink-0 border-b border-border">
          <div
            role="separator"
            tabIndex={0}
            aria-orientation="horizontal"
            aria-controls={listId}
            aria-label={text.resize}
            aria-valuemin={0}
            aria-valuemax={SNAPS.length - 1}
            aria-valuenow={SNAPS.indexOf(snap)}
            aria-valuetext={words[snap]}
            onPointerDown={down}
            onPointerMove={move}
            onPointerUp={up}
            onPointerCancel={up}
            onKeyDown={key}
            className="group/grab flex h-6 cursor-grab items-center justify-center rounded-t-2xl outline-none [touch-action:none] focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-ring/40 active:cursor-grabbing @3xl:hidden"
          >
            <span aria-hidden="true" className="h-1 w-9 rounded-full bg-muted-foreground/40 transition-colors duration-150 group-hover/grab:bg-muted-foreground/70 motion-reduce:transition-none" />
          </div>
          <div className="flex items-center gap-2 px-3 pb-3 @3xl:pt-3">
            <div
              className="min-w-0 flex-1"
              onFocusCapture={() => {
                // A search field wants the results under it: a peeking sheet lifts to half the moment it is used.
                if (narrow && snap === "peek") setSnap("half");
              }}
            >
              {search}
            </div>
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label={snap === "full" ? text.collapse : text.expand}
              aria-controls={listId}
              onClick={() => setSnap(snap === "full" ? "half" : stepSnap(snap, 1))}
              className="shrink-0 @3xl:hidden"
            >
              {snap === "full" ? <IconChevronDown /> : <IconChevronUp />}
            </Button>
          </div>
          {filters ? (
            <div ref={filterRow} data-slot="map-panel-shell-filters" inert={peeking} className={FILTERS}>
              {filters}
            </div>
          ) : null}
        </div>

        <ScrollArea id={listId} inert={peeking} className="min-h-0 flex-1 [&>[data-slot=scroll-area-viewport]]:overscroll-contain [&>[data-slot=scroll-area-viewport]>div]:block!">
          <div className="pb-[env(safe-area-inset-bottom)]">{panel}</div>
        </ScrollArea>

        <button
          type="button"
          aria-label={text.hide}
          aria-expanded={open}
          onClick={() => setOpen(false, "pill")}
          className="absolute start-full top-1/2 z-10 hidden h-14 w-4 -translate-y-1/2 items-center justify-center rounded-e-md border border-s-0 border-border bg-card text-muted-foreground shadow-xs transition-[color,visibility] duration-150 outline-none group-data-[state=closed]/panel:invisible group-data-[state=closed]/panel:delay-150 hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40 motion-reduce:transition-none @3xl:flex"
        >
          <IconChevronLeft className="size-3.5 rtl:-scale-x-100" />
        </button>
      </section>

      {!open ? (
        <Button
          ref={pill}
          type="button"
          variant="outline"
          onClick={() => setOpen(true, "panel")}
          className="absolute inset-x-0 bottom-[calc(1rem+env(safe-area-inset-bottom,0px))] z-20 mx-auto w-fit bg-card shadow-sm hover:bg-muted @3xl:inset-x-auto @3xl:start-4 @3xl:top-4 @3xl:bottom-auto @3xl:mx-0"
        >
          <IconList />
          {text.show}
        </Button>
      ) : null}

      {controls ? (
        <div
          data-slot="map-panel-shell-controls"
          inert={folded}
          className={cn("absolute end-3 top-3 z-10 flex flex-col items-end gap-2 transition-opacity duration-200 motion-reduce:transition-none", folded && "opacity-0")}
        >
          {controls}
        </div>
      ) : null}

      <div data-slot="map-panel-shell-canvas" className="absolute inset-0">
        {canvas}
      </div>
    </div>
  );
}
