/**
 * The words and the small decisions behind GoToShortcuts, as plain functions:
 * they hold no state and call no hook, so a Server Component can use them too.
 */

/** One place a letter takes you. */
export interface GoToDestination {
  /** The key pressed after the prefix: one letter or digit. Case does not matter. Unique within the list. */
  key: string;
  /** Where it goes, in words: "Inbox". It is what the hint panel lists. */
  label: string;
  /** The address to load when the key is pressed. Use `onGo` instead when you route on the client. */
  href?: string;
  /** What to do when the key is pressed. It wins over `href`. */
  onGo?: () => void;
}

/** The words the shortcuts say, for translation. `{label}` is filled in. */
export interface GoToShortcutsLabels {
  /** The heading of the hint panel. Default "Go to". */
  title?: string;
  /** Said politely when the prefix is pressed. Default "Go to: press a letter". */
  armed?: string;
  /** Said politely when a letter was pressed. Default "Going to {label}". */
  going?: string;
  /** The word beside the Esc key on the hint panel. Default "cancel". */
  cancel?: string;
}

export const DEFAULT_LABELS = {
  title: "Go to",
  armed: "Go to: press a letter",
  going: "Going to {label}",
  cancel: "cancel",
} satisfies Required<GoToShortcutsLabels>;

export const DEFAULT_PREFIX = "g";

/** Fills `{name}` marks in a sentence. A mark with no value stays as it is. */
export function fill(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (mark, key: string) => (key in values ? (values[key] ?? mark) : mark));
}

/**
 * The attribute for a link or button you draw yourself that a go-to key reaches: spread it on the element
 * (`<a href="/inbox" {...goToShortcut("i")}>`). ARIA has no syntax for a sequence of presses, so the value
 * lists the keys in the order they are pressed, "g i", which assistive technology reads out as it stands.
 */
export function goToShortcut(key: string, prefix: string = DEFAULT_PREFIX): { "aria-keyshortcuts": string } {
  return { "aria-keyshortcuts": `${prefix.toLowerCase()} ${key.toLowerCase()}` };
}

/** The destination a pressed key leads to, ignoring case, or undefined. */
export function destinationFor(destinations: readonly GoToDestination[], pressed: string): GoToDestination | undefined {
  const wanted = pressed.toLowerCase();
  return destinations.find((destination) => destination.key.toLowerCase() === wanted);
}

/** Input types that take no text: a letter pressed on one of them is not typing. */
const NO_TEXT = new Set(["checkbox", "radio", "button", "submit", "reset", "range", "color", "file", "image"]);

/** Whether a key press came from somewhere text is typed. A shortcut that fires while someone types a "g" is a bug. */
export function isTyping(target: EventTarget | null): boolean {
  if (typeof HTMLElement === "undefined" || !(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  if (target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement) return true;
  if (target instanceof HTMLInputElement) return !NO_TEXT.has(target.type);
  const role = target.getAttribute("role");
  return role === "textbox" || role === "searchbox" || role === "combobox";
}

/** Whether the press came from inside a dialog: the page behind it is not what a go-to key should move. */
export function insideDialog(target: EventTarget | null): boolean {
  return typeof Element !== "undefined" && target instanceof Element && target.closest('[role="dialog"], [role="alertdialog"], dialog[open], [aria-modal="true"]') !== null;
}
