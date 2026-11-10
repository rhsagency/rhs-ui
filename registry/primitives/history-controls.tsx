"use client";

import { useEffect, useId, useMemo, useRef, useState, type ComponentProps, type MouseEvent, type PointerEvent, type RefObject } from "react";

import { IconArrowLeft, IconArrowRight, IconChevronDown } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@rhs-ui/primitives/dropdown-menu";
import { Kbd, KbdGroup } from "@rhs-ui/primitives/kbd";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@rhs-ui/primitives/tooltip";
import { cn } from "@/lib/utils";

export interface HistoryEntry {
  /** A stable key for the place. */
  id: string;
  /** Where it is, in words: "Invoices". It names the button, the tooltip and the menu item. */
  label: string;
}

export interface HistoryControlsLabels {
  /** The name of the pair for screen readers. Default "History". */
  group?: string;
  /** The name and tooltip of Back; `{label}` is where it goes. Default "Back to {label}". */
  back?: string;
  /** The name and tooltip of Forward. Default "Forward to {label}". */
  forward?: string;
  /** The name of Back while there is nowhere to go back to. Default "Back". */
  backEmpty?: string;
  /** The name of Forward while there is nowhere to go forward to. Default "Forward". */
  forwardEmpty?: string;
  /** Why Back is dimmed, in its tooltip. Default "Nothing to go back to". */
  atStart?: string;
  /** Why Forward is dimmed. Default "Nothing to go forward to". */
  atEnd?: string;
  /** The heading of the list of earlier places, and the name of its button. Default "Earlier places". */
  backMenu?: string;
  /** The same for later places. Default "Later places". */
  forwardMenu?: string;
  /** Said after a jump; `{label}` is where it landed. Default "Now on {label}". */
  arrived?: string;
  /** The last line of a list that was cut; `{count}` is how many more there are. Default "{count} more". */
  more?: string;
}

export interface HistoryControlsProps extends Omit<ComponentProps<"div">, "children"> {
  /** Every place visited, oldest first, the one you are on included. */
  entries: readonly HistoryEntry[];
  /** Where you are in `entries`, counting from zero. */
  index: number;
  /** Called with the index to go to: one step from a button, or any distance from a menu. You own the history; change `index` in response. */
  onNavigate: (index: number) => void;
  /** The most places a menu lists. Default 8. */
  maxMenu?: number;
  /** Alt with the left and right arrow, ignored while typing in a field. Default true. */
  shortcuts?: boolean;
  /** Listen only while focus is inside this element (a panel, a viewer) instead of anywhere on the page. */
  scope?: RefObject<HTMLElement | null>;
  /** Button size: 28, 32 or 40px (44px on touch screens). */
  size?: "sm" | "md" | "lg";
  /** `outline` puts both in one bar; `ghost` has no surface of its own. */
  variant?: "outline" | "ghost";
  /** The language of the numbers. Default "en-US". */
  locale?: string;
  /** The words used for the names, the tooltips and the announcements. */
  labels?: HistoryControlsLabels;
}

type Direction = "back" | "forward";

const BOX = {
  sm: { arrow: "size-7 [&_svg:not([class*='size-'])]:size-3.5 [@media(pointer:coarse)]:size-11", chevron: "h-7 w-4 [@media(pointer:coarse)]:h-11 [@media(pointer:coarse)]:w-6" },
  md: { arrow: "size-8 [&_svg:not([class*='size-'])]:size-4 [@media(pointer:coarse)]:size-11", chevron: "h-8 w-5 [@media(pointer:coarse)]:h-11 [@media(pointer:coarse)]:w-6" },
  lg: { arrow: "size-10 [&_svg:not([class*='size-'])]:size-[1.125rem] [@media(pointer:coarse)]:size-11", chevron: "h-10 w-6 [@media(pointer:coarse)]:h-11" },
} as const;

/** How long a press has to last before it opens the menu, in ms. */
const HOLD = 450;

/** True for a field where the keys belong to the person typing. */
function isTyping(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  if (target instanceof HTMLInputElement) return !["button", "checkbox", "radio", "submit", "reset", "range", "color", "file", "image"].includes(target.type);
  return target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement || target.closest("[role='textbox'], [role='searchbox'], [role='combobox']") !== null;
}

