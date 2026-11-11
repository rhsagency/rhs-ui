/**
 * The words, the types and the small time helpers behind RequestAccessDialog,
 * as plain functions: they hold no state, so a Server Component can use them too.
 */

/** A moment: a Date, an ISO string or a timestamp in milliseconds. */
export type RequestTime = Date | string | number;

/** One level of access that can be asked for. */
export interface RequestLevel {
  /** A stable identity from your own data: "edit". It is what `onRequest` receives as `level`. Unique in the list. */
  id: string;
  /** What people call it: "Can edit". */
  label: string;
  /** One line on what it allows: "Make changes and leave comments". */
  description?: string;
}

/** The person who can say yes. */
export interface AccessOwner {
  /** Their name. Initials stand in while the picture loads, or when there is none. */
  name: string;
  /** Their email address. It is only shown when `showOwnerEmail` is on: owners do not always want to be found. */
  email?: string;
  /** A picture. */
  image?: string;
}

/** What `onRequest` receives. */
export interface AccessRequest {
  /** The `id` of the level that was chosen. */
  level: string;
  /** What the person wrote, without the spaces around it. Empty when they wrote nothing. */
  message: string;
}

/** The words the dialog says, for translation. `{owner}`, `{resource}`, `{email}` and `{time}` are filled in. */
export interface RequestAccessLabels {
  /** The title. Default "Request access". */
  title?: string;
  /** The line under it. Default "You do not have access to {resource}. Ask {owner} to let you in." */
  description?: string;
  /** The small heading over who gets the request. Default "Goes to". */
  to?: string;
  /** The tag next to the owner's name. Default "Owner". */
  ownerTag?: string;
  /** The line that says as whom the person asks. Default "You are signed in as {email}". */
  signedInAs?: string;
  /** The title of the notice for a request that is already out. Default "Already requested {time}". */
  pending?: string;
  /** The line under it. Default "{owner} has not answered yet. You can send it again." */
  pendingBody?: string;
  /** The heading over the levels. Default "What do you need?". */
  level?: string;
  /** The label of the note. Default "Message (optional)". */
  message?: string;
  /** The hint inside the note. Default "Say what you are working on and why you need access." */
  messagePlaceholder?: string;
  /** The button. Default "Request access". */
  send?: string;
  /** The button when a request is already out. Default "Send again". */
  sendAgain?: string;
  /** The button while the request is sent. Default "Sending request". */
  sending?: string;
  /** The button after a failure. Default "Try again". */
  retry?: string;
  /** The other button. Default "Cancel". */
  cancel?: string;
  /** The title of the message when it failed. Default "The request was not sent". */
  failed?: string;
  /** The message when it failed and the error says nothing. Default "Something went wrong and nothing was sent. Your note is still here." */
  failedBody?: string;
  /** The title once it was sent. Default "Request sent to {owner}". */
  done?: string;
  /** The line under it. Default "Here is what happens next." */
  doneBody?: string;
  /** First thing to expect. Default "{owner} gets an email with your request and your note." */
  nextMail?: string;
  /** Second thing, when the address is known. Default "We will write to {email} as soon as they answer." */
  nextReply?: string;
  /** Second thing, when it is not. Default "You will be told as soon as they answer." */
  nextReplyAnon?: string;
  /** Third thing. Default "Until then you cannot open {resource}." */
  nextWait?: string;
  /** The button that closes the dialog afterwards. Default "Close". */
  close?: string;
  /** The name of the cross in the corner. Default "Close". */
  closeIcon?: string;
  /** What a request under a minute old is called. Default "just now". */
  justNow?: string;
}

export const DEFAULT_LABELS = {
  title: "Request access",
  description: "You do not have access to {resource}. Ask {owner} to let you in.",
  to: "Goes to",
  ownerTag: "Owner",
  signedInAs: "You are signed in as {email}",
  pending: "Already requested {time}",
  pendingBody: "{owner} has not answered yet. You can send it again.",
  level: "What do you need?",
  message: "Message (optional)",
  messagePlaceholder: "Say what you are working on and why you need access.",
  send: "Request access",
  sendAgain: "Send again",
  sending: "Sending request",
  retry: "Try again",
  cancel: "Cancel",
  failed: "The request was not sent",
  failedBody: "Something went wrong and nothing was sent. Your note is still here.",
  done: "Request sent to {owner}",
  doneBody: "Here is what happens next.",
  nextMail: "{owner} gets an email with your request and your note.",
  nextReply: "We will write to {email} as soon as they answer.",
  nextReplyAnon: "You will be told as soon as they answer.",
  nextWait: "Until then you cannot open {resource}.",
  close: "Close",
  closeIcon: "Close",
  justNow: "just now",
} satisfies Required<RequestAccessLabels>;

/** Puts values into a template: `fill("Request sent to {owner}", { owner })`. A name it does not know is left as it was. */
export function fill(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => (key in values ? (values[key] ?? match) : match));
}

/** The message a refused request carries, when it carries one worth showing: an `Error` with text. */
export function messageOf(error: unknown): string {
  return error instanceof Error ? error.message.trim() : "";
}

/** A moment as milliseconds, or NaN when it is not a date at all. */
export function toTimestamp(time: RequestTime): number {
  return new Date(time).getTime();
}

const UNITS: readonly (readonly [Intl.RelativeTimeFormatUnit, number])[] = [
  ["year", 31_557_600_000],
  ["month", 2_629_800_000],
  ["week", 604_800_000],
  ["day", 86_400_000],
  ["hour", 3_600_000],
  ["minute", 60_000],
];

/** How long ago, in the reader's language: "2 hours ago", "yesterday", "3 weeks ago". Under a minute it says `justNow`. */
export function ageText(at: number, now: number, locale: string, justNow: string): string {
  if (Number.isNaN(at)) return "";
  const diff = at - now;
  const unit = UNITS.find(([, size]) => Math.abs(diff) >= size);
  if (!unit) return justNow;
  let words: Intl.RelativeTimeFormat;
  try {
    words = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  } catch {
    words = new Intl.RelativeTimeFormat("en-US", { numeric: "auto" });
  }
  // From a day up the count is rounded: 47 hours is "2 days ago". Minutes and hours are cut, so 59.6 minutes never reads "60 minutes".
  const count = unit[1] >= 86_400_000 ? Math.round(diff / unit[1]) : Math.trunc(diff / unit[1]);
  return words.format(count, unit[0]);
}

/** The date and time written out in the zone, which is what the first paint shows before the browser's clock is known. */
export function stampText(at: number, locale: string, timeZone: string): string {
  if (Number.isNaN(at)) return "";
  const options: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" };
  let text: string;
  try {
    text = new Intl.DateTimeFormat(locale, { ...options, timeZone }).format(at);
  } catch {
    // An unknown locale or time zone must not take the page down.
    text = new Intl.DateTimeFormat("en-US", { ...options, timeZone: "UTC" }).format(at);
  }
  return text.replace(/\s/g, " ");
}
