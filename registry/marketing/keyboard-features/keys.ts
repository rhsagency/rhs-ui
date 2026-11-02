/**
 * Shortcuts as data. A shortcut is written as text, parsed once into steps,
 * matched against real key events and labelled for the reader's keyboard.
 *
 *   "Mod+K"            one step: hold Mod (Cmd on a Mac, Ctrl elsewhere), press K
 *   "Mod+Shift+P"      one step with two modifiers
 *   "G then P"         a sequence: press G, let go, then press P (also ["G", "P"] or "G P")
 *   "?" or "Esc"       one key on its own
 *
 * Modifiers are Mod (also Cmd, Command, CmdOrCtrl), Ctrl, Alt (Option), Shift
 * and Meta (Win, Super). Keys are a character or one of Enter, Esc, Tab, Space,
 * Backspace, Delete, Up, Down, Left, Right, Home, End, PageUp, PageDown, F1 to
 * F12; the plus key is written Plus.
 */
export type Platform = "mac" | "other";
export type Modifier = "mod" | "ctrl" | "alt" | "shift" | "meta";

export interface KeyStep {
  /** The modifiers held for this step, in the order they were written. */
  modifiers: Modifier[];
  /** The key itself, as `event.key` names it: "k", "?", "Enter", "ArrowUp". A letter is lower case. */
  key: string;
}

/** The part of a keyboard event a shortcut cares about, so tests can pass a plain object. */
export interface KeyLike {
  key: string;
  code?: string;
  metaKey: boolean;
  ctrlKey: boolean;
  altKey: boolean;
  shiftKey: boolean;
}

export interface KeyLabel {
  /** What the keycap shows. */
  text: string;
  /** What a screen reader says when the text is a symbol: "Command" for ⌘. */
  spoken?: string;
}

const MODIFIERS: Record<string, Modifier> = {
  mod: "mod",
  cmd: "mod",
  command: "mod",
  cmdorctrl: "mod",
  commandorcontrol: "mod",
  ctrl: "ctrl",
  control: "ctrl",
  alt: "alt",
  option: "alt",
  opt: "alt",
  shift: "shift",
  meta: "meta",
  win: "meta",
  windows: "meta",
  super: "meta",
};

const NAMED: Record<string, string> = {
  esc: "Escape",
  escape: "Escape",
  enter: "Enter",
  return: "Enter",
  tab: "Tab",
  space: "Space",
  backspace: "Backspace",
  delete: "Delete",
  del: "Delete",
  up: "ArrowUp",
  down: "ArrowDown",
  left: "ArrowLeft",
  right: "ArrowRight",
  arrowup: "ArrowUp",
  arrowdown: "ArrowDown",
  arrowleft: "ArrowLeft",
  arrowright: "ArrowRight",
  home: "Home",
  end: "End",
  pageup: "PageUp",
  pagedown: "PageDown",
  plus: "+",
};

function parseKey(token: string): string {
  if (token.length === 1) return token.toLowerCase();
  const named = NAMED[token.toLowerCase()];
  if (named) return named;
  return /^f\d{1,2}$/i.test(token) ? token.toUpperCase() : token;
}

/** One step, written as "Mod+Shift+P". The last part is the key and every part before it is a modifier. */
export function parseStep(text: string): KeyStep {
  const parts = text.split("+").map((part) => part.trim()).filter(Boolean);
  const key = parts.pop() ?? "";
  const modifiers: Modifier[] = [];
  for (const part of parts) {
    const modifier = MODIFIERS[part.toLowerCase()];
    if (modifier && !modifiers.includes(modifier)) modifiers.push(modifier);
  }
  return { modifiers, key: parseKey(key) };
}

/**
 * A shortcut as steps. A list is a sequence with one step to an item. A string is one step ("Mod+K") or, written the
 * way people say it, a sequence: "G then P", or just "G P". Spaces around a plus are ignored: "Mod + K" is "Mod+K".
 */
export function parseShortcut(keys: string | readonly string[]): KeyStep[] {
  const steps = typeof keys === "string" ? keys.replace(/\s*\+\s*/g, "+").trim().split(/\s+(?:then\s+)?/i) : keys;
  return steps.map(parseStep).filter((step) => step.key !== "");
}

