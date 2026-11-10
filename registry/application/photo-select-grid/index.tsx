"use client";

import { memo, useId, useMemo, useRef, useState, type ComponentProps, type KeyboardEvent, type MouseEvent, type ReactNode } from "react";

import { IconCheck, IconImage, IconInfo } from "@rhs-ui/icons";
import { columnsOf, DEFAULT_LABELS, extended, fill, statusOf, toggled, type PhotoSelectGridLabels, type SelectablePhoto } from "@rhs-ui/application/photo-select-grid/selection";
import { AspectRatio } from "@rhs-ui/primitives/aspect-ratio";
import { Button } from "@rhs-ui/primitives/button";
import { Checkbox } from "@rhs-ui/primitives/checkbox";
import { Label } from "@rhs-ui/primitives/label";
import { cn } from "@/lib/utils";

export type { PhotoSelectGridLabels, SelectablePhoto } from "@rhs-ui/application/photo-select-grid/selection";

export interface PhotoSelectGridProps extends Omit<ComponentProps<"div">, "children" | "defaultValue"> {
  /** The photos of the library, in order. Dozens or hundreds are fine: pictures load as they come into view. */
  photos: readonly SelectablePhoto[];
  /** The `id`s of the chosen photos, in the order they were chosen. Controlled: pair it with `onSelectedChange`. */
  selected?: readonly string[];
  /** The photos chosen at the start, when you do not control it. */
  defaultSelected?: readonly string[];
  /** The selection changed, by a click, a key, a range, Select all or Clear. It receives the new list of `id`s. */
  onSelectedChange?: (ids: string[]) => void;
  /** The most photos that can be chosen. At the limit the others are dimmed and the grid says why. Without one there is no limit, and Select all is there. */
  maxSelect?: number;
  /** How many photos fit in a row at the most. In a narrower space there are fewer, and a tile is never smaller than 5rem, so a phone gets three. Default 4. */
  columns?: number;
  /** The shape of a tile as width over height: 1 is a square (the default), 4 / 3 a landscape print. Pictures are cropped to fill it. */
  ratio?: number;
  /** A photo was clicked while nothing is chosen, to look at it. Without it every click chooses. Once something is chosen, a click chooses again, so opening a photo needs a moment with no selection. */
  onOpen?: (photo: SelectablePhoto) => void;
  /** What acts on the selection, beside the count (below it on a narrow screen): Download, Delete. Yours to draw. */
  actions?: ReactNode;
  /** The language the count is written in. Default "en-US". */
  locale?: string;
  /** The words the grid says, for translation. */
  labels?: PhotoSelectGridLabels;
}

interface TileProps {
  photo: SelectablePhoto;
  index: number;
  chosen: boolean;
  dimmed: boolean;
  stop: boolean;
  showCheck: boolean;
  ratio: number;
  noteId: string;
}

