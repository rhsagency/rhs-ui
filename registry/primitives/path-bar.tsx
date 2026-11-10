"use client";

import { Fragment, useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type ComponentProps, type FormEvent, type KeyboardEvent as ReactKeyEvent, type MouseEvent } from "react";

import { IconAlertCircle, IconArrowRight, IconEdit, IconMoreHorizontal } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { CopyButton } from "@rhs-ui/primitives/copy-button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@rhs-ui/primitives/dropdown-menu";
import { Kbd, KbdGroup } from "@rhs-ui/primitives/kbd";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@rhs-ui/primitives/tooltip";
import { cn } from "@/lib/utils";

export interface PathSegment {
  /** What is shown: a folder, or a part of an address. */
  label: string;
  /** The whole path up to and including this segment: "/projects/northwind". It is what `onNavigate` receives. */
  path: string;
  /** Makes the segment a real link. Without it the segment is a button. */
  href?: string;
}

export interface PathBarLabels {
  /** The name of the bar for screen readers. Default "Path". */
  nav?: string;
  /** The name of the text field. Default "Path". */
  field?: string;
  /** The Edit button. Default "Edit path". */
  edit?: string;
  /** The button that goes to the typed path. Default "Go to path". */
  go?: string;
  /** The Copy button. Default "Copy path". */
  copy?: string;
  /** What Copy says once it has copied. Default "Path copied". */
  copied?: string;
  /** The name of the "…" menu that holds the folded folders. Default "Show hidden folders". */
  more?: string;
  /** Said when the field is empty and Enter is pressed. Default "Enter a path". */
  empty?: string;
}

export interface PathBarProps extends Omit<ComponentProps<"div">, "children" | "onChange"> {
  /** The path as clickable parts, from the root to where you are. The last is the current place and is not a link. */
  segments: readonly PathSegment[];
  /** The whole path as text, for the field and for Copy. Default: the path of the last segment, or the labels joined by the separator. */
  value?: string;
  /** Called with the `path` of a segment that was chosen. */
  onNavigate?: (path: string) => void;
  /** Called with the text of the field when Enter is pressed and it is valid. Default: `onNavigate`. */
  onEditSubmit?: (path: string) => void;
  /** Checks the typed path. Return a short message ("There is no folder called assets") and the field shows it under itself and keeps focus; return nothing when the path is fine. */
  validate?: (path: string) => string | null | undefined;
  /** What stands between the parts, and joins them when `value` is not given. Default "/". */
  separator?: string;
  /** Adds a button that copies the whole path and says "Path copied". */
  copyable?: boolean;
  /** Ctrl or Cmd with L opens the field: `true` while focus is inside the bar, "page" anywhere on the page, `false` never. Default true. */
  bindKeys?: boolean | "page";
  /** The words used, for another language. */
  labels?: PathBarLabels;
}

/** The space between the items of the row, in px (gap-0.5). */
const GAP = 2;

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

/** The folded run of the row as indexes into the segments: [start, end). An empty run folds nothing. */
interface Fold {
  start: number;
  end: number;
}

/**
 * What to fold so the row fits, preferring to show more. First everything; then the first and the last few with
 * a run of the middle folded; then, if even the first does not fit, only the last few. The last segment is never
 * folded: at the very least the row is "… / last".
 */
