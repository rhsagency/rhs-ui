/**
 * The words and the small decisions behind BranchSwitcher, as plain functions:
 * they hold no state and call no hook, so a Server Component can use them too.
 */

/** What a ref is: a branch moves with the work, a tag marks one commit. */
export type RefKind = "branch" | "tag";

/** The words the switcher says, for translation. `{name}`, `{from}`, `{count}`, `{query}` and `{tab}` are filled in. */
export interface BranchSwitcherLabels {
  /** Said to a screen reader before the name on the button when a branch is chosen. Default "Branch:". */
  branchPrefix?: string;
  /** The same for a tag. Default "Tag:". */
  tagPrefix?: string;
  /** The name of the popover, for assistive technology. Default "Switch branch or tag". */
  dialog?: string;
  /** The name of the search field. Default "Find a branch or tag". */
  search?: string;
  /** The name of the button that empties the search field. Default "Clear search". */
  clearSearch?: string;
  /** The hint inside the empty search field. Default "Find a branch or tag…". */
  placeholder?: string;
  /** The first tab, and the name of its list. Default "Branches". */
  branches?: string;
  /** The second tab, and the name of its list. Default "Tags". */
  tags?: string;
  /** The heading over the refs used lately. Default "Recent". */
  recent?: string;
  /** The heading over the rest of the branches. Default "All branches". */
  allBranches?: string;
  /** The heading over the rest of the tags. Default "All tags". */
  allTags?: string;
  /** The label on the default branch. Default "default". */
  defaultMark?: string;
  /** The row that makes a new branch from what was typed. Default "Create branch {name}". */
  create?: string;
  /** The line under it that says where the branch starts. Default "from {from}". */
  createFrom?: string;
  /** The same row while the branch is being made. Default "Creating {name}…". */
  creating?: string;
  /** Said when `onCreate` failed without a message of its own. Default "The branch could not be created. Try again.". */
  createFailed?: string;
  /** Why a typed name is no branch name: it starts with a dash, a dot or a slash. */
  invalidStart?: string;
  /** It ends with a slash, a dot or ".lock". */
  invalidEnd?: string;
  /** It holds a character a name cannot hold, or two dots or slashes in a row. */
  invalidChars?: string;
  /** The button under a capped list. Default "Show {count} more". */
  showMore?: string;
  /** Said when the list is empty and nothing was typed, for branches. Default "No branches yet". */
  emptyBranches?: string;
  /** The same for tags. Default "No tags yet". */
  emptyTags?: string;
  /** Said when nothing matches what was typed, for branches. Default "No branches match “{query}”". */
  noMatchBranches?: string;
  /** The same for tags. Default "No tags match “{query}”". */
  noMatchTags?: string;
  /** The button that goes to the other tab when it has matches. Default "{count} in {tab}". */
  elsewhere?: string;
  /** The keys hint at the foot of the panel: what the arrow keys do. Default "move". */
  keysMove?: string;
  /** What Enter does. Default "choose". */
  keysChoose?: string;
  /** What Escape does while the search field is empty. Default "close". */
  keysClose?: string;
  /** What Escape does while there is text in it. Default "clear". */
  keysClear?: string;
  /** Said politely while the refs load. Default "Loading branches and tags". */
  loading?: string;
  /** Said politely when the list changes. Default "{count} found". */
  found?: string;
}

export const DEFAULT_LABELS = {
  branchPrefix: "Branch:",
  tagPrefix: "Tag:",
  dialog: "Switch branch or tag",
  search: "Find a branch or tag",
  clearSearch: "Clear search",
  placeholder: "Find a branch or tag…",
  branches: "Branches",
  tags: "Tags",
  recent: "Recent",
  allBranches: "All branches",
  allTags: "All tags",
  defaultMark: "default",
  create: "Create branch {name}",
  createFrom: "from {from}",
  creating: "Creating {name}…",
  createFailed: "The branch could not be created. Try again.",
  invalidStart: "A branch name cannot start with a dash, a dot or a slash.",
  invalidEnd: "A branch name cannot end with a slash, a dot or .lock.",
  invalidChars: "A branch name cannot hold two dots or slashes in a row, or any of ~ ^ : ? * [ \\ @{.",
  showMore: "Show {count} more",
  emptyBranches: "No branches yet",
  emptyTags: "No tags yet",
  noMatchBranches: "No branches match “{query}”",
  noMatchTags: "No tags match “{query}”",
  elsewhere: "{count} in {tab}",
  keysMove: "move",
  keysChoose: "choose",
  keysClose: "close",
  keysClear: "clear",
  loading: "Loading branches and tags",
  found: "{count} found",
} satisfies Required<BranchSwitcherLabels>;

