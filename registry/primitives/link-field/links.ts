/** The kinds of destination a link can have. */
export type LinkKind = "external" | "relative" | "anchor" | "email" | "phone";

export const ALL_KINDS: readonly LinkKind[] = ["external", "relative", "anchor", "email", "phone"];

/** A link as a page builder stores it. */
export interface LinkValue {
  /** What the link says. */
  text: string;
  /** Where it goes: "https://northwind.example/pricing", "/pricing", "#faq", "mailto:ines@orbit.example", "tel:+31205550142". Empty while there is no destination, and while the destination is not one the field accepts. */
  href: string;
  /** Open it in a new tab. Only an external link, or a path on this site, can. */
  newTab: boolean;
  /** "noopener noreferrer" for an external link that opens in a new tab, so the page it opens cannot reach back into yours. Set by the field when it reports. */
  rel?: string;
}

/** The words the field says, in its labels, messages and to a screen reader. Each can be replaced, for another language or your own voice. */
export interface LinkLabels {
  text: string;
  textPlaceholder: string;
  destination: string;
  destinationPlaceholder: string;
  newTab: string;
  /** Under the checkbox while the kind of link cannot open in a new tab. */
  newTabUnavailable: string;
  preview: string;
  /** In the preview while the link has no text. */
  previewEmpty: string;
  /** Under the destination while it is empty. `examples` is a list of what fits: "/pricing, #faq or ines@orbit.example". */
  hint: (examples: string) => string;
  /** What the field recognised, in words. The detail is the host, the path, the anchor, the address or the number. */
  kind: Record<LinkKind, (detail: string) => string>;
  /** Added to the line when a bare domain got https:// in front. */
  addedHttps: string;
  /** What the kinds are called when one is not allowed: "Email links". */
  kindNames: Record<LinkKind, string>;
  /** The destination is a kind that `allow` leaves out. */
  notAllowed: (kind: string) => string;
  /** The destination is nothing the field knows. */
  notALink: string;
  /** The destination is a kind of link that is never accepted (javascript:, data:, file:). */
  unsupported: string;
  /** A path that begins with two slashes, or a slash and a backslash, would leave the site. */
  badPath: string;
  /** The link has no text, and text is required. */
  needsText: string;
}

export const DEFAULT_LABELS: LinkLabels = {
  text: "Link text",
  textPlaceholder: "Book a demo",
  destination: "Destination",
  destinationPlaceholder: "https://, /path or #anchor",
  newTab: "Open in a new tab",
  newTabUnavailable: "Not used for this kind of link.",
  preview: "Preview",
  previewEmpty: "Link text",
  hint: (examples) => `Try ${examples}.`,
  kind: {
    external: (host) => `Link to another website: ${host}`,
    relative: (path) => `Page on this site: ${path}`,
    anchor: (id) => `Section on this page: ${id}`,
    email: (address) => `Starts an email to ${address}`,
    phone: (number) => `Starts a call to ${number}`,
  },
  addedHttps: "We added https:// for you.",
  kindNames: { external: "Web addresses", relative: "Paths on this site", anchor: "Anchors", email: "Email links", phone: "Phone links" },
  notAllowed: (kind) => `${kind} are not allowed here.`,
  notALink: "That is not a link yet. Try a web address, a path like /pricing or an anchor like #faq.",
  unsupported: "That kind of link is not supported. Use a web address, a path, an anchor, an email or a phone number.",
  badPath: "A path starts with a single slash, like /pricing. A second slash or a backslash would leave the site.",
  needsText: "Add the text people will see.",
};

/** What a typed destination turned out to be. */
export type LinkAnalysis =
  | { state: "empty" }
  | {
      state: "ok";
      kind: LinkKind;
      /** The destination as it is stored: https:// added, mailto: and tel: in front. */
      href: string;
      /** The host, the path, the anchor, the address or the number, for the words that say what it is. */
      detail: string;
      /** The field changed what was typed to get href (a bare domain got https://). */
      added: boolean;
    }
  | { state: "bad"; reason: "notALink" | "unsupported" | "path" | "notAllowed"; kind?: LinkKind };

