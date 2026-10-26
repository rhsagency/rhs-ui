"use client";

import { useEffect, useId, useRef, useState, type ComponentProps, type FormEvent } from "react";

import { IconCheck, IconClose, IconEye, IconEyeOff, IconPlus } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { Card, CardDescription, CardTitle } from "@rhs-ui/primitives/card";
import { Checkbox } from "@rhs-ui/primitives/checkbox";
import { Input } from "@rhs-ui/primitives/input";
import { Progress } from "@rhs-ui/primitives/progress";
import { cn } from "@/lib/utils";

/** One line of the list. */
export interface ChecklistItem {
  /** A stable identity, passed back to your callbacks. */
  id: string;
  /** What has to be done. */
  label: string;
  /** Whether it is checked. */
  done?: boolean;
  /** A line under the label: who, when or why. */
  note?: string;
}

/** The words the card uses, for translation. `{done}`, `{total}`, `{label}`, `{count}` and `{progress}` are filled in. */
export interface ChecklistCardLabels {
  /** The count under the bar. Default "{done} of {total} done". Overridden by the `progressLabel` prop. */
  progress?: string;
  /** What the count becomes when every item is checked. Default "Everything is checked". */
  complete?: string;
  /** What the count says when there are no items. Default "No items yet". */
  empty?: string;
  /** The button that folds the checked items away. Default "Hide completed". */
  hide?: string;
  /** The button that brings them back. Default "Show completed". */
  show?: string;
  /** Shown instead of the list when everything is checked and hidden. Default "Everything is checked. Completed items are hidden." */
  allHidden?: string;
  /** Shown instead of the list when it has no items. Default "Nothing on the list yet. Add the first item below." */
  none?: string;
  /** The add field's name and placeholder. Default "Add an item". */
  add?: string;
  /** The add button. Default "Add". */
  addButton?: string;
  /** The name of each remove button, followed by the item. Default "Remove {label}". */
  remove?: string;
  /** Said when an item is checked. Default "{label} completed. {progress}." */
  completed?: string;
  /** Said when it is unchecked. Default "{label} marked as not done. {progress}." */
  reopened?: string;
  /** Said when an item is added. Default "{label} added. {progress}." */
  added?: string;
  /** Said when an item is removed. Default "{label} removed. {progress}." */
  removed?: string;
}

export interface ChecklistCardProps extends Omit<ComponentProps<"div">, "title" | "children" | "onToggle"> {
  /** What the list is for: "Launch checklist". It names the group of checkboxes. */
  title: string;
  /** One line under the title. */
  description?: string;
  /** The items, in order. */
  items: readonly ChecklistItem[];
  /** An item was checked or unchecked, with the state it asks for. Update `done` on that item. */
  onToggle?: (id: string, done: boolean) => void;
  /** Enter was pressed in the add field, or Add was. Receives the trimmed text; append an item. Leave it out for a list that cannot grow. */
  onAdd?: (label: string) => void;
  /** An item's remove button was pressed. Leave it out for no remove buttons. */
  onRemove?: (id: string) => void;
  /** Whether the checked items are folded away. Pass it with `onHideCompletedChange` to control it. */
  hideCompleted?: boolean;
  /** Folded away at the start, when you do not control it. */
  defaultHideCompleted?: boolean;
  /** The fold button was pressed, with the state it asks for. */
  onHideCompletedChange?: (hide: boolean) => void;
  /** The count under the bar, with `{done}` and `{total}`: "{done} of {total} done", "{done} of {total} packed". */
  progressLabel?: string;
  /** Heading level of the title. Default 3. */
  headingLevel?: 2 | 3 | 4;
  /** The words the card uses, for translation. */
  labels?: ChecklistCardLabels;
}

const DEFAULT_LABELS = {
  progress: "{done} of {total} done",
  complete: "Everything is checked",
  empty: "No items yet",
  hide: "Hide completed",
  show: "Show completed",
  allHidden: "Everything is checked. Completed items are hidden.",
  none: "Nothing on the list yet. Add the first item below.",
  add: "Add an item",
  addButton: "Add",
  remove: "Remove {label}",
  completed: "{label} completed. {progress}.",
  reopened: "{label} marked as not done. {progress}.",
  added: "{label} added. {progress}.",
  removed: "{label} removed. {progress}.",
} satisfies Required<ChecklistCardLabels>;

