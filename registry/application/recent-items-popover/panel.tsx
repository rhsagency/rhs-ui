"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore, type ComponentProps, type KeyboardEvent, type MouseEvent, type ReactNode } from "react";

import { IconBoard, IconCheck, IconDatabase, IconFile, IconFileSheet, IconFileText, IconFolder, IconHistory, IconImage, IconLayers, IconPushpin } from "@rhs-ui/icons";
import {
  DEFAULT_KINDS,
  DEFAULT_LABELS,
  exactText,
  fill,
  groupItems,
  kindLabel,
  plural,
  stampText,
  timeText,
  toTimestamp,
  type RecentGroupId,
  type RecentItem,
  type RecentItemsLabels,
  type RecentTime,
} from "@rhs-ui/application/recent-items-popover/recent";
import { Button } from "@rhs-ui/primitives/button";
import { Kbd, KbdGroup } from "@rhs-ui/primitives/kbd";
import { cn } from "@/lib/utils";

export interface RecentItemsPanelProps extends Omit<ComponentProps<"div">, "children"> {
  /** What was opened: an id, a title, a kind, a link, when it was opened and whether it is pinned. Any order; the panel orders them. */
  items: readonly RecentItem[];
  /** A row was opened, by a click or by Enter. The event comes with it, so a client-side router can call `preventDefault()`. */
  onOpen?: (item: RecentItem, event: MouseEvent<HTMLElement>) => void;
  /** An item was pinned or unpinned, by its pin button or by pressing P on the row. Update `pinned` on the item. Leave it out for no pinning. */
  onPin?: (item: RecentItem, pinned: boolean) => void;
  /**
   * The history was cleared and the few seconds to undo it have passed. It receives the items that went. Clear history never
   * asks first: the items vanish, an Undo button appears, and only when it goes unused is this called, so it is also the moment to
   * delete them on your side. Closing the popover or leaving the page ends the wait and calls it at once. Pinned items are kept.
   * Remove the items from `items` here, or they come back. Leave it out for no Clear button.
   */
  onClear?: (cleared: readonly RecentItem[]) => void;
  /** How many of the unpinned items are listed. Pinned items are always listed. Default 8. */
  max?: number;
  /** How long Undo is on offer after Clear, in milliseconds. Default 6000. */
  undoMs?: number;
  /** Called after a row was used, so a popover around the panel can close. */
  onNavigate?: () => void;
  /** The moment the headings and the times are measured against. Leave it out to use the browser's clock once the page is live; pass it for the same headings in server HTML, in tests and in previews. */
  now?: RecentTime;
  /** The language of the words and the dates. Default "en-US". */
  locale?: string;
  /** The time zone whose calendar days decide Today and Yesterday, so the server and the browser agree. Default "UTC". */
  timeZone?: string;
  /** The words the panel says, for translation. */
  labels?: RecentItemsLabels;
}

/** The drawing for each kind of thing. A kind that is not here gets a file. */
const KIND_ICONS: Record<string, ReactNode> = {
  project: <IconLayers />,
  document: <IconFileText />,
  record: <IconDatabase />,
  board: <IconBoard />,
  folder: <IconFolder />,
  file: <IconFile />,
  sheet: <IconFileSheet />,
  image: <IconImage />,
};

const subscribeNever = (): (() => void) => () => undefined;

/**
 * The clock the headings and the times are read against: `now` when it is given, otherwise the browser's, once the page is
 * live and then once a minute. Null while the server renders and while the browser hydrates, so both write the same text; a
 * panel that mounts after the page is live has the time at once.
 */
