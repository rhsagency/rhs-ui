/**
 * The keyboard shortcut of the go-to dialog, as plain functions with no state and no hook: `mod+g` is read once,
 * matched against key presses, and written out as the keys to show ("Ctrl" and "G", or the command sign and "G").
 */

export interface ShortcutCombo {
  /** The key itself, in lower case: "g". */
  key: string;
  /** Command on a Mac, Control everywhere else: either of them counts. */
  mod: boolean;
  /** Control itself is required, whichever system this is. */
  ctrl: boolean;
  /** Command (or the Windows key) itself is required. */
  meta: boolean;
  /** Alt, called Option on a Mac, is required. */
  alt: boolean;
  /** Shift is required. */
  shift: boolean;
}

/** Reads a shortcut written as `mod+g`, `ctrl+shift+k` or `alt+/`. `mod` is Command on a Mac and Control elsewhere. */
export function parseShortcut(shortcut: string): ShortcutCombo {
  const parts = shortcut
    .toLowerCase()
    .split("+")
    .map((part) => part.trim())
    .filter(Boolean);
  const key = parts.pop() ?? "";
  return {
    key,
    mod: parts.includes("mod"),
    ctrl: parts.includes("ctrl") || parts.includes("control"),
    meta: parts.includes("meta") || parts.includes("cmd") || parts.includes("command"),
    alt: parts.includes("alt") || parts.includes("option"),
    shift: parts.includes("shift"),
  };
}

/** Whether a key press is exactly this shortcut: the key, the modifiers it names and no others. */
export function matchesShortcut(event: Pick<KeyboardEvent, "key" | "ctrlKey" | "metaKey" | "altKey" | "shiftKey">, combo: ShortcutCombo): boolean {
  if (!combo.key || event.key.toLowerCase() !== combo.key) return false;
  const modifiers = combo.mod ? event.ctrlKey || event.metaKey : event.ctrlKey === combo.ctrl && event.metaKey === combo.meta;
  return modifiers && event.altKey === combo.alt && event.shiftKey === combo.shift;
}

/** The signs a Mac draws for its modifier keys, written as escapes so no tool can change them. */
const COMMAND = "\u2318";
const OPTION = "\u2325";
const SHIFT = "\u21e7";

/** The keys to draw for a shortcut, in the order people read them: `["Ctrl", "G"]`, or on a Mac the command sign and `"G"`. */
export function shortcutKeys(combo: ShortcutCombo, apple: boolean): string[] {
  const keys: string[] = [];
  if (combo.mod || combo.ctrl) keys.push(combo.mod && apple ? COMMAND : "Ctrl");
  if (combo.alt) keys.push(apple ? OPTION : "Alt");
  if (combo.shift) keys.push(apple ? SHIFT : "Shift");
  if (combo.meta && !combo.mod) keys.push(apple ? COMMAND : "Win");
  keys.push(combo.key.length === 1 ? combo.key.toUpperCase() : combo.key.charAt(0).toUpperCase() + combo.key.slice(1));
  return keys;
}

/** True when the key press is going into a field the person is typing in, where a shortcut must not take it. */
export function isTyping(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable || target.tagName === "TEXTAREA" || target.tagName === "SELECT") return true;
  return target instanceof HTMLInputElement && !["button", "checkbox", "radio", "range", "submit", "reset", "color", "file", "image"].includes(target.type);
}
