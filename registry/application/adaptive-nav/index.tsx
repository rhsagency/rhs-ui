"use client";

import { createContext, useContext, useEffect, useId, useLayoutEffect, useRef, useState, type ComponentProps, type MouseEvent, type ReactNode } from "react";
import { Dialog as DialogPrimitive } from "radix-ui";

import { IconClose, IconMoreHorizontal } from "@rhs-ui/icons";
import {
  DEFAULT_LABELS,
  badgeSpeech,
  fill,
  formFor,
  groupItems,
  hasBadge,
  splitForBar,
  type AdaptiveNavBreakpoints,
  type AdaptiveNavItem,
  type AdaptiveNavLabels,
  type NavForm,
} from "@rhs-ui/application/adaptive-nav/nav";
import { Sheet, SheetOverlay, SheetPortal, SheetTitle, SheetTrigger, sheetVariants } from "@rhs-ui/primitives/sheet";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@rhs-ui/primitives/tooltip";
import { AS_CHILD } from "@rhs-ui/primitives/render-prop";
import { cn } from "@/lib/utils";

export type { AdaptiveNavBreakpoints, AdaptiveNavItem, AdaptiveNavLabels, NavForm } from "@rhs-ui/application/adaptive-nav/nav";

export interface AdaptiveNavProps extends Omit<ComponentProps<"div">, "children"> {
  /** The destinations, in order. The same list drives all three shapes. */
  items: readonly AdaptiveNavItem[];
  /** The `id` of the item whose page is showing. It is marked in every shape, including the "More" button of the bar when the item waits in its sheet. */
  current: string;
  /** An item was pressed: it receives the item and the click. A link is only intercepted when you call `event.preventDefault()`, so that route changes and open-in-new-tab keep working; an item without an `href` has nothing else to do. A click with Ctrl, Cmd, Shift or Alt on a link is left alone. */
  onNavigate?: (item: AdaptiveNavItem, event: MouseEvent<HTMLElement>) => void;
  /** The top of the sidebar and the rail: a brand, a workspace switcher. On a phone it moves into the "More" sheet. It may read the shape with `useAdaptiveNavForm()`. */
  header?: ReactNode;
  /** The bottom of the sidebar and the rail: the account. On a phone it moves into the "More" sheet. */
  footer?: ReactNode;
  /** The container widths where the shape changes: `medium` (default 600) and `expanded` (default 840), in px. They apply to the width of this component, not of the window. */
  breakpoints?: AdaptiveNavBreakpoints;
  /** The shape drawn before the width is known: on the server and in the first paint of the browser. Default "sidebar". */
  initialForm?: NavForm;
  /** The words the navigation says, for translation. */
  labels?: AdaptiveNavLabels;
  /** The page. It sits beside the sidebar or rail, and above the bar. */
  children?: ReactNode;
}

const AdaptiveNavContext = createContext<NavForm>("sidebar");

/** The shape the navigation has right now, for a header or footer that wants to be smaller in a rail. */
export function useAdaptiveNavForm(): NavForm {
  return useContext(AdaptiveNavContext);
}

const useBrowserLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

/** What stands for "the More button" when the shape changes and focus has to find its way back. */
const MORE = "\u0000more";

type Variant = "sidebar" | "sheet" | "rail" | "bar";

const ITEM_BASE =
  "relative text-muted-foreground outline-none transition-[background-color,color] duration-150 focus-visible:ring-[3px] focus-visible:ring-ring/40 motion-reduce:transition-none [&_svg]:shrink-0 data-[current]:text-foreground";

const ITEM: Record<Variant, string> = {
  sidebar: "flex h-9 w-full items-center gap-2.5 rounded-md px-2.5 text-left text-sm hover:bg-muted/60 hover:text-foreground data-[current]:bg-muted data-[current]:font-medium [&_svg]:size-[1.125rem]",
  sheet: "flex h-11 w-full items-center gap-3 rounded-md px-3 text-left text-[0.9375rem] hover:bg-muted/60 hover:text-foreground data-[current]:bg-muted data-[current]:font-medium [&_svg]:size-5",
  rail: "grid size-10 place-items-center rounded-lg hover:bg-muted/60 hover:text-foreground data-[current]:bg-muted [&_svg]:size-5",
  // Five places share the width of the bar: under 22rem (the bar is a container) the labels give up a pixel of type and all their padding, so "Customers" is read whole in a fifth of 288px.
  bar: "flex min-h-14 w-full flex-col items-center justify-center gap-1 px-1 text-[0.6875rem] leading-none focus-visible:ring-inset @max-[22rem]:px-0 @max-[22rem]:text-[0.625rem] data-[current]:font-medium data-[current]:after:absolute data-[current]:after:inset-x-5 data-[current]:after:top-0 data-[current]:after:h-0.5 data-[current]:after:rounded-full data-[current]:after:bg-foreground [&_svg]:size-5 [&[data-current]_svg]:stroke-[2.25]",
};