function useClock(now: RecentTime | undefined): number | null {
  const mounted = useSyncExternalStore(subscribeNever, () => true, () => false);
  const [tick, setTick] = useState(() => Date.now());
  const pinned = now !== undefined;
  useEffect(() => {
    if (pinned) return;
    const timer = window.setInterval(() => setTick(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, [pinned]);
  if (pinned) {
    const at = toTimestamp(now);
    if (!Number.isNaN(at)) return at;
  }
  return mounted ? tick : null;
}

interface RowProps {
  item: RecentItem;
  active: boolean;
  clock: number | null;
  locale: string;
  timeZone: string;
  words: Required<RecentItemsLabels>;
  pinnable: boolean;
  onActive: (id: string) => void;
  onOpen: (item: RecentItem, event: MouseEvent<HTMLElement>) => void;
  onPin: (item: RecentItem, pinned: boolean) => void;
}

function Row({ item, active, clock, locale, timeZone, words, pinnable, onActive, onOpen, onPin }: RowProps) {
  const at = toTimestamp(item.openedAt);
  const shown = clock === null ? stampText(at, locale, timeZone) : timeText(at, clock, locale, timeZone);
  const kind = kindLabel(item.kind, words.kinds);
  // The name of the row is what it shows: the title, the kind and the time, so what a person reads is what a screen reader says.
  const shared = {
    "data-row": "",
    "data-id": item.id,
    "aria-keyshortcuts": pinnable ? "P" : undefined,
    tabIndex: active ? 0 : -1,
    title: item.title,
    onFocus: () => onActive(item.id),
    onClick: (event: MouseEvent<HTMLElement>) => onOpen(item, event),
    className:
      "flex min-w-0 flex-1 items-center gap-3 rounded-md py-2 pl-2.5 text-left outline-none focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-ring/40",
  } as const;
  const content = (
    <>
      <span aria-hidden="true" className="grid size-8 shrink-0 place-items-center rounded-md border border-border bg-background text-foreground [&_svg]:size-4">
        {KIND_ICONS[item.kind] ?? <IconFile />}
      </span>
      <span className="grid min-w-0 flex-1">
        <span className="truncate text-sm font-medium tracking-[-0.01em]">{item.title}</span>
        <span className="truncate text-xs text-muted-foreground">{kind}</span>
      </span>
      <time dateTime={Number.isNaN(at) ? undefined : new Date(at).toISOString()} title={exactText(at, locale, timeZone)} className="shrink-0 text-xs text-muted-foreground tabular-nums">
        {shown}
      </time>
    </>
  );
  return (
    <li data-item-id={item.id} className="group/row">
      <div className="flex items-center gap-0.5 rounded-md pr-1.5 transition-colors duration-150 focus-within:bg-muted/70 hover:bg-muted/70 motion-reduce:transition-none">
        {item.href ? (
          <a href={item.href} {...shared}>
            {content}
          </a>
        ) : (
          <button type="button" {...shared}>
            {content}
          </button>
        )}
        {pinnable ? (
          // Out of the tab order on purpose: the row is the one stop, and P pins it from there. The button is for a pointer and a finger.
          <button
            type="button"
            tabIndex={-1}
            aria-label={fill(item.pinned ? words.unpin : words.pin, { title: item.title })}
            onClick={() => onPin(item, !item.pinned)}
            className={cn(
              "grid size-7 shrink-0 place-items-center rounded-md text-muted-foreground outline-none transition-[opacity,color,background-color] duration-150 hover:bg-background hover:text-foreground focus-visible:opacity-100 focus-visible:ring-[3px] focus-visible:ring-ring/40 motion-reduce:transition-none",
              item.pinned ? "text-foreground" : "opacity-0 group-hover/row:opacity-100 group-focus-within/row:opacity-100 [@media(hover:none)]:opacity-100",
            )}
          >
            <IconPushpin aria-hidden="true" className={cn("size-4", item.pinned && "fill-current")} />
          </button>
        ) : null}
      </div>
    </li>
  );
}

/** The few seconds in which a cleared history can be brought back: what was cleared, Undo, and a line that runs out. */
function UndoBar({ count, undoMs, locale, words, onUndo }: { count: number; undoMs: number; locale: string; words: Required<RecentItemsLabels>; onUndo: () => void }) {
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    // One frame at full width, then to nothing over the whole wait.
    const frame = window.requestAnimationFrame(() => setArmed(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);
  return (
    <div className="relative flex shrink-0 items-center justify-between gap-3 border-b border-border bg-muted/40 py-2 pr-2.5 pl-4">
      <p className="flex min-w-0 items-center gap-2 text-sm">
        <IconCheck aria-hidden="true" className="size-4 shrink-0" />
        <span className="truncate tabular-nums">{fill(plural(count, words.clearedOne, words.clearedMany, locale), { count: new Intl.NumberFormat(locale).format(count) })}</span>
      </p>
      <Button type="button" variant="outline" size="sm" onClick={onUndo} className="shrink-0">
        {words.undo}
      </Button>
      <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-0.5 bg-transparent motion-reduce:hidden">
        <span style={{ transitionDuration: `${undoMs}ms` }} className={cn("block h-full bg-foreground/50 transition-[width] ease-linear", armed ? "w-0" : "w-full")} />
      </span>
    </div>
  );
}

const GROUP_WORD: Record<RecentGroupId, keyof Omit<Required<RecentItemsLabels>, "kinds">> = {
  pinned: "groupPinned",
  today: "groupToday",
  yesterday: "groupYesterday",
  earlier: "groupEarlier",
  recent: "groupRecent",
};

/**
 * The inside of the recent items popover, on its own, for a sheet on a phone: what was opened, under Pinned, Today, Yesterday
 * and Earlier, each row with a kind icon, a title cut to one line and how long ago. One tab stop; the arrow keys, Home and End
 * move between rows, Enter opens one and P pins it. Clear history asks no question: the items go, Undo is on offer for a few
 * seconds, and only then is it final. With nothing opened yet it says that recent items appear after opening something. The
 * days are read in `timeZone` against `now`, so the server and the browser agree.
 */
export function RecentItemsPanel({
  items,
  onOpen,
  onPin,
  onClear,
  max = 8,
  undoMs = 6000,
  onNavigate,
  now,
  locale = "en-US",
  timeZone = "UTC",
  labels,
  className,
  ...props
}: RecentItemsPanelProps) {
  const words: Required<RecentItemsLabels> = { ...DEFAULT_LABELS, ...labels, kinds: { ...DEFAULT_KINDS, ...labels?.kinds } };
  const headingId = useId();
  const clock = useClock(now);
  const root = useRef<HTMLDivElement>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [cleared, setCleared] = useState<readonly RecentItem[] | null>(null);
  const [said, setSaid] = useState("");
  const timer = useRef<number | undefined>(undefined);
  const waiting = useRef<readonly RecentItem[] | null>(null);
  const refocus = useRef<string | null>(null);
  const latestClear = useRef(onClear);
  useEffect(() => {
    latestClear.current = onClear;
  });

  // Closing the popover, or leaving the page, ends the wait: the clear is final and the consumer hears of it at once.
  useEffect(
    () => () => {
      window.clearTimeout(timer.current);
      const pending = waiting.current;
      if (pending) {
        waiting.current = null;
        latestClear.current?.(pending);
      }
    },
    [],
  );

  // A pinned row moves to another group, which is another list in the page: focus follows it to its new place.
  useEffect(() => {
    const id = refocus.current;
    if (id === null) return;
    const target = [...(root.current?.querySelectorAll<HTMLElement>("[data-row]") ?? [])].find((row) => row.dataset.id === id);
    if (target) {
      refocus.current = null;
      target.focus();
    }
  });

  const gone = new Set((cleared ?? []).map((item) => item.id));
  const visible = items.filter((item) => item.pinned || !gone.has(item.id));
  const groups = groupItems(visible, clock, timeZone, max);
  const rows = groups.flatMap((group) => group.items);
  const current = rows.some((row) => row.id === activeId) ? activeId : (rows[0]?.id ?? null);
  const clearable = visible.filter((item) => !item.pinned);
  const pinnable = onPin !== undefined;

  function open(item: RecentItem, event: MouseEvent<HTMLElement>) {
    onOpen?.(item, event);
    onNavigate?.();
  }

  function pin(item: RecentItem, next: boolean) {
    if (!onPin) return;
    refocus.current = item.id;
    onPin(item, next);
    setSaid(fill(next ? words.pinnedSaid : words.unpinnedSaid, { title: item.title }));
  }

  function clear() {
    if (cleared !== null || clearable.length === 0) return;
    window.clearTimeout(timer.current);
    waiting.current = clearable;
    setCleared(clearable);
    setSaid(fill(words.clearedSaid, { seconds: Math.max(1, Math.round(undoMs / 1000)) }));
    timer.current = window.setTimeout(() => {
      const pending = waiting.current;
      waiting.current = null;
      if (pending) latestClear.current?.(pending);
      setCleared(null);
    }, undoMs);
  }

  function undo() {
    window.clearTimeout(timer.current);
    waiting.current = null;
    setCleared(null);
    setSaid(words.restored);
  }

  function onKeyDown(event: KeyboardEvent<HTMLElement>) {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const holder = target.closest<HTMLElement>("[data-item-id]");
    if (!holder) return;
    if (event.key.toLowerCase() === "p" && !event.metaKey && !event.ctrlKey && !event.altKey) {
      const item = rows.find((row) => row.id === holder.dataset.itemId);
      if (item && pinnable) {
        event.preventDefault();
        pin(item, !item.pinned);
      }
      return;
    }
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
    const list = [...event.currentTarget.querySelectorAll<HTMLElement>("[data-row]")];
    const at = list.findIndex((row) => row.closest("[data-item-id]") === holder);
    const next = event.key === "Home" ? 0 : event.key === "End" ? list.length - 1 : Math.min(list.length - 1, Math.max(0, at + (event.key === "ArrowDown" ? 1 : -1)));
    event.preventDefault();
    list[next]?.focus();
  }

  return (
    <div ref={root} data-slot="recent-items-panel" role="group" aria-labelledby={headingId} className={cn("flex min-h-0 flex-col bg-popover text-popover-foreground", className)} {...props}>
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border py-2 pr-2.5 pl-4">
        <h2 id={headingId} className="text-sm font-semibold tracking-[-0.01em]">
          {words.title}
        </h2>
        {onClear ? (
          // Not `disabled`: clearing turns the button off, and a disabled button would drop the focus it has.
          <Button
            type="button"
            variant="ghost"
            size="sm"
            aria-disabled={clearable.length === 0 || cleared !== null || undefined}
            onClick={clear}
            className="text-muted-foreground hover:text-foreground aria-disabled:pointer-events-none aria-disabled:opacity-50"
          >
            {words.clear}
          </Button>
        ) : null}
      </div>

      {cleared !== null ? <UndoBar key="undo" count={cleared.length} undoMs={undoMs} locale={locale} words={words} onUndo={undo} /> : null}

      {groups.length ? (
        <div onKeyDown={onKeyDown} className="relative min-h-0 flex-1 overflow-y-auto overscroll-contain py-1 [scrollbar-width:thin]">
          {groups.map((group) => (
            <div key={group.id} role="group" aria-labelledby={`${headingId}-${group.id}`} className="pb-1">
              <h3 id={`${headingId}-${group.id}`} className="px-4 pt-2.5 pb-1 text-xs font-medium text-muted-foreground">
                {words[GROUP_WORD[group.id]]}
              </h3>
              <ul className="grid gap-px px-1.5">
                {group.items.map((item) => (
                  <Row
                    key={item.id}
                    item={item}
                    active={item.id === current}
                    clock={clock}
                    locale={locale}
                    timeZone={timeZone}
                    words={words}
                    pinnable={pinnable}
                    onActive={setActiveId}
                    onOpen={open}
                    onPin={pin}
                  />
                ))}
              </ul>
            </div>
          ))}
        </div>
      ) : cleared === null ? (
        <div className="flex flex-1 flex-col items-center gap-1 px-6 py-10 text-center">
          <span aria-hidden="true" className="mb-3 grid size-10 place-items-center rounded-full border border-border bg-muted text-foreground [&_svg]:size-[1.125rem]">
            <IconHistory />
          </span>
          <p className="text-sm font-medium">{words.emptyTitle}</p>
          <p className="max-w-[17rem] text-[0.8125rem] leading-relaxed text-muted-foreground">{words.emptyBody}</p>
        </div>
      ) : null}

      {rows.length ? (
        <div className="flex shrink-0 items-center gap-4 border-t border-border bg-muted/30 px-4 py-2 text-xs text-muted-foreground max-sm:hidden">
          <span className="inline-flex items-center gap-1.5">
            <KbdGroup>
              <Kbd aria-hidden="true">↑</Kbd>
              <Kbd aria-hidden="true">↓</Kbd>
            </KbdGroup>
            {words.hintMove}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Kbd aria-hidden="true">Enter</Kbd>
            {words.hintOpen}
          </span>
          {pinnable ? (
            <span className="inline-flex items-center gap-1.5">
              <Kbd aria-hidden="true">P</Kbd>
              {words.hintPin}
            </span>
          ) : null}
        </div>
      ) : null}

      {/* Kept in the page when empty: a live region that appears together with its message is often never read. */}
      <p role="status" aria-live="polite" className="sr-only">
        {said}
      </p>
    </div>
  );
}