const EMAIL = /^[^\s@<>()]+@[^\s@<>()]+\.[^\s@<>().\d]{2,}$/;
const DOMAIN = /^(?:www\.)?[^\s/?#@:]+\.[a-z]{2,}(?::\d+)?(?:[/?#]\S*)?$/i;

/** The digits of a phone number with a leading plus kept: "+31 (20) 555 0142" is "+31205550142". */
function dialable(text: string): string {
  return (text.trim().startsWith("+") ? "+" : "") + text.replace(/\D/g, "");
}

function external(href: string): { state: "ok"; kind: "external"; href: string; detail: string; added: boolean } | null {
  try {
    const url = new URL(href);
    const protocol = url.protocol === "https:" || url.protocol === "http:";
    if (!protocol || !(url.hostname.includes(".") || url.hostname === "localhost")) return null;
    return { state: "ok", kind: "external", href, detail: url.hostname.replace(/^www\./, ""), added: false };
  } catch {
    return null;
  }
}

/** What a destination is, written the way an editor would type it. Recognises https and http addresses, paths, anchors, mailto: and tel: links, and the bare forms of them (northwind.example/pricing, ines@orbit.example, +31 20 555 0142). */
export function analyseLink(raw: string, allow: readonly LinkKind[] = ALL_KINDS): LinkAnalysis {
  const text = raw.trim();
  if (!text) return { state: "empty" };
  const permitted = (found: LinkAnalysis): LinkAnalysis => (found.state === "ok" && !allow.includes(found.kind) ? { state: "bad", reason: "notAllowed", kind: found.kind } : found);
  const unknown: LinkAnalysis = { state: "bad", reason: "notALink" };

  if (text.startsWith("#")) return permitted(/^#[A-Za-z][\w:.-]*$/.test(text) ? { state: "ok", kind: "anchor", href: text, detail: text, added: false } : unknown);
  // A browser reads a backslash as a slash, so "/\evil.example" leaves the site exactly as "//evil.example" does.
  if (/^\/[/\\]/.test(text)) return { state: "bad", reason: "path", kind: "relative" };
  if (text.startsWith("/")) return permitted(/[\s\\]/.test(text) ? unknown : { state: "ok", kind: "relative", href: text, detail: text.split(/[?#]/)[0] || "/", added: false });

  const scheme = /^([a-z][a-z0-9+.-]*):/i.exec(text)?.[1]?.toLowerCase();
  if (scheme === "mailto") {
    const address = text.slice(7).split("?")[0] ?? "";
    return permitted(EMAIL.test(address) ? { state: "ok", kind: "email", href: `mailto:${text.slice(7)}`, detail: address, added: false } : unknown);
  }
  if (scheme === "tel") {
    const number = dialable(text.slice(4));
    return permitted(number.replace("+", "").length >= 6 && number.replace("+", "").length <= 15 ? { state: "ok", kind: "phone", href: `tel:${number}`, detail: number, added: false } : unknown);
  }
  if (scheme === "http" || scheme === "https") {
    const found = external(text.replace(/^(https?):/i, (_, name: string) => `${name.toLowerCase()}:`));
    return permitted(found ?? unknown);
  }
  // A scheme with something after it that is not a port ("javascript:alert(1)", "data:text/html", "file:///") is never accepted.
  if (scheme && !/^[a-z0-9.-]+:\d+(?:[/?#]|$)/i.test(text)) return { state: "bad", reason: "unsupported" };

  if (EMAIL.test(text)) return permitted({ state: "ok", kind: "email", href: `mailto:${text}`, detail: text, added: true });
  if (/^\+?[\d\s().-]+$/.test(text) && text.replace(/\D/g, "").length >= 6 && text.replace(/\D/g, "").length <= 15) {
    const number = dialable(text);
    return permitted({ state: "ok", kind: "phone", href: `tel:${number}`, detail: number, added: true });
  }
  if (DOMAIN.test(text)) {
    const found = external(`https://${text}`);
    return permitted(found ? { ...found, added: true } : unknown);
  }
  return unknown;
}

/** Whether a link opens in a new tab at all: a path or an address does, an anchor, an email and a phone call do not. */
export const canOpenInNewTab = (kind: LinkKind | null): boolean => kind === "external" || kind === "relative";

/** The kinds as a short list of examples for the hint under an empty destination: "https://northwind.example, /pricing or #faq". */
export function examplesFor(allow: readonly LinkKind[]): string {
  const examples: Record<LinkKind, string> = { external: "northwind.example", relative: "/pricing", anchor: "#faq", email: "ines@orbit.example", phone: "+31 20 555 0142" };
  const shown = ALL_KINDS.filter((kind) => allow.includes(kind)).map((kind) => examples[kind]);
  return shown.length < 2 ? (shown[0] ?? "") : `${shown.slice(0, -1).join(", ")} or ${shown[shown.length - 1]}`;
}
