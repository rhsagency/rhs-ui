/** The four letters of a RACI chart. */
export type RaciRole = "R" | "A" | "C" | "I";

export interface RaciRoleInfo {
  key: RaciRole;
  /** The full word. It is the cell's accessible name and the label in the menu. */
  word: string;
  /** What the role does, in a few words, for the legend and the menu. */
  meaning: string;
}

const RESPONSIBLE: RaciRoleInfo = { key: "R", word: "Responsible", meaning: "Does the work" };
const ACCOUNTABLE: RaciRoleInfo = { key: "A", word: "Accountable", meaning: "Owns the result and signs it off" };
const CONSULTED: RaciRoleInfo = { key: "C", word: "Consulted", meaning: "Gives input before it is decided" };
const INFORMED: RaciRoleInfo = { key: "I", word: "Informed", meaning: "Hears the outcome afterwards" };

/** The four roles in the order of the acronym. */
export const RACI_ROLES: readonly RaciRoleInfo[] = [RESPONSIBLE, ACCOUNTABLE, CONSULTED, INFORMED];

export const ROLE_INFO: Readonly<Record<RaciRole, RaciRoleInfo>> = { R: RESPONSIBLE, A: ACCOUNTABLE, C: CONSULTED, I: INFORMED };

export interface RaciTask {
  /** Stable identity, the first key of `value`. */
  id: string;
  /** What has to happen: "Design review". It is the row header. */
  label: string;
  /** Folds this task under a heading. Tasks without a group sit above the groups. */
  group?: string;
}

export interface RaciPerson {
  /** Stable identity, the second key of `value`. */
  id: string;
  /** Who it is: "Mara Visser". It is the column header and is read out in every cell. */
  name: string;
  /** What they do, under the name: "Product lead". */
  role?: string;
}

/** Who plays which role: `value[taskId][personId]`. A missing entry means the person is not involved. */
export type RaciValue = Readonly<Record<string, Readonly<Record<string, RaciRole | undefined>>>>;

/** What one edit changed, handed to `onValueChange` next to the whole new map. */
export interface RaciChange {
  taskId: string;
  personId: string;
  /** The new role, or `undefined` when the person is no longer involved. */
  role: RaciRole | undefined;
}

export const isRole = (candidate: unknown): candidate is RaciRole => candidate === "R" || candidate === "A" || candidate === "C" || candidate === "I";

/** The role of one person on one task. Anything that is not R, A, C or I counts as not involved. */
export function roleOf(value: RaciValue, taskId: string, personId: string): RaciRole | undefined {
  const role = value[taskId]?.[personId];
  return isRole(role) ? role : undefined;
}

/** The role a step away from this one, wrapping through "not involved": none, R, A, C, I, none. */
export function stepRole(role: RaciRole | undefined, direction: 1 | -1): RaciRole | undefined {
  const order: readonly (RaciRole | undefined)[] = [undefined, "R", "A", "C", "I"];
  const at = order.indexOf(role);
  return order[(at + direction + order.length) % order.length];
}

/** A new map with one cell changed. The old map is never touched, and a cleared cell leaves no key behind. */
export function withRole(value: RaciValue, taskId: string, personId: string, role: RaciRole | undefined): RaciValue {
  const row: Record<string, RaciRole | undefined> = { ...value[taskId] };
  if (role === undefined) delete row[personId];
  else row[personId] = role;
  return { ...value, [taskId]: row };
}

export interface TaskTally {
  /** How many people are accountable. A healthy task has exactly one. */
  accountable: number;
  /** How many people have any role at all. */
  involved: number;
  /** `none` and `many` are the two ways to get accountability wrong. */
  problem: "none" | "many" | null;
}

export function tallyTask(value: RaciValue, task: RaciTask, people: readonly RaciPerson[]): TaskTally {
  let accountable = 0;
  let involved = 0;
  for (const person of people) {
    const role = roleOf(value, task.id, person.id);
    if (role) involved += 1;
    if (role === "A") accountable += 1;
  }
  return { accountable, involved, problem: accountable === 0 ? "none" : accountable > 1 ? "many" : null };
}

