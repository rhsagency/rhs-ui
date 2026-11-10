/**
 * The parts of the feedback dialog that need no state: the kinds of feedback, what is sent, the words, and the little
 * checks. Plain functions with no hook, so a Server Component can use them too.
 */

/** One kind of feedback. Choosing it changes the hint in the message field, which is how it steers what people write. */
export interface FeedbackType {
  /** A stable identity: `onSubmit` receives it as `type`. */
  id: string;
  /** The name on the segmented control: "Idea". Keep it to a word or two. */
  label: string;
  /** What the message field asks while this kind is chosen: "What went wrong, and what did you expect?". It is the placeholder. */
  prompt: string;
}

/** What `onSubmit` receives. */
export interface FeedbackValues {
  /** The `id` of the kind that was chosen. */
  type: string;
  /** The message, without the spaces around it. */
  message: string;
  /** The email address, or an empty string when none was given. */
  email: string;
  /** The `metadata` that was shown to the sender and goes along, so what was read is what is sent. */
  metadata: Record<string, string>;
}

/** What the sender has typed so far, which the dialog keeps when it is closed by accident. */
export interface FeedbackDraft {
  type: string;
  message: string;
  email: string;
}

/** The words the dialog says, for translation. Use `{count}` and `{email}` where the defaults do. */
export interface FeedbackLabels {
  /** The title. Default "Send feedback". */
  title?: string;
  /** The line under it. Default "Tell us what works and what does not. A person reads every message." */
  description?: string;
  /** The name of the segmented control, for screen readers. Default "Kind of feedback". */
  kind?: string;
  /** The label of the message field. Default "Message". */
  message?: string;
  /** Said under the field near the limit. Default "{count} characters left". */
  left?: string;
  /** Said at the limit. Default "Character limit reached". */
  limit?: string;
  /** The label of the email field when it is required. Default "Email". */
  email?: string;
  /** The label of the email field when it is optional. Default "Email (optional)". */
  emailOptional?: string;
  /** The line under the email field. Default "Only if you would like a reply." */
  emailHint?: string;
  /** What is said when the email is not an address. Default "Enter a valid email address." */
  emailInvalid?: string;
  /** What is said when a required email is empty. Default "Enter your email so we can reply." */
  emailRequired?: string;
  /** The heading over the metadata. Default "Sent along with your message". */
  metadata?: string;
  /** The button that sends. Default "Send feedback". */
  send?: string;
  /** The button after a failure. Default "Try again". */
  retry?: string;
  /** The button that leaves. Default "Cancel". */
  cancel?: string;
  /** Said while the message is on its way. Default "Sending". */
  sending?: string;
  /** The heading of the message after a failure. Default "Could not send your feedback". */
  failed?: string;
  /** The message when the failure carries none. Default "Nothing was sent, and your message is still here." */
  failedBody?: string;
  /** The thank-you. Default "Thanks for the feedback". */
  thanks?: string;
  /** What happens to it when there is an email. Default "If we have a question, we will reply to {email}." */
  thanksReply?: string;
  /** What happens to it when there is none. Default "It goes straight to the team. We cannot reply without an email, but we read every message." */
  thanksNoReply?: string;
  /** Said under the bar that runs down. Default "This window closes by itself." */
  closing?: string;
  /** The button on the thank-you. Default "Close". */
  close?: string;
  /** The name of the corner button. Default "Close". */
  closeIcon?: string;
}

export const DEFAULT_TYPES: readonly FeedbackType[] = [
  { id: "idea", label: "Idea", prompt: "What would make this better for you?" },
  { id: "problem", label: "Problem", prompt: "What went wrong, and what did you expect to happen?" },
  { id: "praise", label: "Praise", prompt: "What do you like? Tell us, so we keep doing it." },
  { id: "other", label: "Other", prompt: "What is on your mind?" },
];

export const DEFAULT_LABELS = {
  title: "Send feedback",
  description: "Tell us what works and what does not. A person reads every message.",
  kind: "Kind of feedback",
  message: "Message",
  left: "{count} characters left",
  limit: "Character limit reached",
  email: "Email",
  emailOptional: "Email (optional)",
  emailHint: "Only if you would like a reply.",
  emailInvalid: "Enter a valid email address.",
  emailRequired: "Enter your email so we can reply.",
  metadata: "Sent along with your message",
  send: "Send feedback",
  retry: "Try again",
  cancel: "Cancel",
  sending: "Sending",
  failed: "Could not send your feedback",
  failedBody: "Nothing was sent, and your message is still here.",
  thanks: "Thanks for the feedback",
  thanksReply: "If we have a question, we will reply to {email}.",
  thanksNoReply: "It goes straight to the team. We cannot reply without an email, but we read every message.",
  closing: "This window closes by itself.",
  close: "Close",
  closeIcon: "Close",
} satisfies Required<FeedbackLabels>;

/** Puts values into a template: `fill("{count} characters left", { count: 42 })`. A name it does not know is left as it was. */
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

/** How many characters have to be left before the counter shows: a seventh of the limit, but never fewer than 20. */
export function nearLimit(limit: number): number {
  return Math.max(20, Math.round(limit / 7));
}

/** The step the screen reader hears at, so it is told at 100, 50, 20, 10 and 0 characters left and not on every key. Null when far from the limit. */
export function limitStep(left: number, limit: number): number | null {
  if (left > nearLimit(limit)) return null;
  const steps = [0, 10, 20, 50, 100].filter((step) => step <= nearLimit(limit));
  return steps.find((step) => left <= step) ?? null;
}
