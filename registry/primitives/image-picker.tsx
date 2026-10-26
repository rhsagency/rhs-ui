"use client";

import { useCallback, useEffect, useId, useRef, useState, type ComponentProps, type KeyboardEvent, type ReactNode } from "react";

import { IconBan, IconCheck, IconImage } from "@rhs-ui/icons";
import { AspectRatio } from "@rhs-ui/primitives/aspect-ratio";
import { Skeleton } from "@rhs-ui/primitives/skeleton";
import { cn } from "@/lib/utils";

/** One picture to choose: what is stored is its `id`, never its address. */
export interface ImagePickerImage {
  /** What `value` and `onValueChange` speak, and what a form submits. */
  id: string;
  /** The address of the picture. */
  src: string;
  /** What the picture shows, in words. Read out after the label when there is one, and the label itself when there is not. */
  alt: string;
  /** A short name, shown under the picture and used as its name. */
  label?: string;
}

interface ImagePickerBase extends Omit<ComponentProps<"div">, "defaultValue" | "onChange" | "children" | "role"> {
  /** The pictures to choose from, in the order of the grid. */
  images: readonly ImagePickerImage[];
  /** How many tiles stand in a row once there is room for them: 2 to 6. On a narrow container the grid has fewer. Default 3. */
  columns?: 2 | 3 | 4 | 5 | 6;
  /** The shape of a tile, as width divided by height: 16 / 9, 4 / 3, 1 for a square. Default 16 / 10. */
  aspect?: number;
  /** The field's name for a plain form submit: the chosen id (one hidden input), or one input per id with `multiple`. */
  name?: string;
  /** Turn the whole picker off. */
  disabled?: boolean;
  /** The pictures are on their way: tiles in the shape of the pictures, shaded, in their place. */
  loading?: boolean;
  /** The name of the tile that clears the choice. Default "None". */
  noneLabel?: string;
  /** What is said when there are no pictures to choose from. Default "No images to choose from." */
  emptyText?: string;
}

interface Single {
  /** Choose one picture, as a radio group. */
  multiple?: false;
  /** Add a first tile that clears the choice: a cover can be left out. */
  allowNone?: boolean;
  max?: undefined;
  /** The id of the chosen picture, or null for none, when you control it. */
  value?: string | null;
  /** The id to start with, when you do not control it. */
  defaultValue?: string | null;
  /** Called with the id of the picture that was chosen, or null when the choice was cleared. */
  onValueChange?: (id: string | null) => void;
}

interface Several {
  /** Choose several pictures, as a set of checkboxes. */
  multiple: true;
  /** The most pictures that can be chosen. The others dim once it is reached, and the count says so. */
  max?: number;
  allowNone?: undefined;
  /** The ids of the chosen pictures, when you control them. */
  value?: readonly string[];
  /** The ids to start with, when you do not control them. */
  defaultValue?: readonly string[];
  /** Called with the ids of the chosen pictures. */
  onValueChange?: (ids: string[]) => void;
}

export type ImagePickerProps = ImagePickerBase & (Single | Several);

// The grid has the columns you ask for once the container is wide enough for tiles of a useful size, and fewer before that.
const GRID = {
  2: "grid-cols-2",
  3: "grid-cols-2 @sm:grid-cols-3",
  4: "grid-cols-2 @sm:grid-cols-3 @md:grid-cols-4",
  5: "grid-cols-2 @sm:grid-cols-3 @lg:grid-cols-5",
  6: "grid-cols-2 @sm:grid-cols-3 @lg:grid-cols-4 @2xl:grid-cols-6",
} as const;

const toIds = (value: string | null | readonly string[] | undefined): string[] => (value == null ? [] : typeof value === "string" ? [value] : [...value]);

