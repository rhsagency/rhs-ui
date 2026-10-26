"use client";

import { memo, useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type ComponentProps, type ReactNode, type RefObject } from "react";
import { createPortal } from "react-dom";

import { WorkbenchHandle, type HandleState } from "@rhs-ui/application/workbench-shell/handle";
import { BESIDE_REM, HANDLE, fitLayout, maxWidth, resolveLayout, resolveMins, sameLayout, type WorkbenchLayout, type WorkbenchMinSizes, type WorkbenchPanel } from "@rhs-ui/application/workbench-shell/layout";
import { IconSidebar, IconSidebarRight } from "@rhs-ui/icons";
import { IconButton, IconButtonProvider } from "@rhs-ui/primitives/icon-button";
import { ScrollArea } from "@rhs-ui/primitives/scroll-area";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@rhs-ui/primitives/sheet";
import { cn } from "@/lib/utils";

export type { WorkbenchLayout, WorkbenchMinSizes, WorkbenchPanel };

export interface WorkbenchShellLabels {
  /** The explorer's name: its landmark, its sheet's title, and the word in the toggle's name. Default "Explorer". */
  explorer?: string;
  /** The inspector's name. Default "Inspector". */
  inspector?: string;
  /** The canvas region's name. Default "Canvas". */
  canvas?: string;
  /** The status bar's name. Default "Status bar". */
  status?: string;
  /** A toggle while its panel is shown. `{panel}` is the panel's name in lower case. Default "Hide {panel}". */
  hide?: string;
  /** A toggle while its panel is collapsed. Default "Show {panel}". */
  show?: string;
  /** A toggle below lg, where the panel opens as a sheet. Default "Open {panel}". */
  open?: string;
  /** The drag handle's name. Default "Resize {panel}". */
  resize?: string;
  /** What a handle reads out for a collapsed panel. Default "Collapsed". */
  collapsed?: string;
  /** What a handle reads out for an open one. `{width}` is the width in px. Default "{width} pixels wide". */
  width?: string;
  /** What a sheet says it holds, for screen readers. Default "The {panel} panel. Press Escape to close.". */
  sheet?: string;
}

export interface WorkbenchShellProps extends Omit<ComponentProps<"div">, "children"> {
  /** The bar across the top: tabs, tools, a title. It sits between the two panel toggles and scrolls sideways when it does not fit. */
  toolbar?: ReactNode;
  /** The panel at the start (the left): a file tree, layers, pages. It scrolls on its own. Leave it out for a workbench without one. */
  explorer?: ReactNode;
  /** The work itself: the editor, the artboard, the document. It takes the room that is left, scrolls on its own and can never be pushed out by wide content. */
  canvas: ReactNode;
  /** The panel at the end (the right): properties, an outline, comments. It scrolls on its own. Leave it out for a workbench without one. */
  inspector?: ReactNode;
  /** A 28px strip along the bottom for small facts: the branch, the cursor position, a save state. It scrolls sideways on a phone. */
  status?: ReactNode;
  /** The starting layout: the widths in px, and which panels start collapsed. The same shape `onSizesChange` hands you, so a saved layout can go straight back in. Default 260 and 320. */
  defaultSizes?: Partial<Omit<WorkbenchLayout, "collapsed">> & { collapsed?: Partial<WorkbenchLayout["collapsed"]> };
  /** The layout when you keep it yourself. Update it from `onSizesChange`. */
  sizes?: WorkbenchLayout;
  /** The width of the shell in rem from which the panels sit beside the canvas; below it they are sheets opened from the toolbar. Default 64 (lg). It is never less than what the panels' minimums and the canvas minimum need together, so the canvas never gets squeezed. Below it the panels are also hidden by CSS before the script has run, so a narrow screen never paints a squeezed layout first. */
  breakpoint?: number;
  /** The least width of the panels, and of the canvas, in px. A panel can be dragged down to its minimum; dragging further collapses it. */
  minSizes?: WorkbenchMinSizes;
  /** The layout changed: a drag was released, a key was pressed, a panel was collapsed or opened. Persist it here. It is not called on every pixel of a drag, nor when a gesture ends where it began. */
  onSizesChange?: (layout: WorkbenchLayout) => void;
  /** The words the shell uses, for translation. */
  labels?: WorkbenchShellLabels;
}

