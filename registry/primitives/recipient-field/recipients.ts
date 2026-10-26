/** One person on the line: an address and, when it is known, their name. */
export interface Recipient {
  /** The address: "ines@orbit.example". */
  email: string;
  /** The name to show instead of the address: "Ines Marchetti". */
  name?: string;
}

/** The words the field says, in its messages and to a screen reader. Each can be replaced, for another language or your own voice. */
export interface RecipientLabels {
  /** The reason on a chip whose address failed the check, when your own check gives none. */
  invalid: string;
  /** The start of the name of the button that removes a chip: "Remove Ines Marchetti". */
  remove: string;
  /** The hint a chip carries for a screen reader. */
  chipHint: string;
  /** The hint the field carries for a screen reader: how to add people and how to reach the ones already there. */
  inputHint: string;
  /** The line under the field when some addresses failed, with what to do about it. `count` is how many, `first` is the first of them, `reason` is why it failed. */
  problems: (count: number, first: string, reason: string) => string;
  /** The name of the list of suggestions. */
  suggestions: string;
  /** Said when suggestions appear. */
  suggestionCount: (count: number) => string;
  /** Said when an address was added. `count` is how many are on the line now. */
  added: (name: string, count: number) => string;
  /** Said when several were added at once, by a paste. */
  addedMany: (added: number, count: number) => string;
  /** Said when a chip was removed. */
  removed: (name: string, count: number) => string;
  /** Said when an address is already on the line. */
  duplicate: (email: string) => string;
  /** Said when the line is full. */
  full: (max: number) => string;
  /** Said when a pasted list did not fit. */
  partlyAdded: (added: number, total: number, max: number) => string;
  /** The name of the whole field when it has no visible label. */
  group: string;
}

const people = (count: number) => `${count} ${count === 1 ? "recipient" : "recipients"}`;

export const DEFAULT_LABELS: RecipientLabels = {
  invalid: "Not a valid address",
  remove: "Remove",
  chipHint: "Press Enter to edit, Delete to remove.",
  inputHint: "Type a name or an address and press Enter, comma or semicolon to add it. Press the left arrow key to reach the people already added.",
  problems: (count, first, reason) => (count === 1 ? `${first}: ${reason}. Click it to fix it.` : `${count} addresses need fixing, starting with ${first}: ${reason}. Click one to fix it.`),
  suggestions: "Suggestions",
  suggestionCount: (count) => `${count} ${count === 1 ? "suggestion" : "suggestions"} available`,
  added: (name, count) => `Added ${name}. ${people(count)}.`,
  addedMany: (added, count) => `Added ${added} addresses. ${people(count)}.`,
  removed: (name, count) => `Removed ${name}. ${people(count)}.`,
  duplicate: (email) => `${email} is already on the line.`,
  full: (max) => `The line is full: at most ${max}.`,
  partlyAdded: (added, total, max) => `Added ${added} of ${total}: the line takes at most ${max}.`,
  group: "Recipients",
};

/** A plain address check: something, an @, a domain with a dot and a last part of two letters or more. No spaces and none of the characters that break a header. */
export function isEmail(value: string): boolean {
  return /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[^\s@<>()[\]\\,;:".\d]{2,}$/.test(value) && !/\.\./.test(value);
}

/**
 * A pasted line split into what it holds: commas, semicolons, tabs and line
 * breaks end an entry, except inside quotes or angle brackets, so
 * "Marchetti, Ines" <ines@orbit.example> stays one.
 */
export function splitRecipients(text: string): string[] {
  const parts: string[] = [];
  let current = "";
  let quoted = false;
  let angled = false;
  for (const char of text) {
    if (char === '"') quoted = !quoted;
    else if (!quoted && char === "<") angled = true;
    else if (!quoted && char === ">") angled = false;
    if (!quoted && !angled && /[,;\t\r\n]/.test(char)) {
      parts.push(current);
      current = "";
    } else current += char;
  }
  parts.push(current);
  return parts.map((part) => part.trim()).filter(Boolean);
}

/** One entry as a recipient. Takes "ines@orbit.example", "<ines@orbit.example>", "Ines <ines@orbit.example>" and "mailto:ines@orbit.example". */
export function parseRecipient(entry: string): Recipient | null {
  const text = entry.trim();
  if (!text) return null;
  const named = /^(?:"([^"]*)"|([^<]*?))\s*<([^>]*)>$/.exec(text);
  if (named) {
    const name = (named[1] ?? named[2] ?? "").trim();
    const email = (named[3] ?? "").trim();
    return email ? (name ? { email, name } : { email }) : null;
  }
  return { email: text.replace(/^mailto:/i, "").trim() };
}

