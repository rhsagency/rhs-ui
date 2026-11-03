/**
 * Keyboard combinations as plain text, and back. A shortcut is written the
 * same on every platform, `Mod+Shift+K`: `Mod` is Command on a Mac and Ctrl
 * elsewhere, so one saved value works for everyone. Modifiers come first in a
 * fixed order (Mod, Ctrl, Alt, Shift, Meta), then the key.
 */

/** The keyboard the shortcut is shown for: symbols on a Mac, words on the others. */
export type ShortcutPlatform = "mac" | "windows" | "linux";

export type ShortcutModifier = "Mod" | "Ctrl" | "Alt" | "Shift" | "Meta";

const ORDER: readonly ShortcutModifier[] = ["Mod", "Ctrl", "Alt", "Shift", "Meta"];

const MODIFIER_NAMES: Record<string, ShortcutModifier> = {
  mod: "Mod",
  cmdorctrl: "Mod",
  commandorcontrol: "Mod",
  ctrl: "Ctrl",
  control: "Ctrl",
  alt: "Alt",
  option: "Alt",
  opt: "Alt",
  shift: "Shift",
  meta: "Meta",
  cmd: "Meta",
  command: "Meta",
  win: "Meta",
  super: "Meta",
};

const KEY_NAMES: Record<string, string> = {
  esc: "Escape",
  escape: "Escape",
  return: "Enter",
  enter: "Enter",
  del: "Delete",
  delete: "Delete",
  backspace: "Backspace",
  space: "Space",
  spacebar: "Space",
  tab: "Tab",
  up: "ArrowUp",
  down: "ArrowDown",
  left: "ArrowLeft",
  right: "ArrowRight",
  arrowup: "ArrowUp",
  arrowdown: "ArrowDown",
  arrowleft: "ArrowLeft",
  arrowright: "ArrowRight",
  pageup: "PageUp",
  pagedown: "PageDown",
  home: "Home",
  end: "End",
  insert: "Insert",
  ins: "Insert",
  plus: "Plus",
};

/** The punctuation keys, by the physical key that carries them, so Shift+/ is recorded as Shift+/ and not as Shift+?. */
const PUNCTUATION: Record<string, string> = {
  Slash: "/",
  Comma: ",",
  Period: ".",
  Minus: "-",
  Equal: "=",
  BracketLeft: "[",
  BracketRight: "]",
  Backslash: "\\",
  Semicolon: ";",
  Quote: "'",
  Backquote: "`",
};

/** Keys that are only ever held down, never the key of a shortcut. */
const MODIFIER_KEYS = new Set(["Control", "Shift", "Alt", "Meta", "AltGraph", "OS"]);
/** Keys that do nothing on their own and are left alone while recording. */
const INERT_KEYS = new Set(["CapsLock", "NumLock", "ScrollLock", "Fn", "FnLock", "Dead", "Process", "Unidentified", "Hyper", "Super", "Symbol", "SymbolLock"]);

export function isModifierKey(key: string): boolean {
  return MODIFIER_KEYS.has(key);
}

export function isInertKey(key: string): boolean {
  return INERT_KEYS.has(key);
}

export interface ParsedShortcut {
  modifiers: readonly ShortcutModifier[];
  /** The key, such as `K`, `Enter`, `ArrowUp`, `F5` or `/`. Null while only modifiers are given. */
  key: string | null;
}

function keyName(raw: string): string {
  const known = KEY_NAMES[raw.toLowerCase()];
  if (known) return known;
  if (/^f\d{1,2}$/i.test(raw)) return raw.toUpperCase();
  return raw.length === 1 ? raw.toUpperCase() : raw;
}

/** Reads `Mod+Shift+K`, `cmd + k`, `Ctrl+Alt+Delete` into its parts. Unknown words are taken as the key. */
export function parseShortcut(text: string): ParsedShortcut {
  const modifiers = new Set<ShortcutModifier>();
  let key: string | null = null;
  for (const part of text.split("+").map((item) => item.trim())) {
    if (!part) continue;
    const modifier = MODIFIER_NAMES[part.toLowerCase()];
    if (modifier) modifiers.add(modifier);
    else key = keyName(part);
  }
  // "Mod++" is the plus key itself.
  if (key === null && /\+\s*\+\s*$/.test(text)) key = "Plus";
  return { modifiers: ORDER.filter((item) => modifiers.has(item)), key };
}

