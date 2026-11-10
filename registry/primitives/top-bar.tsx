"use client";

import { useEffect, useLayoutEffect, useRef, useState, type ComponentProps, type MouseEvent, type ReactNode, type RefObject } from "react";

import { IconChevronLeft, IconMoreHorizontal } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@rhs-ui/primitives/dropdown-menu";
import { cn } from "@/lib/utils";

export interface TopBarAction {
  /** A stable key for the action. */
  id: string;
  /** What it does: the name of its button, and its line in the menu once it has folded. */
  label: string;
  /** The icon, as an element: `<IconSearch />`. */
  icon: ReactNode;
  /** Called when the action is chosen, from its button or from the menu it has folded into. */
  onSelect?: () => void;
  /** Makes it a link instead of a button. */
  href?: string;
  /** Switches the action off: its button is dimmed and does nothing, and so is its line in the menu. It has no effect on a link (an action with an `href`). */
  disabled?: boolean;
  /** Drawn as a destructive item in the menu. */
  destructive?: boolean;
  /** Which actions fold first when space runs out: the lower the number, the sooner. Equal numbers fold from the end. Default 0. */
  priority?: number;
  /** Never folds into the menu. */
  pinned?: boolean;
}

export interface TopBarLabels {
  /** The name of the back button when `backLabel` is not given. Default "Back". */
  back?: string;
  /** The name of the button that opens the folded actions. Default "More actions". */
  more?: string;
}

export interface TopBarProps extends Omit<ComponentProps<"header">, "title"> {
  /** The name of the screen. With `large` it is the big heading; without it, the bar's own. Either way it is the one heading of the bar. */
  title: string;
  /** A line under the title, in a lighter weight. */
  subtitle?: string;
  /** Shows a back button, a chevron, and calls this when it is pressed. */
  onBack?: () => void;
  /** Makes the back button a link to this address; `onBack` still gets a plain click. */
  backHref?: string;
  /** The accessible name of the back button, with where it goes: "Back to orders". Default "Back". */
  backLabel?: string;
  /** Replaces the back button, for a menu button or a logo. */
  leading?: ReactNode;
  /** The actions on the right. They fold into a "more" menu, lowest priority first, before the title is cut. */
  actions?: readonly TopBarAction[];
  /** A big title under the bar that scrolls away with the content; the bar's own title fades in as it goes under. Default false. */
  large?: boolean;
  /** Keeps the bar at the top of the scroll container. Default true. */
  sticky?: boolean;
  /** No bottom border, ever. By default a sticky bar gets one only once content has scrolled under it. */
  borderless?: boolean;
  /** The heading level of the title. Default `h1`; use `h2` or lower when the page already has an `h1`. */
  as?: "h1" | "h2" | "h3" | "h4";
  /** The element that scrolls, when it is not the nearest scrolling parent of the bar. */
  scrollContainer?: RefObject<HTMLElement | null>;
  /** The hidden names of the back button and of the folded-actions menu, for another language. */
  labels?: TopBarLabels;
}

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

const clamp = (n: number, low: number, high: number) => Math.min(Math.max(n, low), high);

/** The nearest ancestor that scrolls vertically, or null for the window. */
function scrollParentOf(element: HTMLElement): HTMLElement | null {
  for (let node = element.parentElement; node; node = node.parentElement) {
    const { overflowY } = getComputedStyle(node);
    if (overflowY === "auto" || overflowY === "scroll" || overflowY === "overlay") return node;
  }
  return null;
}

/** A button is 2.5rem (40px) wide, with a 0.25rem gap. */
const UNIT = 40;

/** Which actions have to fold, by id, so that `slots` buttons fit. One slot goes to the menu button. */
function foldedFor(actions: readonly TopBarAction[], slots: number): Set<string> {
  if (slots >= actions.length) return new Set();
  const room = Math.max(0, slots - 1);
  const order = actions
    .map((action, index) => ({ action, index }))
    .filter(({ action }) => !action.pinned)
    .sort((a, b) => (a.action.priority ?? 0) - (b.action.priority ?? 0) || b.index - a.index);
  return new Set(order.slice(0, Math.max(0, actions.length - room)).map(({ action }) => action.id));
}