/** What a character counts as when text is compared: without its accents and capitals. */
const foldChar = (char: string) => char.normalize("NFD").replace(/\p{M}+/gu, "").toLowerCase();

/** The text folded, and for every folded character where its original starts and ends, so a match found in the folded text can be marked in the original. */
function foldWithMap(text: string): { folded: string; starts: number[]; ends: number[] } {
  let folded = "";
  const starts: number[] = [];
  const ends: number[] = [];
  let offset = 0;
  for (const char of text) {
    const f = foldChar(char);
    for (let unit = 0; unit < f.length; unit += 1) {
      starts.push(offset);
      ends.push(offset + char.length);
    }
    folded += f;
    offset += char.length;
  }
  return { folded, starts, ends };
}

export const foldText = (text: string) => [...text].map(foldChar).join("");

/** Where an already folded `wanted` sits in a folded text, as [from, to) in the characters of the original, or null. */
function locateFolded(fold: ReturnType<typeof foldWithMap>, wanted: string, length: number): [number, number] | null {
  const at = fold.folded.indexOf(wanted);
  if (at === -1) return null;
  return [fold.starts[at] ?? 0, fold.ends[at + wanted.length - 1] ?? length];
}

/** Where `query` sits in `text`, as [from, to) in the characters of `text`, ignoring capitals and accents, or null. */
export function locate(text: string, query: string): [number, number] | null {
  const wanted = foldText(query.trim());
  return wanted ? locateFolded(foldWithMap(text), wanted, text.length) : null;
}

export interface RankedContact {
  contact: Recipient;
  /** Where the query sits in the name, if it does. */
  inName: [number, number] | null;
  /** Where it sits in the address, if it does. */
  inEmail: [number, number] | null;
}

/**
 * The contacts that fit what was typed, best first: a name or an address that
 * begins with it, then a word of the name that begins with it, then the rest
 * that merely contain it. Capitals and accents are ignored. Contacts already on
 * the line are left out.
 */
export function rankContacts(contacts: readonly Recipient[], query: string, taken: ReadonlySet<string>, limit: number): RankedContact[] {
  const wanted = foldText(query.trim());
  if (!wanted) return [];
  const ranked: (RankedContact & { tier: number; index: number })[] = [];
  contacts.forEach((contact, index) => {
    if (taken.has(contact.email.toLowerCase())) return;
    // Each text is folded once, and the same fold finds the match and marks it.
    const nameFold = foldWithMap(contact.name ?? "");
    const emailFold = foldWithMap(contact.email);
    const inName = locateFolded(nameFold, wanted, (contact.name ?? "").length);
    const inEmail = locateFolded(emailFold, wanted, contact.email.length);
    if (!inName && !inEmail) return;
    const wordStart = nameFold.folded.split(/[\s\-.]+/).some((word) => word.startsWith(wanted));
    const tier = nameFold.folded.startsWith(wanted) || emailFold.folded.startsWith(wanted) ? 0 : wordStart ? 1 : 2;
    ranked.push({ contact, inName, inEmail, tier, index });
  });
  ranked.sort((a, b) => a.tier - b.tier || a.index - b.index);
  return ranked.slice(0, limit).map(({ contact, inName, inEmail }) => ({ contact, inName, inEmail }));
}

/** The text to show for a chip: the name when there is one, else the address. */
export const chipText = (recipient: Recipient): string => recipient.name?.trim() || recipient.email;

/** Up to two letters for the circle in front of a name: "Ines Marchetti" is IM, "ines@orbit.example" is I. */
export function initialsFor(recipient: Recipient): string {
  const source = recipient.name?.trim() || recipient.email.split("@")[0] || "";
  const words = source.split(/[\s._-]+/).filter(Boolean);
  // By code point, not by UTF-16 unit: a name that starts with an emoji or another astral character would otherwise be cut in half.
  const initial = (word: string | undefined) => Array.from(word ?? "")[0] ?? "";
  const first = initial(words[0]);
  const last = words.length > 1 ? initial(words[words.length - 1]) : "";
  return (first + last).toUpperCase();
}
