/*
 * The pure half of the save-contact button: one contact object in, the text of
 * a vCard 3.0 file (RFC 2426) out. Nothing here touches the page or the clock
 * (the revision stamp takes `now` as an option), so buildVCard can be tested
 * with plain inputs, or its text turned into a QR code. The button in index.tsx
 * only decides what to show.
 */

export type PhoneType = "work" | "mobile" | "home" | "fax" | "other";
export type EmailType = "work" | "home" | "other";
export type AddressType = "work" | "home" | "other";

export interface ContactPhone {
  value: string;
  /** Labels the number in the address book. Default "other". */
  type?: PhoneType;
}

export interface ContactEmail {
  value: string;
  /** Labels the address in the address book. Default "other". */
  type?: EmailType;
}

export interface ContactAddress {
  street?: string;
  city?: string;
  region?: string;
  postalCode?: string;
  country?: string;
  /** Labels the address in the address book. Default "work". */
  type?: AddressType;
}

export interface Contact {
  /** The full name as it is shown: "Maya Okafor". */
  name: string;
  /** Set both parts when the name does not split the usual way ("Jan van der Berg" is handled; others may not be). */
  givenName?: string;
  familyName?: string;
  /** The company or organisation. */
  organisation?: string;
  /** Their job title. */
  title?: string;
  /** Numbers as plain text, or with a type: `"+31 20 555 0142"` or `{ value, type: "mobile" }`. */
  phones?: readonly (string | ContactPhone)[];
  /** Addresses as plain text, or with a type. */
  emails?: readonly (string | ContactEmail)[];
  /** A website. */
  url?: string;
  /** A postal address, as one line of text or in parts. */
  address?: string | ContactAddress;
  /** Anything worth remembering: where you met. */
  note?: string;
  /** A picture. A data:image/jpeg or png URI is embedded in the file; an https address is linked. */
  photoUrl?: string;
}

export interface VCardOptions {
  /** The moment written into REV. Default: now. Pass a fixed date to get the same text every time. */
  now?: Date;
}

const PHONE_TYPES: Record<PhoneType, string> = { work: "WORK,VOICE", mobile: "CELL,VOICE", home: "HOME,VOICE", fax: "WORK,FAX", other: "VOICE" };
const EMAIL_TYPES: Record<EmailType, string> = { work: "INTERNET,WORK", home: "INTERNET,HOME", other: "INTERNET" };
const ADDRESS_TYPES: Record<AddressType, string> = { work: "WORK", home: "HOME", other: "POSTAL" };

// Words that belong to the family name when they stand in front of it: "van der Berg", "de la Cruz".
const PARTICLES = new Set(["van", "von", "de", "der", "den", "di", "da", "du", "la", "le", "el", "al", "bin", "ibn", "ten", "ter", "op", "het", "'t", "del", "della", "dos", "das", "do"]);

/** Escapes a text value: backslash, comma and semicolon get a backslash, a line break becomes \n (RFC 2426, 5). */
export function escapeVCardText(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r\n|\r|\n/g, "\\n");
}

/** "Ada Lovelace" becomes Ada and Lovelace; "Jan van der Berg" becomes Jan and "van der Berg". */
export function splitName(name: string): { given: string; family: string } {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length < 2) return { given: words[0] ?? "", family: "" };
  let start = words.length - 1;
  while (start > 1 && PARTICLES.has((words[start - 1] ?? "").toLowerCase())) start -= 1;
  return { given: words.slice(0, start).join(" "), family: words.slice(start).join(" ") };
}

const encoder = new TextEncoder();

/**
 * Folds a content line so no physical line is longer than 75 octets (RFC 2426,
 * 2.6). Every continuation starts with one space, which counts toward the
 * limit, and a character is never cut in the middle of its UTF-8 bytes.
 */
export function foldLine(line: string): string {
  if (encoder.encode(line).length <= 75) return line;
  const rows: string[] = [];
  let row = "";
  let size = 0;
  for (const char of line) {
    const width = encoder.encode(char).length;
    if (size + width > 75) {
      rows.push(row);
      row = "";
      size = 1;
    }
    row += char;
    size += width;
  }
  rows.push(row);
  return rows.join("\r\n ");
}

