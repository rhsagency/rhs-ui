"use client";

import { useEffect, useRef, useState, type ComponentProps, type DragEvent } from "react";

import { IconAlertCircle, IconArrowLeft, IconArrowRight, IconClose, IconImage, IconPlus } from "@rhs-ui/icons";
import { acceptsFile, acceptWords, formatBytes } from "@rhs-ui/application/image-upload-grid/files";
import { AspectRatio } from "@rhs-ui/primitives/aspect-ratio";
import { Button } from "@rhs-ui/primitives/button";
import { cn } from "@/lib/utils";

/** One image in the set. */
export interface UploadGridImage {
  /** Names the image, so it keeps its identity when the order changes. Unique within the grid. */
  id: string;
  /** Where the picture is: an object URL for a file just chosen, or the address on your CDN. */
  src: string;
  /** What the picture shows, in words. It is the picture's alt text and names its buttons. */
  alt: string;
}

/** The words the grid uses, for translation. `{name}`, `{count}`, `{max}`, `{position}`, `{total}`, `{room}`, `{left}`, `{size}` and `{types}` are filled in. */
export interface ImageUploadGridLabels {
  /** The tag on the first image. Default "Main". */
  main?: string;
  /** The title of the tile that adds images. Default "Add images". */
  add?: string;
  /** Under it, up to two lines. On a tile narrower than 140px it is read out but not shown. Default "Drop images here or browse". */
  addHint?: string;
  /** Under it when there are no images yet. Default "Drop images here or browse. The first one becomes the main image." */
  emptyHint?: string;
  /** The name of the button that moves an image earlier. Default "Move {name} earlier". */
  earlier?: string;
  /** The name of the button that moves an image later. Default "Move {name} later". */
  later?: string;
  /** The name of the button that removes an image. Default "Remove {name}". */
  remove?: string;
  /** The count of one image. Default "{count} image". */
  countOne?: string;
  /** The count of several images. Default "{count} images". */
  countMany?: string;
  /** The count against a `max`. Default "{count} of {max} images". */
  countOfMax?: string;
  /** Said under the grid when there is something to reorder. Default "Drag to reorder, or use the arrows." */
  reorder?: string;
  /** The title of the add tile when the set is full, in place of "Add images". The count stays under the grid. Default "Limit reached". */
  full?: string;
  /** Under it when the set is full. Default "Remove one to add another." */
  fullReason?: string;
  /** Said after an image moved. Default "Moved to position {position} of {total}". */
  moved?: string;
  /** Said after an image was removed. Default "Removed {name}". */
  removed?: string;
  /** Said when one image was added. Default "Added 1 image". */
  addedOne?: string;
  /** Said when several were added. Default "Added {count} images". */
  addedMany?: string;
  /** Said about a file of a type that is not accepted. Default "{name} cannot be used. Accepted: {types}." */
  wrongType?: string;
  /** Said about a file that is too big. Default "{name} is {size}. The limit is {max}." */
  tooLarge?: string;
  /** Said when more files came than there is room for. Default "Only {room} more can be added. The rest were left out." */
  tooMany?: string;
  /** Said when files are dropped on a full set. Default "The set is full. Remove an image first." */
  isFull?: string;
  /** The name of the button that closes the messages. Default "Dismiss". */
  dismiss?: string;
}

