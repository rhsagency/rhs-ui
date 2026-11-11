/**
 * The marks, the counting and the words behind AttendanceRegister, as plain
 * types and functions: they hold no state and call no hook, so a Server
 * Component can use them too. Sessions are calendar days: a date written as
 * "2026-10-12" belongs to no time zone, and a moment is placed on a day in the
 * time zone you give, so the server and the browser agree on which day it is.
 */

/** How someone took part in a session. */
export type AttendanceMark = "present" | "late" | "absent" | "excused";

/** One person in the register. */
export interface AttendancePerson {
  /** A stable identity from your own data. It is the key of the person in `marks`. */
  id: string;
  /** Their name. */
  name: string;
  /** A picture. Initials stand in while it loads, or when there is none. */
  image?: string;
}

/** One time the group met. */
export interface AttendanceSession {
  /** A stable identity from your own data. It is the key of the session in each person's marks. */
  id: string;
  /** The day: "2026-10-12", or a moment as a Date, a timestamp or an ISO string (placed on a day in `timeZone`). */
  date: string | number | Date;
  /** What the session was about: "Week 3: Type scales". Cut to two lines under the date. */
  title?: string;
}

/** Marks per person and session: `marks[personId][sessionId]` is "late". A cell with no mark has no entry. */
export type AttendanceMarks = Readonly<Record<string, Readonly<Record<string, AttendanceMark>>>>;

/** One cell that changed. */
export interface AttendanceChange {
  /** The `id` of the person. */
  personId: string;
  /** The `id` of the session. */
  sessionId: string;
  /** The mark now, or undefined when it was cleared. */
  mark: AttendanceMark | undefined;
}

/** The words the register says, for translation. `{person}`, `{date}`, `{mark}`, `{count}`, `{came}`, `{counted}`, `{total}`, `{percent}` and `{name}` are filled in. */
export interface AttendanceLabels {
  /** The first column's heading. Default "People". */
  people?: string;
  /** The last column's heading. Default "Attendance". */
  rate?: string;
  /** The footer row's name. Default "Came". */
  came?: string;
  /** The word on today's session. Default "Today". */
  today?: string;
  /** The word on a session that has not happened yet. Default "Upcoming". */
  upcoming?: string;
  /** What a cell says to screen readers when nothing is marked. Default "not marked". */
  notMarked?: string;
  /** Why a future session cannot be marked, said to screen readers in the cell. Default "not open for marking yet". */
  notOpen?: string;
  /** A person's rate: how many sessions they came to, of how many counted. Default "{came} of {counted}". */
  rateOf?: string;
  /** The same, as a percentage. Default "{percent}%". */
  percent?: string;
  /** For a person with no marks that count yet. Default "No marks yet". */
  noRate?: string;
  /** A session's footer: how many of the people came. Default "{came} of {total}". */
  cameOf?: string;
  /** The same for screen readers. Default "{came} of {total} came". */
  cameWords?: string;
  /** For a session nobody is marked in. Default "Not marked". */
  nobody?: string;
  /** The short button that marks a whole session present, when nobody is marked yet. Default "All present". */
  allPresent?: string;
  /** The same, when some are marked and only the rest would change. Default "Rest present". */
  restPresent?: string;
  /** That button's full name. Default "Mark all present on {date}". */
  allPresentFor?: string;
  /** Its full name when only the rest change. Default "Mark the rest present on {date}". */
  restPresentFor?: string;
  /** A cell's name: who, which session and what mark. Default "{person}, {date}, {mark}". */
  cell?: string;
  /** The title of a cell's menu. Default "{person}, {date}". */
  menu?: string;
  /** The menu entry that takes a mark away. Default "Clear mark". */
  clear?: string;
  /** The words for the four marks. */
  marks?: Partial<Record<AttendanceMark, string>>;
  /** What each mark means, in a line. */
  meanings?: Partial<Record<AttendanceMark, string>>;
  /** Said when a mark was set. Default "{person} marked {mark} on {date}." */
  marked?: string;
  /** Said when a mark was cleared. Default "Mark cleared for {person} on {date}." */
  cleared?: string;
  /** Said when a whole session was marked. Default "{count} people marked present on {date}." */
  bulk?: string;
  /** The hint under the register. Default "Arrow keys move between cells. P, L, A and E set present, late, absent or excused. Backspace clears. Enter opens the menu." */
  hint?: string;
  /** The hint on a touch screen. Default "Tap a cell to choose a mark." */
  hintTouch?: string;
  /** What the rate counts. Default "The rate counts present and late against present, late and absent. Excused and unmarked sessions are left out." */
  rateNote?: string;
  /** The name of the table for screen readers. Default "Attendance register". */
  caption?: string;
  /** Shown when there are no people or no sessions. Default "Add people and sessions to start the register." */
  empty?: string;
  /** The name of the list of marks. Default "Marks". */
  legend?: string;
}

