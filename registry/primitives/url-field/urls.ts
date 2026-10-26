export type UrlProtocol = "https://" | "http://";

/** The protocols the menu offers, safest first. */
export const URL_PROTOCOLS: readonly UrlProtocol[] = ["https://", "http://"];

export interface UrlRules {
  /** Refuse http:// and say why. */
  requireHttps: boolean;
  /** Allow a path, query or fragment after the domain. When false the field takes a bare domain only. */
  allowPath: boolean;
  /** The protocols that count as a protocol, rather than as something typed by mistake. */
  protocols: readonly UrlProtocol[];
}

/** A host name as the browser writes it (letters, digits and hyphens in dot-separated labels, an ending of at least two characters) or an IPv4 address. */
const HOST = /^(?:[a-z\d](?:[a-z\d-]{0,61}[a-z\d])?\.)+[a-z][a-z\d-]{0,61}[a-z\d]$|^(?:\d{1,3}\.){3}\d{1,3}$/i;
const IPV4 = /^(?:\d{1,3}\.){3}\d{1,3}$/;
/** The ending of a domain: letters (com), or an internationalised ending as the browser writes it, with an xn-- in front (xn--p1ai). */
const ENDING = /^(?:[a-z]+|xn--[a-z\d-]+)$/i;

/**
 * Takes a protocol off the front of typed or pasted text. `protocol` is the
 * one it starts with, when the menu offers it; `foreign` is any other scheme
 * (ftp://, file://) so it can be explained instead of swallowed.
 */
export function splitScheme(text: string, protocols: readonly UrlProtocol[] = URL_PROTOCOLS): { protocol: UrlProtocol | null; rest: string; foreign: string | null } {
  const match = /^\s*([a-z][a-z\d+.-]*):\/\/(.*)$/i.exec(text);
  if (!match) return { protocol: null, rest: text, foreign: null };
  const scheme = `${(match[1] ?? "").toLowerCase()}://`;
  const known = protocols.find((protocol) => protocol === scheme);
  return known ? { protocol: known, rest: match[2] ?? "", foreign: null } : { protocol: null, rest: text, foreign: scheme };
}

/** The one URL the field reports: the protocol, the host in lower case and the rest as typed, or an empty string while nothing is typed. */
export function buildUrl(protocol: UrlProtocol, rest: string): string {
  const text = rest.trim();
  if (!text) return "";
  const end = text.search(/[/?#]/);
  const host = end === -1 ? text : text.slice(0, end);
  const tail = end === -1 ? "" : text.slice(end);
  return `${protocol}${host.toLowerCase()}${tail}`;
}

/** What is wrong with an address, in a sentence, or null when it can be used. Nothing typed is not an error here. */
export function explainUrl(protocol: UrlProtocol, rest: string, rules: UrlRules): string | null {
  const text = rest.trim();
  if (!text) return null;
  if (splitScheme(text, rules.protocols).foreign) return `Only ${rules.protocols.join(" and ")} addresses work here.`;
  if (/\s/.test(text)) return "Remove the spaces from the address.";
  if (rules.requireHttps && protocol === "http://") return "Use https:// so the link is secure. Browsers warn visitors before they open a plain http:// page.";
  const end = text.search(/[/?#]/);
  // A path with no domain in front of it ("//northwind.example", "/pricing"): the URL parser would shrug off the extra slashes and call it good.
  if (end === 0) return "Start with the domain, like northwind.example.";
  if ((end === -1 ? text : text.slice(0, end)).includes("@")) return "Leave out the username and password.";
  let host: string;
  try {
    host = new URL(`${protocol}${text}`).hostname;
  } catch {
    return "That does not look like a web address.";
  }
  if (!host.includes(".")) return "The address needs a dot, like northwind.example.";
  // Dots and hyphens are allowed, just not in those places: "letters, numbers, dots and hyphens" would be no help to someone who typed a trailing dot.
  if (/^\.|\.$|\.\./.test(host)) return "A domain cannot start or end with a dot, or hold two in a row.";
  if (host.split(".").some((label) => label.startsWith("-") || label.endsWith("-"))) return "A part of the domain cannot start or end with a hyphen.";
  // The ending is what the browser would take for a top-level domain: .com, never .e or .c0m. An IP address has no ending to check.
  if (!IPV4.test(host)) {
    const ending = host.slice(host.lastIndexOf(".") + 1);
    if (ending.length < 2) return "The ending needs at least two letters, like .com.";
    if (!ENDING.test(ending)) return "The ending can only hold letters, like .com.";
  }
  if (!HOST.test(host)) return "Use only letters, numbers, dots and hyphens in the domain.";
  const tail = end === -1 ? "" : text.slice(end);
  if (!rules.allowPath && tail !== "" && tail !== "/") return "Enter just the domain, without a path.";
  return null;
}
