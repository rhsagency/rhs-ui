/** The words the field says, for translation. A `{name}` mark in a sentence is filled in. */
export interface InheritedFieldLabels {
  /** The word beside the switch. Default "Override". */
  override?: string;
  /** What the field says while it follows its parent; `{source}`. Default "Inherited from {source}". */
  inheritedFrom?: string;
  /** Before the parent's value while the field is overridden; `{source}`. Default "{source} value:". */
  parentValue?: string;
  /** The button that goes back to the parent's value. Default "Reset to inherited". */
  reset?: string;
  /** Under an inherited field that still remembers a value of its own. Default "Your own value is kept until you save. Turn Override on to bring it back." */
  kept?: string;
}

export const DEFAULT_LABELS = {
  override: "Override",
  inheritedFrom: "Inherited from {source}",
  parentValue: "{source} value:",
  reset: "Reset to inherited",
  kept: "Your own value is kept until you save. Turn Override on to bring it back.",
} satisfies Required<InheritedFieldLabels>;

export type Words = Required<InheritedFieldLabels>;

/** Fills `{name}` marks in a sentence. A mark with no value stays as it is. */
export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (mark, key: string) => (key in values ? String(values[key]) : mark));
}

/** The text before and after a `{name}` mark, so the value can sit between them in its own markup. Without the mark, everything is "before". */
export function around(template: string, name: string): [before: string, after: string] {
  const at = template.indexOf(`{${name}}`);
  return at < 0 ? [template, ""] : [template.slice(0, at), template.slice(at + name.length + 2)];
}