export const MARK_ORDER = ["present", "late", "absent", "excused"] as const satisfies readonly AttendanceMark[];

/** The key that sets each mark. */
export const MARK_KEY: Record<AttendanceMark, string> = { present: "P", late: "L", absent: "A", excused: "E" };

export const DEFAULT_MARKS = { present: "Present", late: "Late", absent: "Absent", excused: "Excused" } satisfies Record<AttendanceMark, string>;

export const DEFAULT_MEANINGS = {
  present: "Came, on time",
  late: "Came after it began",
  absent: "Did not come",
  excused: "Away with a reason",
} satisfies Record<AttendanceMark, string>;

export const DEFAULT_LABELS = {
  people: "People",
  rate: "Attendance",
  came: "Came",
  today: "Today",
  upcoming: "Upcoming",
  notMarked: "not marked",
  notOpen: "not open for marking yet",
  rateOf: "{came} of {counted}",
  percent: "{percent}%",
  noRate: "No marks yet",
  cameOf: "{came} of {total}",
  cameWords: "{came} of {total} came",
  nobody: "Not marked",
  allPresent: "All present",
  restPresent: "Rest present",
  allPresentFor: "Mark all present on {date}",
  restPresentFor: "Mark the rest present on {date}",
  cell: "{person}, {date}, {mark}",
  menu: "{person}, {date}",
  clear: "Clear mark",
  marked: "{person} marked {mark} on {date}.",
  cleared: "Mark cleared for {person} on {date}.",
  bulk: "{count} people marked present on {date}.",
  hint: "Arrow keys move between cells. P, L, A and E set present, late, absent or excused. Backspace clears. Enter opens the menu.",
  hintTouch: "Tap a cell to choose a mark.",
  rateNote: "The rate counts present and late against present, late and absent. Excused and unmarked sessions are left out.",
  caption: "Attendance register",
  empty: "Add people and sessions to start the register.",
  legend: "Marks",
} satisfies Omit<Required<AttendanceLabels>, "marks" | "meanings">;

/** Puts values into a template: `fill("{person}, {date}", { person: "Mara", date: "12 Oct" })`. A name it does not know is left as it was. */
export function fill(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => (key in values ? (values[key] ?? match) : match));
}

export function isMark(value: string): value is AttendanceMark {
  return (MARK_ORDER as readonly string[]).includes(value);
}

/** The mark a letter stands for: P, L, A or E, in either case. */
export function markOfLetter(letter: string): AttendanceMark | undefined {
  const upper = letter.toUpperCase();
  return MARK_ORDER.find((mark) => MARK_KEY[mark] === upper);
}

/** A number the way the locale writes it. */
export function numberText(value: number, locale: string): string {
  try {
    return new Intl.NumberFormat(locale).format(value);
  } catch {
    return new Intl.NumberFormat("en-US").format(value);
  }
}

const DAY_ONLY = /^\d{4}-\d{2}-\d{2}$/;

