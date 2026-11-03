"use client";

import { useEffect, useId, useMemo, useRef, useState, type ComponentProps, type CSSProperties, type KeyboardEvent, type ReactNode } from "react";

import { IconBan, IconChevronsUpDown, IconShapes } from "@rhs-ui/icons";
import { filterIcons, fold, humanize, scrollbarWidth, type IconEntry } from "@rhs-ui/primitives/icon-picker/search";
import { fieldSurface } from "@rhs-ui/primitives/input";
import { Popover, PopoverContent, PopoverTrigger } from "@rhs-ui/primitives/popover";
import { SearchInput } from "@rhs-ui/primitives/search-input";
import { cn } from "@/lib/utils";

/**
 * One icon of the set, as a rendered element (`<IconStar />`). An element, not a component, so the same set can be
 * handed over from a Server Component and from a client module alike.
 */
export type IconSource = ReactNode;

/** Every sentence the picker says or shows. Each one can be replaced, for another language or your own voice. */
export interface IconPickerMessages {
  /** On the field while nothing is chosen. */
  placeholder: string;
  /** The name and the placeholder of the search box. */
  search: string;
  /** The label of the cell that clears the choice, with `allowNone`. */
  none: string;
  /** The name of the grid for a screen reader. */
  list: string;
  /** The count under the grid, and read out when a search changes it: "24 icons". */
  count: (count: number) => string;
  /** What the grid says when a search finds nothing. */
  empty: (query: string) => string;
}

const MESSAGES: IconPickerMessages = {
  placeholder: "Choose an icon",
  search: "Search icons",
  none: "None",
  list: "Icons",
  count: (count) => `${count} ${count === 1 ? "icon" : "icons"}`,
  empty: (query) => `No icon matches “${query}”`,
};

export interface IconPickerProps extends Omit<ComponentProps<"button">, "value" | "defaultValue" | "onChange" | "children" | "name"> {
  /** The icons to choose from: the name each one is stored under, and the icon as a rendered element (`{ folder: <IconFolder /> }`). A subset of the RHS UI icons is a good set. */
  icons: Readonly<Record<string, IconSource>>;
  /** The name of the chosen icon (a key of `icons`), when you control the field. `null` is none. */
  value?: string | null;
  /** The name to start with, when you do not control the field. */
  defaultValue?: string | null;
  /** Called with the name of the icon that was chosen, or `null` for the None cell. */
  onValueChange?: (name: string | null) => void;
  /** The most icons in a row. Fewer fit on a narrow screen. Default 6. */
  columns?: number;
  /** The name of each icon for people (`{ rocket: "Rocket launch" }`): the search looks in it and it is the cell's accessible name. Icons without one are named from their key. */
  labels?: Readonly<Record<string, string>>;
  /** Extra words the search also finds an icon by (`{ folder: ["directory", "files"] }`). */
  keywords?: Readonly<Record<string, readonly string[]>>;
  /** Add a first cell, "None", that clears the choice. */
  allowNone?: boolean;
  /** Marks the field as having an error. */
  invalid?: boolean;
  /** The field's name, for a plain form submit: the chosen name goes out in a hidden input. */
  name?: string;
  /** The id of a visible label. The name of the chosen icon is added to it, so a screen reader says "Icon, Rocket" and voice control can say "click Rocket". */
  "aria-labelledby"?: string;
  /** A name for the field when there is no visible label. The name of the chosen icon is added to it ("Locked icon: Lock"). */
  "aria-label"?: string;
  /** Every sentence the picker says or shows. Each can be replaced. */
  messages?: Partial<IconPickerMessages>;
  /** Whether the grid is open, when you control it. */
  open?: boolean;
  /** Whether the grid starts open, when you do not control it. */
  defaultOpen?: boolean;
  /** Called when the grid opens or closes. */
  onOpenChange?: (open: boolean) => void;
}

/** The key the None cell has in the grid. It is not a valid name for an icon, so it cannot clash with one. */
const NONE = " none";

const CELL = [
  "relative grid size-10 shrink-0 place-items-center rounded-lg text-foreground outline-none",
  "transition-colors duration-100 motion-reduce:transition-none",
  // The visible cell is 40px; this reaches the 44px target without the cells overlapping (the gap is 4px).
  "before:absolute before:-inset-0.5",
  "[&_svg]:pointer-events-none [&_svg]:size-5 [&_svg]:shrink-0",
  "hover:bg-muted focus-visible:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/50",
  "aria-selected:bg-primary aria-selected:text-primary-foreground aria-selected:hover:bg-primary/90",
].join(" ");