export interface ImageUploadGridProps extends Omit<ComponentProps<"div">, "children" | "onChange"> {
  /** The images to show, in order: the first is the main one. The grid arranges them and never uploads; hand back what should be shown. */
  images: readonly UploadGridImage[];
  /** Called with the new set after an image was moved or removed, by the buttons or by dragging. Store it, and pass it back as `images`. */
  onImagesChange?: (images: UploadGridImage[]) => void;
  /** Called with the files that passed the type, size and room checks, from the add tile or dropped on the grid. Make an image of each (an object URL gives an instant preview), start the upload, and add it to `images`. */
  onFilesAdded?: (files: File[]) => void;
  /** The most images the set can hold, shown as "5 of 8 images". At the limit the add tile is switched off and says why. */
  max?: number;
  /** The types the file input accepts, as the input takes them. Default "image/*". */
  accept?: string;
  /** The largest file in bytes. A bigger one is turned away with the reason, before `onFilesAdded` is called. */
  maxSize?: number;
  /** Turns the whole grid off: no adding, moving, removing or dragging. */
  disabled?: boolean;
  /** The name of the list for a screen reader. Default "Images". */
  label?: string;
  /** The language of the sizes in messages. Default "en-US". */
  locale?: string;
  /** The words the grid uses, for translation. */
  labels?: ImageUploadGridLabels;
}

const DEFAULT_LABELS = {
  main: "Main",
  add: "Add images",
  addHint: "Drop images here or browse",
  emptyHint: "Drop images here or browse. The first one becomes the main image.",
  earlier: "Move {name} earlier",
  later: "Move {name} later",
  remove: "Remove {name}",
  countOne: "{count} image",
  countMany: "{count} images",
  countOfMax: "{count} of {max} images",
  reorder: "Drag to reorder, or use the arrows.",
  full: "Limit reached",
  fullReason: "Remove one to add another.",
  moved: "Moved to position {position} of {total}",
  removed: "Removed {name}",
  addedOne: "Added 1 image",
  addedMany: "Added {count} images",
  wrongType: "{name} cannot be used. Accepted: {types}.",
  tooLarge: "{name} is {size}. The limit is {max}.",
  tooMany: "Only {room} more can be added. The rest were left out.",
  isFull: "The set is full. Remove an image first.",
  dismiss: "Dismiss",
} satisfies Required<ImageUploadGridLabels>;

const fill = (template: string, values: Record<string, string>) => template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? "");

/** What focus should go to once the set has changed: a button on an image that moved, or the place of one that was removed. */
type Refocus = { id: string; action: "earlier" | "later" } | { at: number };

/** The picture, or a quiet block with its description when it cannot be shown. */
function Thumb({ image }: { image: UploadGridImage }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <span className="absolute inset-0 grid content-center justify-items-center gap-1.5 bg-muted px-3 text-center text-xs text-muted-foreground">
        <IconImage aria-hidden="true" className="size-5" />
        <span className="line-clamp-2">{image.alt}</span>
      </span>
    );
  }
  return <img src={image.src} alt={image.alt} draggable={false} loading="lazy" decoding="async" onError={() => setFailed(true)} className="size-full object-cover" />;
}

/**
 * The images of a product or a gallery as a grid of square tiles, for adding,
 * ordering and removing. The first tile is tagged Main, and an "Add images"
 * tile follows the last: a real multiple file input that also takes files
 * dropped on the grid. Every tile has Move earlier, Move later and Remove
 * buttons, which appear on hover and on focus (always, on a screen that cannot
 * hover) and can always be reached with the keyboard; the order can also be
 * changed by dragging a tile onto another. The grid arranges and never
 * uploads: new files come through `onFilesAdded` after the type, size and room
 * checks, and you hand back the images to show, as object URLs or your CDN
 * addresses. Moves and removals are spoken ("Moved to position 2 of 5"), focus
 * stays on the button that was pressed or moves to the neighbour, and a full
 * set switches the add tile off and says why in words ("Limit reached. Remove
 * one to add another."), with the count ("8 of 8 images") under the grid.
 */
