/**
 * The folder logic behind the move dialog, as plain functions with no state and no hook: which folders can be chosen and
 * why not, which rows are on screen for a search, and where a new folder goes. A Server Component can use them too.
 */

/** One folder in the tree. */
export interface FolderNode {
  /** A stable identity: `onMove` receives it. */
  id: string;
  /** The name on the row, and in the path at the foot. */
  name: string;
  /** The folders inside it. */
  children?: readonly FolderNode[];
  /** Cannot be chosen as the destination, for a reason that is not about the items themselves: no permission, a full folder. Give a `reason`. */
  disabled?: boolean;
  /** Why it cannot be chosen, said on the row: "You can only view this folder". */
  reason?: string;
}

/** The words the dialog says, for translation. Use `{count}`, `{path}`, `{folder}` and `{query}` where the defaults do. */
export interface MoveToLabels {
  /** The title for one item that moves. Default "Move 1 item". */
  titleMoveOne?: string;
  /** The title for several that move. Default "Move {count} items". */
  titleMoveMany?: string;
  /** The title for one item that is copied. Default "Copy 1 item". */
  titleCopyOne?: string;
  /** The title for several that are copied. Default "Copy {count} items". */
  titleCopyMany?: string;
  /** The line under the title. Default "Choose the folder they should go to." */
  description?: string;
  /** The name of the search field, and its hint. Default "Search folders". */
  search?: string;
  /** The name of the tree, for screen readers. Default "Folders". */
  tree?: string;
  /** The button that adds a folder under the selection. Default "New folder". */
  newFolder?: string;
  /** The tag on the folder the items are already in, while moving. Default "Already here". */
  alreadyHere?: string;
  /** The tag on the folder the items are in, while copying (a copy can go there). Default "Current folder". */
  currentFolder?: string;
  /** Why the folder that is being moved cannot be the destination. Default "Can't move into itself". */
  selfMove?: string;
  /** Why the folder that is being copied cannot be the destination. Default "Can't copy into itself". */
  selfCopy?: string;
  /** Why a folder inside the one being moved cannot be the destination. Default "Inside the folder being moved". */
  insideMove?: string;
  /** Why a folder inside the one being copied cannot be the destination. Default "Inside the folder being copied". */
  insideCopy?: string;
  /** The tag on a disabled folder that gives no reason. Default "Not available". */
  unavailable?: string;
  /** What is said when the search finds nothing. Default "No folders match {query}." */
  noMatch?: string;
  /** What is said when there are no folders at all. Default "There are no folders yet." */
  noFolders?: string;
  /** Said when the search finds one folder. Default "1 folder matches". */
  matchesOne?: string;
  /** Said when it finds several. Default "{count} folders match". */
  matchesMany?: string;
  /** The foot, with nothing chosen yet. Default "Choose a destination". */
  choose?: string;
  /** The foot for one item that moves; `{path}` is the destination. Default "Moving 1 item to {path}". */
  summaryMoveOne?: string;
  /** The foot for several that move. Default "Moving {count} items to {path}". */
  summaryMoveMany?: string;
  /** The foot for one item that is copied. Default "Copying 1 item to {path}". */
  summaryCopyOne?: string;
  /** The foot for several that are copied. Default "Copying {count} items to {path}". */
  summaryCopyMany?: string;
  /** The confirm button with nothing chosen. Default "Move". */
  moveBare?: string;
  /** The confirm button naming the folder. Default "Move to {folder}". */
  moveTo?: string;
  /** The confirm button with nothing chosen, while copying. Default "Copy". */
  copyBare?: string;
  /** The confirm button naming the folder, while copying. Default "Copy to {folder}". */
  copyTo?: string;
  /** The button that leaves. Default "Cancel". */
  cancel?: string;
  /** Said while the items move. Default "Moving". */
  moving?: string;
  /** Said while they are copied. Default "Copying". */
  copying?: string;
  /** The heading of the message after a failed move. Default "Could not move the items". */
  failedMove?: string;
  /** The heading of the message after a failed copy. Default "Could not copy the items". */
  failedCopy?: string;
  /** The message when the failure carries none. Default "Nothing was changed. Try again." */
  failedBody?: string;
  /** The name of the new folder's field. Default "Name of the new folder". */
  folderName?: string;
  /** The hint in that field. Default "Folder name". */
  folderPlaceholder?: string;
  /** The button that creates it. Default "Create". */
  create?: string;
  /** The button that gives up on it. Default "Cancel". */
  cancelCreate?: string;
  /** Said while the folder is created. Default "Creating folder". */
  creating?: string;
  /** Said once it exists. Default "Folder {folder} created". */
  created?: string;
  /** What is said when the name is empty. Default "Enter a name." */
  nameEmpty?: string;
  /** What is said when the name has a slash in it. Default "A folder name can't contain / or \\." */
  nameSlash?: string;
  /** What is said when a folder of that name is already there. Default "A folder with this name already exists here." */
  nameTaken?: string;
  /** What is said when creating the folder failed without a message. Default "Could not create the folder." */
  createFailed?: string;
  /** The name of the corner button. Default "Close". */
  closeIcon?: string;
}