interface PanelProps {
  icons: IconPickerProps["icons"];
  labels: IconPickerProps["labels"];
  keywords: IconPickerProps["keywords"];
  value: string | null;
  allowNone: boolean;
  columns: number;
  text: IconPickerMessages;
  onPick: (name: string | null) => void;
}

/** What is inside the popover: the search, the grid and a line that names the icon you are on. It mounts when the popover opens, so it starts fresh each time. */
function IconPanel({ icons, labels, keywords, value, allowNone, columns, text, onPick }: PanelProps) {
  const entries = useMemo<readonly IconEntry<ReactNode>[]>(
    () =>
      Object.entries(icons).map(([name, source]) => {
        const label = labels?.[name] ?? humanize(name);
        return { name, label, haystack: fold([label, name, ...(keywords?.[name] ?? [])].join(" ")), icon: source };
      }),
    [icons, labels, keywords],
  );
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<string | null>(null);
  const [hover, setHover] = useState<string | null>(null);
  const [focus, setFocus] = useState<string | null>(null);
  // Measured once, when the panel opens: the room a classic scrollbar takes, and how many columns the screen has room for
  // (the popover keeps 12px from each edge, its padding takes 16px and its border 2px, and the last cell has no gap after it).
  const [room] = useState(() => {
    const bar = scrollbarWidth();
    return { bar, cols: Math.max(2, Math.min(columns, Math.floor((window.innerWidth - 24 - 18 - bar + 4) / 44))) };
  });
  const panel = useRef<HTMLDivElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const grid = useRef<HTMLDivElement>(null);

  const shown = useMemo(() => filterIcons(entries, query), [entries, query]);
  const showNone = allowNone && query.trim() === "";
  const names = useMemo(() => [...(showNone ? [NONE] : []), ...shown.map((entry) => entry.name)], [showNone, shown]);
  const selected = value ?? (allowNone ? NONE : null);
  // The one cell in the tab order: where you were, else the chosen icon, else the first.
  const tabbable = active !== null && names.includes(active) ? active : selected !== null && names.includes(selected) ? selected : names[0];
  // The line under the grid names what the pointer or the focus is on; at rest, the chosen icon, if the search has not hidden it.
  const pointed = hover ?? focus ?? (selected !== null && names.includes(selected) ? selected : null);
  const pointedLabel = pointed === null ? null : pointed === NONE ? text.none : (entries.find((entry) => entry.name === pointed)?.label ?? null);

  const cells = () => [...(grid.current?.querySelectorAll<HTMLElement>('[role="option"]') ?? [])];

  /** Scrolls the grid, and only the grid, so the cell is in view. The page never moves. */
  function reveal(cell: HTMLElement) {
    const box = scroller.current;
    if (!box) return;
    const top = cell.offsetTop - 4;
    const bottom = cell.offsetTop + cell.offsetHeight + 4;
    if (top < box.scrollTop) box.scrollTop = top;
    else if (bottom > box.scrollTop + box.clientHeight) box.scrollTop = bottom - box.clientHeight;
  }

  function go(cell: HTMLElement | undefined) {
    if (!cell) return;
    cell.focus({ preventScroll: true });
    reveal(cell);
  }

  useEffect(() => {
    const cell = cells().find((item) => item.dataset.name === selected);
    if (cell) reveal(cell);
    // Only when the panel opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onGridKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const all = cells();
    const index = all.findIndex((cell) => cell === document.activeElement);
    if (index < 0) return;
    const box = grid.current;
    const across = Math.max(1, (box ? getComputedStyle(box).gridTemplateColumns.split(" ").filter(Boolean).length : room.cols) || room.cols);
    const rtl = box ? getComputedStyle(box).direction === "rtl" : false;
    const last = all.length - 1;
    // A page is what the scroller shows, less one row so you keep your bearings (not the height of every row there is).
    const rows = Math.max(1, Math.floor((scroller.current?.clientHeight ?? 0) / 44) - 1);
    let next = index;
    switch (event.key) {
      case "ArrowRight":
        next = Math.min(last, Math.max(0, index + (rtl ? -1 : 1)));
        break;
      case "ArrowLeft":
        next = Math.min(last, Math.max(0, index + (rtl ? 1 : -1)));
        break;
      case "ArrowDown":
        // From the row above a shorter last row, the last cell is the nearest one below.
        next = index + across <= last ? index + across : Math.floor(index / across) < Math.floor(last / across) ? last : index;
        break;
      case "ArrowUp":
        if (index - across < 0) {
          event.preventDefault();
          panel.current?.querySelector<HTMLInputElement>("input")?.focus();
          return;
        }
        next = index - across;
        break;
      case "Home":
        next = event.ctrlKey || event.metaKey ? 0 : index - (index % across);
        break;
      case "End":
        next = event.ctrlKey || event.metaKey ? last : Math.min(last, index - (index % across) + across - 1);
        break;
      case "PageDown":
        next = Math.min(last, index + across * rows);
        break;
      case "PageUp":
        next = Math.max(0, index - across * rows);
        break;
      default:
        // Typing while on the grid goes to the search, so you never have to find the box first.
        if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey && event.key !== " ") panel.current?.querySelector<HTMLInputElement>("input")?.focus();
        return;
    }
    event.preventDefault();
    go(all[next]);
  }

  const cellOf = (name: string, label: string, icon: ReactNode) => (
    <button
      key={name}
      type="button"
      role="option"
      aria-selected={name === selected}
      aria-label={label}
      tabIndex={name === tabbable ? 0 : -1}
      data-name={name}
      data-slot="icon-picker-cell"
      onClick={() => onPick(name === NONE ? null : name)}
      onFocus={() => {
        setActive(name);
        setFocus(name);
      }}
      onBlur={() => setFocus(null)}
      onPointerEnter={() => setHover(name)}
      onPointerLeave={() => setHover(null)}
      className={CELL}
    >
      {icon}
    </button>
  );

  return (
    <div ref={panel} className="flex flex-col gap-2">
      <SearchInput
        value={query}
        onValueChange={(next) => {
          setQuery(next);
          setActive(null);
          if (scroller.current) scroller.current.scrollTop = 0;
        }}
        placeholder={text.search}
        aria-label={text.search}
        onKeyDown={(event) => {
          // The Enter that confirms an IME composition (and the arrows that pick a candidate) belong to the IME, not to the grid.
          if (event.nativeEvent.isComposing || event.keyCode === 229) return;
          if (event.key === "ArrowDown") {
            event.preventDefault();
            go(cells().find((cell) => cell.tabIndex === 0));
          } else if (event.key === "Enter" && query.trim() !== "" && shown[0]) {
            event.preventDefault();
            onPick(shown[0].name);
          }
        }}
      />
      {shown.length === 0 ? (
        <p className="grid min-h-24 place-items-center px-3 text-center text-sm text-balance text-muted-foreground" style={{ width: `${room.cols * 44 - 4 + room.bar}px` }}>
          {text.empty(query.trim())}
        </p>
      ) : (
        <div
          ref={scroller}
          // The 4px of padding (taken back by the margin) keep the focus rings of the outer cells from being clipped by the scrolling.
          // Tall as 16rem, or as the room the popover measured (less 7rem for the search and the line below), so a short screen never pushes the search out of reach.
          className="relative -m-1 max-h-[max(4rem,min(16rem,calc(var(--radix-popover-content-available-height,100vh)-7rem)))] overflow-x-hidden overflow-y-auto overscroll-contain p-1 [scrollbar-color:color-mix(in_oklab,var(--foreground)_28%,transparent)_transparent] [scrollbar-gutter:stable] [scrollbar-width:thin]"
          style={{ width: `${room.cols * 44 - 4 + 8 + room.bar}px` }}
        >
          <div
            ref={grid}
            role="listbox"
            aria-label={text.list}
            onKeyDown={onGridKeyDown}
            onPointerLeave={() => setHover(null)}
            style={{ gridTemplateColumns: `repeat(${room.cols}, 2.5rem)` } as CSSProperties}
            className="relative grid gap-1"
          >
            {showNone ? cellOf(NONE, text.none, <IconBan />) : null}
            {shown.map((entry) => cellOf(entry.name, entry.label, entry.icon))}
          </div>
        </div>
      )}
      <div className="flex items-center justify-between gap-3 border-t border-border px-1 pt-2 text-xs">
        <span className="min-h-4 min-w-0 truncate font-medium text-foreground">{pointedLabel}</span>
        <span className="shrink-0 text-muted-foreground tabular-nums" aria-hidden="true">
          {text.count(shown.length)}
        </span>
      </div>
      <p role="status" aria-live="polite" className="sr-only">
        {query.trim() === "" ? "" : shown.length === 0 ? text.empty(query.trim()) : text.count(shown.length)}
      </p>
    </div>
  );
}

