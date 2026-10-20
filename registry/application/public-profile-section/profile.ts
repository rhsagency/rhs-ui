export interface ProfileLink {
  /** A stable id for the row. New rows get one from the section. */
  id: string;
  /** What the link is called: "Portfolio". Falls back to the address when left empty. */
  label: string;
  /** Where it goes. A bare "northwind.studio" is read as https://northwind.studio. */
  url: string;
}

export interface PublicProfile {
  /** URL of the picture, or null when there is none and initials are shown instead. */
  avatar: string | null;
  displayName: string;
  /** Without the "@". */
  username: string;
  bio: string;
  links: readonly ProfileLink[];
}

/** The rule shown under the username field, always, so nobody learns it from an error after submitting. */
export const USERNAME_RULE = "3 to 20 characters: letters, numbers and underscores.";

const USERNAME_SHAPE = /^[A-Za-z0-9_]+$/;

/** Why a username cannot be used, in a few words, or null when it follows the rules. */
export function usernameProblem(username: string): string | null {
  if (!username) return "Choose a username";
  if (username.length < 3) return "Use at least 3 characters";
  if (username.length > 20) return "Use 20 characters or fewer";
  if (!USERNAME_SHAPE.test(username)) return "Use letters, numbers and underscores only";
  return null;
}

/** "northwind.studio/work" becomes "https://northwind.studio/work"; null when it is not a web address. */
export function normalizeUrl(raw: string): string | null {
  const text = raw.trim();
  if (!text || /\s/.test(text)) return null;
  const candidate = /^[a-z][a-z0-9+.-]*:\/\//i.test(text) ? text : `https://${text}`;
  try {
    const url = new URL(candidate);
    if ((url.protocol !== "https:" && url.protocol !== "http:") || !url.hostname.includes(".") || url.hostname.endsWith(".")) return null;
    return candidate;
  } catch {
    return null;
  }
}

/** The address as people read it: no scheme, no www, no trailing slash. */
export function displayUrl(url: string): string {
  return url.replace(/^[a-z][a-z0-9+.-]*:\/\//i, "").replace(/^www\./i, "").replace(/\/$/, "");
}
