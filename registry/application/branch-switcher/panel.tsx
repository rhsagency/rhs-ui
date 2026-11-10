"use client";

import { useDeferredValue, useEffect, useId, useMemo, useRef, useState, type ComponentProps, type KeyboardEvent, type ReactNode } from "react";

import { IconAlertCircle, IconCheck, IconClose, IconPlus, IconSearch, IconSpinner } from "@rhs-ui/icons";
import {
  DEFAULT_LABELS,
  NONE,
  around,
  branchNameProblem,
  fill,
  matchRef,
  segmentsOf,
  sliceSegments,
  splitTail,
  toBranchName,
  type BranchSwitcherLabels,
  type NameSegment,
  type RefKind,
  type RefMatch,
} from "@rhs-ui/application/branch-switcher/refs";
import { Badge } from "@rhs-ui/primitives/badge";
import { Kbd } from "@rhs-ui/primitives/kbd";
import { Skeleton } from "@rhs-ui/primitives/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@rhs-ui/primitives/tabs";
import { cn } from "@/lib/utils";

export interface BranchPanelProps extends Omit<ComponentProps<"div">, "children" | "onChange"> {
  /** Every branch of the repository, by name, in the order they should be listed. */
  branches: readonly string[];
  /** Every tag, by name. */
  tags?: readonly string[];
  /** The refs used lately, newest first, branches and tags together. They sit on top while nothing is typed. */
  recent?: readonly string[];
  /** The ref in use: it is checked in its list, and the panel opens on its tab. */
  value?: string;
  /** The default branch: marked in the list and put first among the branches. */
  defaultRef?: string;
  /** The ref a new branch starts from. Default the default branch, or else the first branch. */
  createFrom?: string;
  /** A ref was chosen, with the kind of list it came from. */
  onChoose: (ref: string, kind: RefKind) => void;
  /** Makes the row "Create branch …" appear when what is typed is no branch yet. It may return a promise: the row shows a spinner while it runs, and if it rejects its message is shown and the panel stays. When it resolves the new branch is chosen. */
  onCreate?: (name: string, from: string) => void | Promise<void>;
  /** The refs are still on their way: the list shows placeholders. */
  loading?: boolean;
  /** How many refs show before "Show more". Default 40. */
  pageSize?: number;
  /** What the search field holds at the start. Default nothing. */
  defaultQuery?: string;
  /** Put the cursor in the search field when the panel appears. Default true. */
  autoFocus?: boolean;
  /** The words the panel says, for translation. */
  labels?: BranchSwitcherLabels;
}

const RECENT_LIMIT = 5;

interface RefRow {
  type: "ref";
  key: string;
  name: string;
  match: RefMatch | null;
  current: boolean;
  isDefault: boolean;
  group: "recent" | "all" | "match";
}

interface CreateRow {
  type: "create";
  key: string;
  name: string;
  from: string;
  problem: "invalidStart" | "invalidEnd" | "invalidChars" | null;
}

type Row = RefRow | CreateRow;

const selectable = (row: Row): boolean => row.type === "ref" || row.problem === null;

/** The refs of one list, ranked by how well they match what is typed; with nothing typed, the recent ones first and the default branch at the head of the rest. */
function rank(names: readonly string[], query: string, recent: readonly string[], defaultRef: string | undefined, kind: RefKind): Omit<RefRow, "current" | "isDefault">[] {
  const unique = [...new Set(names)];
  const known = new Set(unique);
  const used = new Map(recent.map((name, at) => [name, at]));
  const typed = query.trim();
  if (typed) {
    const hits: { name: string; match: RefMatch; order: number }[] = [];
    unique.forEach((name, order) => {
      const match = matchRef(typed, name);
      if (match) hits.push({ name, match, order });
    });
    hits.sort((a, b) => b.match.score - a.match.score || (used.get(a.name) ?? Infinity) - (used.get(b.name) ?? Infinity) || a.order - b.order);
    return hits.map(({ name, match }) => ({ type: "ref", key: `ref:${name}`, name, match, group: "match" }));
  }
  const latest = [...new Set(recent)].filter((name) => known.has(name)).slice(0, RECENT_LIMIT);
  const rest = unique.filter((name) => !latest.includes(name));
  if (kind === "branch" && defaultRef && rest.includes(defaultRef)) rest.unshift(...rest.splice(rest.indexOf(defaultRef), 1));
  return [
    ...latest.map((name) => ({ type: "ref" as const, key: `ref:${name}`, name, match: null, group: "recent" as const })),
    ...rest.map((name) => ({ type: "ref" as const, key: `ref:${name}`, name, match: null, group: "all" as const })),
  ];
}