/** Writes parts as the one canonical text: `Mod+Shift+K`. */
export function formatShortcut(parsed: ParsedShortcut): string {
  return [...ORDER.filter((item) => parsed.modifiers.includes(item)), ...(parsed.key ? [parsed.key] : [])].join("+");
}

/** The canonical form of any spelling of a combination, or null when there is no key in it. */
export function normaliseShortcut(text: string | null | undefined): string | null {
  if (!text) return null;
  const parsed = parseShortcut(text);
  return parsed.key ? formatShortcut(parsed) : null;
}

interface KeyEventLike {
  key: string;
  code: string;
  ctrlKey: boolean;
  metaKey: boolean;
  altKey: boolean;
  shiftKey: boolean;
}

/** The modifiers held in an event, on the platform's own terms: Command is `Mod` on a Mac, Ctrl is `Mod` elsewhere. */
export function modifiersOf(event: Pick<KeyEventLike, "ctrlKey" | "metaKey" | "altKey" | "shiftKey">, platform: ShortcutPlatform): ShortcutModifier[] {
  const mac = platform === "mac";
  const held = new Set<ShortcutModifier>();
  if (event.metaKey) held.add(mac ? "Mod" : "Meta");
  if (event.ctrlKey) held.add(mac ? "Ctrl" : "Mod");
  if (event.altKey) held.add("Alt");
  if (event.shiftKey) held.add("Shift");
  return ORDER.filter((item) => held.has(item));
}

/** The key of an event, named for what is printed on it, not for what a modifier turns it into (Option+K is a K, not a ˚). */
function keyOfEvent(event: KeyEventLike): string | null {
  const { key, code } = event;
  if (isModifierKey(key) || isInertKey(key)) return null;
  if (/^[a-z0-9]$/i.test(key)) return key.toUpperCase();
  const letter = /^Key([A-Z])$/.exec(code)?.[1];
  if (letter) return letter;
  const digit = /^Digit(\d)$/.exec(code)?.[1];
  if (digit) return digit;
  const punctuation = PUNCTUATION[code];
  if (punctuation) return punctuation;
  if (key === " ") return "Space";
  if (key === "+") return "Plus";
  return keyName(key);
}

/** The combination a key press makes, or null while only modifiers are held. */
export function shortcutFromEvent(event: KeyEventLike, platform: ShortcutPlatform): string | null {
  const key = keyOfEvent(event);
  return key ? formatShortcut({ modifiers: modifiersOf(event, platform), key }) : null;
}

/** One key of a shortcut as it is shown and as it is read. */
export interface ShortcutKey {
  /** What the keycap shows: ⌘, Ctrl, K, ↑. */
  glyph: string;
  /** What a screen reader says: Command, Control, K, Up arrow. */
  word: string;
}

const MAC_MODIFIERS: Record<ShortcutModifier, ShortcutKey> = {
  Mod: { glyph: "⌘", word: "Command" },
  Ctrl: { glyph: "⌃", word: "Control" },
  Alt: { glyph: "⌥", word: "Option" },
  Shift: { glyph: "⇧", word: "Shift" },
  Meta: { glyph: "⌘", word: "Command" },
};

const WINDOWS_MODIFIERS: Record<ShortcutModifier, ShortcutKey> = {
  Mod: { glyph: "Ctrl", word: "Control" },
  Ctrl: { glyph: "Ctrl", word: "Control" },
  Alt: { glyph: "Alt", word: "Alt" },
  Shift: { glyph: "Shift", word: "Shift" },
  Meta: { glyph: "Win", word: "Windows" },
};

const LINUX_MODIFIERS: Record<ShortcutModifier, ShortcutKey> = { ...WINDOWS_MODIFIERS, Meta: { glyph: "Super", word: "Super" } };

