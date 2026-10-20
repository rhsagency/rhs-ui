import type { ReactNode } from "react";

export interface ProblemCode {
  /** The command or snippet, copied as written. */
  code: string;
  /** Shown in the header when there is no file name: "bash", "json". */
  language?: string;
  /** Shown in the header: "~/.northwind/config.json". */
  filename?: string;
}

export interface ProblemImage {
  src: string;
  /** What the screenshot shows, for someone who cannot see it. */
  alt: string;
  /** A line under the screenshot. */
  caption?: string;
}

export interface ProblemStep {
  /** What to do, in one or two sentences. */
  text: ReactNode;
  /** A command or snippet to copy, under the text. */
  code?: ProblemCode;
  /** A screenshot of the screen the step happens on, under the text. */
  image?: ProblemImage;
}

export interface TroubleshootingProblem {
  /** Stable and URL-safe: it is the anchor (#id) that support replies and docs link to, and a link that targets it opens the problem. */
  id: string;
  /** What the user sees, in the user's words: "I do not get the sign-in email". */
  symptom: string;
  /** The most likely reason, in a sentence or two. */
  cause: ReactNode;
  /** Something to know before the fix: a step that signs people out, data that cannot be undone. */
  warning?: ReactNode;
  /** The fix, in order. Plain strings are fine; use an object for a step with code or a screenshot. */
  steps: readonly (string | ProblemStep)[];
  /** Where "Still stuck?" leads for this problem instead of the guide's support page, and what the link says. */
  support?: { href: string; label?: string };
}

export interface TroubleshootingArea {
  /** Stable and URL-safe: the area can be linked as #id. */
  id: string;
  /** "Sign-in", "Billing", "Sync". */
  title: string;
  /** One line on what belongs here. */
  description?: string;
  /** A small icon above the title: an IconLock, an IconCreditCard. */
  icon?: ReactNode;
  problems: readonly TroubleshootingProblem[];
}

export interface TroubleshootingLabels {
  cause: string;
  fix: string;
  /** The question before the support link: "Still stuck?". */
  stuck: string;
  /** The support link's text. */
  contact: string;
  /** The count under an area's title: "4 problems". */
  problemCount: (count: number) => string;
}
