"use client";

import { Fragment, useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";

import { IconAlertCircle, IconFolderOpen, IconFolderPlus, IconSpinner } from "@rhs-ui/icons";
import {
  DEFAULT_LABELS,
  fill,
  folderNotes,
  messageOf,
  nameProblem,
  pathTo,
  plural,
  siblingsOf,
  visibleRows,
  withCreated,
  type CreatedFolder,
  type FolderNode,
  type MoveToLabels,
} from "@rhs-ui/application/move-to-dialog/folders";
import { FolderTree, type FolderCreation } from "@rhs-ui/application/move-to-dialog/tree";
import { Alert, AlertDescription, AlertTitle } from "@rhs-ui/primitives/alert";
import { Button } from "@rhs-ui/primitives/button";
import { DialogClose, DialogDescription, DialogTitle } from "@rhs-ui/primitives/dialog";
import { SearchInput } from "@rhs-ui/primitives/search-input";
import { cn } from "@/lib/utils";

export interface MoveToPanelProps {
  /** The tree of folders, as nested nodes: `{ id, name, children, disabled, reason }`. Folders you make in the panel are added to it until your own list holds them too. */
  folders: readonly FolderNode[];
  /** The folder the items are in now. While moving it is marked "Already here" and cannot be chosen; while copying it is only marked. Its branch starts open. */
  currentFolderId?: string;
  /** The ids of folders that are themselves among the items. They, and everything inside them, cannot be the destination, and each says why. */
  movingIds?: readonly string[];
  /** How many items are on their way: it is in the title and in the sentence at the foot. Default 1. */
  itemCount?: number;
  /** Moving or copying. Default "move". */
  mode?: "move" | "copy";
  /**
   * Does it, with the id of the chosen folder. Return a promise and the panel waits: the buttons and the tree lock while it runs, and
   * when it resolves `onClose` is called. When it rejects the panel stays as it is with the message above the tree.
   */
  onMove: (folderId: string) => void | Promise<void>;
  /** Adds "New folder" and makes the folder, inside `parentId` (null for the top level) and named `name`. Resolve with the new folder's id, or the folder itself, so it can be chosen; reject to show why it failed. */
  onCreateFolder?: (parentId: string | null, name: string) => string | FolderNode | undefined | void | Promise<string | FolderNode | undefined | void>;
  /** The chosen folder, when you control it. */
  value?: string | null;
  /** The folder chosen to begin with. Its branch starts open. */
  defaultValue?: string | null;
  /** Called with the id of the folder each time one is chosen. */
  onValueChange?: (id: string) => void;
  /** The search text to begin with. */
  defaultQuery?: string;
  /** Draw the panel on its own (a page, a sheet, a preview) instead of inside a Dialog. The title is then a plain heading. */
  standalone?: boolean;
  /** Called when the move is done, and when "Cancel" is pressed in a standalone panel. Inside a Dialog the button closes it. */
  onClose?: () => void;
  /** Called with true while the items are on their way and false after, so a dialog around the panel can refuse to close in the meantime. */
  onBusyChange?: (busy: boolean) => void;
  /** The language of the numbers and of "1 item" against "3 items". Default "en-US". */
  locale?: string;
  /** The words the panel says, for translation. */
  labels?: MoveToLabels;
  /** Classes for the panel. */
  className?: string;
}

function Heading({ standalone, className, children }: { standalone: boolean; className: string; children: ReactNode }) {
  return standalone ? <h2 className={className}>{children}</h2> : <DialogTitle className={className}>{children}</DialogTitle>;
}

function Lede({ standalone, className, children }: { standalone: boolean; className: string; children: ReactNode }) {
  return standalone ? <p className={className}>{children}</p> : <DialogDescription className={className}>{children}</DialogDescription>;
}

/** The sentence at the foot with the destination in it, spelled out as a path: Projects / 2026 / Halcyon. */
function Destination({ template, path }: { template: string; path: readonly FolderNode[] }) {
  const [before = "", ...after] = template.split("{path}");
  return (
    <>
      {before}
      <span className="font-medium text-foreground">
        {path.map((node, index) => (
          <Fragment key={node.id}>
            {index > 0 ? (
              <>
                <span aria-hidden="true" className="px-1 font-normal text-muted-foreground">
                  /
                </span>
                <span className="sr-only">, </span>
              </>
            ) : null}
            {node.name}
          </Fragment>
        ))}
      </span>
      {after.join("{path}")}
    </>
  );
}

interface Creating {
  parentId: string | null;
  name: string;
  error: string | null;
  pending: boolean;
}

/**
 * The inside of the move dialog, on its own. A searchable tree with a file manager's keyboard, where the search expands the
 * matching branches; the folder the items are in is marked "Already here", and the folders that cannot take them (the items
 * themselves and what is inside them, or any folder you disable) say why. "New folder" opens a field under the selection
 * without leaving the panel. The foot spells the destination out as a path ("Moving 3 items to Projects / 2026 / Halcyon") and
 * the button names the folder. Use it inside a Dialog, or with `standalone` anywhere else.
 */
export function MoveToPanel({
  folders,
  currentFolderId,
  movingIds = [],
  itemCount = 1,
  mode = "move",
  onMove,
  onCreateFolder,
  value,
  defaultValue = null,
  onValueChange,
  defaultQuery = "",
  standalone = false,
  onClose,
  onBusyChange,
  locale = "en-US",
  labels,
  className,
}: MoveToPanelProps) {
  const words = { ...DEFAULT_LABELS, ...labels };
  const [own, setOwn] = useState<string | null>(defaultValue);
  const [query, setQuery] = useState(defaultQuery);
  const [created, setCreated] = useState<readonly CreatedFolder[]>([]);
  const [creating, setCreating] = useState<Creating | null>(null);
  const [status, setStatus] = useState<"idle" | "pending">("idle");
  const [error, setError] = useState<string | null>(null);
  const [said, setSaid] = useState("");
  const [refocus, setRefocus] = useState<string | null>(null);
  const tree = withCreated(folders, created, locale);
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(() => {
    const open = new Set<string>();
    for (const id of [currentFolderId, defaultValue ?? value ?? undefined]) {
      if (id) for (const node of (pathTo(folders, id) ?? []).slice(0, -1)) open.add(node.id);
    }
    return open;
  });
  const list = useRef<HTMLUListElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const newButton = useRef<HTMLButtonElement>(null);
  const confirmButton = useRef<HTMLButtonElement>(null);
  const busy = useRef(false);
  // The dialog around the panel is told it is busy while the items move and while a folder is being made, and free again when neither is going on.
  const working = useRef(0);
  const begin = () => {
    working.current += 1;
    onBusyChange?.(true);
  };
  const end = () => {
    working.current = Math.max(0, working.current - 1);
    if (working.current === 0) onBusyChange?.(false);
  };

  const selected = value === undefined ? own : value;
  const pending = status === "pending";
  const count = Math.max(1, Math.round(itemCount));
  const notes = folderNotes(tree, { currentId: currentFolderId, movingIds, mode, labels: words });
  const { rows, matches } = visibleRows(tree, expanded, query);
  const path = selected ? pathTo(tree, selected) : null;
  const searching = query.trim() !== "";
  const figure = new Intl.NumberFormat(locale).format(count);
  const pick = (move: string, copy: string) => (mode === "move" ? move : copy);

  // Words for screen readers: how many folders a search left, and the folder that was just made.
  useEffect(() => {
    if (!searching) return;
    setSaid(matches === 0 ? "" : fill(plural(matches, words.matchesOne, words.matchesMany, locale), { count: new Intl.NumberFormat(locale).format(matches) }));
  }, [searching, matches]);

  // The folder that is chosen (or, with nothing chosen, the one the items are in) is brought into view in the tree when the panel opens, when a
  // different one is chosen and when the search changes: a destination named in the foot and on the button must not be somewhere out of sight in the
  // list. The tree's own box is moved, and never the page around it (scrollIntoView would move that too).
  useLayoutEffect(() => {
    const box = scroller.current;
    const find = (id: string) => box?.querySelector<HTMLElement>(`[data-folder-id="${CSS.escape(id)}"]`);
    const row = selected ? find(selected) : currentFolderId ? find(currentFolderId) : null;
    if (!box || !row) return;
    const top = row.offsetTop;
    const bottom = top + row.offsetHeight;
    if (top < box.scrollTop + 4) box.scrollTop = Math.max(0, top - 4);
    else if (bottom > box.scrollTop + box.clientHeight - 4) box.scrollTop = bottom - box.clientHeight + 4;
  }, [selected, query]); // eslint-disable-line react-hooks/exhaustive-deps

  // Focus goes where it was asked to once the row it names is on screen.
  useEffect(() => {
    if (refocus === null) return;
    list.current?.querySelector<HTMLElement>(`[data-folder-id="${CSS.escape(refocus)}"]`)?.focus({ preventScroll: true });
    setRefocus(null);
  }, [refocus]);

  function select(id: string) {
    if (value === undefined) setOwn(id);
    onValueChange?.(id);
    // The folder stays in view when the search is cleared.
    const above = (pathTo(tree, id) ?? []).slice(0, -1).map((node) => node.id);
    if (above.length) setExpanded((open) => new Set([...open, ...above]));
  }

  function toggle(id: string, open: boolean) {
    setExpanded((current) => {
      const next = new Set(current);
      if (open) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function startCreating() {
    if (creating) return;
    const parentId = selected && pathTo(tree, selected) ? selected : null;
    // The field is drawn under the folder it goes in, so the folder opens and the search steps aside.
    setQuery("");
    if (parentId) toggle(parentId, true);
    setCreating({ parentId, name: "", error: null, pending: false });
  }

  function stopCreating() {
    const parentId = creating?.parentId ?? null;
    setCreating(null);
    if (parentId) setRefocus(parentId);
    else newButton.current?.focus({ preventScroll: true });
  }

  async function createFolder() {
    if (!creating || creating.pending || !onCreateFolder) return;
    const problem = nameProblem(creating.name, siblingsOf(tree, creating.parentId), words);
    if (problem) {
      setCreating({ ...creating, error: problem });
      return;
    }
    const { parentId } = creating;
    const name = creating.name.trim();
    setCreating({ ...creating, pending: true, error: null });
    begin();
    try {
      const result = (await onCreateFolder(parentId, name)) as string | FolderNode | undefined;
      const node = typeof result === "string" ? { id: result, name } : result && typeof result === "object" ? result : null;
      if (node) {
        setCreated((current) => [...current, { parentId, node }]);
        select(node.id);
        setSaid(fill(words.created, { folder: node.name }));
        setRefocus(node.id);
      } else if (parentId) {
        setRefocus(parentId);
      } else {
        // The field is about to leave and nothing was chosen in its place: focus goes to the button that opened it, not to the page.
        newButton.current?.focus({ preventScroll: true });
      }
      setCreating(null);
    } catch (thrown) {
      setCreating((current) => (current ? { ...current, pending: false, error: messageOf(thrown) ?? words.createFailed } : current));
    } finally {
      end();
    }
  }

  async function confirm() {
    if (!selected || busy.current || creating?.pending) return;
    busy.current = true;
    setError(null);
    setStatus("pending");
    begin();
    // The tree and the buttons lock; the confirm button keeps focus, so a keyboard is not left on nothing while it works.
    confirmButton.current?.focus({ preventScroll: true });
    let done = false;
    try {
      await onMove(selected);
      done = true;
    } catch (thrown) {
      setError(messageOf(thrown) ?? words.failedBody);
    } finally {
      busy.current = false;
      setStatus("idle");
      end();
    }
    // After the busy flag is down: a dialog around the panel refuses to close while it is up.
    if (done) onClose?.();
  }

  function searchKeys(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      list.current?.querySelector<HTMLElement>('[role="treeitem"][tabindex="0"]')?.focus();
    } else if (event.key === "Enter") {
      // Type, press Enter: the first folder that matches and can be chosen is chosen.
      event.preventDefault();
      const first = rows.find((row) => (!searching || row.matched) && !notes.get(row.node.id)?.blocked);
      if (first) {
        select(first.node.id);
        setRefocus(first.node.id);
      }
    }
  }

  const creation: FolderCreation | null = creating
    ? {
        parentId: creating.parentId,
        level: (creating.parentId ? (pathTo(tree, creating.parentId)?.length ?? 0) : 0) + 1,
        value: creating.name,
        error: creating.error,
        pending: creating.pending,
        label: words.folderName,
        placeholder: words.folderPlaceholder,
        create: words.create,
        cancel: words.cancelCreate,
        onChange: (name) => setCreating((current) => (current ? { ...current, name, error: null } : current)),
        onSubmit: () => void createFolder(),
        onCancel: stopCreating,
      }
    : null;

  const template = path ? fill(plural(count, pick(words.summaryMoveOne, words.summaryCopyOne), pick(words.summaryMoveMany, words.summaryCopyMany), locale), { count: figure }) : null;
  const target = path?.[path.length - 1];
  const title = fill(plural(count, pick(words.titleMoveOne, words.titleCopyOne), pick(words.titleMoveMany, words.titleCopyMany), locale), { count: figure });

  return (
    <div data-slot="move-to-panel" data-status={status} className={cn("@container flex min-h-0 flex-col", className)}>
      <div className="shrink-0 px-5 pt-5 pr-14 pb-4 sm:px-6 sm:pt-6">
        <Heading standalone={standalone} className="text-lg leading-tight font-semibold tracking-[-0.02em]">
          {title}
        </Heading>
        <Lede standalone={standalone} className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
          {words.description}
        </Lede>
      </div>

      <div className="relative grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)] content-start gap-3 overflow-y-auto px-5 pb-5 sm:px-6">
        <div className="flex items-center gap-2">
          <SearchInput
            value={query}
            onValueChange={setQuery}
            aria-label={words.search}
            placeholder={words.search}
            disabled={pending}
            // While it holds text, the dialog leaves Escape to the field, which clears it.
            data-escape-local={query ? "" : undefined}
            onKeyDown={searchKeys}
            className="flex-1"
          />
          {onCreateFolder ? (
            // In a narrow panel the button is only its icon, and the words stay as its name.
            <Button ref={newButton} type="button" variant="outline" disabled={pending} onClick={startCreating} className="shrink-0 @max-sm:size-9 @max-sm:px-0">
              <IconFolderPlus />
              <span className="@max-sm:sr-only">{words.newFolder}</span>
            </Button>
          ) : null}
        </div>

        {error !== null ? (
          <Alert tone="destructive" role="alert" className="text-[color-mix(in_oklch,var(--destructive),var(--foreground)_20%)]">
            <IconAlertCircle />
            <AlertTitle>{pick(words.failedMove, words.failedCopy)}</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        {/* A little more than eight rows, so half of the ninth shows: a tree that ends exactly on a row does not say there is more below. */}
        <div ref={scroller} className="relative max-h-[18rem] min-h-36 overflow-y-auto rounded-lg border border-border bg-background p-1">
          {rows.length || creation ? (
            <FolderTree ref={list} rows={rows} notes={notes} selectedId={selected} query={query} label={words.tree} disabled={pending} creation={creation} onSelect={select} onOpenChange={toggle} />
          ) : (
            <p className="px-3 py-10 text-center text-sm text-muted-foreground [overflow-wrap:anywhere]">{searching ? fill(words.noMatch, { query: `“${query.trim()}”` }) : words.noFolders}</p>
          )}
        </div>

        {/* Where it is going, in words and as a path, with the room of two lines so the buttons below do not move as the path grows. */}
        <p aria-live="polite" className="flex min-h-9 items-start gap-2 text-[0.8125rem] leading-snug text-pretty text-muted-foreground">
          <IconFolderOpen aria-hidden="true" className="mt-px size-4 shrink-0" />
          <span className="min-w-0 break-words">{path && template ? <Destination template={template} path={path} /> : words.choose}</span>
        </p>
      </div>

      <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-border bg-muted/30 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
        {standalone ? (
          <Button type="button" variant="outline" disabled={pending} onClick={onClose}>
            {words.cancel}
          </Button>
        ) : (
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={pending}>
              {words.cancel}
            </Button>
          </DialogClose>
        )}
        {/* Busy is said with aria-busy and aria-disabled, not disabled: a disabled button gives up focus, which would leave a keyboard on no control until the items are there. */}
        <Button
          ref={confirmButton}
          type="button"
          disabled={!selected && !pending}
          aria-busy={pending || undefined}
          aria-disabled={pending || creating?.pending || undefined}
          onClick={() => void confirm()}
          className="max-w-full min-w-0 aria-disabled:cursor-progress"
        >
          {pending ? <IconSpinner data-slot="button-spinner" /> : null}
          <span className="min-w-0 truncate">{target ? fill(pick(words.moveTo, words.copyTo), { folder: target.name }) : pick(words.moveBare, words.copyBare)}</span>
        </Button>
      </div>
      <p role="status" className="sr-only">
        {pending ? pick(words.moving, words.copying) : creating?.pending ? words.creating : said}
      </p>
    </div>
  );
}