function marks(segments: readonly NameSegment[]): ReactNode {
  return segments.map((segment, at) =>
    segment.hit ? (
      <mark key={at} className="bg-transparent font-semibold text-foreground">
        {segment.text}
      </mark>
    ) : (
      <span key={at}>{segment.text}</span>
    ),
  );
}

/**
 * A ref name that fits: the head gives way with an ellipsis and the tail (the last word or two) stays, so
 * `feature/PAY-1428-retry-failed-webhook-deliveries` never loses the part that tells it apart. The matched
 * letters are drawn bold, and the whole name is said once, whole, to a screen reader.
 */
export function RefName({ name, indices = [], className }: { name: string; indices?: readonly number[]; className?: string }) {
  const [head, tail] = splitTail(name, 14, indices[0]);
  const segments = segmentsOf(name, indices);
  return (
    <span data-slot="branch-switcher-name" className={cn("flex min-w-0 items-baseline", indices.length ? "text-muted-foreground" : "", className)}>
      <span className="sr-only">{name}</span>
      <span aria-hidden="true" className="flex min-w-0 items-baseline">
        <span className="truncate">{marks(sliceSegments(segments, 0, head.length))}</span>
        {tail ? <span className="shrink-0 whitespace-pre">{marks(sliceSegments(segments, head.length, name.length))}</span> : null}
      </span>
    </span>
  );
}

const OPTION =
  "relative flex min-h-9 w-full scroll-m-1 cursor-default items-center gap-2 rounded-md px-2 text-left text-sm select-none data-[active]:bg-muted aria-disabled:cursor-not-allowed aria-disabled:opacity-60";

/**
 * What the switcher's popover holds, and usable on its own in a sheet on a phone: a search field, the Branches
 * and Tags tabs and one list of refs. Typing filters the list and draws the letters that matched in bold;
 * a name that fits what was typed best comes first, and a ref used lately wins a tie. The list is a listbox
 * driven from the search field (Arrow keys move, Enter takes the highlighted row, PageUp and PageDown jump),
 * and Escape empties the field before anything closes. Only the first `pageSize` rows are drawn, so a
 * repository with thousands of refs stays fast; Arrow Down at the end draws the next batch, as does the
 * "Show more" button. When what was typed is no branch yet and `onCreate` exists, a row on top makes it.
 */
