"use client";

import { useEffect, useId, useRef, useState, type ComponentProps, type ReactNode } from "react";
import { Dialog as SheetPrimitive } from "radix-ui";

import { IconClose, IconSidebar } from "@rhs-ui/icons";
import { NotificationBadge } from "@rhs-ui/primitives/notification-badge";
import { Sheet, SheetDescription, SheetOverlay, SheetPortal, SheetTitle } from "@rhs-ui/primitives/sheet";
import { SkipLink } from "@rhs-ui/primitives/skip-link";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@rhs-ui/primitives/tooltip";
import { cn } from "@/lib/utils";

export interface RailArea {
  /** Identifies the area: it is what `activeArea` and `onAreaChange` use. */
  id: string;
  /** The area's name: the button's accessible name and its tooltip. */
  label: string;
  /** An icon element, drawn at 20px. */
  icon: ReactNode;
  /** A count on the icon. Hidden at 0, shown as 99+ above 99. */
  badge?: number;
  /** What the count is about, read after the number: "unread". Default "new". */
  badgeLabel?: string;
}

export interface RailPanelShellLabels {
  /** The rail's name for screen readers. Default "Areas". */
  rail?: string;
  /** The toggle's name while the panel is hidden. Default "Show panel". */
  showPanel?: string;
  /** The toggle's name while the panel is shown. Default "Hide panel". */
  hidePanel?: string;
  /** The sheet's close button. Default "Close". */
  close?: string;
  /** What the sheet says it holds, for screen readers. Default "Pages in this area." */
  sheet?: string;
  /** The skip link's text. Default "Skip to content". */
  skip?: string;
}

export interface RailPanelShellProps extends Omit<ComponentProps<"div">, "children"> {
  /** The areas of the product, top to bottom in the rail. Six or fewer sit comfortably; more scroll. */
  areas: readonly RailArea[];
  /** The `id` of the current area. It is marked with aria-current and a filled tile. */
  activeArea: string;
  /** An area was pressed. Switch `activeArea` and `panel` in response; below md the pages also open in a sheet. */
  onAreaChange: (id: string) => void;
  /** Your mark, at the top of the rail. */
  brand?: ReactNode;
  /** The foot of the rail, under the panel toggle: the account button, help. */
  railFooter?: ReactNode;
  /** The pages of the active area, usually a SidebarNav. Leave it out for an area that has none: the panel and its toggle go away. */
  panel?: ReactNode;
  /** The panel's heading. Default the active area's label. */
  panelTitle?: string;
  /** Icon buttons beside the panel's heading: New page, Search. */
  panelActions?: ReactNode;
  /** Whether the panel is shown from md up. Leave it out to let the shell keep it. */
  panelOpen?: boolean;
  /** Whether the panel starts shown when the shell keeps it. Default true. */
  defaultPanelOpen?: boolean;
  /** The panel was folded or shown with the toggle at the foot of the rail. */
  onPanelOpenChange?: (open: boolean) => void;
  /** Gives the page its own padding (default). Turn it off for a full-bleed page such as a table. */
  padded?: boolean;
  /** The id of the main landmark, which the skip link points at. Default "main". */
  mainId?: string;
  /** The words the shell uses, for translation. */
  labels?: RailPanelShellLabels;
  /** The page. It scrolls inside the shell; the rail and the panel never move. */
  children: ReactNode;
}

/** The pages list is a plain overflow box: its links are already in the tab order, so it adds no stop of its own. */
const PAGES_SCROLLER = "relative min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain [scrollbar-color:var(--border)_transparent] [scrollbar-width:thin]";

const RAIL_BUTTON = [
  "relative grid size-10 shrink-0 place-items-center rounded-lg text-muted-foreground outline-none",
  "transition-[background-color,color,transform] duration-150 active:translate-y-px motion-reduce:transition-none",
  "hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40",
  "aria-[current=true]:bg-foreground aria-[current=true]:text-background aria-[current=true]:hover:bg-foreground aria-[current=true]:hover:text-background",
  "[&_svg]:size-5 [&_svg]:shrink-0",
].join(" ");

interface RailButtonProps extends ComponentProps<"button"> {
  /** The accessible name, and the tooltip. */
  label: string;
  current?: boolean;
}

/** One tile of the rail: an icon, named for screen readers, with its name in a tooltip on the right. */
function RailButton({ label, current, className, children, ...props }: RailButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button type="button" aria-current={current ? "true" : undefined} className={cn(RAIL_BUTTON, className)} {...props}>
          <span className="sr-only">{label}</span>
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent side="right" sideOffset={10}>
        {label}
      </TooltipContent>
    </Tooltip>
  );
}