function Count({ item, className }: { item: AdaptiveNavItem; className?: string }) {
  if (!hasBadge(item)) return null;
  return (
    <span aria-hidden="true" data-slot="adaptive-nav-badge" className={cn("inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[0.6875rem] leading-none font-semibold text-primary-foreground tabular-nums", className)}>
      {item.badge}
    </span>
  );
}

interface NavItemProps {
  item: AdaptiveNavItem;
  current: boolean;
  variant: Variant;
  onPress: (item: AdaptiveNavItem, event: MouseEvent<HTMLElement>) => void;
}

/** One destination in any of the shapes: a link when it has an `href`, a button when it does not. */
function NavItem({ item, current, variant, onPress }: NavItemProps) {
  const speech = badgeSpeech(item);
  const link = item.href !== undefined;
  const shared = {
    "data-nav-id": item.id,
    "data-current": current ? "" : undefined,
    "aria-current": current ? ("page" as const) : undefined,
    // Only the icon shows in a rail: the name, and what the badge counts, are said by the label.
    "aria-label": variant === "rail" ? [item.label, speech].filter(Boolean).join(", ") : undefined,
    className: cn(ITEM_BASE, ITEM[variant]),
    onClick: (event: MouseEvent<HTMLElement>) => {
      if (event.defaultPrevented) return;
      if (link && (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)) return;
      onPress(item, event);
    },
  };
  const content =
    variant === "bar" ? (
      <>
        <span className="relative">
          {item.icon}
          <Count item={item} className="absolute -top-2 left-full -ml-1.5 h-4 min-w-4 px-1 text-[0.625rem] ring-2 ring-card" />
        </span>
        <span className="max-w-full truncate">{item.label}</span>
        {speech ? <span className="sr-only">, {speech}</span> : null}
      </>
    ) : variant === "rail" ? (
      <>
        {item.icon}
        <Count item={item} className="absolute top-0.5 right-0.5 h-4 min-w-4 px-1 text-[0.625rem] ring-2 ring-card" />
      </>
    ) : (
      <>
        {item.icon}
        <span className="min-w-0 flex-1 truncate">{item.label}</span>
        <Count item={item} />
        {speech ? <span className="sr-only">, {speech}</span> : null}
      </>
    );
  const node = link ? (
    <a href={item.href} {...shared}>
      {content}
    </a>
  ) : (
    <button type="button" {...shared}>
      {content}
    </button>
  );
  if (variant !== "rail") return node;
  return (
    <Tooltip>
      <TooltipTrigger {...AS_CHILD}>{node}</TooltipTrigger>
      <TooltipContent side="right" sideOffset={8}>
        {item.label}
        {hasBadge(item) ? <span className="ml-2 tabular-nums opacity-70">{item.badge}</span> : null}
      </TooltipContent>
    </Tooltip>
  );
}

interface Shared {
  items: readonly AdaptiveNavItem[];
  current: string;
  words: Required<AdaptiveNavLabels>;
  onPress: NavItemProps["onPress"];
  header: ReactNode;
  footer: ReactNode;
}

