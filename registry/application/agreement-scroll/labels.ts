/** The words the component says, for translation. A `{name}` mark in a sentence is filled in. */
export interface AgreementScrollLabels {
  /** The hint under the checkbox until the end has been reached. Default "Scroll to the end to accept". */
  scrollHint?: string;
  /** The hint that replaces it when the checkbox unlocks. Default "You can now accept". */
  unlockedHint?: string;
  /** The button that scrolls to the end. Default "Jump to the end". */
  jump?: string;
  /** Names the progress line for a screen reader. Default "Reading progress". */
  progress?: string;
  /** The share read, beside the title; `{percent}`. Default "{percent}% read". */
  percent?: string;
  /** The version, beside the title; `{version}`. Default "Version {version}". */
  version?: string;
  /** The words next to the checkbox when `acceptLabel` is left out; `{title}`. Default "I have read and accept the {title}". */
  accept?: string;
}

export const DEFAULT_LABELS = {
  scrollHint: "Scroll to the end to accept",
  unlockedHint: "You can now accept",
  jump: "Jump to the end",
  progress: "Reading progress",
  percent: "{percent}% read",
  version: "Version {version}",
  accept: "I have read and accept the {title}",
} satisfies Required<AgreementScrollLabels>;

export type Words = Required<AgreementScrollLabels>;

/** Fills `{name}` marks in a sentence. A mark with no value stays as it is. */
export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (mark, key: string) => (key in values ? String(values[key]) : mark));
}

/** How far the reader has come, from 0 to 1. A text that fits without scrolling is read in full. */
export function readFraction(scrollTop: number, scrollHeight: number, clientHeight: number): number {
  const room = scrollHeight - clientHeight;
  return room <= 1 ? 1 : Math.min(1, Math.max(0, scrollTop / room));
}

/** Whether the reader is at the end, to within a pixel or two of rounding. */
export function atEnd(scrollTop: number, scrollHeight: number, clientHeight: number): boolean {
  const room = scrollHeight - clientHeight;
  return room <= 1 || Math.ceil(scrollTop) >= room - 1;
}
