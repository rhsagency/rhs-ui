"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState, type ComponentProps, type CSSProperties, type KeyboardEvent, type ReactNode } from "react";
import { Popover as PopoverPrimitive } from "radix-ui";

import { IconClose } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { Collapsible, CollapsibleContent } from "@rhs-ui/primitives/collapsible";
import { Popover, PopoverClose, PopoverContent, PopoverTrigger } from "@rhs-ui/primitives/popover";
import { cn } from "@/lib/utils";

export interface Hotspot {
  /** What `activeId` and `onActiveChange` speak. Unique within the picture. */
  id: string;
  /** Where the marker sits, as a percentage of the picture's width: 0 at the left edge, 100 at the right. */
  x: number;
  /** Where the marker sits, as a percentage of the picture's height: 0 at the top edge, 100 at the bottom. */
  y: number;
  /** The name of the note. It is also the name of the marker for assistive technology, after its number. */
  title: string;
  /** The note itself: a sentence or two. Read-only text, not a form. */
  body?: ReactNode;
}

export interface HotspotImageLabels {
  /** The name of the button that closes a note. Default "Close note". */
  close?: string;
  /** The name of the list under the picture. Default "Notes". */
  notes?: string;
}

export interface HotspotImageProps extends Omit<ComponentProps<"figure">, "children"> {
  /** The address of the picture. */
  src: string;
  /** What the picture shows. Required. */
  alt: string;
  /** The markers, in the order they are numbered and tabbed through. Their positions are percentages of the picture, so they stay put at any size. */
  hotspots: readonly Hotspot[];
  /** The id of the note that is open, or `null` for none, when you control it. */
  activeId?: string | null;
  /** The id of the note to start open, when you do not control it. Default none, and none is best: a floating note that is open at load puts a focus guard at each end of the page, so the first Tab lands on an invisible stop. */
  defaultActiveId?: string | null;
  /** Called with the id of the note that opened, or `null` when it closed. */
  onActiveChange?: (id: string | null) => void;
  /** Show every note as a numbered list under the picture too: for screen readers and for small screens, where a marker is a small target. Default false. */
  showList?: boolean;
  /** The shape of the picture as width divided by height. It fills the frame, so give it the shape your picture has and the markers land where you put them. Default 3 / 2. */
  ratio?: number;
  /** A line under the picture (and above the list), such as "Apartment 4B, 74 m²". */
  caption?: ReactNode;
  /** The words for the close button and the list, for another language. */
  labels?: HotspotImageLabels;
}

/**
 * The number of a marker: white with a dark number whatever the page theme, because a picture does not follow the
 * theme. A ring and a halo lift it off a dark ground and off a pale one, and it turns black when its note is open.
 */
const MARKER =
  "grid size-7 place-items-center rounded-full bg-white text-xs font-semibold text-black tabular-nums shadow-[0_0_0_3px_rgb(255_255_255/0.7),0_1px_3px_rgb(0_0_0/0.3)] ring-1 ring-black/30 transition-[transform,background-color,color] duration-150 motion-reduce:transition-none";

/** A picture narrower than this, in rem, has no room to hold a floating note: the note opens in a panel under it instead. */
const COMPACT_BELOW = 30;

/** The words of a note: its number, its title and text, and a close button that the caller supplies. */
function Note({ number, title, body, titleId, bodyId, close }: { number: number; title: string; body?: ReactNode; titleId: string; bodyId: string; close: ReactNode }) {
  return (
    <div className="relative">
      <div className="flex items-start gap-2.5 pe-8">
        <span aria-hidden="true" className="grid size-6 shrink-0 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-foreground tabular-nums">
          {number}
        </span>
        <p id={titleId} className="min-w-0 text-sm leading-6 font-semibold tracking-[-0.01em]">
          {title}
        </p>
      </div>
      {body ? (
        <div id={bodyId} className="mt-1.5 text-sm leading-relaxed text-pretty text-muted-foreground">
          {body}
        </div>
      ) : null}
      <div className="absolute -end-1.5 -top-1">{close}</div>
    </div>
  );
}

/**
 * A picture with markers on it that open a note, for an annotated product
 * shot, a floor plan or a diagram. Each marker is a numbered button placed by
 * you in percentages, so it stays on its spot at any width. Pressing it opens
 * a note anchored to the marker, which flips and shifts to stay fully on
 * screen, and pressing it again, pressing Escape or tapping elsewhere closes
 * it. A picture narrower than 30rem is too small to hold a floating note, so
 * there the note opens in a panel under the picture instead and the picture
 * stays in view; that panel closes with its button, its marker or Escape.
 * The markers look small but keep a 44px target for a finger, Tab walks them
 * in numeric order (Tab from an open note carries on to the next marker,
 * Shift+Tab returns to its own), and each is named by its number and title.
 * They are white with a dark number whatever the page theme, because a
 * picture does not change with it. `showList` repeats every note as a list
 * under the picture, for screen readers and for small screens. It annotates a
 * picture: the notes are read-only, and it is neither a guided tour nor a
 * place for comments.
 */