/** The items in their groups, as rows with a heading each: the sidebar, and the list in the sheet. */
function Groups({ items, current, onPress, variant }: Pick<Shared, "items" | "current" | "onPress"> & { variant: "sidebar" | "sheet" }) {
  const base = useId();
  return (
    <div className="grid gap-5">
      {groupItems(items).map((group, at) => (
        <div key={`${group.label ?? ""}-${at}`} className="grid gap-1">
          {group.label ? (
            <p id={`${base}-${at}`} className="px-2.5 pb-1 font-mono text-[0.6875rem] tracking-wide text-muted-foreground uppercase">
              {group.label}
            </p>
          ) : null}
          <ul aria-labelledby={group.label ? `${base}-${at}` : undefined} className="grid gap-0.5">
            {group.items.map((item) => (
              <li key={item.id}>
                <NavItem item={item} current={item.id === current} variant={variant} onPress={onPress} />
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function Sidebar({ items, current, words, onPress, header, footer }: Shared) {
  return (
    <div data-slot="adaptive-nav-sidebar" className="flex h-full w-60 shrink-0 flex-col border-r border-border bg-card text-card-foreground">
      {header ? (
        <div data-slot="adaptive-nav-header" className="shrink-0 px-3 pt-3 pb-1">
          {header}
        </div>
      ) : null}
      <nav aria-label={words.nav} className="relative min-h-0 flex-1 overflow-y-auto px-3 py-3">
        <Groups items={items} current={current} onPress={onPress} variant="sidebar" />
      </nav>
      {footer ? (
        <div data-slot="adaptive-nav-footer" className="shrink-0 border-t border-border p-3">
          {footer}
        </div>
      ) : null}
    </div>
  );
}

function Rail({ items, current, words, onPress, header, footer }: Shared) {
  return (
    <TooltipProvider delayDuration={120} skipDelayDuration={300}>
      <div data-slot="adaptive-nav-rail" className="flex h-full w-16 shrink-0 flex-col items-center border-r border-border bg-card text-card-foreground">
        {header ? (
          <div data-slot="adaptive-nav-header" className="flex w-full shrink-0 justify-center px-2 pt-3 pb-1">
            {header}
          </div>
        ) : null}
        {/* A rail of 64px has no room for a scrollbar: the icons are 40px wide, and a classic one (Windows, Linux) would squeeze them. It scrolls when the window is short, without drawing one. */}
        <nav aria-label={words.nav} className="relative min-h-0 w-full flex-1 overflow-x-hidden overflow-y-auto px-2 py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {groupItems(items).map((group, at) => (
            <div key={`${group.label ?? ""}-${at}`}>
              {at > 0 ? <div aria-hidden="true" className="mx-auto my-2 h-px w-6 bg-border" /> : null}
              <ul aria-label={group.label} className="grid justify-items-center gap-1">
                {group.items.map((item) => (
                  <li key={item.id}>
                    <NavItem item={item} current={item.id === current} variant="rail" onPress={onPress} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
        {footer ? (
          <div data-slot="adaptive-nav-footer" className="flex w-full shrink-0 justify-center border-t border-border p-2">
            {footer}
          </div>
        ) : null}
      </div>
    </TooltipProvider>
  );
}

function Bar({ items, current, words, onPress, header, footer, host, open, onOpenChange }: Shared & { host: HTMLElement | null; open: boolean; onOpenChange: (open: boolean) => void }) {
  const { shown, rest } = splitForBar(items, Boolean(header || footer));
  const hidden = rest.find((item) => item.id === current);
  const more = shown.length < items.length || Boolean(header || footer);
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <nav data-slot="adaptive-nav-bar" aria-label={words.nav} className="@container relative shrink-0 border-t border-border bg-card pb-[env(safe-area-inset-bottom)] text-card-foreground">
        <ul className="grid auto-cols-fr grid-flow-col">
          {shown.map((item) => (
            <li key={item.id} className="min-w-0">
              <NavItem item={item} current={item.id === current} variant="bar" onPress={onPress} />
            </li>
          ))}
          {more ? (
            <li className="min-w-0">
              <SheetTrigger asChild>
                <button
                  type="button"
                  data-nav-more=""
                  data-current={hidden ? "" : undefined}
                  aria-label={hidden ? fill(words.moreCurrent, { label: hidden.label }) : undefined}
                  className={cn(ITEM_BASE, ITEM.bar)}
                >
                  <IconMoreHorizontal aria-hidden="true" />
                  <span className="max-w-full truncate">{words.more}</span>
                </button>
              </SheetTrigger>
            </li>
          ) : null}
        </ul>
      </nav>
      {more ? (
        // The sheet opens inside the component, over the page and not the whole window: the shell is the app.
        <SheetPortal container={host}>
          <SheetOverlay className="absolute" />
          <DialogPrimitive.Content
            data-slot="adaptive-nav-more"
            aria-describedby={undefined}
            className={cn(sheetVariants({ side: "bottom" }), "absolute max-h-[85%] gap-0 pb-[env(safe-area-inset-bottom)]")}
          >
            <div className="flex shrink-0 items-center justify-between gap-3 py-3.5 pr-3 pl-5">
              <SheetTitle>{words.more}</SheetTitle>
              <DialogPrimitive.Close
                aria-label={words.close}
                className="grid size-8 place-items-center rounded-md text-muted-foreground outline-none transition-colors duration-150 hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40"
              >
                <IconClose aria-hidden="true" className="size-4" />
              </DialogPrimitive.Close>
            </div>
            {header ? <div className="shrink-0 px-4 pb-3">{header}</div> : null}
            <nav aria-label={words.more} className="relative min-h-0 flex-1 overflow-y-auto px-3 pb-3">
              <Groups items={rest} current={current} onPress={onPress} variant="sheet" />
            </nav>
            {footer ? <div className="shrink-0 border-t border-border p-4">{footer}</div> : null}
          </DialogPrimitive.Content>
        </SheetPortal>
      ) : null}
    </Sheet>
  );
}

/**
 * One list of destinations that takes the shape the room allows, following the
 * compact, medium and expanded window classes: a bar along the bottom on a
 * phone, a rail of icons with tooltips on a tablet and a sidebar with groups on
 * a desktop. It measures its own width, not the window's, so the same shell
 * works in a full page, a split pane or a preview. Only one shape is in the
 * page at a time, the current item is marked in each (`aria-current`), and when
 * the shape changes focus goes back to the same item. The bar shows the first
 * four items and a "More" button that opens a sheet with the rest, with the
 * header and footer inside it; the sheet opens within the component, over the
 * page. Pass the page as `children`: it sits beside the sidebar or rail, and
 * above the bar.
 */
export function AdaptiveNav({ items, current, onNavigate, header, footer, breakpoints, initialForm = "sidebar", labels, children, className, ...props }: AdaptiveNavProps) {
  const words: Required<AdaptiveNavLabels> = { ...DEFAULT_LABELS, ...labels };
  const [node, setNode] = useState<HTMLDivElement | null>(null);
  const [form, setForm] = useState<NavForm>(initialForm);
  const [moreOpen, setMoreOpen] = useState(false);
  const formNow = useRef<NavForm>(initialForm);
  const wanted = useRef<string | null>(null);
  const medium = breakpoints?.medium;
  const expanded = breakpoints?.expanded;

  // The width of this component decides the shape. The first measure runs before the browser paints, so a phone never sees the sidebar.
  useBrowserLayoutEffect(() => {
    if (!node) return;
    const measure = () => {
      const next = formFor(node.getBoundingClientRect().width, { medium, expanded });
      if (next === formNow.current) return;
      // The element that has focus is about to be replaced by its twin in the new shape: remember which item it is.
      const active = document.activeElement;
      if (active instanceof HTMLElement && node.contains(active)) {
        const holder = active.closest<HTMLElement>("[data-nav-id], [data-nav-more]");
        wanted.current = holder?.hasAttribute("data-nav-more") ? MORE : (holder?.getAttribute("data-nav-id") ?? null);
      }
      formNow.current = next;
      setForm(next);
    };
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [node, medium, expanded]);

  // After the new shape is in the page: the same item gets focus back. The button of a sheet that is gone hands it to the current item.
  useBrowserLayoutEffect(() => {
    const id = wanted.current === MORE ? current : wanted.current;
    wanted.current = null;
    if (id === null || !node) return;
    const target = [...node.querySelectorAll<HTMLElement>("[data-nav-id]")].find((element) => element.getAttribute("data-nav-id") === id) ?? node.querySelector<HTMLElement>("[data-nav-more]");
    target?.focus({ preventScroll: true });
  }, [form, node, current]);

  // The sheet belongs to the bar: when the shape changes, it goes.
  if (form !== "bar" && moreOpen) setMoreOpen(false);

  const press: NavItemProps["onPress"] = (item, event) => {
    onNavigate?.(item, event);
    setMoreOpen(false);
  };
  const shared: Shared = { items, current, words, onPress: press, header, footer };

  return (
    <AdaptiveNavContext.Provider value={form}>
      <div
        {...props}
        ref={setNode}
        data-slot="adaptive-nav"
        data-form={form}
        className={cn("group/adaptive-nav relative flex min-h-0 w-full overflow-hidden bg-background text-foreground", form === "bar" ? "flex-col" : "flex-row", className)}
      >
        {form === "sidebar" ? <Sidebar {...shared} /> : null}
        {form === "rail" ? <Rail {...shared} /> : null}
        {/* The page scrolls here, on its own, so a keyboard can reach it too: a named region that takes focus. */}
        <div data-slot="adaptive-nav-content" role="region" aria-label={words.content} tabIndex={0} className="relative min-h-0 min-w-0 flex-1 overflow-y-auto outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:ring-inset">
          {children}
        </div>
        {form === "bar" ? <Bar {...shared} host={node} open={moreOpen} onOpenChange={setMoreOpen} /> : null}
      </div>
    </AdaptiveNavContext.Provider>
  );
}