export function ImageUploadGrid({
  images,
  onImagesChange,
  onFilesAdded,
  max,
  accept = "image/*",
  maxSize,
  disabled = false,
  label = "Images",
  locale = "en-US",
  labels,
  className,
  ...props
}: ImageUploadGridProps) {
  const text: Required<ImageUploadGridLabels> = { ...DEFAULT_LABELS, ...labels };
  const root = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const refocus = useRef<Refocus | null>(null);
  // Whether the cursor is somewhere in the grid, which a button that left cannot tell us after it is gone.
  const inside = useRef(false);
  const before = useRef(images.length);
  const [dragging, setDragging] = useState<string | null>(null);
  const [target, setTarget] = useState<number | null>(null);
  const [dropping, setDropping] = useState(false);
  const [notes, setNotes] = useState<string[]>([]);
  const [said, setSaid] = useState("");

  const count = images.length;
  const empty = count === 0;
  const full = max !== undefined && count >= max;
  const tally = max === undefined ? fill(count === 1 ? text.countOne : text.countMany, { count: String(count) }) : fill(text.countOfMax, { count: String(count), max: String(max) });

  // What was said stays only while it is news; left in the region it would be read again with the next message.
  useEffect(() => {
    if (!said) return;
    const timer = window.setTimeout(() => setSaid(""), 5000);
    return () => window.clearTimeout(timer);
  }, [said]);

  // Images that arrive are announced from the set itself, so it holds however the parent adds them: now, or when an upload has started.
  useEffect(() => {
    const grown = images.length - before.current;
    before.current = images.length;
    if (grown > 0) setSaid(grown === 1 ? text.addedOne : fill(text.addedMany, { count: String(grown) }));
    // The words come from labels, which can be a new object on every render; only the number of images decides when something arrived.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [images.length]);

  // The button that was pressed moves with its image or leaves with it. Once the new order is on the page, focus goes where the person was.
  useEffect(() => {
    const wanted = refocus.current;
    const region = root.current;
    refocus.current = null;
    // Nobody asked for focus to go anywhere, but it was in the grid and is now on the page: the add input goes off when the set is full.
    const lost = inside.current && document.activeElement === document.body;
    if (!region || (!wanted && !lost)) return;
    const tiles = Array.from(region.querySelectorAll<HTMLElement>("[data-image-id]"));
    let next: HTMLElement | null | undefined;
    if (!wanted) {
      next = full ? tiles[tiles.length - 1]?.querySelector<HTMLElement>('[data-action="remove"]') : input.current;
    } else if ("id" in wanted) {
      const tile = tiles.find((element) => element.dataset.imageId === wanted.id);
      // At the end of the row the button that was pressed is off; its partner is the next best place.
      const partner = wanted.action === "later" ? "earlier" : "later";
      next = tile?.querySelector<HTMLElement>(`[data-action="${wanted.action}"]:not([disabled])`) ?? tile?.querySelector<HTMLElement>(`[data-action="${partner}"]:not([disabled])`) ?? tile?.querySelector<HTMLElement>("[data-action]:not([disabled])");
    } else {
      next = tiles[Math.min(wanted.at, tiles.length - 1)]?.querySelector<HTMLElement>('[data-action="remove"]') ?? input.current;
    }
    next?.focus({ preventScroll: true });
  }, [images]);

  function move(from: number, to: number, by: "keyboard" | "pointer") {
    const image = images[from];
    if (disabled || !image || from === to || to < 0 || to >= count) return;
    const next = images.slice();
    next.splice(from, 1);
    next.splice(to, 0, image);
    if (by === "keyboard") refocus.current = { id: image.id, action: to > from ? "later" : "earlier" };
    setSaid(fill(text.moved, { position: String(to + 1), total: String(count) }));
    onImagesChange?.(next);
  }

  function remove(index: number) {
    const image = images[index];
    if (disabled || !image) return;
    refocus.current = { at: index };
    setSaid(fill(text.removed, { name: image.alt }));
    onImagesChange?.(images.filter((_, at) => at !== index));
  }

  function addFiles(list: readonly File[]) {
    if (disabled || list.length === 0) return;
    const room = max === undefined ? Number.POSITIVE_INFINITY : Math.max(0, max - count);
    const accepted: File[] = [];
    const found: string[] = [];
    let left = 0;
    for (const file of list) {
      if (!acceptsFile(file, accept)) found.push(fill(text.wrongType, { name: file.name, types: acceptWords(accept) }));
      else if (maxSize !== undefined && file.size > maxSize) found.push(fill(text.tooLarge, { name: file.name, size: formatBytes(file.size, locale), max: formatBytes(maxSize, locale) }));
      else if (accepted.length >= room) left += 1;
      else accepted.push(file);
    }
    if (left > 0) found.push(room === 0 ? text.isFull : fill(text.tooMany, { room: String(room), left: String(left) }));
    setNotes(found);
    if (accepted.length > 0) onFilesAdded?.(accepted);
  }

  const carriesFiles = (event: DragEvent) => Array.from(event.dataTransfer.types).includes("Files");

  return (
    <div
      ref={root}
      data-slot="image-upload-grid"
      className={cn("@container grid gap-3", className)}
      {...props}
      onFocus={() => {
        inside.current = true;
      }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) inside.current = false;
      }}
      onDragOver={(event) => {
        // Files from the desktop are taken by the grid; a tile being dragged is taken by the tile it is over.
        if (disabled || !carriesFiles(event)) return;
        event.preventDefault();
        setDropping(true);
      }}
      onDragLeave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDropping(false);
      }}
      onDrop={(event) => {
        if (!carriesFiles(event)) return;
        event.preventDefault();
        setDropping(false);
        addFiles(Array.from(event.dataTransfer.files));
      }}
    >
      <ul aria-label={label} className="grid grid-cols-2 gap-3 @md:grid-cols-3 @2xl:grid-cols-4">
        {images.map((image, index) => (
          <li
            key={image.id}
            data-image-id={image.id}
            draggable={!disabled}
            onDragStart={(event) => {
              event.dataTransfer.effectAllowed = "move";
              event.dataTransfer.setData("text/plain", image.id);
              setDragging(image.id);
            }}
            onDragEnd={() => {
              setDragging(null);
              setTarget(null);
            }}
            onDragOver={(event) => {
              if (dragging === null) return;
              event.preventDefault();
              event.dataTransfer.dropEffect = "move";
              if (target !== index) setTarget(index);
            }}
            onDrop={(event) => {
              if (dragging === null) return;
              event.preventDefault();
              const from = images.findIndex((item) => item.id === dragging);
              setDragging(null);
              setTarget(null);
              if (from >= 0) move(from, index, "pointer");
            }}
            className={cn("group/tile self-start rounded-lg transition-opacity duration-150 motion-reduce:transition-none", dragging === image.id && "opacity-40")}
          >
            {/* The picture and what sits on it share one box, so the badge and the buttons stay on the picture even when another tile in the row is taller. */}
            <div className="relative">
              <AspectRatio ratio={1}>
                <span
                  className={cn(
                    "absolute inset-0 overflow-hidden rounded-lg border bg-muted transition-[box-shadow,border-color] duration-150 motion-reduce:transition-none",
                    index === 0 ? "border-foreground/40" : "border-border",
                    target === index && dragging !== image.id && "ring-2 ring-foreground ring-offset-2 ring-offset-background",
                  )}
                >
                  <Thumb key={image.src} image={image} />
                </span>
              </AspectRatio>
              {index === 0 ? <span className="absolute top-2 left-2 rounded-md bg-foreground px-1.5 py-0.5 text-[0.6875rem] leading-4 font-medium text-background">{text.main}</span> : null}

              <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-2 transition-opacity duration-150 motion-reduce:transition-none [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-focus-within/tile:opacity-100 [@media(hover:hover)]:group-hover/tile:opacity-100">
                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-sm"
                    data-action="remove"
                    disabled={disabled}
                    aria-label={fill(text.remove, { name: image.alt })}
                    onClick={() => remove(index)}
                    className="pointer-events-auto size-7 rounded-full bg-background shadow-xs"
                  >
                    <IconClose size={14} />
                  </Button>
                </div>
                <div className="flex justify-center">
                  <div className="pointer-events-auto flex rounded-full border border-border bg-background p-0.5 shadow-xs">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      data-action="earlier"
                      disabled={disabled || index === 0}
                      aria-label={fill(text.earlier, { name: image.alt })}
                      onClick={() => move(index, index - 1, "keyboard")}
                      className="size-7 rounded-full"
                    >
                      <IconArrowLeft className="rtl:-scale-x-100" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      data-action="later"
                      disabled={disabled || index === count - 1}
                      aria-label={fill(text.later, { name: image.alt })}
                      onClick={() => move(index, index + 1, "keyboard")}
                      className="size-7 rounded-full"
                    >
                      <IconArrowRight className="rtl:-scale-x-100" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </li>
        ))}

        {/* A container of its own, so the tile can tell how much room it has whatever the number of columns: below 140px it drops what does not fit instead of growing past the square. */}
        <li className={cn("@container/add self-start", empty && "col-span-full")}>
          <label
            className={cn(
              "relative flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-3 text-center transition-[border-color,background-color] duration-150 motion-reduce:transition-none",
              "has-[input:focus-visible]:border-ring has-[input:focus-visible]:ring-[3px] has-[input:focus-visible]:ring-ring/40",
              empty ? "min-h-44" : "aspect-square overflow-hidden @max-[8.75rem]/add:gap-1.5 @max-[8.75rem]/add:p-2",
              full || disabled ? "cursor-not-allowed border-border bg-muted/40" : "border-foreground/25 bg-background hover:border-foreground/40 hover:bg-muted/50",
              dropping && !full && !disabled && "border-foreground bg-muted",
            )}
          >
            <input
              ref={input}
              type="file"
              multiple
              accept={accept}
              disabled={disabled || full}
              className="sr-only"
              onChange={(event) => {
                addFiles(Array.from(event.target.files ?? []));
                // So choosing the same file again is a change, too.
                event.target.value = "";
              }}
            />
            <span aria-hidden="true" className={cn("grid size-10 shrink-0 place-items-center rounded-full border border-border bg-card text-foreground @max-[8.75rem]/add:size-8", full && "@max-[8.75rem]/add:hidden")}>
              <IconPlus />
            </span>
            <span className="line-clamp-2 text-sm leading-5 font-medium text-balance @max-[8.75rem]/add:text-[0.8125rem]">{full ? text.full : text.add}</span>
            {/* On a small tile the hint is read out but not shown, except when the set is full: then it is the reason the tile is off. */}
            <span className={cn("max-w-[28ch] text-xs leading-4 text-pretty text-muted-foreground", !empty && "line-clamp-2", !empty && !full && "@max-[8.75rem]/add:sr-only")}>
              {full ? text.fullReason : empty ? text.emptyHint : text.addHint}
            </span>
          </label>
        </li>
      </ul>

      {notes.length > 0 ? (
        <div role="alert" className="flex items-start gap-2.5 rounded-lg border border-destructive/40 bg-destructive/5 py-2.5 pr-2 pl-3 text-xs leading-5">
          <IconAlertCircle aria-hidden="true" className="mt-0.5 size-3.5 shrink-0 text-destructive" />
          <ul className="min-w-0 flex-1 [overflow-wrap:anywhere]">
            {notes.map((note, index) => (
              <li key={`${index}-${note}`}>{note}</li>
            ))}
          </ul>
          <Button type="button" variant="ghost" size="icon-sm" aria-label={text.dismiss} onClick={() => setNotes([])} className="-my-1 size-7 shrink-0 text-muted-foreground hover:text-foreground">
            <IconClose size={14} />
          </Button>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-xs leading-5 text-muted-foreground">
        <p className="tabular-nums">{tally}</p>
        {count > 1 ? <p>{text.reorder}</p> : null}
      </div>

      <p role="status" className="sr-only">
        {said}
      </p>
    </div>
  );
}
