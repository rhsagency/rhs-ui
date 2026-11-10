/**
 * What the external link dialog needs to know about an address: where it really goes, and whether anything about it is
 * built to mislead. Plain functions with no state and no hook, so a Server Component can use them too.
 */

/** The words the dialog says, for translation. Each has a default in English. */
export interface ExternalLinkLabels {
  /** The question the dialog asks. Default "Leave this site?" */
  title?: string;
  /** The line under it. Default "This link goes to another website. Check where it leads before you continue." */
  description?: string;
  /** The small heading over the address. Default "Destination". */
  destination?: string;
  /** The heading of the warning for an address with letters that are not plain ASCII. Default "This address uses look-alike characters". */
  lookalikeTitle?: string;
  /** What that warning says. It ends the sentence the real host follows, on a line of its own. */
  lookalikeBody?: string;
  /** The heading of the warning for an address with a name in front of the host. Default "This address hides where it goes". */
  credentialsTitle?: string;
  /** What that warning says. It ends the sentence the site the link really goes to follows, on a line of its own. */
  credentialsBody?: string;
  /** A quiet note under an address that does not use https. Default "This site does not use a secure connection." */
  insecure?: string;
  /** The heading when the address is not a web address at all. Default "This link cannot be opened" */
  invalidTitle?: string;
  /** What that says. Default "It is not a web address, so there is nothing safe to open." */
  invalidBody?: string;
  /** The checkbox, shown when you pass `onTrust`. Default "Don't ask again for this site". */
  trust?: string;
  /** The safe answer, which has focus. Default "Go back". */
  cancel?: string;
  /** The other answer, which opens the link in a new tab. Default "Continue". */
  continue?: string;
  /** Said to screen readers after "Continue": the link opens in a new tab. Default "(opens in a new tab)". */
  newTab?: string;
}

export const DEFAULT_LABELS = {
  title: "Leave this site?",
  description: "This link goes to another website. Check where it leads before you continue.",
  destination: "Destination",
  lookalikeTitle: "This address uses look-alike characters",
  lookalikeBody: "Some letters are not the ones they appear to be, a common way to imitate a site you trust. The browser will really go to:",
  credentialsTitle: "This address hides where it goes",
  credentialsBody: "The part before the @ is a user name, not the site. The link really goes to:",
  insecure: "This site does not use a secure connection.",
  invalidTitle: "This link cannot be opened",
  invalidBody: "It is not a web address, so there is nothing safe to open.",
  trust: "Don't ask again for this site",
  cancel: "Go back",
  continue: "Continue",
  newTab: "(opens in a new tab)",
} satisfies Required<ExternalLinkLabels>;

export interface LinkInfo {
  /** The address as the browser asks for it: the host in its ASCII form, the path and query as they are sent. */
  href: string;
  /** The host as the browser asks for it, lower case and without a port. A look-alike host shows up here as `xn--` labels. */
  host: string;
  /** The host as it was written, which can hold letters that are not ASCII. */
  written: string;
  /** The port, with its colon, when the address names one: ":8443". */
  port: string;
  /** Everything after the host: the path, the query and the fragment. Empty for a bare host. */
  rest: string;
  /** Whether the address uses https. */
  secure: boolean;
  /** The host holds letters that are not plain ASCII, so it can imitate another site. */
  lookalike: boolean;
  /** The address has a user name in front of the host (`https://shop.example@other.example`), which hides where it goes. */
  hasCredentials: boolean;
  /** What stands in front of the host as it was written, with its @: "shop.example@". Empty when there is nothing. */
  credentials: string;
}

/** What stands between `://` and the next slash as it was typed: a user name and an @ if there are any, the host, and the port. */
function authorityOf(raw: string): string {
  return /^[a-z][a-z\d+.-]*:[/\\]{2}([^/\\?#]*)/i.exec(raw)?.[1] ?? "";
}

/** The host out of an authority, as it was typed, with the user name and the port taken off. */
function writtenHost(authority: string): string {
  const hostPort = authority.slice(authority.lastIndexOf("@") + 1);
  const bracketed = /^\[[^\]]*\]/.exec(hostPort);
  return (bracketed ? bracketed[0] : hostPort.replace(/:\d*$/, "")).toLowerCase();
}

/**
 * Reads an address the way a browser does and reports what is worth showing: the real host, the host as written, and
 * whether it is built to mislead (non-ASCII letters, a user name in front of the host). Returns null for anything that is
 * not an http or https address, so a `javascript:` or `data:` link never gets a Continue button.
 */
export function analyseLink(input: string): LinkInfo | null {
  const raw = input.trim();
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  const host = url.hostname.toLowerCase();
  const authority = authorityOf(raw);
  const written = writtenHost(authority) || host;
  const lookalike = /[^\u0000-\u007f]/.test(written) || host.split(".").some((label) => label.startsWith("xn--"));
  const at = authority.lastIndexOf("@");
  return {
    href: url.href,
    host,
    written,
    port: url.port ? `:${url.port}` : "",
    rest: `${url.pathname === "/" ? "" : url.pathname}${url.search}${url.hash}`,
    secure: url.protocol === "https:",
    lookalike,
    hasCredentials: url.username !== "" || url.password !== "",
    credentials: at >= 0 ? authority.slice(0, at + 1) : "",
  };
}

/**
 * Whether a host is on the list that skips the dialog. An entry is a host (`docs.northwind.dev`) that has to match
 * exactly, or `*.northwind.dev` for every subdomain of it (not the bare domain: list that as well if you want it).
 */
export function isTrusted(host: string, trusted: readonly string[]): boolean {
  const name = host.toLowerCase();
  return trusted.some((entry) => {
    const pattern = entry.trim().toLowerCase();
    if (!pattern) return false;
    return pattern.startsWith("*.") ? name.endsWith(pattern.slice(1)) : name === pattern;
  });
}

/** An address that runs code or carries data instead of leading somewhere. Such a link is stopped, never asked about. */
export function isScriptLink(raw: string): boolean {
  return /^[\s\u0000-\u001f]*(javascript|data|vbscript):/i.test(raw);
}