/**
 * Choose an icon for a project, a folder or a category: a field that opens a
 * searchable grid of the icons you pass in. The grid is one tab stop with the
 * arrow keys moving in two dimensions (Home and End go to the ends of a row,
 * Page Up and Down by rows), every cell has the icon's name as its accessible
 * name, and the search matches names and keywords, whatever order the words
 * come in. Typing while on the grid goes to the search, Enter in the search
 * chooses the first match, and the name of the icon under the pointer or the
 * focus is written under the grid. An optional None cell clears the choice.
 * Cells are 40px with a 44px target, and the grid scrolls inside the popover:
 * the page never moves, and on a short screen the popover shrinks to the room
 * it has instead of running off the top. Name the field with `aria-labelledby`
 * (the id of a visible label) or `aria-label`: the chosen icon's name is added
 * to it, so what a screen reader says matches what the field shows.
 */
export function IconPicker({
  icons,
  value,
  defaultValue = null,
  onValueChange,
  columns = 6,
  labels,
  keywords,
  allowNone = false,
  invalid = false,
  name,
  messages: custom,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  disabled,
  className,
  id,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  "aria-describedby": describedBy,
  ...props
}: IconPickerProps) {
  const text = useMemo<IconPickerMessages>(() => ({ ...MESSAGES, ...custom }), [custom]);
  const [own, setOwn] = useState<string | null>(defaultValue);
  const [innerOpen, setInnerOpen] = useState(defaultOpen);
  const open = openProp ?? innerOpen;
  const setOpen = (next: boolean) => {
    if (openProp === undefined) setInnerOpen(next);
    onOpenChange?.(next);
  };
  const valueId = useId();
  const chosen = value !== undefined ? value : own;
  const key = chosen !== null && Object.prototype.hasOwnProperty.call(icons, chosen) ? chosen : null;
  const source = key === null ? null : icons[key];
  const label = key === null ? null : (labels?.[key] ?? humanize(key));
  // What the field shows is part of what it is called, so "click Rocket" works for voice control (WCAG 2.5.3) and a screen reader
  // hears the label and the choice together. Without a name from the page, the shown text names the button, and a `<label for>`
  // names it with the label alone, so the choice is read as its description instead.
  const named = Boolean(ariaLabel || ariaLabelledBy);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        id={id}
        disabled={disabled}
        data-slot="icon-picker"
        aria-invalid={invalid || undefined}
        aria-label={ariaLabel && !ariaLabelledBy ? `${ariaLabel}: ${label ?? text.placeholder}` : undefined}
        aria-labelledby={ariaLabelledBy ? `${ariaLabelledBy} ${valueId}` : undefined}
        aria-describedby={[describedBy, !named && label !== null ? valueId : undefined].filter(Boolean).join(" ") || undefined}
        className={cn(fieldSurface, "flex h-9 w-full min-w-48 items-center gap-2.5 py-0 pr-2.5 pl-1.5 text-left", className)}
        {...props}
      >
        <span
          aria-hidden="true"
          className={cn("grid size-6 shrink-0 place-items-center rounded-[5px] border [&_svg]:size-4", label !== null ? "border-border bg-muted text-foreground" : "border-dashed border-input text-muted-foreground")}
        >
          {label !== null ? source : <IconShapes />}
        </span>
        <span id={valueId} className={cn("min-w-0 flex-1 truncate", label === null && "text-muted-foreground")}>
          {label ?? text.placeholder}
        </span>
        <IconChevronsUpDown aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
      </PopoverTrigger>
      <PopoverContent
        align="start"
        // The panel is named like the grid inside it, so a screen reader does not announce an unnamed dialog.
        aria-label={text.list}
        // Twelve pixels from every edge, the margin the column count in the panel is worked out with.
        collisionPadding={12}
        className="w-fit max-w-(--radix-popover-content-available-width) p-2"
        onOpenAutoFocus={(event) => {
          // A finger on a phone should not raise the on-screen keyboard: start on the grid instead of the search box.
          if (!window.matchMedia("(pointer: coarse)").matches) return;
          event.preventDefault();
          (event.currentTarget as HTMLElement).querySelector<HTMLElement>('[role="option"][tabindex="0"]')?.focus({ preventScroll: true });
        }}
      >
        <IconPanel
          icons={icons}
          labels={labels}
          keywords={keywords}
          value={chosen}
          allowNone={allowNone}
          columns={Math.max(2, Math.round(columns))}
          text={text}
          onPick={(picked) => {
            if (value === undefined) setOwn(picked);
            onValueChange?.(picked);
            setOpen(false);
          }}
        />
      </PopoverContent>
      {name ? <input type="hidden" name={name} value={chosen ?? ""} /> : null}
    </Popover>
  );
}
