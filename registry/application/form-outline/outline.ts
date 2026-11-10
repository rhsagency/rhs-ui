/** Where a section of the form stands. */
export type OutlineStatus = "done" | "attention" | "todo";

export interface OutlineSection {
  /** The `id` of the element that holds the section on the page. The link goes there. */
  id: string;
  /** The name of the section in the list. */
  label: string;
  /** `done`, `attention` (something needs fixing) or `todo` (not started). */
  status: OutlineStatus;
  /** How many fields need fixing, for `attention`. It is written as "2 problems". */
  errorCount?: number;
}

/** The words the outline says, for translation. A `{name}` mark in a sentence is filled in. */
export interface FormOutlineLabels {
  /** The status of a finished section. Default "Done". */
  done?: string;
  /** The status of a section that needs fixing. Default "Needs attention". */
  attention?: string;
  /** The status of a section nobody has begun. Default "Not started". */
  todo?: string;
  /** One problem. Default "1 problem". */
  problemOne?: string;
  /** Several problems; `{count}`. Default "{count} problems". */
  problemMany?: string;
  /** On the compact bar of a phone; `{current}` and `{total}`. Default "Section {current} of {total}". */
  position?: string;
  /** Above the thin line; `{done}` and `{total}`. Default "{done} of {total} sections done". */
  progress?: string;
  /** For screen readers on the link of the section in view. Default "current section". */
  current?: string;
}

export const DEFAULT_LABELS = {
  done: "Done",
  attention: "Needs attention",
  todo: "Not started",
  problemOne: "1 problem",
  problemMany: "{count} problems",
  position: "Section {current} of {total}",
  progress: "{done} of {total} sections done",
  current: "current section",
} satisfies Required<FormOutlineLabels>;

export type Words = Required<FormOutlineLabels>;

/** Fills `{name}` marks in a sentence. A mark with no value stays as it is. */
export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (mark, key: string) => (key in values ? String(values[key]) : mark));
}

/** "1 problem" or "2 problems", or nothing for a section with none to count. */
export function problemsOf(section: OutlineSection, words: Words): string | null {
  const count = section.status === "attention" ? (section.errorCount ?? 0) : 0;
  return count <= 0 ? null : count === 1 ? words.problemOne : fill(words.problemMany, { count });
}

const HEADING = "h1, h2, h3, h4, h5, h6, [data-form-outline-heading]";

/** The nearest ancestor that scrolls on its own, or null for the page. */
export function scrollParentOf(node: HTMLElement | null): HTMLElement | null {
  for (let element = node?.parentElement ?? null; element; element = element.parentElement) {
    const overflow = getComputedStyle(element).overflowY;
    if ((overflow === "auto" || overflow === "scroll" || overflow === "overlay") && element.scrollHeight > element.clientHeight) return element;
  }
  return null;
}

/** The section the reader is in: the last one whose top has passed a line a quarter of the way down the view. At the very end the last one counts, so a short last section can still be reached. */
export function sectionInView(ids: readonly string[], offset: number, scroller: HTMLElement | null): string | null {
  const top = scroller ? scroller.getBoundingClientRect().top : 0;
  const height = scroller ? scroller.clientHeight : window.innerHeight;
  const line = top + offset + (height - offset) * 0.25;
  const atEnd = scroller ? scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - 2 : window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2;
  let found: string | null = null;
  for (const id of ids) {
    const element = document.getElementById(id);
    if (!element) continue;
    if (atEnd) found = id;
    else if (element.getBoundingClientRect().top <= line) found = id;
  }
  // Before the first section has reached the line, the first one is still the one you are in.
  return found ?? ids.find((id) => document.getElementById(id)) ?? null;
}

/** Scroll so the section's top sits `offset` px under the top of the view, smoothly unless `smooth` is off. */
export function scrollToSection(section: HTMLElement, offset: number, smooth: boolean): void {
  const scroller = scrollParentOf(section);
  const behavior = smooth ? "smooth" : "auto";
  if (scroller) scroller.scrollTo({ top: scroller.scrollTop + section.getBoundingClientRect().top - scroller.getBoundingClientRect().top - offset, behavior });
  else window.scrollTo({ top: window.scrollY + section.getBoundingClientRect().top - offset, behavior });
}

/** Move focus to the heading of a section, so a screen reader reads it and the next Tab starts inside the section. A heading is not focusable by default, so it becomes focusable by script only. */
export function focusHeading(section: HTMLElement): void {
  const heading = section.matches(HEADING) ? section : section.querySelector<HTMLElement>(HEADING);
  const target = heading ?? section;
  if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
  target.focus({ preventScroll: true });
}
