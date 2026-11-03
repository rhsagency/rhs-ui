"use client";

import { useCallback, useId, useRef, useState, type ComponentProps, type KeyboardEvent, type PointerEvent } from "react";

import { IconImage, IconTarget } from "@rhs-ui/icons";
import { CENTRE, ratioLabel, snapPoint, type FocalPoint } from "@rhs-ui/application/focal-point-field/focal";
import { AspectRatio } from "@rhs-ui/primitives/aspect-ratio";
import { Button } from "@rhs-ui/primitives/button";
import { Skeleton } from "@rhs-ui/primitives/skeleton";
import { cn } from "@/lib/utils";

export type { FocalPoint };

/** One of the crops shown beside the image. */
export interface FocalPointPreview {
  /** What the crop is for: "Square", "Banner". */
  label: string;
  /** Its shape as width divided by height: 1, 16 / 9, 3 / 4. */
  ratio: number;
}

/** The words the field uses, for translation. `{x}` and `{y}` are filled in. */
export interface FocalPointFieldLabels {
  /** The name of the handle for a screen reader. Default "Focal point". */
  handle?: string;
  /** What a screen reader hears as the handle's value, and what the readout says. Default "{x}% across, {y}% down". */
  position?: string;
  /** The readout's name for the horizontal position. Default "Across". */
  across?: string;
  /** The readout's name for the vertical position. Default "Down". */
  down?: string;
  /** The button that centres the point. Default "Centre". */
  centre?: string;
  /** The line of help under the readout. Default "Click or drag on the image. The arrow keys move the point by 1% and Shift by 10%, Home centres it." */
  help?: string;
  /** The heading of the previews. Default "Previews". */
  previews?: string;
  /** The heading of the error. Default "The image could not be loaded". */
  failed?: string;
  /** The reason when the browser is offline. Default "You appear to be offline. Reconnect and try again." */
  offline?: string;
  /** The reason when the address is a file that is not an image. Default "The file is not an image the browser can read. Try a JPG, PNG or WebP." */
  unreadable?: string;
  /** The reason otherwise. Default "The address did not return an image. Check the link, or choose another picture." */
  missing?: string;
  /** The button that tries again. Default "Try again". */
  retry?: string;
}

export interface FocalPointFieldProps extends Omit<ComponentProps<"div">, "defaultValue" | "onChange" | "children"> {
  /** The address of the image. */
  src: string;
  /** What the image shows, for people who cannot see it. */
  alt: string;
  /** The point, when you control it. */
  value?: FocalPoint;
  /** The point to start with, when you do not control it. Default the centre. */
  defaultValue?: FocalPoint;
  /** Called with `{ x, y }` as numbers from 0 to 100 while the point moves: ready for `object-position: ${x}% ${y}%`. */
  onValueChange?: (value: FocalPoint) => void;
  /** The crops to preview, each with its shape. Default square, wide (16:9) and tall (3:4). */
  previews?: readonly FocalPointPreview[];
  /** What the point moves in, in percent: it snaps to multiples of it, and the arrow keys move by it (Shift by ten times as much). Default 1. */
  step?: number;
  /** The field's name, for a plain form submit: the point goes out as `nameX` and `nameY`. */
  name?: string;
  /** Turns the field off. */
  disabled?: boolean;
  /** The words the field uses, for translation. */
  labels?: FocalPointFieldLabels;
}

const DEFAULT_LABELS = {
  handle: "Focal point",
  position: "{x}% across, {y}% down",
  across: "Across",
  down: "Down",
  centre: "Centre",
  help: "Click or drag on the image. The arrow keys move the point by 1% and Shift by 10%, Home centres it.",
  previews: "Previews",
  failed: "The image could not be loaded",
  offline: "You appear to be offline. Reconnect and try again.",
  unreadable: "The file is not an image the browser can read. Try a JPG, PNG or WebP.",
  missing: "The address did not return an image. Check the link, or choose another picture.",
  retry: "Try again",
} satisfies Required<FocalPointFieldLabels>;

const DEFAULT_PREVIEWS: readonly FocalPointPreview[] = [
  { label: "Square", ratio: 1 },
  { label: "Wide", ratio: 16 / 9 },
  { label: "Tall", ratio: 3 / 4 },
];

/** The image is shown as large as fits in this height, so a tall picture does not push everything off the screen. */
const MAX_HEIGHT = "26rem";

/** The height, in rem, a preview starts from before it takes its share of the free space of its row, and the most it grows to. */
const PREVIEW_START = 5.25;
const PREVIEW_MOST = 7;

const fill = (template: string, values: Record<string, string>) => template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? "");

/**
 * Mark the part of an image that must never be cropped. The image carries a
 * crosshair handle that works like a two-axis slider: drag it, click where the
 * subject is, or use the arrow keys (1%, Shift 10%) and Home to centre it. The
 * handle says its place as "45% across, 30% down". Beside it, a square, a
 * wide and a tall crop show the same image with `object-position` set to the
 * point, so the result is seen before it is saved. It reports `{ x, y }` as
 * numbers from 0 to 100, ready for CSS `object-position`, and it works with
 * mouse, touch and pen through pointer events.
 */