export const DEFAULT_LABELS = {
  titleMoveOne: "Move 1 item",
  titleMoveMany: "Move {count} items",
  titleCopyOne: "Copy 1 item",
  titleCopyMany: "Copy {count} items",
  description: "Choose the folder they should go to.",
  search: "Search folders",
  tree: "Folders",
  newFolder: "New folder",
  alreadyHere: "Already here",
  currentFolder: "Current folder",
  selfMove: "Can't move into itself",
  selfCopy: "Can't copy into itself",
  insideMove: "Inside the folder being moved",
  insideCopy: "Inside the folder being copied",
  unavailable: "Not available",
  noMatch: "No folders match {query}.",
  noFolders: "There are no folders yet.",
  matchesOne: "1 folder matches",
  matchesMany: "{count} folders match",
  choose: "Choose a destination",
  summaryMoveOne: "Moving 1 item to {path}",
  summaryMoveMany: "Moving {count} items to {path}",
  summaryCopyOne: "Copying 1 item to {path}",
  summaryCopyMany: "Copying {count} items to {path}",
  moveBare: "Move",
  moveTo: "Move to {folder}",
  copyBare: "Copy",
  copyTo: "Copy to {folder}",
  cancel: "Cancel",
  moving: "Moving",
  copying: "Copying",
  failedMove: "Could not move the items",
  failedCopy: "Could not copy the items",
  failedBody: "Nothing was changed. Try again.",
  folderName: "Name of the new folder",
  folderPlaceholder: "Folder name",
  create: "Create",
  cancelCreate: "Cancel",
  creating: "Creating folder",
  created: "Folder {folder} created",
  nameEmpty: "Enter a name.",
  nameSlash: "A folder name can't contain / or \\.",
  nameTaken: "A folder with this name already exists here.",
  createFailed: "Could not create the folder.",
  closeIcon: "Close",
} satisfies Required<MoveToLabels>;

/** Puts values into a template: `fill("Move to {folder}", { folder: "Halcyon" })`. A name it does not know is left as it was. */
export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => (key in values ? String(values[key]) : match));
}

/** `one` for 1 in the locale's own rules, `other` for the rest. */
export function plural(count: number, one: string, other: string, locale: string): string {
  try {
    return new Intl.PluralRules(locale).select(count) === "one" ? one : other;
  } catch {
    return count === 1 ? one : other;
  }
}

/** The words of whatever was thrown: a string, or the message of an error or of any object that has one. */
export function messageOf(thrown: unknown): string | null {
  const text = typeof thrown === "string" ? thrown : (thrown as { message?: unknown } | null | undefined)?.message;
  return typeof text === "string" && text.trim() ? text : null;
}

