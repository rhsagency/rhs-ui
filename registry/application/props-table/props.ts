import type { ReactNode } from "react";

/**
 * The data and the small decisions behind PropsTable, as plain types and
 * functions: they hold no state and call no hook, so a Server Component can
 * use them too.
 */

/** One prop of a component, or one field of an object prop. */
export interface PropRow {
  /** The name as written in code: "variant". For a field of an object prop, the name of the field: "street". */
  name: string;
  /** The type as you would write it: "'default' | 'outline' | 'ghost'". A union wraps at its pipes. */
  type: string;
  /** What it is when you leave it out: "'default'". Leave it out and the table says "None". */
  defaultValue?: string;
  /** The prop has to be given. The row carries the word Required, not an asterisk. */
  required?: boolean;
  /** What it does, in a sentence or two. Plain text, or text with `<code>` in it. */
  description?: ReactNode;
  /** The fields of an object prop, which open beneath the row, indented. They can have fields of their own. */
  children?: readonly PropRow[];
  /** A heading to list the row under. Rows next to each other with the same group sit under one heading. Only used on the rows of the top level. */
  group?: string;
}

/** Rows that sit under one heading, or under none. */
export interface PropSection {
  /** The heading, or undefined for rows with no group. */
  group: string | undefined;
  rows: readonly PropRow[];
}

/** The words the table says, for translation. `{count}` and `{name}` are filled in. */
export interface PropsTableLabels {
  /** The column of names. Default "Prop". */
  prop?: string;
  /** The column of types. Default "Type". */
  type?: string;
  /** The column of defaults. Default "Default". */
  defaultValue?: string;
  /** The column of descriptions. Default "Description". */
  description?: string;
  /** The word on a prop that has to be given. Default "Required". */
  required?: string;
  /** What is shown when a prop has no default. Default "None". */
  none?: string;
  /** The button that opens the fields of an object, for one. Default "{count} field". */
  fieldsOne?: string;
  /** The same for the rest. Default "{count} fields". */
  fieldsOther?: string;
  /** What that button is called to screen readers: its own text and whose fields they are. Default "{fields} of {name}". */
  fieldsOf?: string;
  /** The name of the link to one row. Default "Link to {name}". */
  link?: string;
  /** What is said when there are no props at all. Default "This component takes no props." */
  empty?: string;
}

export const DEFAULT_LABELS = {
  prop: "Prop",
  type: "Type",
  defaultValue: "Default",
  description: "Description",
  required: "Required",
  none: "None",
  fieldsOne: "{count} field",
  fieldsOther: "{count} fields",
  fieldsOf: "{fields} of {name}",
  link: "Link to {name}",
  empty: "This component takes no props.",
} satisfies Required<PropsTableLabels>;

/** Puts values into a template: `fill("Link to {name}", { name: "variant" })`. A name it does not know is left as it was. */
export function fill(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => (key in values ? (values[key] ?? match) : match));
}

/** Whether the locale writes "1 field" with the singular. */
export function isOne(value: number, locale: string): boolean {
  try {
    return new Intl.PluralRules(locale).select(value) === "one";
  } catch {
    return value === 1;
  }
}

const BACKSLASH = String.fromCharCode(92);

/**
 * A type cut at the pipes of its union, the ones that are not inside brackets, generics, a function's parameters or a
 * string: "'a' | 'b' | Array<'c' | 'd'>" is three members. A type that is not a union is one member.
 */
export function splitUnion(type: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let quote = "";
  let start = 0;
  for (let index = 0; index < type.length; index += 1) {
    const char = type.charAt(index);
    if (quote) {
      if (char === BACKSLASH) index += 1;
      else if (char === quote) quote = "";
    } else if (char === "'" || char === '"' || char === "`") quote = char;
    else if (char === "(" || char === "[" || char === "{" || char === "<") depth += 1;
    // The > of an arrow function is not the end of a generic.
    else if (char === ")" || char === "]" || char === "}" || (char === ">" && type.charAt(index - 1) !== "=")) depth -= 1;
    else if (char === "|" && depth === 0) {
      parts.push(type.slice(start, index).trim());
      start = index + 1;
    }
  }
  parts.push(type.slice(start).trim());
  return parts.filter(Boolean);
}

/** A name as an id: "onValueChange" is "onvaluechange", "style.color" is "style-color". */
export function slug(path: string): string {
  return path
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** The id of a row, and the target of its link: "prop-variant", "prop-address-street". */
export function rowId(prefix: string, path: string): string {
  return `${prefix}${slug(path)}`;
}

/** The path of a row: its name, with the names of the rows it sits in in front of it, "address.street". */
export function pathOf(parent: string, name: string): string {
  return parent ? `${parent}.${name}` : name;
}

/** Splits the top level into runs that share a group, in the order given. Rows without a group sit together with no heading. */
export function sectionsOf(rows: readonly PropRow[]): PropSection[] {
  const sections: PropSection[] = [];
  for (const row of rows) {
    const last = sections[sections.length - 1];
    if (last && last.group === row.group) (last.rows as PropRow[]).push(row);
    else sections.push({ group: row.group, rows: [row] });
  }
  return sections;
}

/**
 * The paths that must be open for the row with this id to be on screen, or null when no row has it. A row at the top
 * level needs nothing open, so the list is empty.
 */
export function chainTo(rows: readonly PropRow[], prefix: string, id: string, parent = ""): string[] | null {
  for (const row of rows) {
    const path = pathOf(parent, row.name);
    if (rowId(prefix, path) === id) return [];
    const below = row.children ? chainTo(row.children, prefix, id, path) : null;
    if (below) return [path, ...below];
  }
  return null;
}