/** An empty list that is always the same one, so a prop that was left out does not look new on every render and redo the ranking. */
export const NONE: readonly string[] = [];

/** Fills `{name}` marks in a sentence. A mark with no value stays as it is. */
export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (mark, key: string) => (key in values ? String(values[key]) : mark));
}

/** The text of a sentence before and after a `{mark}`, for putting your own element in its place: "Create branch {name}" gives ["Create branch ", ""]. */
export function around(template: string, key: string): [before: string, after: string] {
  const at = template.indexOf(`{${key}}`);
  return at === -1 ? [template, ""] : [template.slice(0, at), template.slice(at + key.length + 2)];
}

/** How a ref was found: how good the match is, and which letters of the name it used. */
export interface RefMatch {
  /** Higher is better. Only comparable within one query. */
  score: number;
  /** The positions in the name of the letters that matched, in order. */
  indices: readonly number[];
}

const SEPARATORS = new Set(["/", "-", "_", ".", " "]);

/** A position that starts a word: the first letter, one after a separator, or a capital after a small letter. */
function startsWord(name: string, at: number): boolean {
  if (at === 0) return true;
  const before = name[at - 1] ?? "";
  const here = name[at] ?? "";
  return SEPARATORS.has(before) || (before >= "a" && before <= "z" && here >= "A" && here <= "Z");
}

/** Longest query that is matched letter by letter; a longer one has to appear in the name whole. */
const MAX_SCATTERED = 32;

/**
 * Spells the query out of the letters of a name, choosing the letters that read best: those that start a
 * word score high, letters side by side score higher, and a gap costs a little. A small alignment over the
 * name and the query, linear in their lengths thanks to a running best, so a thousand names stay quick.
 */
function align(wanted: string, lower: string, name: string): RefMatch | null {
  const width = lower.length;
  const via: Int32Array[] = [];
  let before = new Float64Array(width).fill(-Infinity);
  for (let step = 0; step < wanted.length; step += 1) {
    const here = new Float64Array(width).fill(-Infinity);
    const came = new Int32Array(width).fill(-1);
    // The best place for the letter before this one, among the places at least one letter away.
    let gap = -Infinity;
    let gapAt = -1;
    for (let at = 0; at < width; at += 1) {
      if (step > 0 && at >= 2) {
        const candidate = (before[at - 2] ?? -Infinity) + 0.5 * (at - 2);
        if (candidate > gap) {
          gap = candidate;
          gapAt = at - 2;
        }
      }
      if (lower[at] !== wanted[step]) continue;
      const bonus = 1 + (startsWord(name, at) ? 8 : 0);
      if (step === 0) {
        here[at] = bonus - Math.min(at, 24) * 0.25;
        continue;
      }
      let best = -Infinity;
      let from = -1;
      const adjacent = at >= 1 ? (before[at - 1] ?? -Infinity) : -Infinity;
      if (adjacent > -Infinity) {
        best = adjacent + 6;
        from = at - 1;
      }
      if (gap > -Infinity && gap - 0.5 * (at - 1) > best) {
        best = gap - 0.5 * (at - 1);
        from = gapAt;
      }
      if (from === -1) continue;
      here[at] = best + bonus;
      came[at] = from;
    }
    via.push(came);
    before = here;
  }
  let end = -1;
  let top = -Infinity;
  before.forEach((score, at) => {
    if (score > top) {
      top = score;
      end = at;
    }
  });
  if (end === -1) return null;
  const indices: number[] = [];
  for (let step = wanted.length - 1, at = end; step >= 0 && at >= 0; step -= 1) {
    indices.push(at);
    at = via[step]?.[at] ?? -1;
  }
  indices.reverse();
  const first = indices[0] ?? 0;
  const span = (indices[indices.length - 1] ?? first) - first + 1;
  const starts = indices.filter((index) => startsWord(name, index)).length;
  // Letters strewn all over a long name are no match: they sit close together, or each one begins a word of the name.
  if (span > wanted.length + Math.max(3, wanted.length * 0.5) && starts < wanted.length) return null;
  // Nor are letters that fall in three or more pieces with none of them at the start of a word: they are just there (`fcr` is in every `refactor/…`).
  const runs = indices.reduce((count, index, at) => (at === 0 || index !== (indices[at - 1] ?? -2) + 1 ? count + 1 : count), 0);
  if (starts === 0 && runs > 2) return null;
  return { score: Math.min(390, 100 + top), indices };
}

