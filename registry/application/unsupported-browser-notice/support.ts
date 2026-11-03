/**
 * What the unsupported-browser notice asks of the browser: feature checks, the browser's name and
 * version read from its user agent, and the memory of "Continue anyway". No React, and nothing
 * touches the DOM until a function is called, so the module is safe to import anywhere.
 */

/** A check written as data, so it can be passed from a Server Component. */
export type BrowserCheckSpec =
  | {
      /** A CSS declaration or condition the browser must understand, as `CSS.supports` takes it: `"container-type: inline-size"` or `"selector(:has(a))"`. */
      css: string;
    }
  | {
      /** A global the browser must have, as a name or a dotted path: `"IntersectionObserver"` or `"navigator.clipboard"`. */
      api: string;
    };

/** How to tell whether the browser has something: a function that returns `false` (or throws) when it does not, or the same written as data. */
export type BrowserCheck = (() => boolean) | BrowserCheckSpec;

export interface BrowserRequirement {
  /** What the app needs, in plain words. It is listed when the browser lacks it: "CSS container queries". */
  label: string;
  /** The check that tells whether the browser has it. */
  test: BrowserCheck;
}

export interface SupportedBrowser {
  /** The browser's name as people know it: "Chrome", "Microsoft Edge", "Safari". */
  name: string;
  /** The oldest version that works: "111" or "16.4". */
  minVersion: string;
  /** The official page to get that browser or to update it. */
  href: string;
}

/** A browser read from its user agent. */
export interface DetectedBrowser {
  /** "Chrome", "Edge", "Firefox", "Safari", "Opera" or "Samsung Internet". */
  name: string;
  /** The version as people say it: "121" for Chrome, Edge, Firefox and Opera, "15.6" for Safari and Samsung Internet. */
  version: string;
}

/** What the checks found out. */
export interface Assessment {
  /** The labels of the requirements this browser failed, in the order you listed them. */
  missing: string[];
  /** The visitor's browser when it is one of yours and older than the version you gave. */
  outdated: { name: string; version: string; minVersion: string } | null;
  /** The visitor's browser, when it could be read. */
  browser: DetectedBrowser | null;
}

/** Whether `CSS.supports` knows the declaration (`"display: grid"`) or the condition (`"(display: grid) and (gap: 1px)"`, `"selector(:has(a))"`). */
export function supportsCss(rule: string): boolean {
  if (typeof CSS === "undefined" || typeof CSS.supports !== "function") return false;
  const text = rule.trim();
  try {
    // A condition goes in whole; a declaration is split into its property and its value.
    if (/^(\(|selector\(|not\b)/i.test(text) || /\)\s*(and|or)\s*\(/i.test(text)) return CSS.supports(text);
    const colon = text.indexOf(":");
    return colon > 0 ? CSS.supports(text.slice(0, colon).trim(), text.slice(colon + 1).trim()) : CSS.supports(text);
  } catch {
    return false;
  }
}

/** Whether a global exists, by name or by dotted path: `"IntersectionObserver"`, `"navigator.clipboard"`. */
export function hasApi(path: string): boolean {
  let scope: unknown = globalThis;
  for (const part of path.split(".")) {
    if (scope === null || (typeof scope !== "object" && typeof scope !== "function") || !(part in scope)) return false;
    scope = (scope as Record<string, unknown>)[part];
  }
  return scope !== undefined && scope !== null;
}

/** Runs one check. A check that throws is a check that failed. */
export function runCheck(test: BrowserCheck): boolean {
  try {
    if (typeof test === "function") return Boolean(test());
    return "css" in test ? supportsCss(test.css) : hasApi(test.api);
  } catch {
    return false;
  }
}

const NUMBER = "(\\d+(?:\\.\\d+)*)";
// The order matters: Edge and Opera also say Chrome, and Chrome also says Safari. The last number is how many parts of the version people say.
const AGENTS: readonly (readonly [string, RegExp, 1 | 2])[] = [
  ["Edge", new RegExp(`\\bEdg(?:e|A)?/${NUMBER}`), 1],
  ["Opera", new RegExp(`\\bOPR/${NUMBER}`), 1],
  ["Samsung Internet", new RegExp(`\\bSamsungBrowser/${NUMBER}`), 2],
  ["Firefox", new RegExp(`\\bFirefox/${NUMBER}`), 1],
  ["Chrome", new RegExp(`(?:^|[^A-Za-z])(?:Headless)?(?:Chrome|Chromium)/${NUMBER}`), 1],
  ["Safari", new RegExp(`\\bVersion/${NUMBER}.*\\bSafari/`), 2],
];

/**
 * The browser behind a user agent, or `null` when it cannot be told with confidence. Browsers on iOS
 * all run Safari's engine under their own name, so a version in their user agent says nothing about
 * what the page can use: they are left to the feature checks.
 */
export function detectBrowser(userAgent: string): DetectedBrowser | null {
  if (/\b(CriOS|FxiOS|EdgiOS|OPiOS)\//.test(userAgent)) return null;
  for (const [name, pattern, parts] of AGENTS) {
    const version = pattern.exec(userAgent)?.[1];
    if (version) return { name, version: version.split(".").slice(0, parts).join(".") };
  }
  return null;
}

/** Negative when `a` is older than `b`, positive when newer, 0 when they are the same: "16.4" against "16.10" and "121.0.1" against "121". */
export function compareVersions(a: string, b: string): number {
  const left = a.split(".").map(Number);
  const right = b.split(".").map(Number);
  for (let index = 0; index < Math.max(left.length, right.length); index += 1) {
    const difference = (left[index] ?? 0) - (right[index] ?? 0);
    if (difference !== 0 && !Number.isNaN(difference)) return difference;
  }
  return 0;
}

/** Whether a listed name ("Microsoft Edge") and a detected one ("Edge") are the same browser. */
export function sameBrowser(listed: string, detected: string): boolean {
  const a = listed.trim().toLowerCase();
  const b = detected.trim().toLowerCase();
  return a === b || a.includes(b) || b.includes(a);
}

/** Runs every check, and compares the visitor's browser with the versions you listed. */
export function assess(requires: readonly BrowserRequirement[], browsers: readonly SupportedBrowser[], userAgent: string): Assessment {
  const missing = requires.filter((requirement) => !runCheck(requirement.test)).map((requirement) => requirement.label);
  const browser = detectBrowser(userAgent);
  const listed = browser ? browsers.find((entry) => sameBrowser(entry.name, browser.name)) : undefined;
  const outdated = browser && listed && compareVersions(browser.version, listed.minVersion) < 0 ? { name: browser.name, version: browser.version, minVersion: listed.minVersion } : null;
  return { missing, outdated, browser };
}

/** What was kept when storage was refused. It lives for the session, like storage would. */
const memory = new Set<string>();

/** Whether the visitor already chose to continue in this browser session. */
export function hasContinued(key: string): boolean {
  if (memory.has(key)) return true;
  try {
    return window.sessionStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}

/** Remembers the choice for the rest of the session: sessionStorage, and memory where storage throws. */
export function rememberContinue(key: string): void {
  memory.add(key);
  try {
    window.sessionStorage.setItem(key, "1");
  } catch {
    // Blocked storage keeps the choice in memory only.
  }
}

/** Forgets the choice, so the notice can show again: for a preview, a test or a "show tips again" button. */
export function forgetContinue(key: string): void {
  memory.delete(key);
  try {
    window.sessionStorage.removeItem(key);
  } catch {
    // Nothing was stored.
  }
}
