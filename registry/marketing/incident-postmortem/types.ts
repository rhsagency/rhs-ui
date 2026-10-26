import type { ReactNode } from "react";

/** How bad it was, in the words customers use. */
export type IncidentSeverity = "critical" | "major" | "minor";

export interface Incident {
  /** Your own reference for it: "INC-2417". Shown beside the word Postmortem. */
  id?: string;
  /** What happened, in plain words: "Elevated error rates on the Halcyon API". */
  title: string;
  /** In words, never in colour alone. */
  severity: IncidentSeverity;
  /** Your own code for the severity, shown beside the word: "SEV 2". */
  severityCode?: string;
  /** When it started, as an ISO 8601 time with its offset: "2026-10-14T09:12:00Z". */
  start: string;
  /** When it ended. Leave it out while it is still going on: the duration then reads Ongoing. */
  end?: string;
  /** The parts of the product that were affected: "Public API", "Webhooks". */
  affected?: readonly string[];
  /** What happened in a few sentences: what broke, for how long, and how it ended. Paragraphs are fine. */
  summary: ReactNode;
}

export interface ImpactFigure {
  /** What is counted: "Customers affected". */
  label: string;
  /** The number. A number is formatted for the locale and set in tabular figures; text such as "3.1%" is shown as written. */
  value: number | string;
  /** What to know about it: "Out of 41,200 active accounts." */
  note?: string;
}

export interface PostmortemImpact {
  /** The numbers that matter, usually two to four: customers affected, requests failed. */
  figures: readonly ImpactFigure[];
  /** What the numbers mean for a customer, in a few sentences. */
  body?: ReactNode;
}

export interface TimelineEvent {
  /** When it happened, as an ISO 8601 time with its offset. */
  time: string;
  /** What happened, in one or two sentences. */
  event: ReactNode;
  /** Marks a turning point in words: "Detected", "Mitigated", "Resolved". It is set apart from the other events. */
  milestone?: string;
}

export interface RootCause {
  /** The root cause in one sentence of plain words. It is set large. */
  summary: ReactNode;
  /** The explanation: how it came about and why nothing caught it. */
  body?: ReactNode;
  /** The factors that made it worse or kept it from being found sooner. */
  factors?: readonly ReactNode[];
}

export interface PostmortemLessons {
  /** What worked, in short sentences. */
  wentWell: readonly ReactNode[];
  /** What did not, in short sentences. Write about the system and the process, not about a person. */
  wentPoorly: readonly ReactNode[];
}

export type ActionStatus = "done" | "in-progress" | "planned";

export interface PostmortemAction {
  /** What will change, in a sentence: "Alert when replica lag passes five seconds". */
  title: string;
  /** The team that owns it: "Platform". Blameless by design: owners are teams. */
  owner: string;
  /** A person on that team, only when you want to name one. */
  person?: string;
  /** When it is due, as an ISO date: "2026-11-15". */
  due: string;
  /** Said in words, never in colour alone. */
  status: ActionStatus;
  /** The ticket's name, shown as the link's text: "PLAT-482". */
  ticket?: string;
  /** Where the ticket lives. */
  href?: string;
}

export interface PostmortemLabels {
  /** The word above the title. */
  postmortem: string;
  /** The label of the severity fact. */
  severity: string;
  /** The word for the most serious severity. */
  critical: string;
  /** The word for the middle severity. */
  major: string;
  /** The word for the least serious severity. */
  minor: string;
  /** The label of the start time in the header. */
  started: string;
  /** The label of the end time in the header. */
  ended: string;
  /** The label of the duration in the header. */
  duration: string;
  /** The duration of an incident that has no end yet. */
  ongoing: string;
  /** The label of the list of what was affected. */
  affected: string;
  /** The landmark name of the contents list, and the small heading above it. */
  contents: string;
  /** The title of the summary section. */
  summary: string;
  /** The title of the impact section. */
  impact: string;
  /** The title of the timeline section. */
  timeline: string;
  /** Said under the heading of the timeline. {zone} stands for the time zone: "UTC". */
  allTimes: string;
  /** Read out beside the offset of each event. {duration} stands for the time since the start. */
  afterStart: string;
  /** Read out beside the offset of an event that happened before the start, such as the change that caused the incident. {duration} stands for the time before the start. */
  beforeStart: string;
  /** The title of the root cause section. */
  rootCause: string;
  /** The heading above the contributing factors. */
  contributing: string;
  /** The title of the lessons section. */
  lessons: string;
  /** The heading of the list of what worked. */
  wentWell: string;
  /** The heading of the list of what did not. */
  wentPoorly: string;
  /** The title of the actions section. */
  actions: string;
  /** The column head of the action itself. */
  action: string;
  /** The column head of the owner. */
  owner: string;
  /** The column head of the due date. */
  due: string;
  /** The column head of the status. */
  status: string;
  /** The status of an action that is finished. */
  done: string;
  /** The status of an action that is being worked on. */
  inProgress: string;
  /** The status of an action that has not started. */
  planned: string;
  /** The accessible name of the link beside a heading. The name of the section follows it: "Link to Timeline". */
  linkTo: string;
  /** Read out after a ticket link, which opens in a new tab. */
  newTab: string;
  /** The unit of a day in a duration: "d". */
  day: string;
  /** The unit of an hour in a duration: "h". */
  hour: string;
  /** The unit of a minute in a duration: "min". */
  minute: string;
  /** Said for a duration shorter than a minute. */
  underMinute: string;
  /** The note at the end of the page. */
  blameless: string;
}