/** The picture, with a shaded block while it loads and a quiet label if it cannot be shown. */
function Thumb({ image, aspect }: { image: ImagePickerImage; aspect: number }) {
  const [state, setState] = useState<"loading" | "loaded" | "error">("loading");
  // A picture that was finished before this ran (the page came from a server) never says so again.
  const attach = useCallback((node: HTMLImageElement | null) => {
    if (node?.complete) setState(node.naturalWidth > 0 ? "loaded" : "error");
  }, []);
  return (
    <AspectRatio ratio={aspect}>
      {state === "error" ? (
        <span className="absolute inset-0 grid content-center justify-items-center gap-1.5 bg-muted px-3 text-center text-xs text-muted-foreground">
          <IconImage aria-hidden="true" className="size-5" />
          <span className="line-clamp-2">{image.label ?? image.alt}</span>
        </span>
      ) : (
        <img
          ref={attach}
          src={image.src}
          alt={image.alt}
          loading="lazy"
          decoding="async"
          draggable={false}
          onLoad={() => setState("loaded")}
          onError={() => setState("error")}
          className={cn("size-full object-cover transition-opacity duration-300 motion-reduce:transition-none", state === "loaded" ? "opacity-100" : "opacity-0")}
        />
      )}
      {state === "loading" ? <Skeleton className="absolute inset-0 rounded-none" /> : null}
    </AspectRatio>
  );
}

interface TileProps {
  role: "radio" | "checkbox";
  checked: boolean;
  /** Dimmed because the most that can be chosen is reached. It can still be reached with the arrow keys. */
  locked: boolean;
  tabStop: boolean;
  ids: { name: string; selected: string; description: string };
  caption: string;
  description?: string;
  dashed?: boolean;
  disabled?: boolean;
  /** Show the caption under the tile. Without it the caption is there for assistive technology only. */
  showCaption: boolean;
  onChoose: () => void;
  onKey: (event: KeyboardEvent<HTMLDivElement>) => void;
  onFocus: () => void;
  attach: (node: HTMLDivElement | null) => void;
  children: ReactNode;
}

function Tile({ role, checked, locked, tabStop, ids, caption, description, dashed, disabled, showCaption, onChoose, onKey, onFocus, attach, children }: TileProps) {
  return (
    <div
      ref={attach}
      role={role}
      aria-checked={checked}
      aria-disabled={locked || disabled || undefined}
      aria-labelledby={checked ? `${ids.name} ${ids.selected}` : ids.name}
      aria-describedby={description ? ids.description : undefined}
      tabIndex={tabStop ? 0 : -1}
      onClick={onChoose}
      onKeyDown={onKey}
      onFocus={onFocus}
      className={cn(
        "group/tile relative grid content-start gap-2 rounded-lg text-left outline-none select-none",
        // The keyboard focus is an outline, set well outside the one that marks the choice, so the two never touch. outline-none switched the style off, so it is switched on again here.
        "focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-[5px] focus-visible:outline-ring",
        locked || disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
      )}
    >
      <span
        className={cn(
          "relative block overflow-hidden rounded-lg border bg-muted transition-[outline-color,border-color] duration-150 motion-reduce:transition-none",
          dashed ? "border-dashed border-border bg-background" : "border-border",
          // The choice is an outline with a gap, so the gap is whatever is behind the picker: a page, a card or a dialog.
          "group-hover/tile:border-foreground/40 group-aria-checked/tile:border-transparent group-aria-checked/tile:outline-2 group-aria-checked/tile:outline-offset-2 group-aria-checked/tile:outline-foreground",
        )}
      >
        {children}
        <span
          aria-hidden="true"
          className="absolute top-2 right-2 grid size-5 scale-75 place-items-center rounded-full bg-foreground text-background opacity-0 shadow-xs transition-[opacity,transform] duration-150 group-aria-checked/tile:scale-100 group-aria-checked/tile:opacity-100 motion-reduce:transition-none"
        >
          <IconCheck size={12} strokeWidth={2.5} />
        </span>
      </span>
      {/* The name is also what the tile is called when no caption is shown. */}
      <span id={ids.name} className={cn(showCaption ? "truncate text-xs font-medium text-muted-foreground group-aria-checked/tile:text-foreground" : "sr-only")}>
        {caption}
      </span>
      {checked ? (
        <span id={ids.selected} className="sr-only">
          Selected
        </span>
      ) : null}
      {description ? (
        <span id={ids.description} className="sr-only">
          {description}
        </span>
      ) : null}
    </div>
  );
}

