"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type ComponentProps, type ReactNode } from "react";
import { createPortal } from "react-dom";

import { IconBan, IconUpload } from "@rhs-ui/icons";
import { describeAccept, fileMatches, summariseDrag } from "@rhs-ui/application/drop-overlay/accept";
import { cn } from "@/lib/utils";

/** The words under the message, for translation. `{count}` and `{types}` are filled in. */
export interface DropOverlayLabels {
  /** How many files are being dragged, for one file. Default "{count} file". */
  one?: string;
  /** How many files are being dragged. Default "{count} files". */
  other?: string;
  /** Said when some of the files will be left out. Default "{count} will be skipped". */
  skipped?: string;
  /** Said in the refusal, with what is accepted. Default "Only {types}". */
  only?: string;
}

const DEFAULT_LABELS = {
  one: "{count} file",
  other: "{count} files",
  skipped: "{count} will be skipped",
  only: "Only {types}",
} satisfies Required<DropOverlayLabels>;

const fill = (template: string, values: Record<string, string>) => template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? "");

export interface DropOverlayPanelProps extends Omit<ComponentProps<"div">, "children"> {
  /** `accept` says what will happen when the files are dropped. `reject` says they cannot be used. Default `accept`. */
  state?: "accept" | "reject";
  /** The headline: what will happen, or why it will not. */
  message: ReactNode;
  /** A quiet line under it, such as how many files and which types. */
  detail?: ReactNode;
}

/**
 * The face of the overlay: a scrim over the region, a dashed frame, an icon
 * and the message. It is what `DropOverlay` draws while files are dragged
 * over, exported so a preview can show each state without a drag, or a region
 * of your own can wear it. It fills the nearest positioned parent.
 */
export function DropOverlayPanel({ state = "accept", message, detail, className, ...props }: DropOverlayPanelProps) {
  const refuse = state === "reject";
  return (
    <div data-slot="drop-overlay-panel" data-state={state} className={cn("absolute inset-0 grid place-items-center rounded-[inherit] bg-background/85 p-3", className)} {...props}>
      <div aria-hidden="true" className={cn("absolute inset-2.5 rounded-lg border-2 border-dashed", refuse ? "border-destructive/60" : "border-foreground/30")} />
      <div className="relative grid max-w-full justify-items-center gap-3 px-6 py-2 text-center">
        <span aria-hidden="true" className={cn("grid size-12 place-items-center rounded-full border bg-card shadow-xs", refuse ? "border-destructive/40 text-destructive" : "border-border text-foreground")}>
          {refuse ? <IconBan className="size-5" /> : <IconUpload className="size-5" />}
        </span>
        <span className="grid gap-1">
          <span className="text-sm font-semibold tracking-[-0.01em] text-foreground">{message}</span>
          {detail ? <span className="text-xs text-muted-foreground">{detail}</span> : null}
        </span>
      </div>
    </div>
  );
}

/** What is being dragged over, as far as the browser says. */
interface DragState {
  kind: "accept" | "reject";
  files: number;
  refused: number;
}

export interface DropOverlayProps extends Omit<ComponentProps<"div">, "ref" | "onDrop" | "onDragEnter" | "onDragOver" | "onDragLeave"> {
  /** Called with the dropped files that match `accept`. Start the upload here. */
  onFiles: (files: File[]) => void;
  /** Called with dropped files that do not match `accept`, so you can say why they were left out. A drag where every file is refused cannot be dropped at all, so this only hears about the odd one out of a mixed drop. */
  onReject?: (files: File[]) => void;
  /** What a file must be, as the input's `accept` takes it: "image/*,.pdf". Without it every file is welcome. The drag is judged by type while it moves and the drop by name and type. */
  accept?: string;
  /** What will happen, said while files are over the region. It is also the polite status a screen reader hears. Default "Drop files to upload". */
  message?: string;
  /** What is said instead when the files cannot be used. Default "These files can't be uploaded". */
  rejectMessage?: string;
  /** Cover the whole window and take a drop anywhere on the page, instead of only the region. The overlay is drawn on the page itself, so a transformed parent cannot shrink it. */
  global?: boolean;
  /** Take no drops and draw nothing. */
  disabled?: boolean;
  /** The words under the message, for translation. */
  labels?: DropOverlayLabels;
}

const subscribeNever = () => () => undefined;

/**
 * Let people drop files anywhere on a region, or the whole page. The moment
 * a file is dragged over, an overlay fills the region with a dashed frame and
 * says what will happen ("Drop to attach to this ticket"); if the dragged types
 * cannot match `accept` it says so instead and the drop is not allowed. Enter
 * and leave are counted, so moving over the region's children never makes it
 * flicker, and dragged text and links are ignored. The overlay is not a place
 * to click: a plain file button stays the route for the keyboard, so pair
 * this with one. The message is also spoken as a polite status. The region
 * needs no setup: give it a radius and a border and the overlay follows them.
 */