export function BranchPanel({
  branches,
  tags = NONE,
  recent = NONE,
  value,
  defaultRef,
  createFrom,
  onChoose,
  onCreate,
  loading = false,
  pageSize = 40,
  defaultQuery = "",
  autoFocus = true,
  labels,
  className,
  ...props
}: BranchPanelProps) {
  const words = { ...DEFAULT_LABELS, ...labels };
  const base = useId();
  const list = useRef<HTMLDivElement>(null);
  const field = useRef<HTMLInputElement>(null);
  const [typed, setTyped] = useState(defaultQuery);
  const query = useDeferredValue(typed);
  const [kind, setKind] = useState<RefKind>(() => (value !== undefined && !branches.includes(value) && tags.includes(value) ? "tag" : "branch"));
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [limit, setLimit] = useState(pageSize);
  const [creating, setCreating] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);

  const names = kind === "branch" ? branches : tags;
  const ranked = useMemo(() => rank(names, query, recent, defaultRef, kind), [names, query, recent, defaultRef, kind]);
  const refs: RefRow[] = ranked.map((row) => ({ ...row, current: row.name === value, isDefault: kind === "branch" && row.name === defaultRef }));

  // The tabs say how many refs they hold, or while typing how many match: so a match in the other tab is never missed.
  const counts = useMemo(() => {
    const typedQuery = query.trim();
    const count = (items: readonly string[]) => (typedQuery ? new Set(items.filter((name) => matchRef(typedQuery, name))).size : new Set(items).size);
    return { branch: count(branches), tag: count(tags) };
  }, [branches, tags, query]);

  const from = createFrom ?? defaultRef ?? branches[0];
  const candidate = toBranchName(query);
  const offered = kind === "branch" && !!onCreate && !loading && !!candidate && !!from && !branches.includes(candidate);
  const create: CreateRow | null = offered ? { type: "create", key: `create:${candidate}`, name: candidate, from: from ?? "", problem: branchNameProblem(candidate) } : null;

  // The first `limit` refs are drawn; the current ref is always among them, so opening the list never hides the check.
  const currentAt = refs.findIndex((row) => row.current);
  const shown = Math.min(refs.length, Math.max(limit, currentAt + 1));
  const hidden = refs.length - shown;
  const rows: Row[] = [...(create ? [create] : []), ...refs.slice(0, shown)];
  const steps = rows.filter(selectable);

  const typedAny = query.trim() !== "";
  const other: RefKind = kind === "branch" ? "tag" : "branch";
  const otherMatches = typedAny && !loading ? counts[other] : 0;
  // What was typed is in no ref of this list but in some of the other one (a tag, while the branches are shown): the create row is
  // offered, and is not the default, so Enter never makes a branch for someone who was looking for a tag.
  const elsewhere = refs.length === 0 && otherMatches > 0;

  // Where the highlight is: where it was put, or the current ref, or the first match, or the create row when nothing matches.
  const fallback = typedAny ? (refs[0]?.key ?? (create && selectable(create) && !elsewhere ? create.key : undefined)) : (refs.find((row) => row.current)?.key ?? refs[0]?.key);
  const active = steps.find((row) => row.key === activeKey)?.key ?? fallback;
  const idOf = (row: Row) => `${base}-r${rows.indexOf(row)}`;
  const activeRow = rows.find((row) => row.key === active);

  // The highlighted row stays in view without moving anything but the list.
  useEffect(() => {
    const box = list.current;
    const row = box?.querySelector("[data-active]");
    if (!box || !row) return;
    const edge = box.getBoundingClientRect();
    const at = row.getBoundingClientRect();
    if (at.top < edge.top) box.scrollTop -= edge.top - at.top + 4;
    else if (at.bottom > edge.bottom) box.scrollTop += at.bottom - edge.bottom + 4;
  }, [active, shown]);

  const heading = (group: RefRow["group"]) => (group === "recent" ? words.recent : kind === "branch" ? words.allBranches : words.allTags);
  // The create row puts the new name where the sentence has its mark: "Create branch " + name, or "Creating " + name + "…".
  const [createBefore, createAfter] = around(creating ? words.creating : words.create, "name");
  const groups: { group: RefRow["group"]; rows: Row[] }[] = [];
  if (create) groups.push({ group: "match", rows: [create] });
  for (const row of rows) {
    if (row.type !== "ref") continue;
    const last = groups[groups.length - 1];
    if (last && last.group === row.group && last.rows[0]?.type === "ref") last.rows.push(row);
    else groups.push({ group: row.group, rows: [row] });
  }
  const headed = !typedAny && groups.length > 1;

  function move(delta: number) {
    if (!steps.length) return;
    const at = steps.findIndex((row) => row.key === active);
    // With nothing highlighted yet, Arrow Down goes to the first row and Arrow Up to the last.
    const next = at === -1 ? (delta > 0 ? 0 : steps.length - 1) : Math.max(0, Math.min(steps.length - 1, at + delta));
    if (delta > 0 && at === steps.length - 1 && hidden > 0) {
      // Arrow Down at the end of what is drawn draws the next batch and goes on into it.
      const following = refs[shown];
      setLimit(shown + pageSize);
      if (following) setActiveKey(following.key);
      return;
    }
    setActiveKey(steps[next]?.key ?? null);
  }

  function choose(row: Row | undefined) {
    if (!row || creating) return;
    if (row.type === "ref") {
      onChoose(row.name, kind);
      return;
    }
    if (row.problem || !onCreate) return;
    setCreating(true);
    setFailure(null);
    (async () => {
      try {
        await onCreate(row.name, row.from);
        onChoose(row.name, "branch");
      } catch (error) {
        setFailure(error instanceof Error && error.message.trim() ? error.message.trim() : words.createFailed);
      } finally {
        setCreating(false);
      }
    })();
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.nativeEvent.isComposing) return;
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      move(event.key === "ArrowDown" ? 1 : -1);
    } else if (event.key === "PageDown" || event.key === "PageUp") {
      event.preventDefault();
      move(event.key === "PageDown" ? 8 : -8);
    } else if (event.key === "Enter") {
      event.preventDefault();
      choose(activeRow);
    } else if (event.key === "Escape" && event.currentTarget.value !== "") {
      // The popover's own Escape is turned off while there is text (see BranchSwitcher): empty the field first.
      event.preventDefault();
      setTyped("");
      setActiveKey(null);
      setLimit(pageSize);
    }
  }

  function restart(next: string) {
    setTyped(next);
    setActiveKey(null);
    setLimit(pageSize);
    setFailure(null);
  }

  const noun = kind === "branch" ? words.branches : words.tags;
  const status = loading
    ? words.loading
    : creating && create
      ? fill(words.creating, { name: create.name })
      : fill(words.found, { count: refs.length + (create && selectable(create) ? 1 : 0) });
  const listId = `${base}-list`;

  const body = (
    // Pressing a row, or a button beside the list, must not take the cursor out of the search field.
    <div onMouseDown={(event) => event.preventDefault()} className="flex min-h-0 flex-1 flex-col">
      {/* The listbox is what scrolls, and it holds options and groups of them, nothing else: the empty message and the button for more sit beside it. It is driven from the search field, so it has no stop of its own in the Tab order (tabIndex -1: a scroller would otherwise be one). It is as tall as its rows, up to 18rem, and gives way when the room around it is smaller. */}
      <div ref={list} id={listId} role="listbox" tabIndex={-1} aria-label={noun} aria-busy={loading || undefined} className="relative max-h-[min(18rem,45dvh)] min-h-0 overflow-y-auto overscroll-contain p-1.5">
        {loading
          ? null
          : groups.map((group, at) => {
            const labelled = headed && group.rows[0]?.type === "ref";
            const headingId = `${base}-g${at}`;
            return (
              <div key={`${group.group}-${at}`} role="group" aria-labelledby={labelled ? headingId : undefined} className={cn(at > 0 && (labelled ? "mt-1" : "mt-1.5 border-t border-border pt-1.5"))}>
                {labelled ? (
                  <div id={headingId} role="presentation" className="px-2 pt-1.5 pb-1 font-mono text-[0.6875rem] tracking-wide text-muted-foreground uppercase">
                    {heading(group.group)}
                  </div>
                ) : null}
                {group.rows.map((row) => {
                  const id = idOf(row);
                  if (row.type === "create") {
                    const disabled = row.problem !== null;
                    return (
                      <div
                        key={row.key}
                        id={id}
                        role="option"
                        aria-selected={false}
                        aria-disabled={disabled || creating || undefined}
                        aria-describedby={disabled ? `${id}-why` : undefined}
                        data-active={active === row.key ? "" : undefined}
                        onClick={() => choose(row)}
                        onPointerMove={() => !disabled && active !== row.key && setActiveKey(row.key)}
                        // Only the tile and the name give way when the row is off. The reason a name is refused is the one line that says what to fix, so it keeps its full colour.
                        className={cn(OPTION, "group/create items-start py-2 aria-disabled:opacity-100")}
                      >
                        <span aria-hidden="true" className="mt-px grid size-5 shrink-0 place-items-center rounded-md border border-border bg-background text-muted-foreground group-aria-disabled/create:opacity-60">
                          {creating ? <IconSpinner className="size-3" /> : <IconPlus className="size-3" strokeWidth={2.25} />}
                        </span>
                        <span className="grid min-w-0 flex-1 gap-0.5">
                          <span className="flex min-w-0 items-baseline leading-5 group-aria-disabled/create:opacity-60">
                            <span className="shrink-0 whitespace-pre">{createBefore}</span>
                            <RefName name={row.name} className="min-w-0 font-mono text-[0.8125rem] font-medium text-foreground" />
                            {createAfter ? <span className="shrink-0 whitespace-pre">{createAfter}</span> : null}
                          </span>
                          {disabled ? (
                            <span id={`${id}-why`} className="text-xs leading-4 text-pretty text-muted-foreground">
                              {words[row.problem ?? "invalidChars"]}
                            </span>
                          ) : (
                            <span className="truncate text-xs leading-4 text-muted-foreground group-aria-disabled/create:opacity-60">{fill(words.createFrom, { from: row.from })}</span>
                          )}
                        </span>
                      </div>
                    );
                  }
                  return (
                    <div
                      key={row.key}
                      id={id}
                      role="option"
                      aria-selected={row.current}
                      aria-disabled={creating || undefined}
                      data-active={active === row.key ? "" : undefined}
                      data-current={row.current ? "" : undefined}
                      onClick={() => choose(row)}
                      onPointerMove={() => active !== row.key && setActiveKey(row.key)}
                      className={cn(OPTION, "text-foreground", row.current && "font-medium")}
                    >
                      <span aria-hidden="true" className="grid size-4 shrink-0 place-items-center">
                        {row.current ? <IconCheck className="size-4" strokeWidth={2.25} /> : null}
                      </span>
                      <RefName name={row.name} indices={row.match?.indices} className="flex-1" />
                      {row.isDefault ? (
                        <Badge variant="outline" className="h-[1.125rem] shrink-0 px-1.5 text-[0.6875rem] font-medium text-muted-foreground">
                          {words.defaultMark}
                        </Badge>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            );
          })}
      </div>

      {loading ? (
        <div aria-hidden="true" className="grid min-h-0 gap-1 overflow-hidden p-1.5">
          {[62, 78, 54, 70, 46, 66].map((width, at) => (
            <div key={at} className="flex h-9 items-center gap-2 px-2">
              <Skeleton className="size-4 rounded-full" delay={at * 70} />
              <Skeleton className="h-3.5" style={{ width: `${width}%` }} delay={at * 70 + 30} />
            </div>
          ))}
        </div>
      ) : (
        <>
          {!rows.length ? (
            <div className="grid shrink-0 justify-items-center gap-2 px-4 py-8 text-center">
              <p className="text-sm text-muted-foreground">{typedAny ? fill(kind === "branch" ? words.noMatchBranches : words.noMatchTags, { query: query.trim() }) : kind === "branch" ? words.emptyBranches : words.emptyTags}</p>
              {otherMatches > 0 ? (
                <button
                  type="button"
                  onClick={() => setKind(other)}
                  className="rounded-md px-2 py-1 text-xs font-medium underline underline-offset-4 outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/40"
                >
                  {fill(words.elsewhere, { count: otherMatches, tab: other === "branch" ? words.branches : words.tags })}
                </button>
              ) : null}
            </div>
          ) : elsewhere ? (
            // Only the create row is here, and the name is in the other list: say so under it, so a tag is not made a branch by accident.
            <div className="shrink-0 border-t border-border p-1.5">
              <button
                type="button"
                onClick={() => setKind(other)}
                className="flex h-9 w-full items-center justify-center rounded-md text-[0.8125rem] font-medium text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40"
              >
                {fill(words.elsewhere, { count: otherMatches, tab: other === "branch" ? words.branches : words.tags })}
              </button>
            </div>
          ) : null}

          {hidden > 0 ? (
            <div className="shrink-0 border-t border-border p-1.5">
              <button
                type="button"
                onClick={() => setLimit(shown + pageSize)}
                className="flex h-9 w-full items-center justify-center rounded-md text-[0.8125rem] font-medium text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40"
              >
                {fill(words.showMore, { count: Math.min(pageSize, hidden) })}
              </button>
            </div>
          ) : null}
        </>
      )}
    </div>
  );

  return (
    <div data-slot="branch-switcher-panel" className={cn("flex min-h-0 min-w-0 flex-col", className)} {...props}>
      <Tabs
        value={kind}
        onValueChange={(next) => {
          setKind(next as RefKind);
          setActiveKey(null);
          setLimit(pageSize);
        }}
        className="min-h-0 flex-1 gap-0"
      >
        <div className="flex h-11 shrink-0 items-center gap-2 border-b border-border px-3.5">
          <IconSearch aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
          <input
            ref={field}
            type="text"
            role="combobox"
            data-slot="branch-switcher-search"
            aria-label={words.search}
            aria-expanded
            aria-haspopup="listbox"
            aria-controls={listId}
            aria-activedescendant={active && activeRow ? idOf(activeRow) : undefined}
            aria-autocomplete="list"
            placeholder={words.placeholder}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            enterKeyHint="go"
            autoFocus={autoFocus}
            value={typed}
            onChange={(event) => restart(event.target.value)}
            onKeyDown={onKeyDown}
            className="h-full min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
          {typed ? (
            <button
              type="button"
              aria-label={words.clearSearch}
              onClick={() => {
                restart("");
                field.current?.focus();
              }}
              className="grid size-6 shrink-0 place-items-center rounded text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40"
            >
              <IconClose aria-hidden="true" size={14} />
            </button>
          ) : null}
        </div>

        <TabsList variant="line" className="w-full shrink-0 gap-1 px-2.5">
          {(["branch", "tag"] as const).map((tab) => (
            <TabsTrigger key={tab} value={tab} className="gap-2 px-1.5 pt-2.5 text-[0.8125rem]">
              {tab === "branch" ? words.branches : words.tags}
              {loading ? null : <span className="rounded-full bg-muted px-1.5 font-mono text-[0.6875rem] leading-4 text-muted-foreground tabular-nums">{counts[tab]}</span>}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* The panel of a tab is no stop in the Tab order either (Radix makes it one): the search field drives the list, and the tabs and "Show more" are the stops. Only the open one is a flex box, so the other stays hidden. */}
        {(["branch", "tag"] as const).map((tab) => (
          <TabsContent key={tab} value={tab} tabIndex={-1} className="min-h-0 flex-1 data-[state=active]:flex data-[state=active]:flex-col">
            {body}
          </TabsContent>
        ))}
      </Tabs>

      {failure ? (
        <p role="alert" className="flex shrink-0 items-start gap-2 border-t border-border bg-muted/40 px-3.5 py-2.5 text-xs text-destructive">
          <IconAlertCircle aria-hidden="true" className="mt-px size-3.5 shrink-0" />
          <span className="min-w-0 text-pretty">{failure}</span>
        </p>
      ) : null}

      <div aria-hidden="true" className="hidden shrink-0 items-center gap-3 border-t border-border px-3.5 py-2 text-[0.6875rem] text-muted-foreground sm:flex [@media(pointer:coarse)]:hidden">
        <span className="inline-flex items-center gap-1.5">
          <Kbd>↑</Kbd>
          <Kbd>↓</Kbd>
          {words.keysMove}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Kbd>↵</Kbd>
          {words.keysChoose}
        </span>
        <span className="ml-auto inline-flex items-center gap-1.5">
          <Kbd>esc</Kbd>
          {typedAny ? words.keysClear : words.keysClose}
        </span>
      </div>

      {/* Kept in the page when empty: a live region that appears together with its message is often never read. */}
      <p role="status" aria-live="polite" className="sr-only">
        {status}
      </p>
    </div>
  );
}