/**
 * The frame for an app with many areas that each have many pages: a slim
 * rail of icon buttons for the areas, a 14rem panel with the pages of the
 * one you are in, and the content beside them. The current area is a filled
 * tile marked aria-current; the rail is a plain list of buttons that Tab
 * walks through, each named for screen readers and in a tooltip. The panel
 * folds away with the toggle at the foot of the rail, and below md it is a
 * sheet that opens next to the rail when you press an area, so the rail
 * never moves. The page scrolls inside the shell. It fills its container:
 * it is as tall as the viewport unless you give it a height.
 */
export function RailPanelShell({
  areas,
  activeArea,
  onAreaChange,
  brand,
  railFooter,
  panel,
  panelTitle,
  panelActions,
  panelOpen,
  defaultPanelOpen = true,
  onPanelOpenChange,
  padded = true,
  mainId = "main",
  labels,
  children,
  className,
  ...props
}: RailPanelShellProps) {
  const text = { rail: "Areas", showPanel: "Show panel", hidePanel: "Hide panel", close: "Close", sheet: "Pages in this area.", skip: "Skip to content", ...labels };
  const panelId = useId();
  const titleId = useId();
  const [innerOpen, setInnerOpen] = useState(defaultPanelOpen);
  const [sheetOpen, setSheetOpen] = useState(false);
  const returnTo = useRef<HTMLElement | null>(null);
  /** The area pressed on a phone whose pages should open once it is current. */
  const pending = useRef<string | null>(null);
  const rail = useRef<HTMLDivElement>(null);

  const open = panelOpen ?? innerOpen;
  const hasPanel = Boolean(panel);
  const active = areas.find((area) => area.id === activeArea);
  const title = panelTitle ?? active?.label ?? "";

  const setOpen = (next: boolean) => {
    if (panelOpen === undefined) setInnerOpen(next);
    onPanelOpenChange?.(next);
  };

  const openSheet = (from: HTMLElement) => {
    returnTo.current = from;
    setSheetOpen(true);
  };

  function press(id: string, from: HTMLElement) {
    // Below md there is no panel beside the rail: the pages of the area open in a sheet instead.
    if (!window.matchMedia?.("(min-width: 48rem)").matches) {
      returnTo.current = from;
      // The area you are on has its pages rendered, so the sheet opens at once. Another area has not rendered its own yet,
      // and whether it has any pages at all is only known then: the effect below opens the sheet after the switch.
      pending.current = id === activeArea ? null : id;
      if (id === activeArea && hasPanel) setSheetOpen(true);
    }
    onAreaChange(id);
  }

  // The sheet is for narrow screens: it closes by itself when the panel takes over, or when the area has no pages.
  useEffect(() => {
    const wide = window.matchMedia?.("(min-width: 48rem)");
    if (!wide) return;
    const close = () => {
      if (!wide.matches) return;
      pending.current = null;
      setSheetOpen(false);
    };
    wide.addEventListener("change", close);
    return () => wide.removeEventListener("change", close);
  }, []);
  useEffect(() => {
    if (!hasPanel) setSheetOpen(false);
  }, [hasPanel]);
  // The area that was pressed on a phone has rendered: show its pages, or nothing when it has none.
  useEffect(() => {
    if (pending.current === null || pending.current !== activeArea) return;
    pending.current = null;
    setSheetOpen(hasPanel);
  }, [activeArea, hasPanel]);

  return (
    <div data-slot="rail-panel-shell" className={cn("relative flex h-dvh min-w-0 bg-background text-foreground", className)} {...props}>
      <SkipLink target={mainId} label={text.skip} />

      <TooltipProvider delayDuration={150} skipDelayDuration={400}>
        {/* pointer-events-auto: while the sheet is open the page is inert, but the rail stays in reach of a finger. */}
        <div ref={rail} data-slot="rail-panel-shell-rail" className="pointer-events-auto flex w-14 shrink-0 flex-col items-center border-r border-border bg-background">
          {brand ? <header className="grid h-14 w-full shrink-0 place-items-center">{brand}</header> : null}
          <nav aria-label={text.rail} className={cn("relative min-h-0 w-full flex-1 overflow-y-auto [scrollbar-width:none]", brand ? "" : "pt-2")}>
            <ul className="flex flex-col items-center gap-1 px-2 py-1">
              {areas.map((area) => (
                <li key={area.id}>
                  <RailButton label={area.label} current={area.id === activeArea} onClick={(event) => press(area.id, event.currentTarget)}>
                    {area.badge ? (
                      <NotificationBadge label={area.badgeLabel ?? "new"} count={area.badge}>
                        {area.icon}
                      </NotificationBadge>
                    ) : (
                      area.icon
                    )}
                  </RailButton>
                </li>
              ))}
            </ul>
          </nav>
          <div className="flex w-full shrink-0 flex-col items-center gap-1 px-2 pb-3">
            {hasPanel ? (
              <>
                <RailButton label={open ? text.hidePanel : text.showPanel} aria-expanded={open} aria-controls={panelId} onClick={() => setOpen(!open)} className="max-md:hidden">
                  <IconSidebar />
                </RailButton>
                <RailButton
                  label={text.showPanel}
                  aria-haspopup="dialog"
                  aria-expanded={sheetOpen}
                  onClick={(event) => (sheetOpen ? setSheetOpen(false) : openSheet(event.currentTarget))}
                  className="md:hidden"
                >
                  <IconSidebar />
                </RailButton>
              </>
            ) : null}
            {railFooter}
          </div>
        </div>
      </TooltipProvider>

      {hasPanel && !sheetOpen ? (
        <div
          id={panelId}
          data-slot="rail-panel-shell-panel"
          data-state={open ? "open" : "closed"}
          inert={!open}
          className={cn("hidden shrink-0 overflow-hidden transition-[width] duration-200 ease-out motion-reduce:transition-none md:block", open ? "w-56" : "w-0")}
        >
          <section aria-labelledby={titleId} className="flex h-full w-56 flex-col border-r border-border bg-muted/40">
            <div className="flex h-14 shrink-0 items-center justify-between gap-2 pr-3 pl-4">
              <p id={titleId} className="min-w-0 truncate text-sm font-semibold tracking-[-0.01em]">
                {title}
              </p>
              {panelActions ? <div className="flex shrink-0 items-center gap-1">{panelActions}</div> : null}
            </div>
            <div key={activeArea} className={PAGES_SCROLLER}>
              <div className="px-2 pb-4 [&_nav_*]:min-w-0">{panel}</div>
            </div>
          </section>
        </div>
      ) : null}

      <main
        id={mainId}
        tabIndex={0}
        className={cn(
          "relative min-w-0 flex-1 overflow-y-auto overscroll-contain outline-none [scrollbar-color:var(--border)_transparent] [scrollbar-width:thin] focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-ring/40",
          padded && "px-4 py-6 sm:px-8 sm:py-8",
        )}
      >
        {children}
      </main>

      <p role="status" className="sr-only">
        {active?.label}
      </p>

      {hasPanel ? (
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetPortal>
            <SheetOverlay className="left-14" />
            <SheetPrimitive.Content
              data-slot="rail-panel-shell-sheet"
              data-side="left"
              // A press on the rail is not "outside": it switches the area and the sheet stays, showing its pages.
              onInteractOutside={(event) => {
                if (event.target instanceof Node && rail.current?.contains(event.target)) event.preventDefault();
              }}
              onCloseAutoFocus={(event) => {
                event.preventDefault();
                returnTo.current?.focus();
              }}
              onClick={(event) => {
                if ((event.target as Element).closest("a[href]")) setSheetOpen(false);
              }}
              className={cn(
                "fixed inset-y-0 left-14 z-50 flex h-full w-72 max-w-[calc(100vw_-_4.5rem)] flex-col border-r border-border bg-[color-mix(in_oklab,var(--muted)_40%,var(--background))] text-foreground shadow-sm outline-none",
                "data-[state=open]:animate-rhs-rail-panel-in data-[state=closed]:animate-rhs-rail-panel-out motion-reduce:data-[state=closed]:animate-none motion-reduce:data-[state=open]:animate-none",
              )}
            >
              <div className="flex h-14 shrink-0 items-center justify-between gap-2 pr-3 pl-4">
                <SheetTitle className="min-w-0 truncate text-sm tracking-[-0.01em]">{title}</SheetTitle>
                <div className="flex shrink-0 items-center gap-1">
                  {panelActions}
                  <SheetPrimitive.Close
                    aria-label={text.close}
                    className="grid size-8 place-items-center rounded-md text-muted-foreground outline-none transition-colors duration-150 hover:bg-background hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40"
                  >
                    <IconClose size={16} />
                  </SheetPrimitive.Close>
                </div>
              </div>
              <SheetDescription className="sr-only">{text.sheet}</SheetDescription>
              <div key={activeArea} className={PAGES_SCROLLER}>
                <div className="px-3 pb-6 [&_nav_*]:min-w-0">{panel}</div>
              </div>
            </SheetPrimitive.Content>
          </SheetPortal>
        </Sheet>
      ) : null}
    </div>
  );
}
