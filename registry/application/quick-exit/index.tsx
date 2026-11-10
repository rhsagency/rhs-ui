"use client";

import { useCallback, useEffect, useId, useRef, useState, type ComponentProps } from "react";

import { IconLogOut } from "@rhs-ui/icons";
import {
  DEFAULT_LABELS,
  DEFAULT_SHORTCUT,
  blankPage,
  fill,
  keycap,
  usesEscape,
  type QuickExitEvent,
  type QuickExitLabels,
  type QuickExitReason,
  type QuickExitShortcut,
} from "@rhs-ui/application/quick-exit/exit";
import { Button } from "@rhs-ui/primitives/button";
import { Kbd } from "@rhs-ui/primitives/kbd";
import { cn } from "@/lib/utils";

export type { QuickExitEvent, QuickExitLabels, QuickExitReason, QuickExitShortcut } from "@rhs-ui/application/quick-exit/exit";

type Placement = "top-right" | "top-left" | "bottom-right" | "bottom-left";

const PLACEMENT: Record<Placement, string> = {
  "top-right": "top-[max(0.75rem,env(safe-area-inset-top))] right-[max(0.75rem,env(safe-area-inset-right))]",
  "top-left": "top-[max(0.75rem,env(safe-area-inset-top))] left-[max(0.75rem,env(safe-area-inset-left))]",
  "bottom-right": "bottom-[max(0.75rem,env(safe-area-inset-bottom))] right-[max(0.75rem,env(safe-area-inset-right))]",
  "bottom-left": "bottom-[max(0.75rem,env(safe-area-inset-bottom))] left-[max(0.75rem,env(safe-area-inset-left))]",
};

export interface QuickExitProps extends Omit<ComponentProps<"div">, "children"> {
  /** The neutral site a visitor is sent to: a weather page, a news site, a search engine. Choose one that is ordinary for your audience and loads fast. */
  href: string;
  /** The words on the button. Default "Leave this site now". */
  label?: string;
  /** Runs the moment an exit starts, before the page is blanked: clear a draft, a session. Call `event.preventDefault()` to stop the exit and take over, for a preview or a test. Keep analytics out of it: a visitor who leaves in a hurry should leave no trace. */
  onExit?: (event: QuickExitEvent) => void;
  /** The key that leaves from anywhere on the page: `{ key: "Escape", presses: 3, within: 1000 }` by default, or `false` for a button alone. */
  shortcut?: false | QuickExitShortcut;
  /** Replace the current history entry with the neutral address, so Back does not return to this page. Default true. Turn it off to navigate normally. */
  hideHistory?: boolean;
  /** The corner the button stays in. Default "top-right". */
  placement?: Placement;
  /** The words read after the button's name, for translation. */
  labels?: QuickExitLabels;
}

/**
 * The quick exit that services for abuse, health and legal advice put on every
 * page: one button that stays in view, and the Escape key pressed three times
 * within a second, either of which blanks the page at once and replaces it with
 * a neutral site. The button is the first thing a keyboard reaches when it is the
 * first element of your layout, is named by what it says and described as a quick
 * exit that opens a neutral site, and the Escape count ignores presses that a
 * dialog, a menu or an open list used to close itself, while still working in a
 * text field. The page is covered by a plain blank surface before anything else
 * happens, and the history entry is replaced, so Back does not lead back to it.
 * A browser keeps its history, and the page still shows in an app switcher for a
 * moment: say so on the page that explains how to stay safe.
 */
export function QuickExit({ href, label = "Leave this site now", onExit, shortcut, hideHistory = true, placement = "top-right", labels, className, ...props }: QuickExitProps) {
  const words = { ...DEFAULT_LABELS, ...labels };
  const base = useId();
  const leaving = useRef(false);
  const [pressed, setPressed] = useState(0);
  const keyOn = shortcut !== false;
  const key = shortcut === false ? DEFAULT_SHORTCUT.key : (shortcut?.key ?? DEFAULT_SHORTCUT.key);
  const presses = Math.max(1, shortcut === false ? DEFAULT_SHORTCUT.presses : (shortcut?.presses ?? DEFAULT_SHORTCUT.presses));
  const within = shortcut === false ? DEFAULT_SHORTCUT.within : (shortcut?.within ?? DEFAULT_SHORTCUT.within);

  // The latest callback, without putting the key listener back every time a parent renders.
  const exit = useRef(onExit);
  useEffect(() => {
    exit.current = onExit;
  });

  const leave = useCallback(
    (reason: QuickExitReason) => {
      if (leaving.current) return;
      let stopped = false;
      exit.current?.({ reason, href, preventDefault: () => (stopped = true) });
      if (stopped) return;
      leaving.current = true;
      blankPage(href);
      if (hideHistory) window.location.replace(href);
      else window.location.assign(href);
    },
    [href, hideHistory],
  );

  // The key counts presses in a window of time. It listens on the window in the bubbling phase, after dialogs, menus and lists
  // have had their Escape: what they used is marked as handled, and is not counted.
  useEffect(() => {
    if (!keyOn) return;
    const taps: number[] = [];
    let timer: number | undefined;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== key || event.repeat || event.isComposing || event.defaultPrevented) return;
      if (event.ctrlKey || event.metaKey || event.altKey || usesEscape(event.target)) return;
      const now = performance.now();
      while (taps.length && now - (taps[0] ?? now) > within) taps.shift();
      taps.push(now);
      window.clearTimeout(timer);
      if (taps.length >= presses) {
        taps.length = 0;
        setPressed(0);
        leave("keyboard");
        return;
      }
      setPressed(taps.length);
      // The count falls back to zero when the presses stop, so the hint on the button never lies about what the next press does.
      timer = window.setTimeout(() => {
        taps.length = 0;
        setPressed(0);
      }, within);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.clearTimeout(timer);
    };
  }, [keyOn, key, presses, within, leave]);

  const description = [words.description, keyOn ? fill(words.shortcut, { key: key === "Escape" ? "Escape" : keycap(key), count: presses }) : ""].filter(Boolean).join(" ");

  return (
    <div data-slot="quick-exit" data-pressed={pressed || undefined} className={cn("fixed z-[2147483000]", PLACEMENT[placement], className)} {...props}>
      <Button
        type="button"
        aria-describedby={`${base}-description`}
        onClick={() => leave("button")}
        className="h-11 gap-2.5 px-4 shadow-sm ring-2 ring-background sm:h-10"
      >
        <IconLogOut aria-hidden="true" />
        <span>{label}</span>
        {keyOn ? (
          <span aria-hidden="true" className="hidden items-center gap-1.5 border-l border-primary-foreground/25 pl-2.5 text-xs font-medium text-primary-foreground/80 sm:inline-flex [@media(pointer:coarse)]:hidden">
            <Kbd className="border-primary-foreground/30 bg-primary-foreground/15 text-primary-foreground">{keycap(key)}</Kbd>
            <span className="tabular-nums">×{presses - pressed}</span>
          </span>
        ) : null}
      </Button>
      <span id={`${base}-description`} className="sr-only">
        {description}
      </span>
    </div>
  );
}