/**
 * Matches what was typed against a ref name, ignoring case. A name that holds
 * the query whole beats one that holds its letters apart, and a match that
 * starts a name or a word beats one in the middle of a word; letters apart
 * must sit close together or begin the words of the name (`fcr` finds
 * `feature/checkout-redesign`). An empty query matches everything, with no
 * letters marked.
 */
export function matchRef(query: string, name: string): RefMatch | null {
  const wanted = query.trim().toLowerCase();
  if (!wanted) return { score: 0, indices: [] };
  const lower = name.toLowerCase();
  const whole = lower.indexOf(wanted);
  if (whole !== -1) {
    const tier = lower === wanted ? 1000 : whole === 0 ? 800 : startsWord(name, whole) ? 600 : 400;
    // Among equals the shorter name, and the match nearer the start, comes first.
    return { score: tier - Math.min(whole, 60) * 0.5 - Math.min(lower.length - wanted.length, 60) * 0.1, indices: Array.from({ length: wanted.length }, (_, step) => whole + step) };
  }
  if (wanted.length > MAX_SCATTERED || wanted.length > lower.length) return null;
  // Cheap first: can the name spell the query at all, in order?
  let reach = 0;
  for (const letter of wanted) {
    const found = lower.indexOf(letter, reach);
    if (found === -1) return null;
    reach = found + 1;
  }
  return align(wanted, lower, name);
}

/** A piece of a name, and whether the query matched it. */
export interface NameSegment {
  text: string;
  hit: boolean;
}

/** Cuts a name into runs of matched and unmatched letters, from the positions `matchRef` gave. */
export function segmentsOf(name: string, indices: readonly number[]): NameSegment[] {
  if (!indices.length) return [{ text: name, hit: false }];
  const hits = new Set(indices);
  const segments: NameSegment[] = [];
  for (let at = 0; at < name.length; at += 1) {
    const hit = hits.has(at);
    const last = segments[segments.length - 1];
    if (last && last.hit === hit) last.text += name[at] ?? "";
    else segments.push({ text: name[at] ?? "", hit });
  }
  return segments;
}

/** The part of a list of segments between two positions of the name. */
export function sliceSegments(segments: readonly NameSegment[], from: number, to: number): NameSegment[] {
  const out: NameSegment[] = [];
  let at = 0;
  for (const segment of segments) {
    const start = Math.max(from, at);
    const end = Math.min(to, at + segment.text.length);
    if (end > start) out.push({ text: segment.text.slice(start - at, end - at), hit: segment.hit });
    at += segment.text.length;
  }
  return out;
}

/**
 * Where a long name is cut so that its end stays on screen: the head can shrink
 * with an ellipsis, the tail never does, and it begins at a separator when one
 * is close, so the tail reads as the last word or two of the name. When a match
 * sits in the middle (`focus` is the position of its first letter) the tail is
 * stretched back to reach it, up to thirty letters, so what matched is what
 * stays on screen. A name that is short enough comes back whole with an empty tail.
 */
export function splitTail(name: string, tail = 14, focus?: number): [head: string, tail: string] {
  if (name.length <= tail + 8) return [name, ""];
  let cut = name.length - tail;
  if (focus !== undefined && focus < cut) cut = Math.max(focus, name.length - 30);
  // Begin the tail at a separator when one is within a few letters (a shorter tail first), so it starts at a word.
  for (const step of [0, 1, 2, 3, 4, -1, -2, -3, -4, -5]) {
    const at = cut + step;
    if (at >= 1 && at < name.length - 3 && SEPARATORS.has(name[at] ?? "")) {
      cut = at;
      break;
    }
  }
  return [name.slice(0, cut), name.slice(cut)];
}

/** What a person typed, made into a branch name: edges trimmed and spaces turned into dashes, as code hosts do. */
export function toBranchName(typed: string): string {
  return typed.trim().replace(/\s+/g, "-");
}

/** Why a name cannot be a branch name, as the key of the label that says so, or null when it can. The rules are those of `git check-ref-format`. */
export function branchNameProblem(name: string): "invalidStart" | "invalidEnd" | "invalidChars" | null {
  if (!name) return "invalidChars";
  if (/^[-./]/.test(name)) return "invalidStart";
  if (/[/.]$/.test(name) || /\.lock(\/|$)/.test(name)) return "invalidEnd";
  if (/\.\.|\/\/|@\{|[\u0000-\u001f\u007f~^:?*[\\]/.test(name) || name === "@") return "invalidChars";
  if (/(^|\/)\./.test(name)) return "invalidStart";
  return null;
}
