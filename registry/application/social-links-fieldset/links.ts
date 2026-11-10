/** One network a person can add a link to. Named in text: no logos. */
export interface SocialNetwork {
  /** Identifies the network. It is the key of its handle in the value, and the name of its field. Not "website", which is the website field's. */
  id: string;
  /** What the field is called: "GitHub". */
  label: string;
  /** The fixed part of the address, shown before the input so people type only the handle: "github.com/", "linkedin.com/in/". A pasted link is recognised by it. */
  prefix: string;
  /** What a handle may look like, as a RegExp or the source of one (from a Server Component only the source can be passed). Default letters, numbers, dots, dashes and underscores. */
  pattern?: RegExp | string;
  /** What to say when the handle does not match, in words: "Handles use letters, numbers and dashes." Write one whenever you set a `pattern`. */
  message?: string;
  /** What the empty input shows: "your-handle". */
  placeholder?: string;
  /** The link is required. Every network is optional, and says so, unless it is. */
  required?: boolean;
}

/** The handles, by network id, and the website as a full address under "website". An empty string is nothing. */
export type SocialLinks = Record<string, string>;

/** What is wrong with a link: a required one is empty, or what is there is not a link of that network (or not a web address). */
export type SocialProblem = "missing" | "invalid";

const DEFAULT_PATTERN = /^[A-Za-z0-9._-]+$/;

const withoutScheme = (text: string) => text.replace(/^[a-z][a-z\d+.-]*:\/\//i, "").replace(/^www\./i, "");

/** A pasted link, a leading @ or stray spaces, cut down to the handle. Anything else is left for the pattern to judge. */
export function toHandle(raw: string, prefix: string): string {
  let handle = raw.trim();
  const base = withoutScheme(prefix).toLowerCase();
  const bare = withoutScheme(handle);
  // Only a link to this network is cut: the handle is the first part of the path, without a query, a fragment or the rest of the path.
  if (base && bare.toLowerCase().startsWith(base)) handle = bare.slice(base.length).split(/[/?#]/)[0] ?? "";
  return handle.replace(/^@+/, "").replace(/\/+$/, "");
}

function patternOf(network: SocialNetwork): RegExp {
  const { pattern } = network;
  if (!pattern) return DEFAULT_PATTERN;
  // A flag that remembers where it stopped would make the same handle pass and then fail.
  return typeof pattern === "string" ? new RegExp(pattern) : new RegExp(pattern.source, pattern.flags.replace(/[gy]/g, ""));
}

/** What is wrong with a handle (as `toHandle` returns it), or nothing. An empty one is only wrong when the network is required. */
export function checkHandle(network: SocialNetwork, handle: string): SocialProblem | undefined {
  if (handle === "") return network.required ? "missing" : undefined;
  return patternOf(network).test(handle) ? undefined : "invalid";
}

/**
 * The address with https:// in front when it has no scheme, and whether it is a web address at all: http or https, and a
 * host with a dot and a top-level domain. `value` is only an address to use when `valid` is true.
 */
export function toWebsite(raw: string): { value: string; valid: boolean } {
  const text = raw.trim();
  if (!text) return { value: "", valid: true };
  const address = /^[a-z][a-z\d+.-]*:\/\//i.test(text) ? text : `https://${text}`;
  try {
    const url = new URL(address);
    const valid = (url.protocol === "https:" || url.protocol === "http:") && /\.[a-z0-9-]{2,}$/i.test(url.hostname) && !/\s/.test(text);
    return { value: address, valid };
  } catch {
    return { value: text, valid: false };
  }
}

/**
 * What the fieldset lets out, for a server to do the same to what was posted: each handle cut down and checked, the
 * website given its https:// and checked, and an empty string for every link that failed. `problems` says which did and why,
 * by network id (or "website"). Never trust the browser: run this where the links are saved.
 */
export function cleanSocialLinks(
  networks: readonly SocialNetwork[],
  input: Readonly<Record<string, string | undefined>>,
  options: { website?: boolean } = {},
): { links: SocialLinks; problems: Record<string, SocialProblem> } {
  const links: SocialLinks = {};
  const problems: Record<string, SocialProblem> = {};
  if (options.website ?? true) {
    const website = toWebsite(input.website ?? "");
    links.website = website.valid ? website.value : "";
    if (!website.valid) problems.website = "invalid";
  }
  for (const network of networks) {
    const handle = toHandle(input[network.id] ?? "", network.prefix);
    const problem = checkHandle(network, handle);
    links[network.id] = problem ? "" : handle;
    if (problem) problems[network.id] = problem;
  }
  return { links, problems };
}