/** The folders from the top down to the one with this id, or null when it is not in the tree. */
export function pathTo(tree: readonly FolderNode[], id: string): FolderNode[] | null {
  for (const node of tree) {
    if (node.id === id) return [node];
    const below = node.children ? pathTo(node.children, id) : null;
    if (below) return [node, ...below];
  }
  return null;
}

/** What is said about a row besides its name: the reason it cannot be chosen, or a plain mark. */
export interface FolderNote {
  /** The words on the row. */
  text: string;
  /** The folder cannot be the destination: the row is dimmed and is not chosen by a click or a key. */
  blocked: boolean;
}

export interface NoteOptions {
  /** Where the items are now. */
  currentId?: string;
  /** The folders that are themselves being moved or copied: they, and everything inside them, cannot be the destination. */
  movingIds: readonly string[];
  mode: "move" | "copy";
  labels: Required<MoveToLabels>;
}

/**
 * A note for every folder that is not an ordinary destination. The folders being moved and what is inside them cannot take
 * themselves; the folder the items are in is "Already here" while moving and just marked while copying (a copy can go
 * next to its original); and a folder with `disabled` says why. The first reason that applies is the one shown.
 */
export function folderNotes(tree: readonly FolderNode[], { currentId, movingIds, mode, labels }: NoteOptions): Map<string, FolderNote> {
  const notes = new Map<string, FolderNote>();
  const moving = new Set(movingIds);
  const walk = (list: readonly FolderNode[], inside: boolean) => {
    for (const node of list) {
      const itself = moving.has(node.id);
      if (itself) notes.set(node.id, { text: mode === "move" ? labels.selfMove : labels.selfCopy, blocked: true });
      else if (inside) notes.set(node.id, { text: mode === "move" ? labels.insideMove : labels.insideCopy, blocked: true });
      else if (node.id === currentId) notes.set(node.id, mode === "move" ? { text: labels.alreadyHere, blocked: true } : { text: labels.currentFolder, blocked: false });
      else if (node.disabled) notes.set(node.id, { text: node.reason ?? labels.unavailable, blocked: true });
      if (node.children) walk(node.children, inside || itself);
    }
  };
  walk(tree, false);
  return notes;
}

/** A folder made inside the dialog, kept until the `folders` you pass hold it too. */
export interface CreatedFolder {
  /** The folder it is inside, or null for the top level. */
  parentId: string | null;
  node: FolderNode;
}

function sorted(list: readonly FolderNode[], locale: string): boolean {
  return list.every((node, index) => index === 0 || (list[index - 1] as FolderNode).name.localeCompare(node.name, locale, { sensitivity: "base" }) <= 0);
}

/** Puts a node among its siblings: in alphabetical order when they already are, and at the end when they are not. */
function insert(list: readonly FolderNode[], node: FolderNode, locale: string): FolderNode[] {
  if (!sorted(list, locale)) return [...list, node];
  const at = list.findIndex((other) => other.name.localeCompare(node.name, locale, { sensitivity: "base" }) > 0);
  return at < 0 ? [...list, node] : [...list.slice(0, at), node, ...list.slice(at)];
}

/**
 * The tree with the folders made inside the dialog added. One that the tree already holds (the same id, or the same name in
 * the same place) is left out, so a parent that re-sends its folders after creating one never shows it twice.
 */
export function withCreated(tree: readonly FolderNode[], created: readonly CreatedFolder[], locale: string): readonly FolderNode[] {
  if (!created.length) return tree;
  const attach = (list: readonly FolderNode[], parentId: string | null): FolderNode[] => {
    let next = list.map((node) => (node.children?.length || created.some((entry) => entry.parentId === node.id) ? { ...node, children: attach(node.children ?? [], node.id) } : node));
    for (const entry of created) {
      if (entry.parentId !== parentId) continue;
      const taken = list.some((node) => node.id === entry.node.id || node.name.trim().toLowerCase() === entry.node.name.trim().toLowerCase());
      // A folder made inside a folder that was itself just made is not in the tree yet, so its own folders are attached on the way in.
      if (!taken) next = insert(next, created.some((other) => other.parentId === entry.node.id) ? { ...entry.node, children: attach(entry.node.children ?? [], entry.node.id) } : entry.node, locale);
    }
    return next;
  };
  return attach(tree, null);
}