/** A session as a calendar day: its key ("2026-10-12", which sorts) and midnight of that day in UTC, for formatting. Null when the date cannot be read. */
export function dayOf(date: string | number | Date, timeZone: string): { key: string; ms: number } | null {
  if (typeof date === "string" && DAY_ONLY.test(date)) {
    const ms = Date.parse(`${date}T00:00:00Z`);
    return Number.isNaN(ms) ? null : { key: date, ms };
  }
  const at = date instanceof Date ? date.getTime() : new Date(date).getTime();
  if (Number.isNaN(at)) return null;
  const key = dayKeyAt(at, timeZone);
  return { key, ms: Date.parse(`${key}T00:00:00Z`) };
}

/** The day a moment falls on in a time zone, as "2026-10-12". The format of en-CA is the one that sorts. */
export function dayKeyAt(at: number, timeZone: string): string {
  const options = { year: "numeric", month: "2-digit", day: "2-digit" } as const;
  try {
    return new Intl.DateTimeFormat("en-CA", { ...options, timeZone }).format(at);
  } catch {
    return new Intl.DateTimeFormat("en-CA", { ...options, timeZone: "UTC" }).format(at);
  }
}

// Intl writes some spaces as narrow or thin no-break spaces, and the version of its data decides which: a plain space looks the same and every engine agrees on it.
const ODD_SPACES = new RegExp(`[${String.fromCharCode(0x00a0, 0x2009, 0x202f)}]`, "g");

function format(ms: number, locale: string, options: Intl.DateTimeFormatOptions): string {
  let text: string;
  try {
    text = new Intl.DateTimeFormat(locale, { ...options, timeZone: "UTC" }).format(ms);
  } catch {
    text = new Intl.DateTimeFormat("en-US", { ...options, timeZone: "UTC" }).format(ms);
  }
  return text.replace(ODD_SPACES, " ");
}

/** "12 Oct": for a column heading and a cell's name. */
export function shortDateText(ms: number, locale: string): string {
  return format(ms, locale, { day: "numeric", month: "short" });
}

/** "Mon". */
export function weekdayText(ms: number, locale: string): string {
  return format(ms, locale, { weekday: "short" });
}

/** "Monday 12 October", for a screen reader's longer sentences. */
export function longDateText(ms: number, locale: string): string {
  return format(ms, locale, { weekday: "long", day: "numeric", month: "long" });
}

/** What was counted for one person or one session. */
export interface Tally {
  present: number;
  late: number;
  absent: number;
  excused: number;
  /** Cells with no mark. */
  unmarked: number;
  /** Who came: present and late. */
  came: number;
  /** What counts against the rate: present, late and absent. Excused and unmarked are left out. */
  counted: number;
  /** The rate as a whole percentage, or null when nothing counts yet. */
  percent: number | null;
}

function tallyOf(list: readonly (AttendanceMark | undefined)[]): Tally {
  const tally = { present: 0, late: 0, absent: 0, excused: 0, unmarked: 0 };
  for (const mark of list) {
    if (mark) tally[mark] += 1;
    else tally.unmarked += 1;
  }
  const came = tally.present + tally.late;
  const counted = came + tally.absent;
  return { ...tally, came, counted, percent: counted ? Math.round((came / counted) * 100) : null };
}

export function markOf(marks: AttendanceMarks, personId: string, sessionId: string): AttendanceMark | undefined {
  return marks[personId]?.[sessionId];
}

/** One person over the sessions that have taken place. */
export function tallyPerson(marks: AttendanceMarks, personId: string, sessionIds: readonly string[]): Tally {
  return tallyOf(sessionIds.map((id) => markOf(marks, personId, id)));
}

/** One session over all the people. */
export function tallySession(marks: AttendanceMarks, sessionId: string, personIds: readonly string[]): Tally {
  return tallyOf(personIds.map((id) => markOf(marks, id, sessionId)));
}

/** A copy of the marks with one cell set, or cleared with undefined. A person with no marks left has no entry. */
export function withMark(marks: AttendanceMarks, personId: string, sessionId: string, mark: AttendanceMark | undefined): AttendanceMarks {
  const own = { ...(marks[personId] ?? {}) };
  if (mark) own[sessionId] = mark;
  else delete own[sessionId];
  const rest = { ...marks };
  if (Object.keys(own).length) rest[personId] = own;
  else delete rest[personId];
  return rest;
}
