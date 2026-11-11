/**
 * The words and the small decisions behind RecommendationReasonPopover, as plain
 * types and functions: they hold no state and call no hook, so a Server
 * Component can use them too.
 */

/** What kind of signal a reason comes from. It picks the icon and is read out before the reason. */
export type ReasonKind = "activity" | "interest" | "popular" | "location" | "similar" | "following" | "context";

/** One reason an item was shown, in plain words. */
export interface RecommendationReason {
  /** The reason as a sentence a person would say: "You viewed Trail running shoes yesterday". */
  label: string;
  /** More, in a smaller line: "Based on what you looked at in the last 7 days". */
  detail?: string;
  /** Where the signal comes from. It picks the icon and says so to screen readers. Default "context". */
  kind?: ReasonKind;
}

/** Who paid for something that is shown as an ad. */
export interface Sponsorship {
  /** The advertiser: "Northwind Outfitters". */
  by: string;
  /** What sponsorship means here, in a sentence. Without it the panel says what the labels default to. */
  note?: string;
}

/** The words the popover says, for translation. `{by}` is filled in. */
export interface RecommendationReasonLabels {
  /** The title, and the name of the default button. Default "Why am I seeing this?" */
  title?: string;
  /** The close button's name. Default "Close". */
  close?: string;
  /** The word on an ad. Default "Sponsored". */
  sponsored?: string;
  /** Who paid. Default "Paid for by {by}". */
  paidBy?: string;
  /** What sponsorship means, when `sponsored.note` is not given. Default "Advertisers pay to reach people who may like what they offer. They do not get your name or what you do here." */
  sponsoredNote?: string;
  /** The heading over the reasons of something recommended. Default "Why it was chosen for you". */
  reasons?: string;
  /** The heading over the reasons of an ad. Default "Why this ad was shown to you". */
  reasonsSponsored?: string;
  /** What is said when there are no reasons to give. Default "This was not chosen using anything we know about you." */
  noReasons?: string;
  /** Said to screen readers in front of each reason, by the kind of signal. */
  kinds?: Partial<Record<ReasonKind, string>>;
  /** The button that asks for less of this. Default "Show less like this". */
  lessLikeThis?: string;
  /** What that button says once it worked. Default "We will show you less like this". */
  lessDone?: string;
  /** The button that hides the item. Default "Hide this". */
  hide?: string;
  /** What that button says once it worked. Default "Hidden. You will not see this again". */
  hideDone?: string;
  /** The link to the settings. Default "Manage personalisation". */
  manage?: string;
  /** Said while an action is being saved. Default "Saving". */
  saving?: string;
  /** Shown and said when an action failed. Default "Could not save that. Nothing was changed." */
  failed?: string;
}

export const DEFAULT_KINDS = {
  activity: "Your activity",
  interest: "Your interests",
  popular: "Popular",
  location: "Where you are",
  similar: "People like you",
  following: "What you follow",
  context: "This page",
} satisfies Record<ReasonKind, string>;

export const DEFAULT_LABELS = {
  title: "Why am I seeing this?",
  close: "Close",
  sponsored: "Sponsored",
  paidBy: "Paid for by {by}",
  sponsoredNote: "Advertisers pay to reach people who may like what they offer. They do not get your name or what you do here.",
  reasons: "Why it was chosen for you",
  reasonsSponsored: "Why this ad was shown to you",
  noReasons: "This was not chosen using anything we know about you.",
  lessLikeThis: "Show less like this",
  lessDone: "We will show you less like this",
  hide: "Hide this",
  hideDone: "Hidden. You will not see this again",
  manage: "Manage personalisation",
  saving: "Saving",
  failed: "Could not save that. Nothing was changed.",
} satisfies Omit<Required<RecommendationReasonLabels>, "kinds">;

/** Puts values into a template: `fill("Paid for by {by}", { by: "Northwind" })`. A name it does not know is left as it was. */
export function fill(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => (key in values ? (values[key] ?? match) : match));
}

/** Whether a handler returned a promise, so a quick answer does not flash a busy state. */
export function isThenable(value: unknown): value is PromiseLike<unknown> {
  return typeof value === "object" && value !== null && typeof (value as { then?: unknown }).then === "function";
}

/** The message a refused action carries, when it carries one worth showing: an `Error` with text. */
export function messageOf(error: unknown): string {
  return error instanceof Error ? error.message.trim() : "";
}
