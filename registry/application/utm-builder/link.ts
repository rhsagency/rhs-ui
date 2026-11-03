/** The five tags a campaign link carries, in the order they are written. */
export const UTM_FIELDS = ["source", "medium", "campaign", "term", "content"] as const;

export type UtmField = (typeof UTM_FIELDS)[number];

/** What the builder holds: the page and the tags. */
export interface UtmValue {
  /** The page the link points to. */
  url: string;
  source: string;
  medium: string;
  campaign: string;
  term: string;
  content: string;
}

export const EMPTY_UTM: UtmValue = { url: "", source: "", medium: "", campaign: "", term: "", content: "" };

/** The name each tag has in the link. */
export const UTM_PARAM: Readonly<Record<UtmField, string>> = {
  source: "utm_source",
  medium: "utm_medium",
  campaign: "utm_campaign",
  term: "utm_term",
  content: "utm_content",
};

/** What is wrong with the address of the page. */
export type BaseProblem = "empty" | "scheme" | "protocol" | "invalid";

export type BaseResult = { url: URL; problem?: undefined; suggestion?: undefined } | { url?: undefined; problem: BaseProblem; suggestion?: string };

/**
 * Reads the address of the page. It has to be an absolute http or https
 * address. An address that only lacks the scheme (northwind.example/pricing)
 * comes back with the address it probably meant, so it can be fixed in one click.
 */
export function parseBase(raw: string): BaseResult {
  const text = raw.trim();
  if (text === "") return { problem: "empty" };
  // "localhost:3000" and "example.com:8080" look like a scheme and are not one.
  const hasScheme = /^[a-z][a-z\d+.-]*:/i.test(text) && !/^[a-z\d.-]+:\d+(?:[/?#]|$)/i.test(text);
  if (!hasScheme) {
    try {
      const guess = new URL(`https://${text}`);
      if (guess.hostname.includes(".") || guess.hostname === "localhost") return { problem: "scheme", suggestion: guess.href === `https://${text}/` ? `https://${text}` : guess.href };
    } catch {
      // Not a web address, whatever is put in front of it.
    }
    return { problem: "invalid" };
  }
  let url: URL;
  try {
    url = new URL(text);
  } catch {
    return { problem: "invalid" };
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return { problem: "protocol" };
  return { url };
}

/** A tag in the form reports like: lower case, with hyphens where the spaces were. */
export function tidy(value: string): string {
  return value.trim().replace(/\s+/g, "-").toLowerCase();
}

/** What is wrong with the way a tag is written, if anything, and what it would be fixed to. */
export function writingOf(value: string): { kind: "case" | "space"; fixed: string } | null {
  if (value.trim() === "") return null;
  const fixed = tidy(value);
  if (fixed === value) return null;
  return { kind: value !== value.toLowerCase() ? "case" : "space", fixed };
}

export interface LinkResult {
  /** The finished link, or null while something is missing. */
  link: string | null;
  /** The tags that are still empty, among those that must have a value. */
  missing: UtmField[];
  /** What is wrong with the address, if anything. */
  problem: BaseProblem | null;
  /** The address the person probably meant, when it only lacked https://. */
  suggestion: string | undefined;
  /** The tags the link carries, as they are written in it: the name and the encoded value. */
  tags: { key: string; value: string }[];
  /** The tags that were already in the address and have been replaced. */
  replaced: string[];
}

/**
 * Builds the link: the page, with its own parameters and its #fragment kept,
 * and the tags added in a fixed order and encoded with encodeURIComponent (a
 * space is %20, an ampersand %26). A tag that is already in the address is
 * replaced, not doubled.
 */
export function buildLink(value: UtmValue, requireTerm: boolean): LinkResult {
  const base = parseBase(value.url);
  const required: UtmField[] = requireTerm ? ["source", "medium", "campaign", "term"] : ["source", "medium", "campaign"];
  const missing = required.filter((field) => value[field].trim() === "");
  if (!base.url || missing.length > 0) return { link: null, missing, problem: base.problem ?? null, suggestion: base.suggestion, tags: [], replaced: [] };

  const managed = new Set(Object.values(UTM_PARAM));
  const replaced: string[] = [];
  const kept = base.url.search
    .replace(/^\?/, "")
    .split("&")
    .filter((pair) => {
      if (pair === "") return false;
      const key = (pair.split("=")[0] ?? "").toLowerCase();
      if (managed.has(key)) {
        if (!replaced.includes(key)) replaced.push(key);
        return false;
      }
      return true;
    });
  const tags = UTM_FIELDS.filter((field) => value[field].trim() !== "").map((field) => ({ key: UTM_PARAM[field], value: encodeURIComponent(value[field].trim()) }));
  const url = new URL(base.url.href);
  url.search = [...kept, ...tags.map((tag) => `${tag.key}=${tag.value}`)].join("&");
  return { link: url.href, missing: [], problem: null, suggestion: undefined, tags, replaced };
}