/**
 * Choose one image from a set of thumbnails, such as a cover, a header or a
 * theme: a grid of tiles of one shape, built as a radio group. The arrow keys
 * move through the grid in two directions (Up and Down go a whole row) with one
 * tab stop for all of it, Space or Enter chooses, and the chosen tile gets a
 * ring and a check, with "Selected" in its name for a screen reader. Every
 * image has a description and an optional caption, `allowNone` adds a first tile
 * that clears the choice, a picture that is still loading shows the Skeleton
 * and one that cannot be shown falls back to a quiet block with its label.
 * `multiple` and `max` make it a set of checkboxes that reports an array of
 * ids. What is stored is the id, so it never depends on an address. The
 * choice is drawn as an outline a little outside its tile, so leave a few
 * pixels of room around the grid.
 */
export function ImagePicker(props: ImagePickerProps) {
  const { images, columns = 3, aspect = 16 / 10, name, disabled, loading, noneLabel = "None", emptyText = "No images to choose from.", multiple, max, allowNone, value, defaultValue, onValueChange, className, "aria-label": ariaLabel, "aria-labelledby": labelledBy, ...rest } = props;
  const base = useId();
  const group = useRef<HTMLDivElement>(null);
  const tiles = useRef<(HTMLDivElement | null)[]>([]);
  const [own, setOwn] = useState<string[]>(() => toIds(defaultValue));
  const [said, setSaid] = useState("");
  const selected = value !== undefined ? toIds(value) : own;
  const none = Boolean(allowNone) && !multiple;
  const count = images.length + (none ? 1 : 0);
  // The tab stop is the chosen tile, or the first one when nothing is chosen. It follows the focus after that.
  const [stop, setStop] = useState<number | null>(null);
  const firstChosen = none && selected.length === 0 ? 0 : images.findIndex((image) => selected.includes(image.id)) + (none ? 1 : 0);
  const tabStop = Math.min(stop ?? Math.max(0, firstChosen), Math.max(0, count - 1));
  const full = Boolean(multiple) && max !== undefined && selected.length >= max;

  // What was said stays only while it is news; left in the live region it would be read again together with the next message.
  useEffect(() => {
    if (!said) return;
    const timer = window.setTimeout(() => setSaid(""), 4000);
    return () => window.clearTimeout(timer);
  }, [said]);

  function commit(next: string[]) {
    if (value === undefined) setOwn(next);
    if (multiple) (onValueChange as Several["onValueChange"])?.(next);
    else (onValueChange as Single["onValueChange"])?.(next[0] ?? null);
  }

  function choose(index: number) {
    if (disabled) return;
    if (none && index === 0) {
      // Choosing what is already chosen changes nothing, so nothing is reported.
      if (selected.length > 0) commit([]);
      return;
    }
    const image = images[index - (none ? 1 : 0)];
    if (!image) return;
    if (!multiple) {
      if (selected[0] !== image.id) commit([image.id]);
    } else if (selected.includes(image.id)) {
      commit(selected.filter((id) => id !== image.id));
    } else if (full) {
      setSaid(`You can choose up to ${max}. Unselect one first.`);
    } else {
      commit([...selected, image.id]);
    }
  }

  /** How many tiles are in a row right now, which the layout decides: read from where the tiles are. */
  function perRow(): number {
    const nodes = tiles.current.filter((node): node is HTMLDivElement => node !== null);
    const top = nodes[0]?.offsetTop;
    return Math.max(1, nodes.filter((node) => node.offsetTop === top).length);
  }

  function focusTile(index: number) {
    setStop(index);
    tiles.current[index]?.focus();
  }

  function keyDown(event: KeyboardEvent<HTMLDivElement>, index: number) {
    const { key } = event;
    if (key === " " || key === "Enter") {
      event.preventDefault();
      choose(index);
      return;
    }
    const last = count - 1;
    const row = perRow();
    const rtl = group.current ? getComputedStyle(group.current).direction === "rtl" : false;
    let next = index;
    if (key === "ArrowRight") next = Math.min(last, Math.max(0, index + (rtl ? -1 : 1)));
    else if (key === "ArrowLeft") next = Math.min(last, Math.max(0, index + (rtl ? 1 : -1)));
    // Down goes a row: onto the last tile when the row below is shorter, and nowhere from the last row.
    else if (key === "ArrowDown") next = index + row <= last ? index + row : Math.floor(index / row) < Math.floor(last / row) ? last : index;
    else if (key === "ArrowUp") next = index - row >= 0 ? index - row : index;
    else if (key === "Home") next = 0;
    else if (key === "End") next = last;
    else return;
    event.preventDefault();
    focusTile(next);
  }

  if (!loading && count === 0) {
    // Nothing to choose from is said in words, not as an empty group.
    return (
      <div data-slot="image-picker" className={cn("w-full", className)} {...rest}>
        <p role="status" className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
          {emptyText}
        </p>
      </div>
    );
  }

  const ids = (index: number) => ({ name: `${base}-name-${index}`, selected: `${base}-selected-${index}`, description: `${base}-description-${index}` });
  const role = multiple ? "checkbox" : "radio";
  const skeletons = Math.min(12, images.length || columns * 2);

  return (
    <div data-slot="image-picker" className={cn("@container w-full", className)} {...rest}>
      <div
        ref={group}
        role={multiple ? "group" : "radiogroup"}
        aria-label={labelledBy ? undefined : (ariaLabel ?? "Images")}
        aria-labelledby={labelledBy}
        aria-disabled={disabled || undefined}
        aria-busy={loading || undefined}
        className={cn("grid gap-3", GRID[columns])}
      >
        {loading ? (
          <>
            {Array.from({ length: skeletons }, (_, index) => (
              <div key={index} className="grid content-start gap-2">
                <AspectRatio ratio={aspect}>
                  <Skeleton delay={index * 90} className="absolute inset-0 rounded-lg" />
                </AspectRatio>
                <Skeleton delay={index * 90} className="h-3 w-2/3" />
              </div>
            ))}
            <span role="status" className="sr-only">
              Loading images
            </span>
          </>
        ) : (
          <>
            {none ? (
              <Tile
                role="radio"
                checked={selected.length === 0}
                locked={false}
                tabStop={tabStop === 0}
                ids={ids(0)}
                caption={noneLabel}
                dashed
                disabled={disabled}
                showCaption
                onChoose={() => choose(0)}
                onKey={(event) => keyDown(event, 0)}
                onFocus={() => setStop(0)}
                attach={(node) => {
                  tiles.current[0] = node;
                }}
              >
                <AspectRatio ratio={aspect}>
                  <span className="absolute inset-0 grid place-items-center text-muted-foreground">
                    <IconBan aria-hidden="true" className="size-5" />
                  </span>
                </AspectRatio>
              </Tile>
            ) : null}
            {images.map((image, position) => {
              const index = position + (none ? 1 : 0);
              const checked = selected.includes(image.id);
              return (
                <Tile
                  key={image.id}
                  role={role}
                  checked={checked}
                  locked={full && !checked}
                  tabStop={tabStop === index}
                  ids={ids(index)}
                  caption={image.label ?? image.alt}
                  description={image.label && image.label !== image.alt ? image.alt : undefined}
                  disabled={disabled}
                  showCaption={Boolean(image.label)}
                  onChoose={() => choose(index)}
                  onKey={(event) => keyDown(event, index)}
                  onFocus={() => setStop(index)}
                  attach={(node) => {
                    tiles.current[index] = node;
                  }}
                >
                  <Thumb key={image.src} image={image} aspect={aspect} />
                </Tile>
              );
            })}
          </>
        )}
      </div>
      {multiple && !loading ? (
        <p className="mt-3 text-xs text-muted-foreground tabular-nums">
          {max !== undefined ? `${selected.length} of ${max} chosen` : `${selected.length} chosen`}
        </p>
      ) : null}
      <span role="status" className="sr-only">
        {said}
      </span>
      {name
        ? multiple
          ? selected.map((id) => <input key={id} type="hidden" name={name} value={id} disabled={disabled} />)
          : <input type="hidden" name={name} value={selected[0] ?? ""} disabled={disabled} />
        : null}
    </div>
  );
}