export function FocalPointField({ src, alt, value, defaultValue = CENTRE, onValueChange, previews = DEFAULT_PREVIEWS, step = 1, name, disabled = false, labels, className, ...props }: FocalPointFieldProps) {
  const text: Required<FocalPointFieldLabels> = { ...DEFAULT_LABELS, ...labels };
  const base = useId();
  const helpId = `${base}-help`;
  const stage = useRef<HTMLDivElement>(null);
  const handle = useRef<HTMLDivElement>(null);
  // Where on the handle it was grabbed, so dragging it by its edge does not make it jump to the pointer.
  const grab = useRef({ x: 0, y: 0 });
  const [own, setOwn] = useState<FocalPoint>(() => snapPoint(defaultValue, step));
  const [dragging, setDragging] = useState(false);
  const [ratio, setRatio] = useState(4 / 3);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [reason, setReason] = useState(text.missing);
  const [attempt, setAttempt] = useState(0);
  const point = value ?? own;
  const position = (at: FocalPoint) => fill(text.position, { x: String(Math.round(at.x)), y: String(Math.round(at.y)) });

  // An image that finished before this ran (the page came from a server) never says so again.
  const attach = useCallback((node: HTMLImageElement | null) => {
    if (!node?.complete) return;
    if (node.naturalWidth > 0) {
      setRatio(node.naturalHeight > 0 ? node.naturalWidth / node.naturalHeight : 4 / 3);
      setStatus("ready");
    } else {
      setStatus("error");
    }
  }, []);

  function failed() {
    setReason(typeof navigator !== "undefined" && navigator.onLine === false ? text.offline : /^(?:data|blob):/i.test(src) ? text.unreadable : text.missing);
    setStatus("error");
  }

  function commit(next: FocalPoint) {
    const snapped = snapPoint(next, step);
    if (snapped.x === point.x && snapped.y === point.y) return;
    if (value === undefined) setOwn(snapped);
    onValueChange?.(snapped);
  }

  function fromPointer(event: PointerEvent<HTMLDivElement>) {
    const box = stage.current?.getBoundingClientRect();
    if (!box || box.width === 0 || box.height === 0) return;
    commit({ x: ((event.clientX - grab.current.x - box.left) / box.width) * 100, y: ((event.clientY - grab.current.y - box.top) / box.height) * 100 });
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (disabled) return;
    const jump = (event.shiftKey ? 10 : 1) * step;
    const next: FocalPoint | null =
      event.key === "ArrowLeft" ? { x: point.x - jump, y: point.y } : event.key === "ArrowRight" ? { x: point.x + jump, y: point.y } : event.key === "ArrowUp" ? { x: point.x, y: point.y - jump } : event.key === "ArrowDown" ? { x: point.x, y: point.y + jump } : event.key === "Home" ? CENTRE : null;
    if (!next) return;
    event.preventDefault();
    commit(next);
  }

  const objectPosition = `${point.x}% ${point.y}%`;

  return (
    <div data-slot="focal-point-field" data-status={status} className={cn("@container grid gap-6 @2xl:grid-cols-[minmax(0,1fr)_20rem] @2xl:items-start", className)} {...props}>
      <div className="min-w-0">
        {status === "error" ? (
          <div role="alert" className="grid aspect-[4/3] place-content-center justify-items-center gap-2 rounded-lg border border-dashed border-border bg-muted/40 px-6 text-center">
            <IconImage aria-hidden="true" className="size-6 text-muted-foreground" />
            <p className="text-sm font-medium">{text.failed}</p>
            <p className="max-w-sm text-xs leading-5 text-muted-foreground">{reason}</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-1"
              onClick={() => {
                setStatus("loading");
                setAttempt((current) => current + 1);
              }}
            >
              {text.retry}
            </Button>
          </div>
        ) : (
          <div
            ref={stage}
            data-dragging={dragging || undefined}
            aria-busy={status === "loading" || undefined}
            style={{ maxWidth: `calc(${MAX_HEIGHT} * ${ratio})` }}
            className={cn("relative mx-auto w-full touch-none select-none", disabled ? "cursor-not-allowed opacity-60" : dragging ? "cursor-grabbing" : "cursor-crosshair")}
            onPointerDown={(event) => {
              if (disabled || status !== "ready" || event.button !== 0) return;
              event.preventDefault();
              const grip = handle.current?.getBoundingClientRect();
              const onHandle = Boolean(grip) && event.target instanceof Node && Boolean(handle.current?.contains(event.target));
              grab.current = onHandle && grip ? { x: event.clientX - (grip.left + grip.width / 2), y: event.clientY - (grip.top + grip.height / 2) } : { x: 0, y: 0 };
              event.currentTarget.setPointerCapture(event.pointerId);
              setDragging(true);
              fromPointer(event);
              handle.current?.focus({ preventScroll: true });
            }}
            onPointerMove={(event) => {
              if (dragging) fromPointer(event);
            }}
            onPointerUp={() => setDragging(false)}
            onPointerCancel={() => setDragging(false)}
            onLostPointerCapture={() => setDragging(false)}
          >
            <AspectRatio ratio={ratio} className="overflow-hidden rounded-lg border border-border bg-muted">
              <img
                key={attempt}
                ref={attach}
                src={src}
                alt={alt}
                draggable={false}
                onLoad={(event) => {
                  const image = event.currentTarget;
                  setRatio(image.naturalWidth > 0 && image.naturalHeight > 0 ? image.naturalWidth / image.naturalHeight : 4 / 3);
                  setStatus("ready");
                }}
                onError={failed}
                className={cn("size-full object-cover transition-opacity duration-300 motion-reduce:transition-none", status === "ready" ? "opacity-100" : "opacity-0")}
              />
              {status === "loading" ? <Skeleton className="absolute inset-0 rounded-none" /> : null}
            </AspectRatio>

            {status === "ready" ? (
              <div className="pointer-events-none absolute inset-0">
                <span aria-hidden="true" className="absolute inset-y-0 w-px -translate-x-1/2 bg-white/70 shadow-[0_0_0_0.5px_rgb(0_0_0/0.3)]" style={{ left: `${point.x}%` }} />
                <span aria-hidden="true" className="absolute inset-x-0 h-px -translate-y-1/2 bg-white/70 shadow-[0_0_0_0.5px_rgb(0_0_0/0.3)]" style={{ top: `${point.y}%` }} />
                <div
                  ref={handle}
                  role="slider"
                  tabIndex={disabled ? -1 : 0}
                  aria-label={text.handle}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round(point.x)}
                  aria-valuetext={position(point)}
                  aria-disabled={disabled || undefined}
                  aria-describedby={helpId}
                  onKeyDown={onKeyDown}
                  data-dragging={dragging || undefined}
                  className="pointer-events-auto absolute z-10 grid size-8 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 border-white bg-black/25 shadow-[0_0_0_1px_rgb(0_0_0/0.45),0_2px_8px_rgb(0_0_0/0.35)] outline-none transition-[transform] duration-150 focus-visible:ring-[3px] focus-visible:ring-white/70 data-[dragging]:scale-110 motion-reduce:transition-none"
                  style={{ left: `${point.x}%`, top: `${point.y}%` }}
                >
                  <span aria-hidden="true" className="size-1.5 rounded-full bg-white shadow-[0_0_0_1px_rgb(0_0_0/0.4)]" />
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>

      <div className="grid min-w-0 gap-5">
        <div className="grid gap-3">
          <div className="flex items-end justify-between gap-3">
            <dl className="flex gap-6">
              <div className="grid gap-0.5">
                <dt className="text-xs text-muted-foreground">{text.across}</dt>
                <dd className="text-lg leading-none font-semibold tracking-[-0.02em] tabular-nums">{Math.round(point.x)}%</dd>
              </div>
              <div className="grid gap-0.5">
                <dt className="text-xs text-muted-foreground">{text.down}</dt>
                <dd className="text-lg leading-none font-semibold tracking-[-0.02em] tabular-nums">{Math.round(point.y)}%</dd>
              </div>
            </dl>
            <Button type="button" variant="outline" size="sm" disabled={disabled || status !== "ready"} onClick={() => commit(CENTRE)}>
              <IconTarget />
              {text.centre}
            </Button>
          </div>
          <p id={helpId} className="text-xs leading-5 text-muted-foreground">
            {text.help}
          </p>
        </div>

        <div className="grid gap-2">
          <p className="text-xs font-medium text-muted-foreground">{text.previews}</p>
          <ul className="flex flex-wrap items-end gap-x-2.5 gap-y-4">
            {previews.map((preview) => (
              // The widths follow the ratios, so the crops of a row stand side by side at the same height. Each starts from a height of 5.25rem and grows with the space of its row up to 7rem, a row that is full wraps to the next, and a very narrow shape keeps a width a crop can still be judged at.
              <li key={preview.label} className="min-w-14" style={{ flex: `${preview.ratio} 1 ${preview.ratio * PREVIEW_START}rem`, maxWidth: `${preview.ratio * PREVIEW_MOST}rem` }}>
                <AspectRatio ratio={preview.ratio} className="overflow-hidden rounded-md border border-border bg-muted">
                  {status === "ready" ? <img src={src} alt="" draggable={false} className="size-full object-cover" style={{ objectPosition }} /> : <Skeleton className="size-full rounded-none" />}
                </AspectRatio>
                {/* The name above the shape, always two lines, so every caption is as tall as the next. */}
                <p className="mt-1.5 grid grid-cols-[minmax(0,1fr)] text-xs leading-4">
                  <span className="truncate font-medium">{preview.label}</span>
                  <span className="truncate text-muted-foreground tabular-nums">{ratioLabel(preview.ratio)}</span>
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {name ? (
        <>
          <input type="hidden" name={`${name}X`} value={point.x} disabled={disabled} />
          <input type="hidden" name={`${name}Y`} value={point.y} disabled={disabled} />
        </>
      ) : null}
    </div>
  );
}
