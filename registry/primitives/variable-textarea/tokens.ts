/** A value the template can use: `key` is written between the delimiters (letters, digits, underscores, dots and hyphens, no spaces), `label` names it in the menu and `sample` is what the preview shows in its place. */
export interface TemplateVariable {
  key: string;
  label: string;
  sample: string;
}

/** The characters around a variable's key: `["{{", "}}"]`, `["[", "]"]`, `["%", "%"]`. */
export type Delimiters = readonly [string, string];

export const DEFAULT_DELIMITERS: Delimiters = ["{{", "}}"];

/** The words the field says, for another language or your own voice. Each can be replaced. */
export interface VariableTextareaLabels {
  /** The name of the text for a screen reader when it has no label, id or aria-label of its own. */
  name: string;
  /** The menu button. */
  insert: string;
  /** The heading inside the menu. */
  variables: string;
  /** The preview toggle. */
  preview: string;
  /** What the preview says while there is no text. */
  previewEmpty: string;
  /** The line under a preview. */
  sampleNote: string;
  /** The line under the text when nothing is wrong; `token` is an example variable as it is written. */
  hint: (token: string) => string;
  /** Said of a variable the template uses but you did not pass. */
  unknown: (token: string) => string;
  /** The offer after `unknown`, when a variable is close enough in spelling. */
  didYouMean: (token: string) => string;
  /** What a screen reader hears after a variable is inserted. */
  inserted: (label: string) => string;
  /** The reason a variable cannot be inserted, in the menu. */
  noRoom: (extra: number) => string;
  /** Read after a flagged variable in the preview. */
  notAVariable: string;
  /** The line when more variables are flagged than are listed. */
  andMore: (count: number) => string;
}

export const DEFAULT_LABELS: VariableTextareaLabels = {
  name: "Message template",
  insert: "Insert variable",
  variables: "Variables",
  preview: "Preview",
  previewEmpty: "Nothing to preview yet.",
  sampleNote: "Showing sample data. The template stays as you wrote it.",
  hint: (token) => `Variables are written like ${token}.`,
  unknown: (token) => `${token} is not a variable.`,
  didYouMean: (token) => `Did you mean ${token}?`,
  inserted: (label) => `Inserted ${label}`,
  noRoom: (extra) => `Needs ${extra} more ${extra === 1 ? "character" : "characters"}`,
  notAVariable: "not a variable",
  andMore: (count) => `and ${count} more not recognised`,
};

/** A piece of the template: plain text, a variable that is known, or one that is written like a variable but is not one you passed. */
export type Fragment =
  | { type: "text"; text: string }
  | { type: "variable"; text: string; key: string; label: string; sample: string }
  | { type: "unknown"; text: string; key: string };

const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** A variable as it is written in the text: the delimiters around a key of letters (of any script), digits, underscores, dots and hyphens, with spaces allowed inside. */
function pattern(delimiters: Delimiters): RegExp {
  return new RegExp(`${escapeRegExp(delimiters[0])}[ \\t]*([\\p{L}\\p{M}\\p{N}_.\\-]*)[ \\t]*${escapeRegExp(delimiters[1])}`, "gu");
}

/** The variable as it is written in the text. */
export function tokenOf(key: string, delimiters: Delimiters = DEFAULT_DELIMITERS): string {
  return `${delimiters[0]}${key}${delimiters[1]}`;
}

/** The template cut into its pieces, in order. */
export function parseTemplate(text: string, variables: readonly TemplateVariable[], delimiters: Delimiters = DEFAULT_DELIMITERS): Fragment[] {
  const known = new Map(variables.map((variable) => [variable.key, variable]));
  const fragments: Fragment[] = [];
  let at = 0;
  for (const match of text.matchAll(pattern(delimiters))) {
    const from = match.index ?? 0;
    if (from > at) fragments.push({ type: "text", text: text.slice(at, from) });
    const key = match[1] ?? "";
    const variable = known.get(key);
    fragments.push(variable ? { type: "variable", text: match[0], key, label: variable.label, sample: variable.sample } : { type: "unknown", text: match[0], key });
    at = from + match[0].length;
  }
  if (at < text.length) fragments.push({ type: "text", text: text.slice(at) });
  return fragments;
}

/** The message with every known variable replaced by its sample. A variable that is not known stays as it was written. */
export function fillTemplate(text: string, variables: readonly TemplateVariable[], delimiters: Delimiters = DEFAULT_DELIMITERS): string {
  return parseTemplate(text, variables, delimiters)
    .map((fragment) => (fragment.type === "variable" ? fragment.sample : fragment.text))
    .join("");
}

/** How many single-character edits turn one word into the other. */
function distance(a: string, b: string): number {
  let previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let row = 1; row <= a.length; row += 1) {
    const current = [row];
    for (let column = 1; column <= b.length; column += 1) {
      const cost = a.charAt(row - 1) === b.charAt(column - 1) ? 0 : 1;
      current[column] = Math.min((previous[column] ?? 0) + 1, (current[column - 1] ?? 0) + 1, (previous[column - 1] ?? 0) + cost);
    }
    previous = current;
  }
  return previous[b.length] ?? 0;
}

/** The key you passed that a mistyped one is nearest to, when it is near enough to be a typo. */
export function closestKey(key: string, variables: readonly TemplateVariable[]): string | null {
  if (key === "") return null;
  const wanted = key.toLowerCase();
  const allowed = Math.max(1, Math.min(3, Math.floor(wanted.length / 3)));
  let best: { key: string; away: number } | null = null;
  for (const variable of variables) {
    const away = distance(wanted, variable.key.toLowerCase());
    if (away <= allowed && (best === null || away < best.away)) best = { key: variable.key, away };
  }
  return best?.key ?? null;
}

/** An unknown variable in the text, once however often it appears, with the key it was probably meant to be. */
export interface UnknownVariable {
  token: string;
  key: string;
  suggestion: string | null;
}

/** The variables the template writes that were not passed in, each once, in the order they first appear. */
export function unknownVariables(fragments: readonly Fragment[], variables: readonly TemplateVariable[]): UnknownVariable[] {
  const seen = new Set<string>();
  const found: UnknownVariable[] = [];
  for (const fragment of fragments) {
    if (fragment.type !== "unknown" || seen.has(fragment.text)) continue;
    seen.add(fragment.text);
    found.push({ token: fragment.text, key: fragment.key, suggestion: closestKey(fragment.key, variables) });
  }
  return found;
}
