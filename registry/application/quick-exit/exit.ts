/**
 * The words and the small decisions behind QuickExit, as plain functions: they
 * hold no state and call no hook, so a Server Component can use them too.
 */

/** What started the exit: the button, or the key pressed several times. */
export type QuickExitReason = "button" | "keyboard";

/** What `onExit` receives, a moment before the page is blanked. */
export interface QuickExitEvent {
  /** What started it. */
  reason: QuickExitReason;
  /** Where the visitor is about to be sent. */
  href: string;
  /** Stops the exit: the page is not blanked and nobody is sent anywhere. Call it when you take over, in a preview or a test. */
  preventDefault: () => void;
}

/** The key that leaves, how many times it is pressed, and how long the presses have, in ms. */
export interface QuickExitShortcut {
  /** The key, as `KeyboardEvent.key` names it. Default "Escape". */
  key?: string;
  /** How many presses it takes. Default 3. */
  presses?: number;
  /** All the presses must fall within this many milliseconds. Default 1000. */
  within?: number;
}

/** The words the control says, for translation. `{key}` and `{count}` are filled in. */
export interface QuickExitLabels {
  /** Read after the name of the button, so a screen reader says what it does. Default "Quick exit, opens a neutral site.". */
  description?: string;
  /** Read after that when the shortcut is on. Default "Or press {key} {count} times, anywhere on the page.". */
  shortcut?: string;
}

export const DEFAULT_LABELS = {
  description: "Quick exit, opens a neutral site.",
  shortcut: "Or press {key} {count} times, anywhere on the page.",
} satisfies Required<QuickExitLabels>;

export const DEFAULT_SHORTCUT = { key: "Escape", presses: 3, within: 1000 } satisfies Required<QuickExitShortcut>;

/** Fills `{name}` marks in a sentence. A mark with no value stays as it is. */
export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (mark, key: string) => (key in values ? String(values[key]) : mark));
}

/** A key as it is printed on a keycap: Escape is Esc. */
export function keycap(key: string): string {
  return key === "Escape" ? "Esc" : key.length === 1 ? key.toUpperCase() : key;
}

/** What uses Escape itself: a dialog, a menu, an open list. A press inside one of them closes it, and is not counted as part of an exit. */
const USES_ESCAPE = '[role="dialog"], [role="alertdialog"], [role="menu"], [role="listbox"], dialog[open], [aria-modal="true"]';

/** Whether a key press that came from `target` belongs to something that closes on Escape. Text fields and ordinary controls are not: an exit must work while someone is typing. */
export function usesEscape(target: EventTarget | null): boolean {
  if (typeof Element === "undefined" || !(target instanceof Element)) return false;
  if (target.closest(USES_ESCAPE)) return true;
  // A button that has opened a popup, or a combobox with its list showing, closes it on Escape.
  return target.closest('[aria-haspopup][aria-expanded="true"], [role="combobox"][aria-expanded="true"]') !== null;
}

/**
 * Covers the page at once, with a plain blank surface in the visitor's own colour scheme and nothing from the
 * site on it, and puts the neutral site's name in the tab. Done by hand on the document, not through React, so
 * it happens in the same moment as the press, before anything is rendered or fetched.
 */
export function blankPage(href: string): void {
  if (typeof document === "undefined") return;
  const cover = document.createElement("div");
  cover.setAttribute("data-quick-exit-cover", "");
  cover.setAttribute("aria-hidden", "true");
  cover.style.cssText = "position:fixed;inset:0;z-index:2147483647;background:Canvas;color:CanvasText;color-scheme:light dark;";
  document.body.appendChild(cover);
  try {
    document.title = new URL(href, window.location.href).hostname;
  } catch {
    document.title = "";
  }
}
