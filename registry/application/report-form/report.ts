/** One reason a person can give for a report. */
export interface ReportReason {
  /** What `onSubmit` reports when this reason is chosen. Unique in the list. */
  id: string;
  /** The reason in a few words: "Spam or misleading". */
  label: string;
  /** One line that says what it covers: "Ads, scams and links that go nowhere." */
  description?: string;
  /** Choosing it opens a text box, and the report cannot be sent until the box has some words in it. */
  requiresDetail?: boolean;
}

/** What is being reported, so the person can see they picked the right thing. */
export interface ReportSubject {
  /** The kind of thing: "post", "listing", "user" or "comment". It goes into the heading ("Report this listing") and picks the icon. */
  kind: string;
  /** Its title or name: "Halcyon road bike, 54 cm". */
  title: string;
  /** A second line: who posted it, and when. */
  byline?: string;
}

/** Where the form stands before it is sent. */
export interface ReportDraft {
  /** The chosen reason, or `null` before one is chosen. */
  reasonId: string | null;
  /** What was typed in the detail box. */
  detail: string;
  /** The "Also block" box is ticked. */
  block: boolean;
}

/** What `onSubmit` receives. */
export interface ReportSubmission {
  reasonId: string;
  /** The detail, trimmed; an empty string when the reason does not ask for it. */
  detail: string;
  block: boolean;
}

/** The optional "Also block this user" box. */
export interface BlockOption {
  /** Default "Also block this user". */
  label?: string;
  /** The line under it. Default "You will no longer see what they post, and they cannot message you." */
  description?: string;
}

/** The words the form says, for translation. A `{name}` mark in a sentence is filled in. */
export interface ReportFormLabels {
  /** The heading; `{kind}` is the subject's kind. Default "Report this {kind}". */
  title?: string;
  /** The line under the heading. Default "What is wrong with it? Choose the closest reason." */
  intro?: string;
  /** Names the list of reasons for a screen reader. Default "Reason for the report". */
  reasons?: string;
  /** The label of the detail box. Default "Tell us what happened". */
  detailLabel?: string;
  /** The line over the detail box; `{min}` is the fewest characters. Default "At least {min} characters, so we can act on it." */
  detailHint?: string;
  /** What the note under the reasons says. Default "We review reports within 24 hours and never tell the person you reported who sent it." */
  note?: string;
  /** Beside the buttons until a reason is chosen. Default "Choose a reason to send your report." */
  needReason?: string;
  /** Beside the buttons while the detail is too short; `{min}`. Default "Add at least {min} characters of detail to send your report." */
  needDetail?: string;
  /** The cancel button. Default "Cancel". */
  cancel?: string;
  /** The send button. Default "Send report". */
  submit?: string;
  /** What is said when sending failed. Default "We could not send your report. Check your connection and try again." */
  failed?: string;
  /** The heading of the confirmation. Default "Thanks, we have your report". */
  doneTitle?: string;
  /** The text of the confirmation. Default "Our team will look at it within 24 hours. You will only hear from us if we need more detail." */
  doneBody?: string;
  /** Added to the confirmation when the person was blocked too. Default "The person is blocked." */
  doneBlocked?: string;
  /** What a screen reader hears when the confirmation replaces the form. Default "Report sent." */
  sent?: string;
  /** The button on the confirmation. Default "Done". */
  done?: string;
}

export const DEFAULT_LABELS = {
  title: "Report this {kind}",
  intro: "What is wrong with it? Choose the closest reason.",
  reasons: "Reason for the report",
  detailLabel: "Tell us what happened",
  detailHint: "At least {min} characters, so we can act on it.",
  note: "We review reports within 24 hours and never tell the person you reported who sent it.",
  needReason: "Choose a reason to send your report.",
  needDetail: "Add at least {min} characters of detail to send your report.",
  cancel: "Cancel",
  submit: "Send report",
  failed: "We could not send your report. Check your connection and try again.",
  doneTitle: "Thanks, we have your report",
  doneBody: "Our team will look at it within 24 hours. You will only hear from us if we need more detail.",
  doneBlocked: "The person is blocked.",
  sent: "Report sent.",
  done: "Done",
} satisfies Required<ReportFormLabels>;

export const DEFAULT_BLOCK = {
  label: "Also block this user",
  description: "You will no longer see what they post, and they cannot message you.",
} satisfies Required<BlockOption>;

export type Words = Required<ReportFormLabels>;

/** Fills `{name}` marks in a sentence. A mark with no value stays as it is. */
export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (mark, key: string) => (key in values ? String(values[key]) : mark));
}

/** The fewest characters a detail needs, unless the form is told otherwise. */
export const MIN_DETAIL = 10;

/** What stops the report from being sent, or `null` when it can go: a reason is missing, or the chosen reason wants more words. */
export function blocker(reasons: readonly ReportReason[], draft: ReportDraft, minDetail: number): "reason" | "detail" | null {
  const reason = reasons.find((item) => item.id === draft.reasonId);
  if (!reason) return "reason";
  if (reason.requiresDetail && draft.detail.trim().length < minDetail) return "detail";
  return null;
}