/** The symbols that need Shift to type on most layouts. Pressing one is not a Shift shortcut, so Shift is not held against it: "?" is Shift and the slash key, and is written "?". */
const SHIFTED = /^[!@#$%^&*()_+{}|:"<>?~]$/;

function sameKey(event: KeyLike, key: string): boolean {
  if (key.length === 1) {
    if (event.key.toLowerCase() === key) return true;
    // The key typed some other character: Option+K on a Mac types "˚", and a Cyrillic layout types "л" on the K key.
    // Then the physical key decides. When the character is a Latin letter or digit it is trusted as it is, so on a
    // Dvorak keyboard "k" is the key printed "k", wherever it sits.
    if (/^[a-z0-9]$/.test(key) && event.code && !/^[a-z0-9]$/i.test(event.key)) return event.code === (/\d/.test(key) ? `Digit${key}` : `Key${key.toUpperCase()}`);
    return false;
  }
  return key === "Space" ? event.key === " " : event.key === key;
}

/** Whether a key event is this step on this platform. Every modifier has to match exactly: Mod+K is not Mod+Shift+K. */
export function matchStep(event: KeyLike, step: KeyStep, platform: Platform): boolean {
  const mac = platform === "mac";
  const mod = step.modifiers.includes("mod");
  if (event.metaKey !== (step.modifiers.includes("meta") || (mac && mod))) return false;
  if (event.ctrlKey !== (step.modifiers.includes("ctrl") || (!mac && mod))) return false;
  if (event.altKey !== step.modifiers.includes("alt")) return false;
  const shift = step.modifiers.includes("shift");
  if (shift ? !event.shiftKey : event.shiftKey && !SHIFTED.test(step.key)) return false;
  return sameKey(event, step.key);
}

/** Whether the last events, in order, are these steps. */
export function endsWith(events: readonly KeyLike[], steps: readonly KeyStep[], platform: Platform): boolean {
  if (steps.length === 0 || events.length < steps.length) return false;
  const tail = events.slice(events.length - steps.length);
  return steps.every((step, index) => {
    const event = tail[index];
    return event !== undefined && matchStep(event, step, platform);
  });
}

/** Keys that are only a modifier being pressed: they never start or finish a shortcut by themselves. */
export const MODIFIER_KEYS: ReadonlySet<string> = new Set(["Shift", "Control", "Alt", "Meta", "AltGraph", "CapsLock", "Fn", "OS"]);

const ARROWS: Record<string, KeyLabel> = {
  ArrowUp: { text: "↑", spoken: "Up arrow" },
  ArrowDown: { text: "↓", spoken: "Down arrow" },
  ArrowLeft: { text: "←", spoken: "Left arrow" },
  ArrowRight: { text: "→", spoken: "Right arrow" },
};

/**
 * What a modifier says on a keycap. On a Mac it is the symbol that is printed on the key, with its name for a screen
 * reader; elsewhere it is the word. Until the platform is known Mod says both, so it is true on every keyboard.
 */
export function modifierLabel(modifier: Modifier, platform: Platform | "unknown"): KeyLabel {
  const mac = platform === "mac";
  switch (modifier) {
    case "mod":
      return platform === "unknown" ? { text: "Cmd/Ctrl", spoken: "Command or Control" } : mac ? { text: "⌘", spoken: "Command" } : { text: "Ctrl", spoken: "Control" };
    case "ctrl":
      return mac ? { text: "⌃", spoken: "Control" } : { text: "Ctrl", spoken: "Control" };
    case "alt":
      return mac ? { text: "⌥", spoken: "Option" } : { text: "Alt" };
    case "shift":
      return mac ? { text: "⇧", spoken: "Shift" } : { text: "Shift" };
    case "meta":
      return mac ? { text: "⌘", spoken: "Command" } : { text: "Win", spoken: "Windows" };
  }
}

/** What the key of a step says on a keycap. */
export function keyLabel(key: string, platform: Platform | "unknown"): KeyLabel {
  const arrow = ARROWS[key];
  if (arrow) return arrow;
  const mac = platform === "mac";
  switch (key) {
    case "Escape":
      return { text: "Esc", spoken: "Escape" };
    case "Enter":
      return mac ? { text: "↵", spoken: "Enter" } : { text: "Enter" };
    case "Tab":
      return mac ? { text: "⇥", spoken: "Tab" } : { text: "Tab" };
    case "Backspace":
      return mac ? { text: "⌫", spoken: "Backspace" } : { text: "Backspace" };
    case "Space":
      return { text: "Space" };
    case "+":
      return { text: "+", spoken: "Plus" };
    default:
      return { text: key.length === 1 ? key.toUpperCase() : key };
  }
}
