"use client";

import { useEffect, useRef, useState, type ComponentProps, type KeyboardEvent, type PointerEvent } from "react";

import { cn } from "@/lib/utils";

export interface AlphabetIndexProps extends Omit<ComponentProps<"nav">, "children" | "onSelect"> {
  /** The stops of the rail: a string ("ABC...Z#") or an array, so it also works for years or numbers. Default "ABCDEFGHIJKLMNOPQRSTUVWXYZ#". */
  letters?: string | readonly string[];
  /** The letters that have entries. The others are dimmed, skipped by the keyboard and by a drag. Default: all of them. */
  available?: readonly string[] | ReadonlySet<string>;
  /** The letter your list is showing now, marked on the rail. Keep it in step with the scroll position. */
  value?: string;
  /** Called with the letter when it is pressed, dragged to, or chosen with Enter. Scroll your list to its section here. */
  onSelect: (letter: string) => void;
  /** `vertical` is a strip beside a list; `horizontal` runs along the top. Default "vertical". */
  orientation?: "vertical" | "horizontal";
  /** The name of the rail for assistive technology. Default "Alphabet index". */
  label?: string;
  /** Show the big letter beside the rail while a finger or a mouse is down on it. Default true. */
  bubble?: boolean;
}

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ#";

/**
 * The index strip beside a contact list or a directory. Press or drag along it and the letter you are on
 * shows in a bubble while your list jumps there; letters with no entries are dimmed and skipped, and a drag
 * over them lands on the nearest letter that has some. For the keyboard and for screen readers it is a plain
 * list of buttons (Tab enters it at the current letter, the arrow keys move, Home and End jump, Enter selects, and
 * Tab leaves it from wherever focus is), and the touch scrubbing is added on top with pointer events, so nothing
 * depends on it. Under reduced motion the bubble appears without a fade. Give the rail room: a height for a
 * vertical one (`h-full` in a flex row works), and about 2rem a stop for a horizontal one with long labels such as
 * years. The stops share the length equally.
 */
