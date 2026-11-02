export interface FontOption {
  /** The family's name as the page knows it: "Fraunces". It is what the search matches and what the list says when there is no `label`. */
  family: string;
  /** The CSS font-family list the font is drawn with, and the value the field reports: `"Fraunces", Georgia, serif`. End it with a generic family, so something is always drawn. */
  stack: string;
  /** What the list calls the font, when that is not the family's name. */
  label?: string;
  /** The heading it is listed under: "Sans", "Serif", "Mono", "Display". Fonts without one are listed first, under no heading. */
  group?: string;
}

export const DEFAULT_GROUPS: readonly string[] = ["Sans", "Serif", "Mono", "Display"];

export const DEFAULT_SAMPLE = "Sphinx of black quartz, judge my vow.";

const GENERIC = new Set(["serif", "sans-serif", "monospace", "cursive", "fantasy", "system-ui", "ui-serif", "ui-sans-serif", "ui-monospace", "ui-rounded", "math", "emoji", "fangsong"]);

/** The families of a CSS font-family list, in order, without their quotes. */
export function familiesOf(stack: string): string[] {
  const families: string[] = [];
  for (const match of stack.matchAll(/\s*(?:"([^"]*)"|'([^']*)'|([^,]+))/g)) {
    const family = (match[1] ?? match[2] ?? match[3] ?? "").trim();
    if (family) families.push(family);
  }
  return families;
}

/** A generic family (serif, monospace) is always there, and so is a family the page names with a variable, which cannot be looked up from here. */
export function isGeneric(family: string): boolean {
  return GENERIC.has(family.toLowerCase()) || /\(/.test(family);
}

const unquote = (name: string): string => name.replace(/^["']|["']$/g, "");

let canvas: CanvasRenderingContext2D | null | undefined;

/** Whether a font on the system draws with its own letters: the same text is a different width in it than in each of the three default families. */
function isOnSystem(family: string): boolean {
  canvas ??= document.createElement("canvas").getContext("2d");
  const context = canvas;
  if (!context) return true;
  const width = (font: string) => {
    context.font = `72px ${font}`;
    return context.measureText("mmmmmmmmmmlliWW 0123").width;
  };
  return ["monospace", "serif", "sans-serif"].some((base) => width(`"${family}", ${base}`) !== width(base));
}

/**
 * Whether a family can be drawn on this page: a web font the page declares is there once it has loaded (and
 * is taken to be there while it waits for its first use), a font the page does not declare must be on the
 * system. In a server render nothing can be known, so everything is taken to be there.
 */
export function isInstalled(family: string): boolean {
  if (isGeneric(family) || typeof document === "undefined") return true;
  const wanted = family.toLowerCase();
  // A browser or a test environment without the font set only has the system to ask.
  const face = typeof document.fonts === "undefined" ? undefined : Array.from(document.fonts).find((candidate) => unquote(candidate.family).toLowerCase() === wanted);
  if (face) return face.status !== "error";
  return isOnSystem(family);
}

/** The family a list falls back to when its first is not there: the next one that can be drawn, ending at the last of the list. */
export function fallbackOf(stack: string): string {
  const families = familiesOf(stack);
  return families.slice(1).find((family) => isGeneric(family) || isInstalled(family)) ?? families[families.length - 1] ?? "the default font";
}

/** Two font-family lists that differ only in quotes, spaces and capitals are the same list. */
export function sameStack(a: string, b: string): boolean {
  const flat = (text: string) => text.replace(/["']/g, "").replace(/\s*,\s*/g, ",").replace(/\s+/g, " ").trim().toLowerCase();
  return flat(a) === flat(b);
}

export interface FontSection {
  name: string;
  /** Each font with its place in the list you gave, which is what the list's rows are named by. */
  fonts: readonly { font: FontOption; index: number }[];
}

/** The fonts under their headings: the ones with no group first, then the groups in the order given, then any other group in the order it first appears. */
export function groupFonts(fonts: readonly FontOption[], groups: readonly string[]): FontSection[] {
  const order = ["", ...groups];
  for (const font of fonts) if (!order.includes(font.group ?? "")) order.push(font.group ?? "");
  return order
    .map((name) => ({ name, fonts: fonts.map((font, index) => ({ font, index })).filter((entry) => (entry.font.group ?? "") === name) }))
    .filter((section) => section.fonts.length > 0);
}

const fold = (text: string): string => text.normalize("NFD").replace(/\p{M}+/gu, "").toLowerCase();

/** The search matches the name, the family and the group, so "serif" lists the serif fonts. */
export function matchesFont(font: FontOption, query: string): boolean {
  const wanted = fold(query.trim());
  return !wanted || [font.label ?? font.family, font.family, font.group ?? ""].some((text) => fold(text).includes(wanted));
}
