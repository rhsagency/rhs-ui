/** One brand the shop sells. */
export interface Brand {
  /** What it is called: "Northwind". */
  name: string;
  /** The brand's page. */
  href: string;
  /** How many of its products the shop has. Shown beside the name. */
  count?: number;
  /** The mark, for the popular tiles. A transparent SVG or PNG: it is drawn in one colour, in the text colour. Without one the tile shows the brand's initials. */
  logo?: { src: string; alt: string };
}

/** The letters of the jump bar. */
export const LETTERS: readonly string[] = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

/** The group for names that do not start with a letter: "1898 Mill". */
export const OTHER = "#";

/** Lower case with the accents taken off, so "Élan" is found by typing "elan" and sorts under E. */
export function normalise(text: string): string {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

/** The group a name belongs to: A to Z, or "#" for a number or a symbol. */
export function letterOf(name: string): string {
  const first = normalise(name.trim()).charAt(0).toUpperCase();
  return first.length === 1 && first >= "A" && first <= "Z" ? first : OTHER;
}

/** The first letters of the first two words, for a brand without a logo: "Cairn Outdoor" is "CO", "Northwind" is "N". */
export function monogram(name: string): string {
  const words = normalise(name)
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean);
  const letters = words.slice(0, 2).map((word) => word.charAt(0).toUpperCase());
  return letters.join("") || "?";
}

/** The id of a group's heading on the page, and the target of its jump link. */
export const groupId = (base: string, letter: string): string => `${base}-${letter === OTHER ? "other" : letter.toLowerCase()}`;
