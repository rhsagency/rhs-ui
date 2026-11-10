"use client";

import { Fragment, useEffect, useId, useRef, useState, type ComponentProps, type KeyboardEvent } from "react";

import { IconCheck, IconChevronRight, IconClose, IconFolder, IconFolderOpen, IconSpinner } from "@rhs-ui/icons";
import { splitMatch, type FolderNote, type TreeRow } from "@rhs-ui/application/move-to-dialog/folders";
import { cn } from "@/lib/utils";

/** The row where a new folder is being named, drawn under the folder it goes in. */
export interface FolderCreation {
  /** The folder the new one goes in, or null for the top level. The row appears first among its folders. */
  parentId: string | null;
  /** How deep the row is, from 1. */
  level: number;
  /** What has been typed. */
  value: string;
  /** What is wrong with it, in words, or null. */
  error: string | null;
  /** The folder is being made: the field and the buttons are off. */
  pending: boolean;
  /** The name of the field, for screen readers. */
  label: string;
  /** The hint in the field. */
  placeholder: string;
  /** The name of the button that creates it. */
  create: string;
  /** The name of the button that gives up. */
  cancel: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

export interface FolderTreeProps extends Omit<ComponentProps<"ul">, "children" | "onSelect" | "role"> {
  /** The rows that are on screen, from `visibleRows`. */
  rows: readonly TreeRow[];
  /** A note for each folder that is not an ordinary destination: why it cannot be chosen, or a plain mark. */
  notes: ReadonlyMap<string, FolderNote>;
  /** The folder that is chosen. */
  selectedId: string | null;
  /** The search text, which is marked in the names. While there is some, the matching branches are open and the chevrons rest. */
  query: string;
  /** The name of the tree, for screen readers. */
  label: string;
  /** Nothing can be chosen or opened, because the items are on their way. */
  disabled?: boolean;
  /** The row where a new folder is being named. */
  creation?: FolderCreation | null;
  /** A folder that can be chosen was clicked or confirmed with the keyboard. */
  onSelect: (id: string) => void;
  /** A folder was opened or closed. */
  onOpenChange: (id: string, open: boolean) => void;
}

const INDENT = 16;
const INSET = 6;

/**
 * A folder tree for choosing one, with the keyboard of a file manager: Up and Down move, Right opens a folder or steps into it,
 * Left closes it or goes to its folder, Home and End jump, Enter and Space choose, and letters jump to the next name that starts
 * with them. Only one row is in the tab order. A folder that cannot be the destination stays reachable, so a screen reader
 * hears why, but it is not chosen.
 */
export function FolderTree({ rows, notes, selectedId, query, label, disabled = false, creation, onSelect, onOpenChange, className, ref, ...props }: FolderTreeProps) {
  const id = useId();
  const list = useRef<HTMLUListElement | null>(null);
  const [focused, setFocused] = useState<string | null>(null);
  const typed = useRef({ text: "", timer: 0 });
  const searching = query.trim() !== "";
  const ids = rows.map((row) => row.node.id);
  const active = focused && ids.includes(focused) ? focused : selectedId && ids.includes(selectedId) ? selectedId : (ids[0] ?? null);

  function attach(element: HTMLUListElement | null) {
    list.current = element;
    if (typeof ref === "function") ref(element);
    else if (ref) ref.current = element;
  }

  function moveTo(target: string) {
    setFocused(target);
    const find = () => list.current?.querySelector<HTMLElement>(`[data-folder-id="${CSS.escape(target)}"]`);
    const show = (row: HTMLElement | null | undefined) => {
      row?.focus();
      row?.scrollIntoView({ block: "nearest" });
    };
    // A row that is on screen is focused at once, so a key held down never outruns the focus; one that is about to be drawn gets it a frame later.
    const row = find();
    if (row) show(row);
    else window.requestAnimationFrame(() => show(find()));
  }

  function choose(row: TreeRow) {
    if (disabled || notes.get(row.node.id)?.blocked) return;
    onSelect(row.node.id);
  }

  function keys(event: KeyboardEvent<HTMLLIElement>, row: TreeRow) {
    if (event.target !== event.currentTarget || disabled) return;
    const index = rows.findIndex((entry) => entry.node.id === row.node.id);
    const go = (target?: TreeRow) => {
      if (!target) return;
      event.preventDefault();
      moveTo(target.node.id);
    };
    switch (event.key) {
      case "ArrowDown":
        return go(rows[index + 1]);
      case "ArrowUp":
        return go(rows[index - 1]);
      case "Home":
        return go(rows[0]);
      case "End":
        return go(rows[rows.length - 1]);
      case "ArrowRight":
        event.preventDefault();
        if (row.hasChildren && !row.open) onOpenChange(row.node.id, true);
        else if (row.hasChildren) go(rows[index + 1]);
        return;
      case "ArrowLeft":
        event.preventDefault();
        if (row.hasChildren && row.open && !searching) onOpenChange(row.node.id, false);
        else if (row.parent) moveTo(row.parent);
        return;
      case "Enter":
      case " ":
        event.preventDefault();
        choose(row);
        return;
      default: {
        if (event.key.length !== 1 || !/\S/.test(event.key) || event.ctrlKey || event.metaKey || event.altKey) return;
        // Letters typed in quick succession make one word, so "pro" finds Projects and not the next name with a p.
        window.clearTimeout(typed.current.timer);
        typed.current.text += event.key.toLowerCase();
        typed.current.timer = window.setTimeout(() => {
          typed.current.text = "";
        }, 700);
        const word = typed.current.text;
        const from = word.length === 1 ? index + 1 : index;
        const order = [...rows.slice(from), ...rows.slice(0, from)];
        go(order.find((entry) => entry.node.name.toLowerCase().startsWith(word)));
      }
    }
  }

  useEffect(() => () => window.clearTimeout(typed.current.timer), []);

  const field = creation ? <CreationRow key="creation" creation={creation} /> : null;

  return (
    <ul ref={attach} role="tree" aria-label={label} aria-busy={disabled || undefined} data-slot="folder-tree" className={cn("grid grid-cols-[minmax(0,1fr)] gap-px text-sm", disabled && "opacity-70", className)} {...props}>
      {creation && creation.parentId === null ? field : null}
      {rows.map((row) => {
        const note = notes.get(row.node.id);
        const blocked = note?.blocked === true;
        const selected = selectedId === row.node.id;
        const parts = row.matched ? splitMatch(row.node.name, query) : null;
        return (
          <Fragment key={row.node.id}>
            <li
              role="treeitem"
              data-folder-id={row.node.id}
              aria-level={row.level}
              aria-posinset={row.position}
              aria-setsize={row.size}
              aria-expanded={row.hasChildren ? row.open : undefined}
              aria-selected={selected}
              aria-disabled={blocked || undefined}
              aria-describedby={note ? `${id}-${row.node.id}-note` : undefined}
              tabIndex={row.node.id === active ? 0 : -1}
              onFocus={(event) => {
                if (event.target === event.currentTarget) setFocused(row.node.id);
              }}
              onKeyDown={(event) => keys(event, row)}
              onClick={() => {
                setFocused(row.node.id);
                if (disabled) return;
                choose(row);
                // A folder that cannot be the destination still opens: what is inside it may be.
                if (row.hasChildren && !row.open) onOpenChange(row.node.id, true);
              }}
              style={{ paddingLeft: (row.level - 1) * INDENT + INSET }}
              className={cn(
                "flex min-h-8 cursor-default items-center gap-x-1.5 rounded-md py-1 pr-2 outline-none select-none",
                "transition-colors duration-150 focus-visible:ring-[3px] focus-visible:ring-ring/40 motion-reduce:transition-none",
                // Why a folder cannot be chosen is the point of its row: on a narrow panel the reason takes a second line under the name, whole.
                blocked ? "cursor-not-allowed text-muted-foreground @max-md:flex-wrap" : "hover:bg-muted",
                selected && "bg-muted font-medium",
              )}
            >
              <span
                aria-hidden="true"
                onClick={(event) => {
                  if (!row.hasChildren || searching || disabled) return;
                  event.stopPropagation();
                  setFocused(row.node.id);
                  onOpenChange(row.node.id, !row.open);
                }}
                className={cn("grid size-5 shrink-0 place-items-center rounded text-muted-foreground", row.hasChildren && !searching && !disabled && "hover:bg-foreground/10 hover:text-foreground", !row.hasChildren && "invisible")}
              >
                <IconChevronRight size={14} className={cn("transition-transform duration-150 motion-reduce:transition-none", row.open && "rotate-90")} />
              </span>
              <span aria-hidden="true" className={cn("grid shrink-0 place-items-center", blocked ? "text-muted-foreground/70" : "text-muted-foreground")}>
                {row.open ? <IconFolderOpen size={16} /> : <IconFolder size={16} />}
              </span>
              <span className="min-w-[5rem] flex-1 truncate" title={row.node.name}>
                {parts ? (
                  <>
                    {parts[0]}
                    <mark className="rounded-[3px] bg-foreground/15 px-px font-semibold text-foreground">{parts[1]}</mark>
                    {parts[2]}
                  </>
                ) : (
                  row.node.name
                )}
              </span>
              {note ? (
                <span
                  id={`${id}-${row.node.id}-note`}
                  title={note.text}
                  className={cn(
                    "max-w-[44%] min-w-0 shrink truncate text-xs font-normal",
                    // Narrow: the reason has the width of the row, indented to the name (chevron, icon and two gaps), and is never cut off.
                    note.blocked
                      ? "text-muted-foreground @max-md:max-w-none @max-md:basis-full @max-md:overflow-visible @max-md:pl-12 @max-md:leading-snug @max-md:whitespace-normal"
                      : "rounded-full border border-border px-2 py-px text-[0.6875rem] text-muted-foreground",
                  )}
                >
                  {note.text}
                </span>
              ) : null}
              {selected ? <IconCheck aria-hidden="true" size={14} className="shrink-0" /> : null}
            </li>
            {creation && creation.parentId === row.node.id ? field : null}
          </Fragment>
        );
      })}
    </ul>
  );
}

function CreationRow({ creation }: { creation: FolderCreation }) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const { error, pending } = creation;