const fill = (template: string, values: Record<string, string>) => template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? "");

/**
 * A titled checklist for a launch, a packing list or a QA pass: a count and a
 * bar for how far along it is ("3 of 5 done"), a real checkbox per item that
 * strikes through and says so when it is checked, and an add row at the bottom
 * that takes a new item on Enter. Checked items can be folded away behind
 * "Hide completed", and when every item is checked the count gives way to a
 * quiet "Everything is checked". The items are a labelled group of checkboxes,
 * so the whole list works from the keyboard, and each remove button hands
 * focus to the neighbouring item instead of dropping it.
 */
export function ChecklistCard({
  title,
  description,
  items,
  onToggle,
  onAdd,
  onRemove,
  hideCompleted,
  defaultHideCompleted = false,
  onHideCompletedChange,
  progressLabel,
  headingLevel = 3,
  labels,
  className,
  ...props
}: ChecklistCardProps) {
  const text: Required<ChecklistCardLabels> = { ...DEFAULT_LABELS, ...labels };
  const Heading = `h${headingLevel}` as "h2" | "h3" | "h4";
  const uid = useId();
  const titleId = `${uid}-title`;
  const root = useRef<HTMLDivElement>(null);
  const field = useRef<HTMLInputElement>(null);
  const foldButton = useRef<HTMLButtonElement>(null);
  const timer = useRef<number | undefined>(undefined);
  const [ownHide, setOwnHide] = useState(defaultHideCompleted);
  const [draft, setDraft] = useState("");
  const [said, setSaid] = useState("");

  const hidden = hideCompleted ?? ownHide;
  const total = items.length;
  const done = items.filter((item) => item.done).length;
  const everything = total > 0 && done === total;
  const shown = hidden ? items.filter((item) => !item.done) : items;
  const count = fill(progressLabel ?? text.progress, { done: String(done), total: String(total) });

  useEffect(() => () => window.clearTimeout(timer.current), []);

  function say(template: string, label: string, nextDone: number, nextTotal: number) {
    const progress = fill(progressLabel ?? text.progress, { done: String(nextDone), total: String(nextTotal) });
    setSaid(fill(template, { label, progress }));
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setSaid(""), 5000);
  }

  /** The checkbox of an item that is still on the list, to hand focus to. */
  function checkboxOf(item: ChecklistItem | undefined) {
    return item ? root.current?.querySelector<HTMLElement>(`[data-item="${CSS.escape(item.id)}"] [role="checkbox"]`) : null;
  }

  function toggle(item: ChecklistItem, next: boolean, index: number) {
    // With the checked items folded away, checking one takes its row off the list: focus goes to the item after it, else the one before, else the fold button (which brings the checked items back), not to the top of the page.
    const leaving = hidden && next;
    const neighbour = leaving ? (shown[index + 1] ?? shown[index - 1]) : undefined;
    onToggle?.(item.id, next);
    say(next ? text.completed : text.reopened, item.label, done + (next ? 1 : -1), total);
    if (leaving) requestAnimationFrame(() => (checkboxOf(neighbour) ?? foldButton.current ?? field.current)?.focus());
  }

  function remove(item: ChecklistItem, index: number) {
    // Focus goes to the item after this one, else the one before, else the add field: not to the top of the page.
    const neighbour = shown[index + 1] ?? shown[index - 1];
    onRemove?.(item.id);
    say(text.removed, item.label, done - (item.done ? 1 : 0), total - 1);
    requestAnimationFrame(() => (checkboxOf(neighbour) ?? field.current)?.focus());
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const label = draft.trim();
    if (!label) return;
    onAdd?.(label);
    setDraft("");
    say(text.added, label, done, total + 1);
    field.current?.focus();
  }

  function fold(next: boolean) {
    if (hideCompleted === undefined) setOwnHide(next);
    onHideCompletedChange?.(next);
  }

  return (
    <Card ref={root} data-slot="checklist-card" role="group" aria-labelledby={titleId} className={cn("@container gap-0 overflow-hidden py-0", className)} {...props}>
      <div className="grid gap-3.5 px-5 pt-5 pb-4">
        <div className="min-w-0">
          <CardTitle asChild>
            <Heading id={titleId} className="text-[0.9375rem] leading-snug tracking-[-0.01em] [overflow-wrap:anywhere]">
              {title}
            </Heading>
          </CardTitle>
          {description ? <CardDescription className="mt-0.5 text-[0.8125rem] leading-5 text-pretty">{description}</CardDescription> : null}
        </div>
        <div className="grid gap-2">
          <Progress value={done} max={Math.max(total, 1)} aria-labelledby={titleId} getValueLabel={() => count} className="h-1" />
          <div className="flex min-h-7 items-center justify-between gap-3 text-xs">
            <p className={cn("flex items-center gap-1.5 tabular-nums", everything ? "font-medium text-foreground" : "text-muted-foreground")}>
              {everything ? <IconCheck className="size-3.5" /> : null}
              {total === 0 ? text.empty : everything ? text.complete : count}
            </p>
            {done > 0 ? (
              <Button ref={foldButton} type="button" variant="ghost" size="sm" onClick={() => fold(!hidden)} className="-me-2 h-7 gap-1.5 px-2 text-xs text-muted-foreground hover:text-foreground [&_svg:not([class*='size-'])]:size-3.5">
                {hidden ? <IconEye /> : <IconEyeOff />}
                {hidden ? text.show : text.hide}
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      {shown.length ? (
        <ul className="border-t border-border">
          {shown.map((item, index) => {
            const checkboxId = `${uid}-${item.id}`;
            const noteId = `${checkboxId}-note`;
            return (
              <li key={item.id} data-item={item.id} data-done={item.done ? "" : undefined} className="group/item flex items-start gap-3 px-5 py-2.5 transition-colors duration-150 hover:bg-muted/40 motion-reduce:transition-none">
                <Checkbox
                  id={checkboxId}
                  checked={Boolean(item.done)}
                  onCheckedChange={(next) => toggle(item, next === true, index)}
                  aria-describedby={item.note ? noteId : undefined}
                  className="mt-0.5"
                />
                <div className="min-w-0 flex-1">
                  <label
                    htmlFor={checkboxId}
                    className={cn(
                      "block cursor-pointer text-sm leading-5 line-through decoration-transparent transition-[color,text-decoration-color] duration-200 [overflow-wrap:anywhere] motion-reduce:transition-none",
                      item.done && "text-muted-foreground decoration-muted-foreground/70",
                    )}
                  >
                    {item.label}
                  </label>
                  {item.note ? (
                    <p id={noteId} className="mt-0.5 text-xs leading-4 text-muted-foreground [overflow-wrap:anywhere]">
                      {item.note}
                    </p>
                  ) : null}
                </div>
                {onRemove ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={fill(text.remove, { label: item.label })}
                    onClick={() => remove(item, index)}
                    className="-my-1 -me-2 size-7 shrink-0 text-muted-foreground transition-opacity hover:text-foreground focus-visible:opacity-100 motion-reduce:transition-none [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover/item:opacity-100"
                  >
                    <IconClose />
                  </Button>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="border-t border-border px-5 py-6 text-center text-sm text-muted-foreground">{total === 0 ? text.none : text.allHidden}</p>
      )}

      {onAdd ? (
        <form onSubmit={submit} className="flex items-center gap-1 border-t border-border px-4 py-2">
          <IconPlus aria-hidden="true" className="ms-1 size-4 shrink-0 text-muted-foreground" />
          <Input
            ref={field}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            aria-label={text.add}
            placeholder={text.add}
            autoComplete="off"
            className="h-9 flex-1 border-transparent bg-transparent px-2 shadow-none placeholder:text-muted-foreground focus-visible:border-ring"
          />
          {draft.trim() ? (
            <Button type="submit" size="sm" variant="secondary">
              {text.addButton}
            </Button>
          ) : null}
        </form>
      ) : null}
      <p role="status" className="sr-only">
        {said}
      </p>
    </Card>
  );
}