interface Frame {
  /** The shell is wide enough for the panels to sit beside the canvas. */
  beside: boolean;
  /** The layout is mirrored, so the explorer is on the right. */
  rtl: boolean;
  /** The width of the row of panels in px, or null before it is measured. */
  width: number | null;
}

const useBrowserLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

const fill = (template: string, panel: string) => template.replace("{panel}", panel);

/**
 * Whether an element has more to show than it has room for, so that it can be
 * given a tab stop and a keyboard can scroll it. It is measured with every
 * render, whenever the element or one of its children changes size, and when
 * children come and go.
 */
function useOverflows(ref: RefObject<HTMLElement | null>): boolean {
  const [overflows, setOverflows] = useState(false);
  const measure = useRef<() => void>(() => undefined);
  useBrowserLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    measure.current = () => setOverflows(element.scrollWidth > element.clientWidth + 1 || element.scrollHeight > element.clientHeight + 1);
    const resize = new ResizeObserver(() => measure.current());
    const watch = () => {
      resize.disconnect();
      resize.observe(element);
      for (const child of Array.from(element.children)) resize.observe(child);
      measure.current();
    };
    const mutation = new MutationObserver(watch);
    mutation.observe(element, { childList: true });
    watch();
    return () => {
      resize.disconnect();
      mutation.disconnect();
    };
  }, [ref]);
  // What is inside can change without its box changing: the facts in a status bar are text.
  useBrowserLayoutEffect(() => measure.current());
  return overflows;
}

type PanelHosts = Record<WorkbenchPanel, HTMLElement>;

/**
 * One element per panel for the panel's content to be drawn into through a portal.
 * The element is moved between the panel at the side and its sheet, so the
 * content is never remounted: a field keeps what was typed and a tree keeps its
 * open folders when a sheet closes or when the shell crosses its breakpoint. The
 * elements are made once the browser is there; until then the content is drawn
 * in place, which is what the server sends.
 */
function usePanelHosts(): PanelHosts | null {
  const [hosts, setHosts] = useState<PanelHosts | null>(null);
  useBrowserLayoutEffect(() => {
    const make = (panel: WorkbenchPanel) => {
      const element = document.createElement("div");
      element.className = "contents";
      element.dataset.slot = `workbench-shell-${panel}-content`;
      return element;
    };
    const made = { explorer: make("explorer"), inspector: make("inspector") };
    setHosts(made);
    return () => {
      made.explorer.remove();
      made.inspector.remove();
    };
  }, []);
  return hosts;
}

/** A ref for the element that shows a panel (the side panel, or its sheet's body): it takes the panel's host in when it appears. */
function usePlace(host: HTMLElement | null) {
  return useCallback(
    (slot: HTMLElement | null) => {
      if (slot && host && host.parentElement !== slot) slot.appendChild(host);
    },
    [host],
  );
}

/** The strip along the bottom. It scrolls sideways when its facts do not fit, and then it is a tab stop, so a keyboard can reach what is cut off. Memoised: a drag re-renders the shell on every move, not the strip. */
const StatusBar = memo(function StatusBar({ label, children }: { label: string; children: ReactNode }) {
  const element = useRef<HTMLDivElement>(null);
  const scrolls = useOverflows(element);
  return (
    <div
      ref={element}
      data-slot="workbench-shell-status"
      role="group"
      aria-label={label}
      tabIndex={scrolls ? 0 : undefined}
      className="relative flex h-7 shrink-0 items-center gap-x-3 overflow-x-auto border-t border-border bg-muted/40 px-3 text-xs whitespace-nowrap text-muted-foreground outline-none [scrollbar-width:none] focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-ring/40"
    >
      {children}
    </div>
  );
});

/** The work area. It is a tab stop only while it has something to scroll: an editor that scrolls itself does not get a second stop in front of it. Memoised, so dragging a panel does not render it again. */
const Canvas = memo(function Canvas({ label, children }: { label: string; children: ReactNode }) {
  const element = useRef<HTMLDivElement>(null);
  const scrolls = useOverflows(element);
  return (
    <div
      ref={element}
      data-slot="workbench-shell-canvas"
      role="region"
      aria-label={label}
      tabIndex={scrolls ? 0 : undefined}
      className="relative min-w-0 flex-1 overflow-auto outline-none [scrollbar-color:var(--border)_transparent] [scrollbar-width:thin] focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-ring/40"
    >
      {children}
    </div>
  );
});