/**
 * The app bar of a phone-first screen: a back button, a title that truncates with an ellipsis (its full
 * text stays in the page for assistive technology), actions on the right, and an optional large title
 * that settles into the bar as the content scrolls under it. When space runs out the actions fold into a
 * "more" menu, lowest priority first, before the title is cut. It keeps clear of the top safe area, its
 * bottom border appears only once content has scrolled under the bar, and the title is the one
 * heading of the bar: the large one when there is one, so the outline never doubles.
 */
export function TopBar({ title, subtitle, onBack, backHref, backLabel, leading, actions = [], large = false, sticky = true, borderless = false, as: Heading = "h1", scrollContainer, labels, className, ...props }: TopBarProps) {
  const words = { back: backLabel ?? labels?.back ?? "Back", more: labels?.more ?? "More actions" };
  const bar = useRef<HTMLElement>(null);
  const row = useRef<HTMLDivElement>(null);
  const lead = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);
  const big = useRef<HTMLHeadingElement>(null);
  const [folded, setFolded] = useState<ReadonlySet<string>>(() => new Set());
  const signature = actions.map((action) => `${action.id}:${action.priority ?? 0}:${action.pinned ? 1 : 0}`).join("|");
  const latest = useRef(actions);
  useEffect(() => {
    latest.current = actions;
  });

  // The scroll decides two things: how far the large title has gone under the bar (0 to 1), and whether anything is under it at all.
  useIsoLayoutEffect(() => {
    const element = bar.current;
    if (!element) return;
    const parent = scrollContainer?.current ?? scrollParentOf(element);
    const source: HTMLElement | Window = parent ?? window;
    let frame = 0;
    const update = () => {
      frame = 0;
      let progress = 0;
      if (large && big.current) {
        // 0 while the big title is clear of the bar, 1 once the whole of it has gone under.
        const heading = big.current.getBoundingClientRect();
        progress = clamp((element.getBoundingClientRect().bottom - heading.top) / Math.max(heading.height, 1), 0, 1);
      }
      const offset = parent ? parent.scrollTop : window.scrollY;
      // The bar's own title fades in while the big one is going under, so one takes over from the other.
      element.style.setProperty("--tb-title", clamp((progress - 0.3) / 0.7, 0, 1).toFixed(3));
      element.dataset.scrolled = (large ? progress >= 0.99 : offset > 0) ? "true" : "false";
    };
    const queue = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    update();
    source.addEventListener("scroll", queue, { passive: true });
    const observer = new ResizeObserver(queue);
    observer.observe(element);
    if (big.current) observer.observe(big.current);
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      source.removeEventListener("scroll", queue);
      observer.disconnect();
    };
  }, [large, scrollContainer]);

  // The room left for actions is what the back button and the whole title leave. Actions fold before the title is cut.
  useIsoLayoutEffect(() => {
    const element = row.current;
    if (!element) return;
    const measure = () => {
      const list = latest.current;
      const title = label.current;
      if (!list.length || !title) {
        setFolded((now) => (now.size ? new Set() : now));
        return;
      }
      const style = getComputedStyle(element);
      const gap = Number.parseFloat(style.columnGap) || 4;
      const inner = element.clientWidth - Number.parseFloat(style.paddingLeft) - Number.parseFloat(style.paddingRight);
      // The title is as wide as its text (it is inline-block, so scrollWidth is the text, not the box), with 0.5rem of padding on each side and a gap on each side of it.
      const space = inner - (lead.current?.offsetWidth ?? 0) - title.scrollWidth - 16 - gap * 2;
      const slots = Math.floor((space + gap) / (UNIT + gap));
      const next = foldedFor(list, slots);
      setFolded((now) => (now.size === next.size && [...next].every((id) => now.has(id)) ? now : next));
    };
    measure();
    // The observer answers on the next frame: a change of layout in its own callback ends in "loop completed with undelivered notifications".
    let frame = 0;
    const observer = new ResizeObserver(() => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(measure);
    });
    observer.observe(element);
    // A web font arriving changes the width of the title.
    void document.fonts?.ready.then(measure);
    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [signature, title, Boolean(onBack || backHref || leading)]);

  const plainBack = (event: MouseEvent<HTMLElement>) => {
    if (!onBack) return;
    if (backHref && (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)) return;
    event.preventDefault();
    onBack();
  };
  const back = leading ?? (onBack || backHref ? (
    backHref ? (
      <Button asChild variant="ghost" size="icon">
        <a href={backHref} aria-label={words.back} onClick={plainBack}>
          <IconChevronLeft />
        </a>
      </Button>
    ) : (
      <Button type="button" variant="ghost" size="icon" aria-label={words.back} onClick={onBack}>
        <IconChevronLeft />
      </Button>
    )
  ) : null);

  const inRow = actions.filter((action) => !folded.has(action.id));
  const inMenu = actions.filter((action) => folded.has(action.id));
  const small = "truncate text-[0.9375rem] leading-5 font-semibold tracking-[-0.01em]";

  return (
    <>
      <header
        ref={bar}
        data-slot="top-bar"
        data-large={large || undefined}
        className={cn(
          "z-20 bg-background pt-[max(env(safe-area-inset-top),var(--top-bar-inset,0px))] text-foreground",
          sticky && "sticky top-0",
          !borderless && "border-b transition-[border-color] duration-150 motion-reduce:transition-none",
          !borderless && (sticky ? "border-transparent data-[scrolled=true]:border-border" : "border-border"),
          className,
        )}
        {...props}
      >
        <div ref={row} className="flex h-14 items-center gap-1 px-2">
          {back ? (
            <div ref={lead} className="flex shrink-0 items-center">
              {back}
            </div>
          ) : null}
          <div className={cn("min-w-0 flex-1 px-2", !back && "pl-3")}>
            {large ? (
              // The big title below is the heading; this copy only has to be seen, once the big one has gone under the bar.
              <span ref={label} aria-hidden="true" style={{ opacity: "var(--tb-title, 0)" }} className={cn(small, "inline-block max-w-full align-top")}>
                {title}
              </span>
            ) : (
              <Heading className="m-0">
                <span ref={label} className={cn(small, "inline-block max-w-full align-top")}>
                  {title}
                </span>
              </Heading>
            )}
            {subtitle && !large ? <p className="m-0 truncate text-xs leading-4 text-muted-foreground">{subtitle}</p> : null}
          </div>
          {actions.length ? (
            <div className="flex shrink-0 items-center gap-1">
              {inRow.map((action) =>
                action.href ? (
                  <Button key={action.id} asChild variant="ghost" size="icon">
                    <a href={action.href} aria-label={action.label} onClick={action.onSelect}>
                      {action.icon}
                    </a>
                  </Button>
                ) : (
                  <Button key={action.id} type="button" variant="ghost" size="icon" aria-label={action.label} disabled={action.disabled} onClick={action.onSelect}>
                    {action.icon}
                  </Button>
                ),
              )}
              {inMenu.length ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button type="button" variant="ghost" size="icon" aria-label={words.more}>
                      <IconMoreHorizontal />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="min-w-44">
                    {inMenu.map((action) => (
                      <DropdownMenuItem key={action.id} variant={action.destructive ? "destructive" : "default"} disabled={action.disabled} onSelect={() => action.onSelect?.()}>
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
      </header>
      {large ? (
        <div className="bg-background px-4 pt-1 pb-3">
          <Heading ref={big} className="m-0 line-clamp-2 text-[1.75rem] leading-8 font-semibold tracking-[-0.04em] text-balance text-foreground">
            {title}
          </Heading>
          {subtitle ? <p className="mt-1 mb-0 text-sm text-muted-foreground">{subtitle}</p> : null}
        </div>
      ) : null}
    </>
  );
}