/** Keys are drawn for the platform, resolved after mount so the server and the browser agree. */
function useIsMac(): boolean {
  const [mac, setMac] = useState(false);
  useEffect(() => {
    const nav = navigator as Navigator & { userAgentData?: { platform?: string } };
    setMac(/mac|iphone|ipad/i.test(nav.userAgentData?.platform || nav.platform || nav.userAgent));
  }, []);
  return mac;
}

interface SideProps {
  direction: Direction;
  /** Where pressing it goes, or null when there is nowhere to go. */
  target: HistoryEntry | null;
  name: string;
  reason: string;
  menuName: string;
  list: readonly { entry: HistoryEntry; to: number }[];
  /** "" or "14 more". */
  rest: string;
  keys: readonly string[];
  size: "sm" | "md" | "lg";
  /** True for a moment after its key ran, so a key press shows on the button it belongs to. */
  flashing: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGo: (to: number) => void;
  onPress: () => void;
}

/** One side: the arrow, and the small chevron that lists where it would go. A press that is held opens the same list. */
function Side({ direction, target, name, reason, menuName, list, rest, keys, size, flashing, open, onOpenChange, onGo, onPress }: SideProps) {
  const arrow = useRef<HTMLButtonElement>(null);
  const timer = useRef<number | undefined>(undefined);
  const held = useRef(false);
  const origin = useRef<"arrow" | "chevron">("chevron");
  const off = target === null;
  useEffect(() => () => window.clearTimeout(timer.current), []);
  // A list closes with its reason to exist: when this side turns off (a jump to the far end, or the keys) while its list is open, the request is dropped too, or the list would open by itself the next time there is somewhere to go.
  useEffect(() => {
    if (off && open) onOpenChange(false);
  }, [off, open, onOpenChange]);

  const openFromArrow = () => {
    origin.current = "arrow";
    onOpenChange(true);
  };
  const begin = (event: PointerEvent<HTMLButtonElement>) => {
    if (off || (event.pointerType === "mouse" && event.button !== 0)) return;
    held.current = false;
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      held.current = true;
      openFromArrow();
    }, HOLD);
  };
  const end = () => window.clearTimeout(timer.current);

  const reasonId = `${useId()}-reason`;
  const Icon = direction === "back" ? IconArrowLeft : IconArrowRight;
  return (
    <div className="inline-flex items-center">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            ref={arrow}
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={name}
            aria-disabled={off || undefined}
            aria-describedby={off ? reasonId : undefined}
            aria-keyshortcuts={!off && keys.length ? (direction === "back" ? "Alt+ArrowLeft" : "Alt+ArrowRight") : undefined}
            data-flash={flashing || undefined}
            className={cn(
              BOX[size].arrow,
              "select-none [-webkit-touch-callout:none] data-[flash=true]:bg-muted",
              "aria-disabled:cursor-default aria-disabled:opacity-40 aria-disabled:hover:bg-transparent aria-disabled:active:translate-y-0",
            )}
            onPointerDown={begin}
            onPointerUp={end}
            onPointerLeave={end}
            onPointerCancel={end}
            onContextMenu={(event) => {
              // A right click, or a long press on a touch screen, asks for the list too.
              event.preventDefault();
              if (!off) openFromArrow();
            }}
            onClick={(event: MouseEvent<HTMLButtonElement>) => {
              // The press that opened the menu is not a click on the button.
              if (off || held.current) {
                held.current = false;
                event.preventDefault();
                return;
              }
              onPress();
            }}
          >
            <Icon />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className={cn(!off && keys.length ? "flex items-center gap-2.5" : undefined)}>
          {off ? reason : name}
          {!off && keys.length ? (
            <KbdGroup aria-hidden="true">
              {keys.map((key) => (
                <Kbd key={key} className="h-[1.125rem] min-w-[1.125rem] border-transparent bg-background/20 text-background">
                  {key}
                </Kbd>
              ))}
            </KbdGroup>
          ) : null}
        </TooltipContent>
      </Tooltip>
      {off ? (
        <span id={reasonId} className="sr-only">
          {reason}
        </span>
      ) : null}

      <DropdownMenu
        open={open && !off}
        onOpenChange={(next) => {
          // A chevron with nowhere to go opens nothing. Closing still goes through: a chosen place is told before the list closes, and by then this side may be off.
          if (next && off) return;
          if (next) origin.current = "chevron";
          onOpenChange(next);
        }}
      >
        <DropdownMenuTrigger asChild>
          {/* Dimmed, never disabled: a jump to the far end turns this off while its own list is closing, and a disabled button cannot take the focus back, so it would fall to the page. */}
          <Button
            type="button"
            variant="ghost"
            aria-label={menuName}
            aria-disabled={off || undefined}
            aria-describedby={off ? reasonId : undefined}
            className={cn(
              BOX[size].chevron,
              "px-0 text-muted-foreground hover:text-foreground data-[state=open]:bg-muted data-[state=open]:text-foreground [&_svg:not([class*='size-'])]:size-3",
              "aria-disabled:pointer-events-none aria-disabled:opacity-40",
            )}
          >
            <IconChevronDown strokeWidth={2.25} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          className="max-w-[min(20rem,var(--radix-dropdown-menu-content-available-width))] min-w-48"
          // A menu that a held press opened gives focus back to the arrow it came from, not to the chevron.
          onCloseAutoFocus={(event) => {
            if (origin.current !== "arrow") return;
            event.preventDefault();
            arrow.current?.focus({ preventScroll: true });
          }}
        >
          <DropdownMenuLabel>{menuName}</DropdownMenuLabel>
          {list.map(({ entry, to }) => (
            <DropdownMenuItem key={entry.id} onSelect={() => onGo(to)}>
              <span className="truncate">{entry.label}</span>
            </DropdownMenuItem>
          ))}
          {rest ? <DropdownMenuLabel className="pt-1 pb-1.5">{rest}</DropdownMenuLabel> : null}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

/**
 * Back and forward for an app that keeps its own history: a file manager, a wiki, a docs viewer, a panel that is
 * not a page. Each side is an arrow and a small chevron: the tooltip says where the arrow goes ("Back to
 * Invoices"), and the chevron, a press held on the arrow, or a right click opens a real menu of the places
 * before (or after) this one, nearest first, to jump straight to one. At either end the arrow dims and says why.
 * Alt with the left and right arrow work too, but never while typing in a field. A jump is announced ("Now on
 * Invoices"). It never touches window.history: you keep the list and the position, and change them when it
 * calls `onNavigate`.
 */
export function HistoryControls({
  entries,
  index,
  onNavigate,
  maxMenu = 8,
  shortcuts = true,
  scope,
  size = "md",
  variant = "outline",
  locale = "en-US",
  labels,
  className,
  "aria-label": ariaLabel,
  ...props
}: HistoryControlsProps) {
  const words = {
    group: labels?.group ?? "History",
    back: labels?.back ?? "Back to {label}",
    forward: labels?.forward ?? "Forward to {label}",
    backEmpty: labels?.backEmpty ?? "Back",
    forwardEmpty: labels?.forwardEmpty ?? "Forward",
    atStart: labels?.atStart ?? "Nothing to go back to",
    atEnd: labels?.atEnd ?? "Nothing to go forward to",
    backMenu: labels?.backMenu ?? "Earlier places",
    forwardMenu: labels?.forwardMenu ?? "Later places",
    arrived: labels?.arrived ?? "Now on {label}",
    more: labels?.more ?? "{count} more",
  };
  const numbers = useMemo(() => new Intl.NumberFormat(locale), [locale]);
  const mac = useIsMac();
  const last = entries.length - 1;
  const at = last < 0 ? -1 : Math.min(Math.max(Math.round(index), 0), last);
  const limit = Math.max(1, Math.floor(maxMenu));

  const before = at > 0 ? entries.slice(0, at).map((entry, to) => ({ entry, to })).reverse() : [];
  const after = at >= 0 && at < last ? entries.slice(at + 1).map((entry, offset) => ({ entry, to: at + 1 + offset })) : [];
  const back = before[0]?.entry ?? null;
  const forward = after[0]?.entry ?? null;
  const rest = (list: readonly unknown[]) => (list.length > limit ? words.more.replace("{count}", numbers.format(list.length - limit)) : "");

  const [menu, setMenu] = useState<Direction | null>(null);
  const [flash, setFlash] = useState<Direction | null>(null);
  const [heard, setHeard] = useState({ id: 0, text: "" });
  const flashTimer = useRef<number | undefined>(undefined);
  const clearTimer = useRef<number | undefined>(undefined);
  useEffect(
    () => () => {
      window.clearTimeout(flashTimer.current);
      window.clearTimeout(clearTimer.current);
    },
    [],
  );

  const say = (text: string) => {
    window.clearTimeout(clearTimer.current);
    // A new id remounts the text, so saying the same thing twice is heard twice.
    setHeard((previous) => ({ id: previous.id + 1, text }));
    clearTimer.current = window.setTimeout(() => setHeard((previous) => ({ ...previous, text: "" })), 3000);
  };
  const blink = (which: Direction) => {
    window.clearTimeout(flashTimer.current);
    setFlash(which);
    flashTimer.current = window.setTimeout(() => setFlash(null), 180);
  };
  const go = (to: number) => {
    const entry = entries[to];
    if (!entry) return;
    onNavigate(to);
    say(words.arrived.replace("{label}", entry.label));
  };
  const step = (direction: Direction) => {
    const to = direction === "back" ? at - 1 : at + 1;
    if (to < 0 || to > last) {
      say(direction === "back" ? words.atStart : words.atEnd);
      return;
    }
    blink(direction);
    go(to);
  };

  const latest = useRef(step);
  useEffect(() => {
    latest.current = step;
  });
  useEffect(() => {
    if (!shortcuts) return;
    const host: EventTarget = scope?.current ?? document;
    const onKey = (raw: Event) => {
      const event = raw as KeyboardEvent;
      if (event.defaultPrevented || event.isComposing || !event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || isTyping(event.target)) return;
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      // The browser's own Alt and arrow would leave the page: with an app of its own history, the keys are the app's.
      event.preventDefault();
      latest.current(event.key === "ArrowLeft" ? "back" : "forward");
    };
    host.addEventListener("keydown", onKey);
    return () => host.removeEventListener("keydown", onKey);
  }, [shortcuts, scope]);

  const alt = mac ? "⌥" : "Alt";
  const joined = variant === "outline";
  return (
    <TooltipProvider delayDuration={300}>
      <div
        role="group"
        aria-label={ariaLabel ?? words.group}
        data-slot="history-controls"
        data-size={size}
        data-variant={variant}
        className={cn("inline-flex items-center", joined ? "gap-0.5 rounded-lg border border-border bg-background p-0.5 shadow-xs" : "gap-1", className)}
        {...props}
      >
        <Side
          direction="back"
          target={back}
          name={back ? words.back.replace("{label}", back.label) : words.backEmpty}
          reason={words.atStart}
          menuName={words.backMenu}
          list={before.slice(0, limit)}
          rest={rest(before)}
          keys={shortcuts ? [alt, "←"] : []}
          size={size}
          flashing={flash === "back"}
          open={menu === "back"}
          onOpenChange={(open) => setMenu(open ? "back" : null)}
          onGo={go}
          onPress={() => step("back")}
        />
        {joined ? <span aria-hidden="true" className="mx-0.5 h-4 w-px bg-border" /> : null}
        <Side
          direction="forward"
          target={forward}
          name={forward ? words.forward.replace("{label}", forward.label) : words.forwardEmpty}
          reason={words.atEnd}
          menuName={words.forwardMenu}
          list={after.slice(0, limit)}
          rest={rest(after)}
          keys={shortcuts ? [alt, "→"] : []}
          size={size}
          flashing={flash === "forward"}
          open={menu === "forward"}
          onOpenChange={(open) => setMenu(open ? "forward" : null)}
          onGo={go}
          onPress={() => step("forward")}
        />
        <span role="status" className="sr-only">
          <span key={heard.id}>{heard.text}</span>
        </span>
      </div>
    </TooltipProvider>
  );
}
