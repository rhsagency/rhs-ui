/**
 * The manners of the newsletter dialog as plain functions with no hook: when it may open, what it remembers, and the
 * checks it makes before it speaks. The component calls them; a Server Component can use the words and the labels too.
 */

/** How the dialog finds its moment: a delay after the page loads, a depth of scrolling, or never by itself (you open it). */
export type NewsletterTrigger = "delay" | "scroll" | "manual";

/** Why the dialog was dismissed, so you can tell a "No thanks" from a stray Escape. */
export type NewsletterDismissal = "decline" | "close" | "escape" | "outside";

/**
 * Where the moment of the last dismissal is kept. `read` returns when it was (milliseconds since 1970) or nothing; `write` is
 * given the moment to keep. A cookie, localStorage, your own database: you choose. `read` may return `Infinity` for a visitor
 * who must never be asked again, such as one who is already subscribed.
 */
export interface NewsletterStorage {
  read: () => number | null | undefined;
  write: (at: number) => void;
}

/** The words the dialog says, for translation. Use `{email}` where the default does. */
export interface NewsletterLabels {
  /** The title. Default "Stay in the loop". */
  title?: string;
  /** The line under it when you give no `incentive`. Default "New posts and product news in your inbox. No spam, and you can leave at any time." */
  description?: string;
  /** The label of the email field. Default "Email address". */
  email?: string;
  /** The hint in the field. Default "you@company.com". */
  placeholder?: string;
  /** The plain line about privacy under the field. Default "We use your email for this newsletter only, and every email has a one-click unsubscribe." */
  privacy?: string;
  /** The button that subscribes. Default "Subscribe". */
  subscribe?: string;
  /** The button that says no, as easy to find as the other. Default "No thanks". */
  decline?: string;
  /** Said while the sign-up is on its way. Default "Subscribing". */
  subscribing?: string;
  /** What is said when the address is not one. Default "Enter a valid email address." */
  invalid?: string;
  /** The heading of the message after a failure. Default "Could not subscribe you". */
  failed?: string;
  /** The message when the failure carries none. Default "Something went wrong on our side. Your address is still here, so you can try again." */
  failedBody?: string;
  /** The title once it worked. Default "You're subscribed". */
  done?: string;
  /** The line under it. Default "We sent a confirmation to {email}. Open it to finish." */
  doneBody?: string;
  /** Said under the bar that runs down. Default "This window closes by itself." */
  closing?: string;
  /** The button on the confirmation. Default "Close". */
  close?: string;
  /** The name of the corner button. Default "Close". */
  closeIcon?: string;
}

export const DEFAULT_LABELS = {
  title: "Stay in the loop",
  description: "New posts and product news in your inbox. No spam, and you can leave at any time.",
  email: "Email address",
  placeholder: "you@company.com",
  privacy: "We use your email for this newsletter only, and every email has a one-click unsubscribe.",
  subscribe: "Subscribe",
  decline: "No thanks",
  subscribing: "Subscribing",
  invalid: "Enter a valid email address.",
  failed: "Could not subscribe you",
  failedBody: "Something went wrong on our side. Your address is still here, so you can try again.",
  done: "You're subscribed",
  doneBody: "We sent a confirmation to {email}. Open it to finish.",
  closing: "This window closes by itself.",
  close: "Close",
  closeIcon: "Close",
} satisfies Required<NewsletterLabels>;

/** Puts values into a template: `fill("Sent to {email}", { email })`. A name it does not know is left as it was. */
export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => (key in values ? String(values[key]) : match));
}

/** A deliberately plain check: something, an @, something, a dot, something. The server is the judge of the rest. */
export function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

/** The words of whatever was thrown: a string, or the message of an error or of any object that has one. */
export function messageOf(thrown: unknown): string | null {
  const text = typeof thrown === "string" ? thrown : (thrown as { message?: unknown } | null | undefined)?.message;
  return typeof text === "string" && text.trim() ? text : null;
}

const DAY = 86_400_000;

/** The key under which the default storage keeps the moment of the last dismissal. */
export const DISMISSED_KEY = "rhs-newsletter-dismissed";

/** The key under which the number of pages seen in this tab's session is kept. */
export const VIEWS_KEY = "rhs-newsletter-views";

/** The default storage: the moment in localStorage. Where that is blocked it remembers nothing, and the dialog stays shy rather than rude. */
export const localStorageSuppression: NewsletterStorage = {
  read() {
    try {
      const value = Number(window.localStorage.getItem(DISMISSED_KEY));
      return Number.isFinite(value) && value > 0 ? value : null;
    } catch {
      return null;
    }
  },
  write(at) {
    try {
      window.localStorage.setItem(DISMISSED_KEY, String(at));
    } catch {
      // storage is blocked: nothing to remember it with
    }
  },
};

/** Whether the last dismissal is still inside the days the dialog keeps away. */
export function isSuppressed(storage: NewsletterStorage, days: number, now: number): boolean {
  const at = storage.read();
  return typeof at === "number" && !Number.isNaN(at) && now - at < days * DAY;
}

/**
 * Counts this page as seen in the session and says how many have been. Where sessionStorage is blocked it says 1 whatever the
 * number, so the dialog never opens on a page it cannot be sure is not the first.
 */
export function countPageView(): number {
  try {
    const next = Number(window.sessionStorage.getItem(VIEWS_KEY) ?? "0") + 1;
    window.sessionStorage.setItem(VIEWS_KEY, String(next));
    return next;
  } catch {
    return 1;
  }
}

/** Whether somebody is in the middle of a field: focus is in something they type into. */
export function isTyping(): boolean {
  const active = document.activeElement;
  if (!(active instanceof HTMLElement)) return false;
  if (active.isContentEditable) return true;
  if (active instanceof HTMLTextAreaElement || active instanceof HTMLSelectElement) return true;
  return active instanceof HTMLInputElement && !["button", "checkbox", "radio", "range", "submit", "reset", "file", "image", "color"].includes(active.type);
}

/** Whether something else already has the visitor's attention: another dialog is open, or the tab is in the background. */
export function isBusy(): boolean {
  if (document.visibilityState === "hidden") return true;
  return document.querySelector('[role="dialog"][data-state="open"], [role="alertdialog"][data-state="open"], dialog[open]') !== null;
}

/** How far down the page the visitor has seen, as a percentage of its height. */
export function scrollDepth(): number {
  const height = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight);
  if (height <= 0) return 0;
  return Math.min(100, ((window.scrollY + window.innerHeight) / height) * 100);
}