export function AlphabetIndex({ letters = ALPHABET, available, value, onSelect, orientation = "vertical", label = "Alphabet index", bubble = true, className, ...props }: AlphabetIndexProps) {
  const list = typeof letters === "string" ? Array.from(letters) : [...letters];
  const vertical = orientation === "vertical";
  const rail = useRef<HTMLUListElement>(null);
  const pressing = useRef(false);
  const lastLetter = useRef<string | null>(null);
  const swallowClick = useRef(0);
  const hideTimer = useRef(0);
  const [shown, setShown] = useState<{ letter: string; at: number; open: boolean } | null>(null);
  /** The letter that has focus while focus is inside the rail. The one tab stop follows it, so Tab and Shift+Tab leave from wherever the arrow keys went. */
  const [focused, setFocused] = useState<string | null>(null);

  const has = (letter: string): boolean => !available || (available instanceof Set ? available.has(letter) : (available as readonly string[]).includes(letter));
  const stop = value !== undefined && list.includes(value) && has(value) ? value : list.find(has);

  useEffect(() => () => window.clearTimeout(hideTimer.current), []);

  /** The letter under the pointer; a letter without entries gives way to the nearest one with some (the later one when two are as near). */
  function letterAt(event: PointerEvent<HTMLUListElement>): { letter: string; at: number } | null {
    const box = rail.current?.getBoundingClientRect();
    if (!box || !list.length) return null;
    const size = vertical ? box.height : box.width;
    const along = (vertical ? event.clientY - box.top : event.clientX - box.left) / (size || 1);
    const index = Math.min(list.length - 1, Math.max(0, Math.floor(along * list.length)));
    for (let step = 0; step < list.length; step++) {
      for (const candidate of [index + step, index - step]) {
        const letter = list[candidate];
        if (letter !== undefined && has(letter)) return { letter, at: ((candidate + 0.5) / list.length) * size };
      }
    }
    return null;
  }

  function scrub(event: PointerEvent<HTMLUListElement>) {
    const hit = letterAt(event);
    if (!hit) return;
    setShown({ letter: hit.letter, at: hit.at, open: true });
    if (hit.letter !== lastLetter.current) {
      lastLetter.current = hit.letter;
      onSelect(hit.letter);
    }
  }

  function release() {
    if (!pressing.current) return;
    pressing.current = false;
    lastLetter.current = null;
    // The click a finger or a mouse sends after the release has been handled already.
    swallowClick.current = Date.now() + 400;
    window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => setShown((now) => (now ? { ...now, open: false } : now)), 240);
  }

  function keys(event: KeyboardEvent<HTMLUListElement>) {
    const buttons = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>("button:not(:disabled)"));
    const at = buttons.indexOf(document.activeElement as HTMLButtonElement);
    if (at === -1) return;
    const next = event.key === "ArrowDown" || event.key === "ArrowRight" ? at + 1 : event.key === "ArrowUp" || event.key === "ArrowLeft" ? at - 1 : event.key === "Home" ? 0 : event.key === "End" ? buttons.length - 1 : null;
    if (next === null) return;
    event.preventDefault();
    buttons[Math.min(buttons.length - 1, Math.max(0, next))]?.focus();
  }

  if (!list.length) return null;

  const placement = vertical ? "right-full mr-3 -translate-y-1/2" : "bottom-full mb-3 -translate-x-1/2";

  return (
    <nav data-slot="alphabet-index" data-orientation={orientation} aria-label={label} className={cn("relative", vertical ? "w-6" : "h-6 w-full", className)} {...props}>
      <ul
        ref={rail}
        onKeyDown={keys}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocused(null);
        }}
        onPointerDown={(event) => {
          if (event.button !== 0) return;
          pressing.current = true;
          event.currentTarget.setPointerCapture(event.pointerId);
          scrub(event);
        }}
        onPointerMove={(event) => {
          if (pressing.current) scrub(event);
        }}
        onPointerUp={release}
        onPointerCancel={release}
        onLostPointerCapture={release}
        className={cn("flex size-full touch-none select-none", vertical ? "flex-col" : "flex-row")}
      >
        {list.map((letter) => {
          const enabled = has(letter);
          return (
            <li key={letter} aria-hidden={enabled ? undefined : true} className="flex min-h-3.5 min-w-3.5 flex-1">
              <button
                type="button"
                disabled={!enabled}
                tabIndex={letter === (focused ?? stop) ? 0 : -1}
                aria-current={letter === value ? "true" : undefined}
                onFocus={() => setFocused(letter)}
                onClick={() => {
                  if (Date.now() < swallowClick.current) return;
                  onSelect(letter);
                }}
                className={cn(
                  "grid flex-1 place-items-center rounded-full text-[0.6875rem] leading-none font-medium tabular-nums outline-none",
                  "transition-colors duration-100 focus-visible:ring-2 focus-visible:ring-ring/60 motion-reduce:transition-none",
                  enabled ? "text-muted-foreground hover:bg-muted hover:text-foreground" : "pointer-events-none text-muted-foreground/35",
                  "aria-[current=true]:bg-primary aria-[current=true]:text-primary-foreground aria-[current=true]:hover:bg-primary",
                )}
              >
                {letter}
              </button>
            </li>
          );
        })}
      </ul>
      {bubble && shown ? (
        <div
          aria-hidden="true"
          data-open={shown.open}
          style={vertical ? { top: shown.at } : { left: shown.at }}
          className={cn(
            "pointer-events-none absolute z-10 grid h-12 min-w-12 place-items-center rounded-xl bg-foreground px-3 text-2xl font-semibold tracking-[-0.02em] text-background tabular-nums shadow-sm",
            // In and out with a short fade and a small grow; a browser without @starting-style simply shows it at once. Reduced motion has neither.
            "transition-[opacity,scale] duration-150 starting:scale-90 starting:opacity-0 data-[open=false]:scale-90 data-[open=false]:opacity-0 motion-reduce:scale-100 motion-reduce:transition-none motion-reduce:starting:scale-100 motion-reduce:starting:opacity-100",
            placement,
          )}
        >
          {shown.letter}
        </div>
      ) : null}
    </nav>
  );
}
