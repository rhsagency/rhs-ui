/** A webmail inbox the verification card can offer as a shortcut. */
export interface MailLink {
  /** A stable identity, such as "gmail". */
  id: string;
  /** What the button says: "Open Gmail". */
  label: string;
  /** Where the inbox lives. It opens in a new tab. */
  href: string;
  /** The domains whose addresses are read there, in lower case: `["gmail.com", "googlemail.com"]`. */
  domains: readonly string[];
}

/**
 * Gmail, Outlook and Yahoo Mail, with the domains that belong to each. Spread
 * it into your own list to add a provider:
 * `[...DEFAULT_MAIL_LINKS, { id: "fastmail", label: "Open Fastmail", href: "https://app.fastmail.com", domains: ["fastmail.com"] }]`.
 */
export const DEFAULT_MAIL_LINKS: readonly MailLink[] = [
  { id: "gmail", label: "Open Gmail", href: "https://mail.google.com/", domains: ["gmail.com", "googlemail.com"] },
  { id: "outlook", label: "Open Outlook", href: "https://outlook.live.com/mail/", domains: ["outlook.com", "hotmail.com", "hotmail.co.uk", "live.com", "msn.com"] },
  { id: "yahoo", label: "Open Yahoo Mail", href: "https://mail.yahoo.com/", domains: ["yahoo.com", "yahoo.co.uk", "ymail.com", "rocketmail.com"] },
];

/**
 * The links whose domains include the domain of `email`. An address that is
 * not one, or one at a company the list does not know, gets none: a shortcut
 * that might lead to the wrong inbox is worse than no shortcut.
 */
export function mailLinksFor(email: string, links: readonly MailLink[] = DEFAULT_MAIL_LINKS): MailLink[] {
  const at = email.lastIndexOf("@");
  if (at < 1) return [];
  const domain = email.slice(at + 1).trim().toLowerCase();
  return links.filter((link) => link.domains.some((candidate) => candidate.toLowerCase() === domain));
}