/** One photo. It is memoised: choosing one photo in a grid of hundreds draws two tiles again, not all of them. */
const Tile = memo(function Tile({ photo, index, chosen, dimmed, stop, showCheck, ratio, noteId }: TileProps) {
  const [failed, setFailed] = useState(false);
  return (
    <li className="min-w-0">
      {/* The tile is the toggle: a checkbox named by the photo's description. The picture is decoration, the circle a drawing of the state. */}
      <div
        role="checkbox"
        aria-checked={chosen}
        aria-disabled={dimmed || undefined}
        aria-label={photo.alt}
        aria-describedby={dimmed ? noteId : undefined}
        tabIndex={stop ? 0 : -1}
        data-photo={index}
        data-chosen={chosen || undefined}
        className={cn(
          "group/tile relative block overflow-hidden rounded-lg bg-muted outline-none select-none",
          // outline-none sets the outline style to none for good, and outline-2 only borrows it: the ring needs its own style.
          "focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
          dimmed ? "cursor-not-allowed" : "cursor-pointer",
        )}
      >
        <AspectRatio ratio={ratio}>
          {failed ? (
            <span className="absolute inset-0 grid place-items-center text-muted-foreground">
              <IconImage aria-hidden="true" className="size-6" />
            </span>
          ) : (
            <img
              src={photo.src}
              alt=""
              draggable={false}
              loading="lazy"
              decoding="async"
              onError={() => setFailed(true)}
              className={cn(
                "size-full object-cover transition-[transform,opacity,filter] duration-200 motion-reduce:transition-none",
                chosen && "scale-[0.86] rounded-md",
                dimmed && "opacity-40 saturate-50",
              )}
            />
          )}
        </AspectRatio>
        <span aria-hidden="true" className={cn("pointer-events-none absolute inset-0 rounded-lg border-2 border-transparent transition-colors duration-150 motion-reduce:transition-none", chosen && "border-foreground")} />
        <span
          aria-hidden="true"
          data-check=""
          className={cn(
            "absolute top-2 left-2 grid size-6 place-items-center rounded-full border-2 transition-[opacity,background-color,border-color,color] duration-150 motion-reduce:transition-none",
            chosen ? "border-primary bg-primary text-primary-foreground" : "border-foreground/45 bg-background/75 text-transparent group-hover/tile:bg-background group-hover/tile:text-muted-foreground",
            // With a selection under way every circle is drawn; before it, a circle appears under the pointer or the focus, and always where nothing can hover.
            chosen || showCheck ? "opacity-100" : "opacity-0 group-hover/tile:opacity-100 group-focus-visible/tile:opacity-100 [@media(hover:none)]:opacity-100",
            dimmed && "opacity-0 group-hover/tile:opacity-60",
          )}
        >
          <IconCheck size={14} strokeWidth={3} />
        </span>
      </div>
    </li>
  );
});

/**
 * A grid for choosing many photos from a library of dozens or hundreds. Each
 * photo is a toggle with a circle that fills with a check, driven by the ids you
 * pass, and a chosen photo steps back into its tile with a frame. Click toggles;
 * Shift-click chooses everything between the last photo you clicked and this
 * one; Space toggles from the keyboard, Shift with an arrow key or Space
 * extends a range and Control or Cmd with A chooses all. The grid is one Tab
 * stop and the arrow keys move like a grid. A status line, "3 selected", is a
 * polite live region. At `maxSelect` the other photos dim, the status line
 * says "limit reached" beside the count and a note under the grid says what
 * to do. With `onOpen`, selecting starts with the first chosen photo: until
 * then a plain click opens the photo, and the circle is what chooses it. Below
 * 28rem of room the toolbar is two rows: the choice, the count and Clear, then
 * your `actions`.
 */