export function DropOverlay({ onFiles, onReject, accept, message = "Drop files to upload", rejectMessage = "These files can't be uploaded", global = false, disabled = false, labels, className, children, ...props }: DropOverlayProps) {
  const text: Required<DropOverlayLabels> = { ...DEFAULT_LABELS, ...labels };
  const root = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<DragState | null>(null);
  // What was last dragged over, so the words stay put while the overlay fades out.
  const lastDrag = useRef<DragState | null>(null);
  if (drag) lastDrag.current = drag;
  const mounted = useSyncExternalStore(subscribeNever, () => true, () => false);
  // The latest props, read by the listeners without attaching them again on every render.
  const latest = useRef({ onFiles, onReject, accept });
  latest.current = { onFiles, onReject, accept };

  useEffect(() => {
    if (disabled) return;
    const target: EventTarget | null = global ? window : root.current;
    if (!target) return;
    let depth = 0;
    // Whether a drag is on, so the listeners for its end do nothing the rest of the time.
    let live = false;
    // Browsers fire dragover every few hundred milliseconds while a drag is over the page. When they stop, the drag is over, however it ended (Escape, a drop somewhere else).
    let watchdog: ReturnType<typeof setTimeout> | undefined;
    const hasFiles = (event: DragEvent) => Boolean(event.dataTransfer && Array.from(event.dataTransfer.types).includes("Files"));
    const judge = (event: DragEvent): DragState => {
      const { files, refused } = summariseDrag(event.dataTransfer?.items, latest.current.accept);
      return { kind: files > 0 && refused === files ? "reject" : "accept", files, refused };
    };
    const show = (next: DragState | null) => {
      live = next !== null;
      clearTimeout(watchdog);
      if (next) {
        watchdog = setTimeout(() => {
          depth = 0;
          show(null);
        }, 1200);
      }
      setDrag((current) => (current === next || (current && next && current.kind === next.kind && current.files === next.files && current.refused === next.refused) ? current : next));
    };
    const enter = (event: Event) => {
      const drop = event as DragEvent;
      if (!hasFiles(drop)) return;
      depth += 1;
      show(judge(drop));
    };
    const over = (event: Event) => {
      const drop = event as DragEvent;
      if (!hasFiles(drop)) return;
      // Cancelling dragover is what allows a drop.
      drop.preventDefault();
      const next = judge(drop);
      if (drop.dataTransfer) drop.dataTransfer.dropEffect = next.kind === "reject" ? "none" : "copy";
      show(next);
    };
    const leave = (event: Event) => {
      const drop = event as DragEvent;
      if (!hasFiles(drop)) return;
      depth = Math.max(0, depth - 1);
      if (depth === 0) show(null);
    };
    const drop = (event: Event) => {
      const dropped = event as DragEvent;
      if (!hasFiles(dropped)) return;
      dropped.preventDefault();
      depth = 0;
      show(null);
      const files = Array.from(dropped.dataTransfer?.files ?? []);
      const { accept: rule, onFiles: take, onReject: refuse } = latest.current;
      const taken = files.filter((file) => fileMatches(file, rule));
      const left = files.filter((file) => !fileMatches(file, rule));
      if (taken.length > 0) take(taken);
      if (left.length > 0) refuse?.(left);
    };
    // Mouse and key events do not fire during a drag, so the first one after it means it is over.
    const finish = () => {
      if (!live) return;
      depth = 0;
      show(null);
    };
    target.addEventListener("dragenter", enter);
    target.addEventListener("dragover", over);
    target.addEventListener("dragleave", leave);
    target.addEventListener("drop", drop);
    window.addEventListener("pointerdown", finish);
    window.addEventListener("keydown", finish);
    window.addEventListener("blur", finish);
    return () => {
      target.removeEventListener("dragenter", enter);
      target.removeEventListener("dragover", over);
      target.removeEventListener("dragleave", leave);
      target.removeEventListener("drop", drop);
      window.removeEventListener("pointerdown", finish);
      window.removeEventListener("keydown", finish);
      window.removeEventListener("blur", finish);
      show(null);
    };
  }, [disabled, global]);

  const active = drag !== null && !disabled;
  const view = drag ?? lastDrag.current;
  const refuse = view?.kind === "reject";
  const rule = accept?.trim() ? accept : undefined;
  const detail = (() => {
    if (!view) return undefined;
    const parts: string[] = [];
    if (refuse) {
      if (rule) parts.push(fill(text.only, { types: describeAccept(rule) }));
    } else {
      if (view.files > 0) parts.push(fill(view.files === 1 ? text.one : text.other, { count: String(view.files) }));
      if (view.refused > 0) parts.push(fill(text.skipped, { count: String(view.refused) }));
      else if (rule) parts.push(describeAccept(rule));
    }
    return parts.length > 0 ? parts.join(" · ") : undefined;
  })();

  const layer = (
    <div
      aria-hidden="true"
      data-slot="drop-overlay-layer"
      data-active={active || undefined}
      className={cn("pointer-events-none rounded-[inherit] transition-[opacity,visibility] duration-150 motion-reduce:transition-none", global ? "fixed inset-0 z-50" : "absolute inset-0 z-30", active ? "visible opacity-100" : "invisible opacity-0")}
    >
      <div className={cn("relative size-full rounded-[inherit] transition-transform duration-200 ease-out motion-reduce:transition-none", active ? "scale-100" : "scale-[0.985]")}>
        <DropOverlayPanel state={refuse ? "reject" : "accept"} message={refuse ? rejectMessage : message} detail={detail} />
      </div>
    </div>
  );

  return (
    <div ref={root} data-slot="drop-overlay" data-drag={drag?.kind} className={cn("relative", className)} {...props}>
      {children}
      {global ? (mounted ? createPortal(layer, document.body) : null) : layer}
      <span role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {active ? (refuse ? rejectMessage : message) : ""}
      </span>
    </div>
  );
}