function fold(widths: readonly number[], ellipsis: number, separator: number, available: number): Fold {
  const n = widths.length;
  const none: Fold = { start: 0, end: 0 };
  if (n === 0 || available <= 0) return none;
  const step = separator + GAP * 2;
  const width = (start: number, end: number) => {
    const shown = widths.filter((_, index) => index < start || index >= end);
    const parts = shown.length + (end > start ? 1 : 0);
    return shown.reduce((sum, w) => sum + w, 0) + (end > start ? ellipsis : 0) + step * Math.max(0, parts - 1);
  };
  if (width(0, 0) <= available + 0.5) return none;
  for (let last = n - 2; last >= 1; last -= 1) if (width(1, n - last) <= available + 0.5) return { start: 1, end: n - last };
  for (let last = n - 1; last >= 1; last -= 1) if (width(0, n - last) <= available + 0.5) return { start: 0, end: n - last };
  return { start: 0, end: Math.max(0, n - 1) };
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

const CRUMB =
  "inline-flex h-7 shrink-0 items-center rounded-md px-2 text-sm whitespace-nowrap text-muted-foreground outline-none transition-colors duration-150 motion-reduce:transition-none";
// The ring sits inside the part: the row clips what runs past it, and an outer ring would be cut at its edges.
const CRUMB_LIVE = "cursor-pointer hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-ring/40";
const SEPARATOR = "flex shrink-0 items-center px-0.5 text-sm text-muted-foreground/70 select-none";

/**
 * The address bar of a file manager or a storage browser. The path is a row of parts you can press to go there;
 * press Edit, click the empty space or use Ctrl L and the row becomes a text field with the whole path: Enter goes,
 * Escape gives the row back, and a path your `validate` refuses shows its reason under the field and keeps focus
 * in it. A path longer than the bar folds its middle into a "…" menu (nothing is lost: every folded folder is in
 * it) and the last part always stays. Copy puts the whole path on the clipboard and says "Path copied". It
 * owns no location: you pass the parts and hear what was chosen.
 */
export function PathBar({
  segments,
  value,
  onNavigate,
  onEditSubmit,
  validate,
  separator = "/",
  copyable = false,
  bindKeys = true,
  labels,
  className,
  onKeyDown,
  "aria-label": ariaLabel,
  ...props
}: PathBarProps) {
  const words = {
    nav: labels?.nav ?? "Path",
    field: labels?.field ?? "Path",
    edit: labels?.edit ?? "Edit path",
    go: labels?.go ?? "Go to path",
    copy: labels?.copy ?? "Copy path",
    copied: labels?.copied ?? "Path copied",
    more: labels?.more ?? "Show hidden folders",
    empty: labels?.empty ?? "Enter a path",
  };
  const id = useId();
  const mac = useIsMac();
  const last = segments[segments.length - 1];
  const text = value ?? last?.path ?? segments.map((segment) => segment.label).join(separator);

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [folded, setFolded] = useState<Fold>({ start: 0, end: 0 });
  const input = useRef<HTMLInputElement>(null);
  const edit = useRef<HTMLButtonElement>(null);
  const bar = useRef<HTMLElement>(null);
  const list = useRef<HTMLOListElement>(null);
  const twins = useRef<HTMLDivElement>(null);
  /** The current part, the one place that is never a button: where focus goes when the part that held it turns into this. */
  const here = useRef<HTMLSpanElement>(null);
  const comeBack = useRef(false);
  /** Set when a part was chosen with focus in the bar ("bar") or in the "…" menu ("menu"): that part turns into plain text and the "…" button may go, and the focus they held would fall to the page. */
  const handOff = useRef<"bar" | "menu" | false>(false);
  /** Set at once, before React has rendered: removing the field can blur it, and that blur must not undo a finish that already happened. */
  const active = useRef(false);

  const begin = () => {
    active.current = true;
    setDraft(text);
    setError(null);
    setEditing(true);
  };
  const finish = (focusEdit: boolean) => {
    active.current = false;
    comeBack.current = focusEdit;
    setEditing(false);
    setError(null);
  };

  useEffect(() => {
    if (editing) {
      input.current?.focus();
      input.current?.select();
    } else if (comeBack.current) {
      comeBack.current = false;
      edit.current?.focus({ preventScroll: true });
    }
  }, [editing]);

  // The path changed under a part that was pressed, so that part is plain text now: focus goes to where the bar is now, and a keyboard user keeps their place, with Tab going on from it.
  const places = segments.map((segment) => segment.path).join("|");
  useEffect(() => {
    // A choice made in the "…" menu is handed on by the menu itself, once it has closed (onCloseAutoFocus below).
    if (handOff.current !== "bar") return;
    // The fold is measured after the new parts have rendered once, so the current part can be missing for one render: wait for the next.
    if (!here.current && segments.length) return;
    handOff.current = false;
    // Focus that is still on a real control (a button of the bar that stayed, a field somewhere else) is left alone.
    const held = document.activeElement;
    if (held instanceof HTMLElement && held !== document.body && held.isConnected) return;
    (here.current ?? edit.current)?.focus({ preventScroll: true });
    // `segments` is read for its length only: `places` says when it changed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [places, folded]);

  // Ctrl or Cmd with L, while focus is in the bar or (with "page") anywhere.
  const isShortcut = (event: KeyboardEvent | ReactKeyEvent) => (event.ctrlKey || event.metaKey) && !event.altKey && !event.shiftKey && event.key.toLowerCase() === "l";
  const latest = useRef({ begin, editing });
  useEffect(() => {
    latest.current = { begin, editing };
  });
  useEffect(() => {
    if (bindKeys !== "page") return;
    const onKey = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.isComposing || !isShortcut(event)) return;
      event.preventDefault();
      if (latest.current.editing) input.current?.select();
      else latest.current.begin();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [bindKeys]);

  // The container decides how much of the path fits, from hidden twins of every part: the live row is never measured.
  const measure = useCallback(() => {
    const host = list.current;
    const copies = twins.current;
    if (!host || !copies) return;
    const widths: number[] = [];
    let ellipsis = 0;
    let gap = 0;
    for (const child of Array.from(copies.children) as HTMLElement[]) {
      const w = child.getBoundingClientRect().width;
      if (child.dataset.part !== undefined) widths[Number(child.dataset.part)] = w;
      else if (child.dataset.ellipsis !== undefined) ellipsis = w;
      else if (child.dataset.separator !== undefined) gap = w;
    }
    const next = fold(widths, ellipsis, gap, host.clientWidth);
    setFolded((previous) => (previous.start === next.start && previous.end === next.end ? previous : next));
  }, []);
  const signature = `${separator}|${segments.map((segment) => segment.label).join("|")}`;
  useIsoLayoutEffect(() => {
    const host = list.current;
    const copies = twins.current;
    if (editing || !host || !copies) return;
    measure();
    // The observers answer on the next frame: a change of layout in their own callback ends in "loop completed with undelivered notifications".
    let frame = 0;
    const observer = new ResizeObserver(() => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(measure);
    });
    observer.observe(host);
    for (const child of Array.from(copies.children)) observer.observe(child);
    // A web font arriving changes every width.
    void document.fonts?.ready.then(() => measure());
    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [editing, measure, signature]);

  const go = (segment: PathSegment, event?: MouseEvent<HTMLElement>) => {
    if (event) {
      // A link with a handler is a button that has an address: a plain click is yours, a modified one opens the address.
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      if (!onNavigate) return;
      event.preventDefault();
    }
    // Note where focus is now, in the bar or in its "…" menu: it is handed on once the new path has arrived (the effect above) or the menu has closed (onCloseAutoFocus below).
    const held = document.activeElement;
    handOff.current = held instanceof HTMLElement ? (held.closest("[role='menu']") ? "menu" : bar.current?.contains(held) ? "bar" : false) : false;
    if (onNavigate) onNavigate(segment.path);
    else if (segment.href !== undefined) window.location.assign(segment.href);
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const path = draft.trim();
    const problem = path === "" ? words.empty : validate?.(path);
    if (problem) {
      setError(problem);
      input.current?.focus();
      return;
    }
    finish(true);
    (onEditSubmit ?? onNavigate)?.(path);
  };

  const keys = (
    <KbdGroup aria-hidden="true">
      <Kbd className="h-[1.125rem] min-w-[1.125rem] border-transparent bg-background/20 text-background">{mac ? "⌘" : "Ctrl"}</Kbd>
      <Kbd className="h-[1.125rem] min-w-[1.125rem] border-transparent bg-background/20 text-background">L</Kbd>
    </KbdGroup>
  );

  if (editing) {
    return (
      <div data-slot="path-bar" data-editing="" className={cn("grid gap-1.5", className)} onKeyDown={onKeyDown} {...props}>
        <form
          aria-label={words.field}
          onSubmit={submit}
          onBlur={(event) => {
            // Leaving the bar cancels the edit; moving between its own controls does not.
            if (active.current && !event.currentTarget.contains(event.relatedTarget as Node | null)) finish(false);
          }}
        >
          <div className="flex h-10 items-center gap-1 rounded-lg border border-input bg-background pr-1 pl-3 shadow-xs transition-[border-color,box-shadow] duration-150 focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/40 has-[[aria-invalid=true]]:border-destructive has-[[aria-invalid=true]]:ring-destructive/25 motion-reduce:transition-none">
            <input
              ref={input}
              value={draft}
              aria-label={words.field}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? `${id}-error` : undefined}
              enterKeyHint="go"
              spellCheck={false}
              autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off"
              onChange={(event) => {
                setDraft(event.target.value);
                setError(null);
              }}
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  event.preventDefault();
                  finish(true);
                }
              }}
              className="h-full min-w-0 flex-1 bg-transparent font-mono text-[0.8125rem] text-foreground outline-none placeholder:text-muted-foreground"
            />
            {/* Pressing it must not move focus out of the field first, or the bar would close before the press lands. */}
            <Button type="submit" variant="ghost" size="icon-sm" aria-label={words.go} onMouseDown={(event) => event.preventDefault()}>
              <IconArrowRight />
            </Button>
          </div>
          {error ? (
            <p id={`${id}-error`} role="alert" className="mt-1.5 flex items-start gap-1.5 text-xs leading-5 text-destructive">
              <IconAlertCircle className="mt-0.5 size-3.5 shrink-0" />
              {error}
            </p>
          ) : null}
        </form>
      </div>
    );
  }

  const items: ({ kind: "part"; segment: PathSegment; index: number } | { kind: "more" })[] = [];
  segments.forEach((segment, index) => {
    if (index >= folded.start && index < folded.end) {
      if (index === folded.start) items.push({ kind: "more" });
      return;
    }
    items.push({ kind: "part", segment, index });
  });
  const hidden = segments.slice(folded.start, folded.end);

  return (
    <div
      data-slot="path-bar"
      className={cn("relative", className)}
      onKeyDown={(event) => {
        onKeyDown?.(event);
        // Keys typed in the "…" menu reach this handler too, through the portal; only the bar's own are its business.
        if (bindKeys === true && !event.defaultPrevented && event.currentTarget.contains(event.target as Node) && isShortcut(event)) {
          event.preventDefault();
          begin();
        }
      }}
      {...props}
    >
      <TooltipProvider delayDuration={300}>
        <nav
          ref={bar}
          aria-label={ariaLabel ?? words.nav}
          data-folded={hidden.length ? "" : undefined}
          // The empty space is a way in for the mouse; the Edit button and Ctrl L are the ways in for everyone else.
          // A click in the "…" menu bubbles up here through React (the menu is a portal), so the target has to be inside the bar itself.
          onClick={(event) => {
            const target = event.target as HTMLElement;
            if (event.currentTarget.contains(target) && !target.closest("a, button")) begin();
          }}
          className="relative flex h-10 cursor-text items-center gap-1 rounded-lg border border-border bg-background pr-1 pl-1.5 shadow-xs"
        >
          {/* Clipped, so a row that has not been measured yet (the server render, the first paint) ends at its edge instead of running over the buttons. */}
          <ol ref={list} className="m-0 flex min-w-0 flex-1 list-none items-center overflow-hidden p-0" style={{ gap: GAP }}>
            {items.map((item, position) => (
              <Fragment key={item.kind === "more" ? "more" : `${item.index}-${item.segment.path}`}>
                {position > 0 ? (
                  <li aria-hidden="true" className={SEPARATOR}>
                    {separator}
                  </li>
                ) : null}
                {item.kind === "more" ? (
                  <li className="flex shrink-0">
                    <DropdownMenu
                      onOpenChange={(open) => {
                        // A part pressed earlier that went nowhere must not claim the focus of this menu.
                        if (open) handOff.current = false;
                      }}
                    >
                      <DropdownMenuTrigger asChild>
                        <button type="button" aria-label={words.more} className={cn(CRUMB, CRUMB_LIVE, "px-1.5 data-[state=open]:bg-muted data-[state=open]:text-foreground")}>
                          <IconMoreHorizontal className="size-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="start"
                        className="min-w-44"
                        // A folder chosen here moves the bar on, and this button can be gone with the fold: focus goes to the part the bar is at now. Leaving the menu without a choice returns to its button, as usual.
                        onCloseAutoFocus={(event) => {
                          if (handOff.current !== "menu") return;
                          handOff.current = false;
                          event.preventDefault();
                          (here.current ?? edit.current)?.focus({ preventScroll: true });
                        }}
                      >
                        {hidden.map((segment, index) => (
                          <DropdownMenuItem key={`${index}-${segment.path}`} onSelect={() => go(segment)}>
                            <span className="truncate">{segment.label}</span>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </li>
                ) : item.index === segments.length - 1 ? (
                  <li className="flex min-w-0">
                    <span
                      ref={here}
                      tabIndex={-1}
                      aria-current="page"
                      className="inline-flex h-7 min-w-0 items-center rounded-md px-2 text-sm font-medium text-foreground outline-none focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-ring/40"
                    >
                      <span className="truncate">{item.segment.label}</span>
                    </span>
                  </li>
                ) : (
                  <li className="flex shrink-0">
                    {item.segment.href !== undefined ? (
                      <a href={item.segment.href} onClick={(event) => go(item.segment, event)} className={cn(CRUMB, CRUMB_LIVE)}>
                        {item.segment.label}
                      </a>
                    ) : (
                      <button type="button" onClick={() => go(item.segment)} className={cn(CRUMB, CRUMB_LIVE)}>
                        {item.segment.label}
                      </button>
                    )}
                  </li>
                )}
              </Fragment>
            ))}
          </ol>

          <div className="flex shrink-0 items-center">
            {copyable ? <CopyButton iconOnly size="sm" variant="ghost" value={text} label={words.copy} copiedLabel={words.copied} className="text-muted-foreground hover:text-foreground" /> : null}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  ref={edit}
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={words.edit}
                  aria-keyshortcuts={bindKeys ? "Control+L Meta+L" : undefined}
                  className="text-muted-foreground hover:text-foreground"
                  onClick={begin}
                >
                  <IconEdit />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className={cn(bindKeys && "flex items-center gap-2.5")}>
                {words.edit}
                {bindKeys ? keys : null}
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Hidden twins of every part, of the separator and of the "…" button. They are measured and never shown, focused or read. */}
          <div aria-hidden="true" className="pointer-events-none invisible absolute top-0 left-0 h-0 w-0 overflow-hidden">
            <div ref={twins} inert className="flex w-max items-center">
              {segments.map((segment, index) => (
                <span key={`${index}-${segment.path}`} data-part={index} className={cn(CRUMB, index === segments.length - 1 && "font-medium")}>
                  {segment.label}
                </span>
              ))}
              <span data-ellipsis="" className={cn(CRUMB, "px-1.5")}>
                <IconMoreHorizontal className="size-4" />
              </span>
              <span data-separator="" className={SEPARATOR}>
                {separator}
              </span>
            </div>
          </div>
        </nav>
      </TooltipProvider>
    </div>
  );
}