export function HotspotImage({ src, alt, hotspots, activeId, defaultActiveId = null, onActiveChange, showList = false, ratio = 3 / 2, caption, labels, className, ...props }: HotspotImageProps) {
  const text = { close: labels?.close ?? "Close note", notes: labels?.notes ?? "Notes" };
  const [own, setOwn] = useState<string | null>(defaultActiveId);
  const active = activeId !== undefined ? activeId : own;
  const [frame, setFrame] = useState<HTMLDivElement | null>(null);
  const [compact, setCompact] = useState(false);
  const markers = useRef(new Map<string, HTMLButtonElement>());
  const panel = useRef<HTMLDivElement>(null);
  const scope = useId();
  const panelId = `${scope}-panel`;
  const titleOf = (id: string) => `${scope}-${id}-title`;
  const bodyOf = (id: string) => `${scope}-${id}-body`;
  // A note that is open when the page loads was opened by the page, not by the visitor, so it must not pull focus away from wherever they are.
  const byPage = useRef<string | null>(activeId !== undefined ? activeId : defaultActiveId);

  const current = hotspots.find((spot) => spot.id === active) ?? null;
  const currentId = current?.id ?? null;
  // The panel keeps the text of the note it last held while it closes, so the words do not vanish before the height has.
  const [lastId, setLastId] = useState<string | null>(currentId);
  if (currentId !== null && currentId !== lastId) setLastId(currentId);
  const kept = current ?? hotspots.find((spot) => spot.id === lastId) ?? null;

  // The picture decides how the note opens: floating next to its marker when there is room, in a panel under the picture when there is not.
  useLayoutEffect(() => {
    if (!frame) return;
    const measure = () => {
      const rem = Number.parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
      setCompact(frame.offsetWidth < COMPACT_BELOW * rem);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(frame);
    return () => observer.disconnect();
  }, [frame]);

  // In a panel, a note the visitor opened takes focus (as a floating one does, so its title and text are read) and is brought into view if it opened below the fold.
  useEffect(() => {
    const node = panel.current;
    if (!compact || currentId === null || byPage.current === currentId || !node) return;
    node.focus({ preventScroll: true });
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = window.setTimeout(() => node.scrollIntoView({ block: "nearest", behavior: calm ? "auto" : "smooth" }), calm ? 0 : 220);
    return () => window.clearTimeout(timer);
  }, [compact, currentId]);

  const change = (next: string | null) => {
    byPage.current = null;
    if (activeId === undefined) setOwn(next);
    onActiveChange?.(next);
  };

  const leave = (id: string, event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Tab") return;
    const marker = markers.current.get(id);
    if (!marker) return;
    if (event.shiftKey) {
      // Back from anywhere in the note lands on its own marker.
      event.preventDefault();
      marker.focus();
    } else if ((event.target as HTMLElement).closest("button")) {
      // Forward from the close button hands focus to the marker and lets the browser take the next step from there: the next marker.
      marker.focus();
    }
  };

  // A floating note is a popover and closes itself on Escape; a panel is part of the page, so it closes here.
  const dismiss = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key !== "Escape" || active === null) return;
    event.preventDefault();
    const was = active;
    change(null);
    if (panel.current?.contains(event.target as Node)) markers.current.get(was)?.focus();
  };

  return (
    <figure data-slot="hotspot-image" className={cn("m-0 w-full", className)} {...props}>
      <div ref={setFrame} className="relative w-full rounded-xl border border-border bg-muted" style={{ aspectRatio: ratio }}>
        <div className="absolute inset-0 overflow-hidden rounded-[inherit]">
          <img src={src} alt={alt} loading="lazy" decoding="async" draggable={false} className="size-full object-cover" />
        </div>
        {hotspots.map((spot, index) => {
          const number = index + 1;
          const open = active === spot.id;
          const place = { left: `${Math.min(100, Math.max(0, spot.x))}%`, top: `${Math.min(100, Math.max(0, spot.y))}%` } as CSSProperties;
          return (
            <Popover
              key={spot.id}
              // In a panel the popover never opens: a press on the marker still arrives here, as a request to open, and toggles the note.
              open={!compact && open}
              onOpenChange={(next) => {
                if (compact) change(open ? null : spot.id);
                else if (next) change(spot.id);
                else if (active === spot.id) change(null);
              }}
            >
              <PopoverTrigger asChild>
                <button
                  ref={(node) => {
                    if (node) markers.current.set(spot.id, node);
                    else markers.current.delete(spot.id);
                  }}
                  type="button"
                  aria-label={`${number}: ${spot.title}`}
                  data-state={open ? "open" : "closed"}
                  style={place}
                  {...(compact ? { "aria-haspopup": undefined, "aria-expanded": open, "aria-controls": open ? panelId : undefined, onKeyDown: dismiss } : null)}
                  className="group/marker absolute z-10 grid size-11 -translate-x-1/2 -translate-y-1/2 cursor-pointer place-items-center rounded-full outline-none"
                >
                  {/* A short invitation: the ring grows twice and stops, so it never keeps moving. */}
                  <span aria-hidden="true" style={{ animationDelay: `${index * 140}ms` }} className="absolute size-7 rounded-full bg-white motion-safe:animate-rhs-hotspot-ping" />
                  <span
                    className={cn(
                      MARKER,
                      "relative group-hover/marker:scale-110 group-active/marker:scale-95",
                      "group-data-[state=open]/marker:bg-black group-data-[state=open]/marker:text-white group-data-[state=open]/marker:ring-white",
                      // Two rings, a black one against the marker and a white one outside it, so focus shows on a dark picture and on a pale one.
                      "group-focus-visible/marker:shadow-[0_0_0_2px_#000,0_0_0_4px_#fff,0_1px_3px_rgb(0_0_0/0.3)]",
                    )}
                  >
                    {number}
                  </span>
                </button>
              </PopoverTrigger>
              <PopoverContent
                side="top"
                sideOffset={10}
                collisionPadding={8}
                sticky="always"
                onOpenAutoFocus={(event) => {
                  // Focus lands on the note itself, so a screen reader reads its title and text; Tab reaches the close button next.
                  event.preventDefault();
                  if (byPage.current !== spot.id) (event.target as HTMLElement).focus({ preventScroll: true });
                }}
                aria-labelledby={titleOf(spot.id)}
                aria-describedby={spot.body ? bodyOf(spot.id) : undefined}
                // When the picture narrows and the note moves to the panel, the popover closes without the visitor asking: focus stays where it was.
                onCloseAutoFocus={(event) => {
                  if (compact) event.preventDefault();
                }}
                onKeyDown={(event) => leave(spot.id, event)}
                className="w-72 max-w-(--radix-popover-content-available-width) p-0"
              >
                {/* The note scrolls inside the room it has; the arrow sits outside this box, so it is not clipped. */}
                <div className="relative max-h-(--radix-popover-content-available-height) overflow-y-auto rounded-[inherit] p-3.5">
                  <Note
                    number={number}
                    title={spot.title}
                    body={spot.body}
                    titleId={titleOf(spot.id)}
                    bodyId={bodyOf(spot.id)}
                    close={
                      <PopoverClose asChild>
                        <Button type="button" variant="ghost" size="icon-sm" aria-label={text.close} className="text-muted-foreground">
                          <IconClose />
                        </Button>
                      </PopoverClose>
                    }
                  />
                </div>
                <PopoverPrimitive.Arrow asChild>
                  <span className="block size-2.5 -translate-y-1/2 rotate-45 border-r border-b border-border bg-popover" />
                </PopoverPrimitive.Arrow>
              </PopoverContent>
            </Popover>
          );
        })}
      </div>
      {compact ? (
        <Collapsible open={current !== null}>
          <CollapsibleContent>
            {kept ? (
              <div className="pt-3">
                <div
                  ref={panel}
                  id={panelId}
                  role="group"
                  tabIndex={-1}
                  aria-labelledby={titleOf(kept.id)}
                  aria-describedby={kept.body ? bodyOf(kept.id) : undefined}
                  onKeyDown={(event) => {
                    dismiss(event);
                    leave(kept.id, event);
                  }}
                  className="scroll-mb-4 rounded-xl border border-border bg-card p-3.5 text-card-foreground outline-none"
                >
                  <Note
                    number={hotspots.findIndex((spot) => spot.id === kept.id) + 1}
                    title={kept.title}
                    body={kept.body}
                    titleId={titleOf(kept.id)}
                    bodyId={bodyOf(kept.id)}
                    close={
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label={text.close}
                        onClick={() => {
                          change(null);
                          markers.current.get(kept.id)?.focus();
                        }}
                        className="text-muted-foreground"
                      >
                        <IconClose />
                      </Button>
                    }
                  />
                </div>
              </div>
            ) : null}
          </CollapsibleContent>
        </Collapsible>
      ) : null}
      {caption ? <figcaption className="mt-3 text-sm text-muted-foreground">{caption}</figcaption> : null}
      {showList ? (
        <ol aria-label={text.notes} className="mt-5 grid list-none gap-x-8 gap-y-1 p-0 sm:grid-cols-2">
          {hotspots.map((spot, index) => (
            <li key={spot.id} data-active={active === spot.id ? "true" : "false"} className="group/item flex gap-3 rounded-lg px-3 py-2.5 transition-colors duration-150 data-[active=true]:bg-muted motion-reduce:transition-none">
              <span aria-hidden="true" className="mt-px grid size-6 shrink-0 place-items-center rounded-full border border-border bg-background text-xs font-semibold tabular-nums group-data-[active=true]/item:border-primary group-data-[active=true]/item:bg-primary group-data-[active=true]/item:text-primary-foreground">
                {index + 1}
              </span>
              <div className="min-w-0">
                <p className="text-sm leading-6 font-medium tracking-[-0.01em]">{spot.title}</p>
                {spot.body ? <div className="text-sm leading-relaxed text-muted-foreground">{spot.body}</div> : null}
              </div>
            </li>
          ))}
        </ol>
      ) : null}
    </figure>
  );
}