export function PhotoSelectGrid({
  photos,
  selected,
  defaultSelected = [],
  onSelectedChange,
  maxSelect,
  columns = 4,
  ratio = 1,
  onOpen,
  actions,
  locale = "en-US",
  labels,
  className,
  ...props
}: PhotoSelectGridProps) {
  const text: Required<PhotoSelectGridLabels> = { ...DEFAULT_LABELS, ...labels };
  const [own, setOwn] = useState<readonly string[]>(defaultSelected);
  const ids = selected ?? own;
  const chosen = useMemo(() => new Set(ids), [ids]);
  const photoIds = useMemo(() => photos.map((photo) => photo.id), [photos]);
  const noteId = useId();
  const allId = useId();
  // The photo a range starts from, and the ones the last range added: a range that is moved back takes only its own photos out.
  const anchor = useRef<number | null>(null);
  const added = useRef<readonly string[]>([]);
  // The tile the keyboard is on, which holds the one tab stop; at first the first chosen photo, or the first.
  const [stopAt, setStopAt] = useState(() => Math.max(0, photos.findIndex((photo) => (selected ?? defaultSelected).includes(photo.id))));

  const count = ids.length;
  const total = photos.length;
  const full = maxSelect !== undefined && count >= maxSelect;
  const canSelectAll = maxSelect === undefined || maxSelect >= total;
  // Selecting is on once something is chosen, and for good when there is nothing to open: then every click chooses.
  const selecting = count > 0 || onOpen === undefined;
  const stop = Math.min(stopAt, Math.max(0, total - 1));
  const per = Math.max(1, Math.floor(columns));

  function commit(next: string[]) {
    if (next.length === 0) {
      anchor.current = null;
      added.current = [];
    }
    if (selected === undefined) setOwn(next);
    onSelectedChange?.(next);
  }

  function toggle(index: number) {
    const photo = photos[index];
    if (!photo) return;
    const next = toggled(ids, photo.id, maxSelect);
    // At the limit a photo that is not chosen cannot be added: nothing changed.
    if (next.length === ids.length && !chosen.has(photo.id)) return;
    anchor.current = index;
    added.current = [];
    commit(next);
  }

  function range(index: number) {
    if (!photos[index]) return;
    const from = anchor.current ?? index;
    anchor.current = from;
    const without = ids.filter((id) => !added.current.includes(id));
    const next = extended(without, photoIds, from, index, maxSelect);
    const before = new Set(without);
    added.current = next.filter((id) => !before.has(id));
    commit(next);
  }

  function selectAll() {
    if (!canSelectAll) return;
    anchor.current = null;
    added.current = [];
    commit(photoIds.slice());
  }

  /** What a click or Enter does: a range with Shift, a toggle with Control or Cmd, on the circle or while selecting, and otherwise open the photo. */
  function activate(index: number, how: { shift: boolean; modifier: boolean; circle: boolean }) {
    if (how.shift) range(index);
    else if (how.modifier || how.circle || selecting) toggle(index);
    else {
      const photo = photos[index];
      if (photo) onOpen?.(photo);
    }
  }

  function onClick(event: MouseEvent<HTMLUListElement>) {
    const target = event.target as HTMLElement;
    const tile = target.closest<HTMLElement>("[data-photo]");
    if (!tile) return;
    if (event.shiftKey) event.preventDefault();
    activate(Number(tile.dataset.photo), { shift: event.shiftKey, modifier: event.ctrlKey || event.metaKey, circle: Boolean(target.closest("[data-check]")) });
  }

  /** Space and Enter act on the tile; the arrow keys, Home and End move between tiles like a grid, and with Shift they extend a range as they go. */
  function onKeyDown(event: KeyboardEvent<HTMLUListElement>) {
    const tile = (event.target as HTMLElement).closest<HTMLElement>("[data-photo]");
    if (!tile || event.altKey) return;
    const here = Number(tile.dataset.photo);
    const modifier = event.ctrlKey || event.metaKey;
    if (modifier && event.key.toLowerCase() === "a") {
      event.preventDefault();
      selectAll();
      return;
    }
    if (event.key === "Escape") {
      if (count > 0) {
        event.preventDefault();
        commit([]);
      }
      return;
    }
    if (event.key === " ") {
      event.preventDefault();
      if (event.shiftKey) range(here);
      else toggle(here);
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      activate(here, { shift: event.shiftKey, modifier, circle: false });
      return;
    }
    const tiles = Array.from(event.currentTarget.querySelectorAll<HTMLElement>("[data-photo]"));
    const across = columnsOf(tiles);
    const rtl = getComputedStyle(event.currentTarget).direction === "rtl";
    const rowStart = here - (here % across);
    let to: number;
    switch (event.key) {
      case "ArrowRight":
        to = here + (rtl ? -1 : 1);
        break;
      case "ArrowLeft":
        to = here + (rtl ? 1 : -1);
        break;
      case "ArrowDown":
        // A short last row has no tile under the right-hand ones: go to its last tile, unless this is already the last row.
        to = here + across < tiles.length ? here + across : rowStart + across < tiles.length ? tiles.length - 1 : here;
        break;
      case "ArrowUp":
        to = here - across >= 0 ? here - across : here;
        break;
      case "Home":
        to = modifier ? 0 : rowStart;
        break;
      case "End":
        to = modifier ? tiles.length - 1 : Math.min(tiles.length - 1, rowStart + across - 1);
        break;
      default:
        return;
    }
    event.preventDefault();
    to = Math.max(0, Math.min(tiles.length - 1, to));
    if (event.shiftKey) {
      // A range begins where the keyboard was when Shift went down.
      anchor.current ??= here;
      range(to);
    }
    tiles[to]?.focus();
  }

  return (
    <div data-slot="photo-select-grid" className={cn("@container grid gap-3", className)} {...props}>
      {/* From 28rem of room the choice sits on the left and the count, Clear and the actions on the right, as one row. Below it the choice, the count and Clear are the first row and the actions get a row of their own, so nothing wraps raggedly. */}
      <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-4 gap-y-2 @md:flex @md:flex-wrap @md:justify-between">
        {canSelectAll ? (
          <div className="flex items-center gap-2.5">
            <Checkbox id={allId} disabled={total === 0} checked={count === 0 ? false : count >= total ? true : "indeterminate"} onCheckedChange={(next) => (next === true ? selectAll() : commit([]))} />
            <Label htmlFor={allId} className="cursor-pointer">
              {text.selectAll}
            </Label>
          </div>
        ) : (
          <p className="text-sm leading-5 font-medium">{fill(text.chooseUpTo, { max: new Intl.NumberFormat(locale).format(maxSelect ?? 0) })}</p>
        )}
        <div className="contents @md:flex @md:min-w-0 @md:flex-wrap @md:items-center @md:justify-end @md:gap-x-2 @md:gap-y-1">
          <div className="flex min-w-0 items-center justify-end gap-x-2">
            <p role="status" aria-live="polite" aria-atomic="true" className={cn("text-end text-sm leading-5 tabular-nums", count > 0 ? "font-medium text-foreground" : "text-muted-foreground")}>
              {statusOf(count, maxSelect, text, locale)}
            </p>
            {count > 0 ? (
              <Button type="button" variant="ghost" size="sm" onClick={() => commit([])} className="text-muted-foreground hover:text-foreground">
                {text.clear}
              </Button>
            ) : null}
          </div>
          {actions ? <div className="col-span-full flex flex-wrap items-center gap-x-2 gap-y-1 @md:contents">{actions}</div> : null}
        </div>
      </div>

      {total === 0 ? (
        <p className="rounded-lg border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">{text.empty}</p>
      ) : (
        <ul
          role="list"
          aria-label={text.list}
          onClick={onClick}
          onKeyDown={onKeyDown}
          onFocus={(event) => {
            const tile = (event.target as HTMLElement).closest<HTMLElement>("[data-photo]");
            if (tile) setStopAt(Number(tile.dataset.photo));
          }}
          // At the most `columns` tiles across; below that the tiles keep their size and the row takes fewer.
          style={{ gridTemplateColumns: `repeat(auto-fill, minmax(max(5rem, calc((100% - ${(per - 1) * 0.5}rem) / ${per})), 1fr))` }}
          className="grid gap-2"
        >
          {photos.map((photo, index) => (
            <Tile key={photo.id} photo={photo} index={index} chosen={chosen.has(photo.id)} dimmed={full && !chosen.has(photo.id)} stop={index === stop} showCheck={selecting} ratio={ratio} noteId={noteId} />
          ))}
        </ul>
      )}

      {full ? (
        <p id={noteId} className="flex items-start gap-2 text-xs leading-5 text-muted-foreground">
          <IconInfo aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
          <span>{fill(text.limit, { max: new Intl.NumberFormat(locale).format(maxSelect ?? 0) })}</span>
        </p>
      ) : null}
      {total > 1 ? <p className="text-xs leading-5 text-muted-foreground [@media(hover:none)]:hidden">{text.hint}</p> : null}
    </div>
  );
}