const KEYS: Record<string, { glyph: string; mac?: string; word: string }> = {
  ArrowUp: { glyph: "↑", word: "Up arrow" },
  ArrowDown: { glyph: "↓", word: "Down arrow" },
  ArrowLeft: { glyph: "←", word: "Left arrow" },
  ArrowRight: { glyph: "→", word: "Right arrow" },
  Enter: { glyph: "Enter", mac: "↩", word: "Enter" },
  Escape: { glyph: "Esc", word: "Escape" },
  Backspace: { glyph: "⌫", word: "Backspace" },
  Delete: { glyph: "Del", mac: "⌦", word: "Delete" },
  Tab: { glyph: "Tab", mac: "⇥", word: "Tab" },
  Space: { glyph: "Space", word: "Space" },
  PageUp: { glyph: "PgUp", word: "Page up" },
  PageDown: { glyph: "PgDn", word: "Page down" },
  Plus: { glyph: "+", word: "Plus" },
  "/": { glyph: "/", word: "Slash" },
  ",": { glyph: ",", word: "Comma" },
  ".": { glyph: ".", word: "Period" },
  "-": { glyph: "-", word: "Minus" },
  "=": { glyph: "=", word: "Equals" },
  "[": { glyph: "[", word: "Left bracket" },
  "]": { glyph: "]", word: "Right bracket" },
  "\\": { glyph: "\\", word: "Backslash" },
  ";": { glyph: ";", word: "Semicolon" },
  "'": { glyph: "'", word: "Apostrophe" },
  "`": { glyph: "`", word: "Backtick" },
};

/** The keys of a held-modifier set or a whole shortcut, in the order the platform prints them (⌃ ⌥ ⇧ ⌘ on a Mac). */
export function describeModifiers(modifiers: readonly ShortcutModifier[], platform: ShortcutPlatform): ShortcutKey[] {
  const table = platform === "mac" ? MAC_MODIFIERS : platform === "windows" ? WINDOWS_MODIFIERS : LINUX_MODIFIERS;
  const order: readonly ShortcutModifier[] = platform === "mac" ? ["Ctrl", "Alt", "Shift", "Mod", "Meta"] : ["Mod", "Ctrl", "Alt", "Shift", "Meta"];
  const keys: ShortcutKey[] = [];
  for (const modifier of order) {
    if (!modifiers.includes(modifier)) continue;
    // Mod and Ctrl are one key off a Mac; Mod and Meta are one key on a Mac. Show each key once.
    if (platform !== "mac" && modifier === "Ctrl" && modifiers.includes("Mod")) continue;
    if (platform === "mac" && modifier === "Meta" && modifiers.includes("Mod")) continue;
    keys.push(table[modifier]);
  }
  return keys;
}

/** A whole shortcut as keycaps: modifiers in the platform's order, then the key. */
export function describeShortcut(shortcut: string, platform: ShortcutPlatform): ShortcutKey[] {
  const parsed = parseShortcut(shortcut);
  const keys = describeModifiers(parsed.modifiers, platform);
  if (parsed.key) {
    const known = KEYS[parsed.key];
    keys.push(known ? { glyph: (platform === "mac" ? known.mac : undefined) ?? known.glyph, word: known.word } : { glyph: parsed.key, word: parsed.key });
  }
  return keys;
}

/** The words for a screen reader: "Command plus Shift plus K". */
export function shortcutWords(shortcut: string, platform: ShortcutPlatform): string {
  return describeShortcut(shortcut, platform)
    .map((key) => key.word)
    .join(" plus ");
}

/** Whether the shortcut has a modifier, or is a function key, which needs none. */
export function isComplete(shortcut: string): boolean {
  const parsed = parseShortcut(shortcut);
  return parsed.modifiers.length > 0 || /^F\d{1,2}$/.test(parsed.key ?? "");
}

/** Reads the platform from the browser. Only call it in the browser, after mount. */
export function detectPlatform(): ShortcutPlatform {
  const nav = navigator as Navigator & { userAgentData?: { platform?: string } };
  const text = nav.userAgentData?.platform || nav.platform || nav.userAgent;
  if (/mac|iphone|ipad|ipod/i.test(text)) return "mac";
  return /win/i.test(text) ? "windows" : "linux";
}