  useEffect(() => {
    input.current?.focus({ preventScroll: true });
    input.current?.scrollIntoView({ block: "nearest" });
  }, []);

  return (
    <li
      role="treeitem"
      aria-level={creation.level}
      aria-selected={false}
      aria-label={creation.label}
      // The dialog around this tree sees this mark on whatever in the row has focus (the field, or one of its buttons) and leaves Escape to
      // the row: it gives up the new folder, not the dialog and the folder that was chosen in it.
      data-escape-local=""
      onKeyDown={(event) => {
        if (event.key !== "Escape") return;
        event.preventDefault();
        if (!pending) creation.onCancel();
      }}
      className="grid gap-1 py-0.5 pr-1"
      style={{ paddingLeft: (creation.level - 1) * INDENT + INSET }}
    >
      <div className="flex items-center gap-1.5">
        <span aria-hidden="true" className="size-5 shrink-0" />
        <IconFolder aria-hidden="true" size={16} className="shrink-0 text-muted-foreground" />
        <input
          ref={input}
          type="text"
          value={creation.value}
          // readOnly and aria-disabled, not disabled, while the folder is made: a disabled field lets go of focus, which would drop it on the dialog and leave nowhere to press Escape.
          readOnly={pending}
          aria-disabled={pending || undefined}
          autoComplete="off"
          spellCheck={false}
          aria-label={creation.label}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          placeholder={creation.placeholder}
          onChange={(event) => creation.onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key !== "Enter") return;
            event.preventDefault();
            if (!pending) creation.onSubmit();
          }}
          className="h-7 min-w-0 flex-1 rounded-md border border-input bg-background px-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40 aria-disabled:opacity-60 aria-invalid:border-destructive"
        />
        <button
          type="button"
          aria-label={creation.create}
          // aria-disabled and not disabled while it works: the button has focus when it is pressed, and a disabled one would let go of it.
          aria-disabled={pending || undefined}
          onClick={() => !pending && creation.onSubmit()}
          className="grid size-7 shrink-0 place-items-center rounded-md bg-primary text-primary-foreground outline-none hover:bg-primary/90 focus-visible:ring-[3px] focus-visible:ring-ring/40 aria-disabled:cursor-progress"
        >
          {pending ? <IconSpinner size={14} /> : <IconCheck size={14} />}
        </button>
        <button
          type="button"
          aria-label={creation.cancel}
          aria-disabled={pending || undefined}
          onClick={() => !pending && creation.onCancel()}
          className="grid size-7 shrink-0 place-items-center rounded-md text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40 aria-disabled:cursor-not-allowed aria-disabled:opacity-50"
        >
          <IconClose size={14} />
        </button>
      </div>
      {error ? (
        <p id={`${id}-error`} role="alert" className="pl-[1.625rem] text-xs font-medium text-destructive">
          {error}
        </p>
      ) : null}
    </li>
  );
}