/** The PHOTO line for a picture, or nothing when it cannot be used in a card. */
function photoLine(photoUrl: string | undefined): string | null {
  const url = photoUrl?.trim();
  if (!url) return null;
  const inline = /^data:image\/(jpeg|jpg|png|gif);base64,([A-Za-z0-9+/=\s]+)$/i.exec(url);
  if (inline) {
    const kind = (inline[1] ?? "jpeg").toLowerCase();
    return `PHOTO;ENCODING=b;TYPE=${kind === "jpg" ? "JPEG" : kind.toUpperCase()}:${(inline[2] ?? "").replace(/\s+/g, "")}`;
  }
  return /^https?:\/\/[^\s]+$/i.test(url) ? `PHOTO;VALUE=uri:${url}` : null;
}

function addressLine(address: string | ContactAddress): string | null {
  if (typeof address === "string") return address.trim() ? `ADR;TYPE=${ADDRESS_TYPES.work}:;;${escapeVCardText(address.trim())};;;;` : null;
  const parts = [address.street, address.city, address.region, address.postalCode, address.country].map((part) => escapeVCardText(part?.trim() ?? ""));
  if (parts.every((part) => !part)) return null;
  const [street, city, region, postalCode, country] = parts;
  return `ADR;TYPE=${ADDRESS_TYPES[address.type ?? "work"]}:;;${street};${city};${region};${postalCode};${country}`;
}

/**
 * The text of a .vcf file (vCard 3.0) for one contact: CRLF line ends, escaped
 * text, lines folded at 75 octets, labelled phone, email and address types and
 * the name split into family and given parts. Phones and emails with no value
 * are left out. Returns null when the contact has no name.
 */
export function buildVCard(contact: Contact, options: VCardOptions = {}): string | null {
  const name = contact.name?.trim();
  if (!name) return null;
  const split = contact.givenName !== undefined || contact.familyName !== undefined ? { given: contact.givenName?.trim() ?? "", family: contact.familyName?.trim() ?? "" } : splitName(name);
  const lines: (string | null)[] = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    "PRODID:-//RHS UI//Save contact//EN",
    `FN:${escapeVCardText(name)}`,
    `N:${escapeVCardText(split.family)};${escapeVCardText(split.given)};;;`,
    contact.organisation?.trim() ? `ORG:${escapeVCardText(contact.organisation.trim())}` : null,
    contact.title?.trim() ? `TITLE:${escapeVCardText(contact.title.trim())}` : null,
  ];
  for (const phone of contact.phones ?? []) {
    const entry = typeof phone === "string" ? { value: phone, type: "other" as const } : { value: phone.value, type: phone.type ?? "other" };
    if (entry.value.trim()) lines.push(`TEL;TYPE=${PHONE_TYPES[entry.type]}:${escapeVCardText(entry.value.trim())}`);
  }
  for (const email of contact.emails ?? []) {
    const entry = typeof email === "string" ? { value: email, type: "other" as const } : { value: email.value, type: email.type ?? "other" };
    if (entry.value.trim()) lines.push(`EMAIL;TYPE=${EMAIL_TYPES[entry.type]}:${escapeVCardText(entry.value.trim())}`);
  }
  if (contact.url?.trim()) lines.push(`URL:${contact.url.trim().replace(/[\r\n]+/g, "")}`);
  if (contact.address) lines.push(addressLine(contact.address));
  if (contact.note?.trim()) lines.push(`NOTE:${escapeVCardText(contact.note.trim())}`);
  lines.push(photoLine(contact.photoUrl));
  lines.push(`REV:${(options.now ?? new Date()).toISOString().slice(0, 19)}Z`, "END:VCARD");
  return `${lines.filter((line): line is string => Boolean(line)).map(foldLine).join("\r\n")}\r\n`;
}

/** "Maya Okafor" becomes "maya-okafor.vcf". A name you give is kept, with .vcf added when it is missing. */
export function vCardFileName(contact: Contact, fileName?: string): string {
  const own = fileName?.trim();
  if (own) return /\.vcf$/i.test(own) ? own : `${own}.vcf`;
  const slug = (contact.name ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return `${slug || "contact"}.vcf`;
}

/** Hands text to the browser as a file download, with no server involved. On an iPhone the file opens the Add Contact sheet. */
export function downloadTextFile(contents: string, fileName: string, type: string): void {
  const url = URL.createObjectURL(new Blob([contents], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.rel = "noopener";
  link.style.display = "none";
  document.body.append(link);
  link.click();
  link.remove();
  // Safari needs the address to stay valid a little after the click.
  window.setTimeout(() => URL.revokeObjectURL(url), 4000);
}
