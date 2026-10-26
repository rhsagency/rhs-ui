/**
 * Where a dismissal is remembered: localStorage, one small record per notice,
 * with a plain in-memory map behind it for the browsers that will not store
 * anything (a private window, blocked site data, a full quota). No React and no
 * DOM at import time, so the module is safe to import anywhere; the functions
 * that touch storage only run in the browser.
 */

const PREFIX = "rhs-ui:dismissed:";
const DAY = 86_400_000;

/** What is kept for one notice: the version it was dismissed at, and when. */
interface Dismissal {
  version: string;
  at: number;
}

/** Dismissals the browser refused to store. They live for the session, and are newer than anything in storage under the same key. */
const memory = new Map<string, string>();
const listeners = new Set<() => void>();

const keyOf = (id: string) => `${PREFIX}${id}`;

function read(key: string): string | null {
  const held = memory.get(key);
  if (held !== undefined) return held;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, raw: string | null) {
  try {
    if (raw === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, raw);
    memory.delete(key);
  } catch {
    if (raw === null) memory.delete(key);
    else memory.set(key, raw);
  }
}

function emit() {
  for (const listener of [...listeners]) listener();
}

/** Another tab dismissed or restored a notice: tell the ones on this page. */
function onStorage(event: StorageEvent) {
  if (event.key === null || event.key.startsWith(PREFIX)) emit();
}

/** Calls `listener` whenever any dismissal changes, in this tab or another. Returns the function that stops it. */
export function subscribeDismissals(listener: () => void): () => void {
  listeners.add(listener);
  if (listeners.size === 1) window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) window.removeEventListener("storage", onStorage);
  };
}

/**
 * Whether the notice is dismissed right now: there is a record for this exact
 * version, and, with `remindAfterDays`, it is younger than that. A record that
 * cannot be read counts as no record.
 */
export function readDismissed(id: string, version = "", remindAfterDays?: number): boolean {
  const raw = read(keyOf(id));
  if (raw === null) return false;
  let record: Partial<Dismissal> | null;
  try {
    record = JSON.parse(raw) as Partial<Dismissal> | null;
  } catch {
    return false;
  }
  if (!record || typeof record !== "object" || record.version !== version) return false;
  if (remindAfterDays !== undefined && Number.isFinite(remindAfterDays)) {
    return Date.now() - (typeof record.at === "number" ? record.at : 0) < remindAfterDays * DAY;
  }
  return true;
}

/** Remembers that the notice was dismissed at this version, now. */
export function writeDismissed(id: string, version = "") {
  write(keyOf(id), JSON.stringify({ version, at: Date.now() } satisfies Dismissal));
  emit();
}

/** Forgets the dismissal, so the notice shows again. */
export function clearDismissed(id: string) {
  write(keyOf(id), null);
  emit();
}