/** One line of the tree as it is on screen. */
export interface TreeRow {
  node: FolderNode;
  /** How deep it is, from 1. */
  level: number;
  /** The id of the folder it is in, or null at the top. */
  parent: string | null;
  /** Its place among the folders beside it, from 1. */
  position: number;
  /** How many folders are beside it. */
  size: number;
  /** Whether a chevron is shown: it has folders to show. */
  hasChildren: boolean;
  /** Whether those folders are on screen. */
  open: boolean;
  /** The search matched this folder's own name. */
  matched: boolean;
}

interface Kept {
  node: FolderNode;
  hit: boolean;
  kids: Kept[];
}

/**
 * The rows that are on screen. Without a search, a folder's children show when it is in `expanded`. With one, only the folders
 * whose name holds the text show, together with the folders they sit in, and those are all open: the matching branches expand
 * by themselves and nothing else is in the way. `matches` is how many names matched.
 */
export function visibleRows(tree: readonly FolderNode[], expanded: ReadonlySet<string>, query: string): { rows: TreeRow[]; matches: number } {
  const needle = query.trim().toLowerCase();
  const rows: TreeRow[] = [];
  if (!needle) {
    const walk = (list: readonly FolderNode[], level: number, parent: string | null) => {
      list.forEach((node, index) => {
        const hasChildren = Boolean(node.children?.length);
        const open = hasChildren && expanded.has(node.id);
        rows.push({ node, level, parent, position: index + 1, size: list.length, hasChildren, open, matched: false });
        if (open && node.children) walk(node.children, level + 1, node.id);
      });
    };
    walk(tree, 1, null);
    return { rows, matches: 0 };
  }
  let matches = 0;
  const keep = (list: readonly FolderNode[]): Kept[] =>
    list.flatMap((node) => {
      const kids = node.children ? keep(node.children) : [];
      const hit = node.name.toLowerCase().includes(needle);
      if (hit) matches += 1;
      return hit || kids.length ? [{ node, hit, kids }] : [];
    });
  const walk = (list: readonly Kept[], level: number, parent: string | null) => {
    list.forEach((entry, index) => {
      rows.push({ node: entry.node, level, parent, position: index + 1, size: list.length, hasChildren: entry.kids.length > 0, open: entry.kids.length > 0, matched: entry.hit });
      walk(entry.kids, level + 1, entry.node.id);
    });
  };
  walk(keep(tree), 1, null);
  return { rows, matches };
}

/** A name split around the first place the search text occurs in it, for marking it. Null when it does not occur. */
export function splitMatch(name: string, query: string): [string, string, string] | null {
  const needle = query.trim().toLowerCase();
  if (!needle) return null;
  const at = name.toLowerCase().indexOf(needle);
  return at < 0 ? null : [name.slice(0, at), name.slice(at, at + needle.length), name.slice(at + needle.length)];
}

/** What is wrong with a new folder's name, in words, or null when it can be used. `siblings` are the folders it would sit beside. */
export function nameProblem(raw: string, siblings: readonly FolderNode[], labels: Required<MoveToLabels>): string | null {
  const name = raw.trim();
  if (!name) return labels.nameEmpty;
  if (/[\\/]/.test(name)) return labels.nameSlash;
  if (siblings.some((node) => node.name.trim().toLowerCase() === name.toLowerCase())) return labels.nameTaken;
  return null;
}

/** The folders a new one would sit beside: the children of the folder it goes in, or the top level. */
export function siblingsOf(tree: readonly FolderNode[], parentId: string | null): readonly FolderNode[] {
  if (parentId === null) return tree;
  const path = pathTo(tree, parentId);
  return path ? (path[path.length - 1]?.children ?? []) : [];
}