/**
 * The layout that code editors, design tools and content editors share: an
 * explorer at the start, the canvas in the middle, an inspector at the end, a
 * toolbar across the top and a 28px status bar underneath. The panels are
 * separated by drag handles that are also keyboard separators: arrow keys
 * resize in 16px steps (Shift for 64), Home collapses a panel and End brings it
 * back, a double click resets it, and the toggles in the toolbar collapse them
 * too. Each part scrolls on its own, the canvas takes what is left and cannot be
 * pushed out by wide content, and the panels give way together when the shell
 * gets narrow, then return to the sizes you chose when it grows. Below 64rem of
 * its own width (lg, or the `breakpoint` you give) the panels become sheets
 * opened from the same toolbar buttons. The content of a panel is mounted once
 * and moved between the panel and its sheet, so it keeps its state when a sheet
 * closes or the shell crosses the breakpoint. `onSizesChange` gives you the
 * layout to save, once per gesture. It fills its container: it is as tall as the
 * viewport unless you give it a height, and it follows the reading direction.
 */
export function WorkbenchShell({ toolbar, explorer, canvas, inspector, status, defaultSizes, sizes, breakpoint, minSizes, onSizesChange, labels, className, ref, ...props }: WorkbenchShellProps) {
  const text = {
    explorer: "Explorer",
    inspector: "Inspector",
    canvas: "Canvas",
    status: "Status bar",
    hide: "Hide {panel}",
    show: "Show {panel}",
    open: "Open {panel}",
    resize: "Resize {panel}",
    collapsed: "Collapsed",
    width: "{width} pixels wide",
    sheet: "The {panel} panel. Press Escape to close.",
    ...labels,
  };
  const mins = resolveMins(minSizes);
  const root = useRef<HTMLDivElement | null>(null);
  const row = useRef<HTMLDivElement>(null);
  const settle = useRef<number | undefined>(undefined);
  const toggles = { explorer: useRef<HTMLButtonElement>(null), inspector: useRef<HTMLButtonElement>(null) };
  const explorerId = useId();
  const inspectorId = useId();
  const [initial] = useState(() => resolveLayout(defaultSizes ?? {}));
  const [own, setOwn] = useState(initial);
  const [live, setLive] = useState<WorkbenchLayout | null>(null);
  const [dragging, setDragging] = useState(false);
  const [animate, setAnimate] = useState(false);
  // The server and the first client render say "beside", and below the breakpoint the panels are hidden by CSS until the real width is known.
  const [frame, setFrame] = useState<Frame>({ beside: true, rtl: false, width: null });
  const [sheet, setSheet] = useState<WorkbenchPanel | null>(null);
  const { beside, rtl } = frame;

  const present = { explorer: Boolean(explorer), inspector: Boolean(inspector) };
  // What the panels at their least and the canvas at its least need side by side, in px.
  const room = (present.explorer ? mins.explorer + HANDLE : 0) + (present.inspector ? mins.inspector + HANDLE : 0) + mins.canvas;
  // With the default breakpoint the panels are also hidden by CSS below 64rem, so a narrow screen never paints them before the script has run.
  const fallback = breakpoint === undefined ? "@max-5xl:hidden" : undefined;
  // A breakpoint you choose cannot be a class (Tailwind reads classes from the source, not from a prop), so the same rule is written out for this shell alone.
  const scope = useId();
  const fallbackRule = breakpoint !== undefined && Number.isFinite(breakpoint) ? `@container (width < ${breakpoint}rem){[data-fallback="${scope}"]>:is([data-slot=workbench-shell-explorer],[data-slot=workbench-shell-inspector],[data-slot=workbench-shell-handle]){display:none}}` : null;
  const hosts = usePanelHosts();
  const place = { explorer: usePlace(hosts?.explorer ?? null), inspector: usePlace(hosts?.inspector ?? null) };
  const base = sizes ?? own;
  const layout = live ?? base;
  const drawn = fitLayout(layout, present, mins, frame.width);
  const ids = { explorer: explorerId, inspector: inspectorId };
  const content = { explorer, inspector };

  // The shell measures itself, and a ref you pass still gets the element.
  const attach = useCallback(
    (element: HTMLDivElement | null) => {
      root.current = element;
      if (typeof ref === "function") ref(element);
      else if (ref) ref.current = element;
    },
    [ref],
  );

  // How wide the shell is: wide enough for the panels to sit beside the canvas, and room for the canvas minimum. Its own width, not the window's, so it works in a pane.
  useBrowserLayoutEffect(() => {
    const element = root.current;
    if (!element) return;
    const measure = () => {
      const rem = Number.parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
      const next: Frame = { beside: element.clientWidth >= Math.max((breakpoint ?? BESIDE_REM) * rem, room), rtl: getComputedStyle(element).direction === "rtl", width: row.current?.clientWidth ?? null };
      setFrame((current) => (current.beside === next.beside && current.rtl === next.rtl && current.width === next.width ? current : next));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [breakpoint, room]);

  // Sheets are for narrow shells: they go away when the panels take over.
  useEffect(() => {
    if (beside) setSheet(null);
  }, [beside]);

  useEffect(() => () => window.clearTimeout(settle.current), []);

  function commit(next: WorkbenchLayout) {
    setLive(null);
    // A gesture that ends where it began (a click on a handle, a drag back to the start) changes nothing and tells nobody.
    if (sameLayout(next, base)) return;
    // A panel that opens or closes slides; a panel that is being resized does not follow with a delay.
    if (next.collapsed.explorer !== base.collapsed.explorer || next.collapsed.inspector !== base.collapsed.inspector) {
      setAnimate(true);
      window.clearTimeout(settle.current);
      settle.current = window.setTimeout(() => setAnimate(false), 260);
    }
    if (sizes === undefined) setOwn(next);
    onSizesChange?.(next);
  }

  function withPanel(current: WorkbenchLayout, panel: WorkbenchPanel, state: HandleState): WorkbenchLayout {
    const collapsed = { ...current.collapsed, [panel]: state.collapsed };
    return panel === "explorer" ? { ...current, explorer: state.width, collapsed } : { ...current, inspector: state.width, collapsed };
  }

  function change(panel: WorkbenchPanel, state: HandleState, final: boolean) {
    const next = withPanel(live ?? base, panel, state);
    if (final) commit(next);
    else setLive(next);
  }

  function toggle(panel: WorkbenchPanel) {
    commit(withPanel(base, panel, { collapsed: !base.collapsed[panel], width: base[panel] }));
  }

  function toggleButton(panel: WorkbenchPanel): ReactNode {
    const name = text[panel].toLowerCase();
    const shown = beside ? !layout.collapsed[panel] : sheet === panel;
    return (
      <IconButton
        ref={toggles[panel]}
        icon={panel === "explorer" ? <IconSidebar className="rtl:-scale-x-100" /> : <IconSidebarRight className="rtl:-scale-x-100" />}
        label={fill(beside ? (shown ? text.hide : text.show) : text.open, name)}
        side="bottom"
        aria-expanded={shown}
        aria-controls={beside ? ids[panel] : undefined}
        aria-haspopup={beside ? undefined : "dialog"}
        onClick={() => (beside ? toggle(panel) : setSheet(panel))}
        className={shown ? "bg-muted text-foreground" : "text-muted-foreground"}
      />
    );
  }

  /** What goes inside the scroll area of a panel or its sheet: the place the panel's host is moved into, or the content itself until the hosts exist. */
  function body(panel: WorkbenchPanel): ReactNode {
    return hosts ? <div ref={place[panel]} className="contents" /> : content[panel];
  }

  function side(panel: WorkbenchPanel): ReactNode {
    const collapsed = layout.collapsed[panel];
    const width = drawn[panel];
    return (
      <aside
        id={ids[panel]}
        aria-label={text[panel]}
        data-slot={`workbench-shell-${panel}`}
        data-state={collapsed ? "collapsed" : "open"}
        inert={collapsed}
        style={{ width: collapsed ? 0 : width }}
        className={cn("relative shrink-0 overflow-hidden bg-muted/30", fallback, animate && !dragging && "transition-[width] duration-200 ease-out motion-reduce:transition-none")}
      >
        <div style={{ width }} className="h-full">
          <ScrollArea className="h-full [&>[data-slot=scroll-area-viewport]>div]:block!">{body(panel)}</ScrollArea>
        </div>
      </aside>
    );
  }

  function handle(panel: WorkbenchPanel): ReactNode {
    return (
      <WorkbenchHandle
        panel={panel}
        controls={ids[panel]}
        label={fill(text.resize, text[panel].toLowerCase())}
        words={{ collapsed: text.collapsed, width: text.width }}
        width={drawn[panel]}
        collapsed={layout.collapsed[panel]}
        min={mins[panel]}
        max={maxWidth(panel, layout, drawn, present, mins, frame.width)}
        reset={initial[panel]}
        className={fallback}
        edge={panel === "explorer" ? "start" : "end"}
        row={row}
        onChange={(state, final) => change(panel, state, final)}
        onDragChange={setDragging}
      />
    );
  }

  return (
    <IconButtonProvider>
      <div
        ref={attach}
        data-slot="workbench-shell"
        data-dragging={dragging ? "true" : undefined}
        className={cn("@container relative flex h-dvh min-w-0 flex-col overflow-hidden bg-background text-foreground data-[dragging=true]:cursor-col-resize data-[dragging=true]:select-none", className)}
        {...props}
      >
        {fallbackRule ? <style>{fallbackRule}</style> : null}
        <div data-slot="workbench-shell-toolbar" className="flex h-12 shrink-0 items-center gap-1 border-b border-border px-2">
          {present.explorer ? toggleButton("explorer") : null}
          <div className="relative flex h-full min-w-0 flex-1 items-center gap-2 overflow-x-auto px-1 [scrollbar-width:none]">{toolbar}</div>
          {present.inspector ? toggleButton("inspector") : null}
        </div>

        <div ref={row} data-fallback={fallbackRule ? scope : undefined} className="flex min-h-0 flex-1">
          {beside && present.explorer ? (
            <>
              {side("explorer")}
              {handle("explorer")}
            </>
          ) : null}
          <Canvas label={text.canvas}>{canvas}</Canvas>
          {beside && present.inspector ? (
            <>
              {handle("inspector")}
              {side("inspector")}
            </>
          ) : null}
        </div>

        {status ? <StatusBar label={text.status}>{status}</StatusBar> : null}

        {!beside
          ? (["explorer", "inspector"] as const)
              .filter((panel) => present[panel])
              .map((panel) => (
                <Sheet key={panel} open={sheet === panel} onOpenChange={(open) => setSheet(open ? panel : null)}>
                  <SheetContent
                    side={(panel === "explorer") !== rtl ? "left" : "right"}
                    className="w-[min(22rem,calc(100vw-3rem))] gap-0 p-0"
                    onCloseAutoFocus={(event) => {
                      // There is no trigger inside the sheet to hand focus back to: it goes to the toolbar button that opened it.
                      event.preventDefault();
                      toggles[panel].current?.focus();
                    }}
                    onInteractOutside={(event) => {
                      // The panel's content is drawn here by a portal, not inside the sheet, so what it opens (a menu, a popover, a date picker) is outside the sheet's React tree; using it is not a click outside.
                      if (event.target instanceof Element && event.target.closest("[data-radix-popper-content-wrapper]")) event.preventDefault();
                    }}
                  >
                    {/* The sheet's own close button is placed with physical offsets (1rem from the top and from the right, 1.75rem wide), so the header pads on the physical right as well, in either direction, to keep clear of it, and its title is centred on the button. */}
                    <SheetHeader className="shrink-0 border-b border-border pt-5 pb-3 pl-4 pr-14">
                      <SheetTitle>{text[panel]}</SheetTitle>
                      <SheetDescription className="sr-only">{fill(text.sheet, text[panel].toLowerCase())}</SheetDescription>
                    </SheetHeader>
                    <ScrollArea className="min-h-0 flex-1 [&>[data-slot=scroll-area-viewport]>div]:block!">{body(panel)}</ScrollArea>
                  </SheetContent>
                </Sheet>
              ))
          : null}

        {hosts && present.explorer ? createPortal(explorer, hosts.explorer) : null}
        {hosts && present.inspector ? createPortal(inspector, hosts.inspector) : null}
      </div>
    </IconButtonProvider>
  );
}