export interface PersonTally {
  R: number;
  A: number;
  C: number;
  I: number;
  /** Tasks they do or answer for: responsible plus accountable. */
  carries: number;
  /** Tasks they are part of in any way. */
  involved: number;
}

export function tallyPerson(value: RaciValue, person: RaciPerson, tasks: readonly RaciTask[]): PersonTally {
  const tally: PersonTally = { R: 0, A: 0, C: 0, I: 0, carries: 0, involved: 0 };
  for (const task of tasks) {
    const role = roleOf(value, task.id, person.id);
    if (!role) continue;
    tally[role] += 1;
    tally.involved += 1;
    if (role === "R" || role === "A") tally.carries += 1;
  }
  return tally;
}

export interface TaskSection {
  /** Unique within the matrix, safe as a React key. */
  key: string;
  /** The heading, or `undefined` for tasks that belong to no group. */
  group: string | undefined;
  tasks: RaciTask[];
}

/** Tasks gathered under their group, in the order the groups first appear. Tasks without a group come first, above every heading. */
export function sectionsOf(tasks: readonly RaciTask[]): TaskSection[] {
  const sections: TaskSection[] = [];
  const byGroup = new Map<string, TaskSection>();
  for (const task of tasks) {
    const group = task.group?.trim() ? task.group : undefined;
    const key = group === undefined ? "\u0000ungrouped" : `group:${group}`;
    let section = byGroup.get(key);
    if (!section) {
      section = { key, group, tasks: [] };
      byGroup.set(key, section);
      sections.push(section);
    }
    section.tasks.push(task);
  }
  // A stable sort: the section without a group moves to the front, and the groups keep the order they first appeared in.
  return sections.sort((a, b) => Number(b.group === undefined) - Number(a.group === undefined));
}

/**
 * Scrolls a region sideways, just far enough for a cell the keyboard has reached to sit clear of the pinned
 * task names on its left and inside the edge on its right. A browser leaves a focused cell where it is while
 * any sliver of it shows, and here that can be a sliver beside the task names or at the edge, so the keyboard
 * would sit on a cell it cannot see. The table cell around the chip is what is brought in, so the focus ring
 * has room as well. A click never moves the table.
 */
export function clearOfPinned(region: HTMLElement, cell: HTMLElement): void {
  try {
    if (!cell.matches(":focus-visible")) return;
  } catch {
    // A browser without :focus-visible: go on, because the keyboard is the case that matters.
  }
  const area = region.getBoundingClientRect();
  const box = (cell.closest("td") ?? cell).getBoundingClientRect();
  const left = Math.max(area.left + region.clientLeft, region.querySelector<HTMLElement>("thead th")?.getBoundingClientRect().right ?? 0);
  const right = area.left + region.clientLeft + region.clientWidth;
  // A cell wider than the free room lines up with its start.
  if (box.left < left) region.scrollLeft -= left - box.left;
  else if (box.right > right) region.scrollLeft += Math.min(box.right - right, box.left - left);
}

/** "Nobody is accountable" or "2 people are accountable": the words next to the mark on a row that needs fixing. */
export function problemWords(tally: TaskTally): string {
  return tally.problem === "none" ? "Nobody is accountable" : `${tally.accountable} people are accountable`;
}

/** The one line above the matrix, in words, for what is wrong across every task. Empty when there are no tasks. */
export function verdictWords(tallies: readonly TaskTally[]): string {
  if (tallies.length === 0) return "";
  const none = tallies.filter((tally) => tally.problem === "none").length;
  const many = tallies.filter((tally) => tally.problem === "many").length;
  const task = (count: number): string => (count === 1 ? "1 task has" : `${count} tasks have`);
  if (none + many === 0) return "Every task has exactly one accountable person.";
  if (many === 0) return `${task(none)} no accountable person.`;
  if (none === 0) return `${task(many)} more than one accountable person.`;
  return `${none + many} tasks need attention: ${none} with no accountable person, ${many} with more than one.`;
}
