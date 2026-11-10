/**
 * The words and the small decisions behind ViewStack, as plain functions: they
 * hold no state and call no hook, so a Server Component can use them too.
 */

import type { ReactNode } from "react";

/** One view of the stack: a title and what it shows. */
export interface ViewDefinition {
  /** The view's heading, and the name of the Back button of the view that opens above it. */
  title: string;
  /** What the view holds. It stays mounted while another view is above it, so a form in it keeps what was typed. */
  content: ReactNode;
}

/** The views a stack can show, by id. The first one is the root. */
export type ViewRegistry = Readonly<Record<string, ViewDefinition>>;

/** The words the stack says, for translation. `{title}` is filled in. */
export interface ViewStackLabels {
  /** The name of the Back button, with the title of the view it returns to. Default "Back to {title}". */
  back?: string;
}

export const DEFAULT_LABELS = {
  back: "Back to {title}",
} satisfies Required<ViewStackLabels>;

/** Fills `{name}` marks in a sentence. A mark with no value stays as it is. */
export function fill(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (mark, key: string) => (key in values ? (values[key] ?? mark) : mark));
}

/** A view that is drawn: its identity for React, which view it shows, whether it is on its way out, and how it came in. */
export interface Entry {
  uid: number;
  id: string;
  /** Where it sits in the stack, root 0. A view that is leaving keeps the level it had. */
  level: number;
  leaving: boolean;
  /** `forward` slides in from the side, `fade` cross-fades (a stack that was replaced), `none` is the first draw. */
  enter: "forward" | "fade" | "none";
}

/**
 * The stack to show: the ids that exist, at least the root. An id the registry does not know is dropped, so a
 * stale `stack` from a URL or a saved state never draws a hole.
 */
export function clean(stack: readonly string[], views: ViewRegistry): string[] {
  const known = stack.filter((id) => Object.hasOwn(views, id));
  if (known.length) return known;
  const root = Object.keys(views)[0];
  return root === undefined ? [] : [root];
}

/**
 * What to draw after the stack changed. A view that was at the same place with the same id is the same view
 * (its state survives); a view that is no longer in the stack is kept, marked as leaving, so it can slide out
 * before it is removed; a view that is new comes in from the side when it sits on top of views that stayed,
 * and fades in when the whole stack was replaced.
 */
export function reconcile(previous: readonly Entry[], stack: readonly string[], uid: () => number): Entry[] {
  const before = previous.filter((entry) => !entry.leaving);
  const live: Entry[] = stack.map((id, at) => {
    const same = before[at];
    return same && same.id === id ? { ...same, level: at } : { uid: -1, id, level: at, leaving: false, enter: "none" };
  });
  const kept = live.filter((entry) => entry.uid !== -1).length;
  const drawn = live.map((entry) => (entry.uid === -1 ? { ...entry, uid: uid(), enter: kept > 0 ? ("forward" as const) : ("fade" as const) } : { ...entry, enter: "none" as const }));
  const retained = new Set(drawn.map((entry) => entry.uid));
  const out = [...before.filter((entry) => !retained.has(entry.uid)).map((entry) => ({ ...entry, leaving: true })), ...previous.filter((entry) => entry.leaving && !retained.has(entry.uid))];
  return [...drawn, ...out];
}
