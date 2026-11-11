"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";

import { IconAlertCircle, IconCheck, IconChevronUp, IconPlus, IconSearch, IconSpinner } from "@rhs-ui/icons";
import {
  ALL_ID,
  BLANK_ID,
  DEFAULT_LABELS,
  categoriesOf,
  fill,
  isOne,
  isThenable,
  matches,
  messageOf,
  numberText,
  type Template,
  type TemplateCategory,
  type TemplatePickerLabels,
} from "@rhs-ui/application/template-picker-dialog/templates";
import { Button } from "@rhs-ui/primitives/button";
import { DialogDescription, DialogTitle } from "@rhs-ui/primitives/dialog";
import { SearchInput } from "@rhs-ui/primitives/search-input";
import { cn } from "@/lib/utils";

export interface TemplatePickerPanelProps {
  /** The templates to choose from: an id, a name, a description, a category, a preview and tags to search by. Blank is added for you, first. */
  templates: readonly Template[];
  /** The groups for the rail, with their names. Categories that templates name and you did not list are added after yours. */
  categories?: readonly TemplateCategory[];
  /** The `id` of the category to start in. Default: all templates. */
  defaultCategory?: string;
  /**
   * The choice was made: the `id` of the template, or null for Blank. Return a promise and the panel locks while it runs,
   * the button spins, and when it resolves `onClose` is called; when it rejects the panel stays open and says why.
   */
  onSelect: (id: string | null) => void | Promise<void>;
  /** Closes the dialog: after a choice was made, and from Cancel. Leave it out and the panel has no Cancel button. */
  onClose?: () => void;
  /** Called when the panel locks and unlocks, so a dialog can refuse to be closed while a choice is being made. */
  onBusyChange?: (busy: boolean) => void;
  /** The language of the numbers and of "1 template" against "12 templates". Default "en-US". */
  locale?: string;
  /** The words the panel says, for translation. */
  labels?: TemplatePickerLabels;
  /** The picture on the Blank card. It has a quiet one of its own. */
  blankPreview?: ReactNode;
  /** Draws the panel on a page instead of in a dialog: plain headings, no dialog title. */
  standalone?: boolean;
  /** What the search field starts with. */
  defaultQuery?: string;
  /** The `id` of the template that starts chosen. Default Blank (null). */
  defaultSelected?: string | null;
  /** Classes for the panel, for its height: it fills what it is given. */
  className?: string;
}

/** The failure text, darkened toward the foreground so small red words reach 4.5:1. */
const DANGER_TEXT = "text-[color:color-mix(in_oklch,var(--destructive),var(--foreground)_30%)]";

/** How many cards sit side by side: the ones that share the top of the first. */
function columnsOf(items: readonly HTMLElement[]): number {
  const first = items[0];
  if (!first) return 1;
  let count = 0;
  for (const item of items) {
    if (Math.abs(item.offsetTop - first.offsetTop) >= 4) break;
    count += 1;
  }
  return Math.max(1, count);
}

/** A preview in its frame: drawn flat, so the same picture can be small on a card and large beside the grid. */
function Frame({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div aria-hidden="true" className={cn("relative overflow-hidden border border-border bg-muted", className)}>
      {children}
    </div>
  );
}

/** What a search with no result says: what was searched, what to do, and the button that does it. Compact, so Blank above it keeps its place. */
function NoMatch({ title, hint, children }: { title: string; hint: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-dashed border-border px-5 py-5 text-center">
      <span aria-hidden="true" className="grid size-9 place-items-center rounded-full bg-muted text-muted-foreground">
        <IconSearch size={16} />
      </span>
      <p className="mt-2.5 text-sm font-medium tracking-[-0.01em] text-balance">{title}</p>
      <p className="mt-1 max-w-xs text-[0.8125rem] leading-relaxed text-pretty text-muted-foreground">{hint}</p>
      {children ? <div className="mt-3.5">{children}</div> : null}
    </div>
  );
}

/** The picture on the Blank card: an empty page with a plus, where something would go. */
function BlankPage() {
  return (
    <div className="grid size-full place-items-center bg-background">
      <span className="grid size-9 place-items-center rounded-full border border-dashed border-muted-foreground/50 text-muted-foreground">
        <IconPlus size={16} />
      </span>
    </div>
  );
}

interface CardProps {
  id: string;
  name: string;
  meta: string;
  preview: ReactNode;
  checked: boolean;
  tabbable: boolean;
  busy: boolean;
  onChoose: (id: string) => void;
  onConfirm: () => void;
}

function Card({ id, name, meta, preview, checked, tabbable, busy, onChoose, onConfirm }: CardProps) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={checked}
      aria-disabled={busy || undefined}
      data-id={id}
      tabIndex={tabbable ? 0 : -1}
      onClick={() => onChoose(id)}
      onDoubleClick={onConfirm}
      className={cn(
        "group/card relative flex min-w-0 flex-col gap-2 rounded-lg border border-border bg-card p-1.5 text-left outline-none select-none",
        "transition-[border-color,background-color] duration-150 motion-reduce:transition-none",
        "hover:border-[color-mix(in_oklch,var(--border),var(--foreground)_28%)] focus-visible:ring-[3px] focus-visible:ring-ring/40",
        "aria-checked:border-foreground aria-checked:bg-muted/50 aria-disabled:pointer-events-none aria-disabled:opacity-60",
      )}
    >
      <Frame className="aspect-[4/3] w-full rounded-md">
        {preview}
        <span
          aria-hidden="true"
          className="absolute top-1.5 right-1.5 grid size-5 place-items-center rounded-full bg-foreground text-background opacity-0 transition-opacity duration-150 group-aria-checked/card:opacity-100 motion-reduce:transition-none"
        >
          <IconCheck size={12} />
        </span>
      </Frame>
      <span className="block min-w-0 px-1 pb-1">
        <span className="block truncate text-sm font-medium tracking-[-0.01em]">{name}</span>
        <span className="block truncate text-xs text-muted-foreground">{meta}</span>
      </span>
    </button>
  );
}

/**
 * The inside of TemplatePickerDialog, usable on its own: a search field, the categories with their counts, a grid of cards
 * that works as one radio group, the template in focus beside it, and a button that names what it will make. Below 640px
 * the categories become a row of chips and the side panel becomes a sheet at the foot, with a button for the large
 * preview. Blank is always the first card and the default choice, and what is chosen is always in the grid: a pick that
 * a search or a category hides is set aside, Blank stands in, and the pick is back when the filter lets go of it. The
 * layout follows the width of the screen, so give the panel the room of a page or of the dialog.
 */
export function TemplatePickerPanel({
  templates,
  categories,
  defaultCategory,
  onSelect,
  onClose,
  onBusyChange,
  locale = "en-US",
  labels,
  blankPreview,
  standalone = false,
  defaultQuery = "",
  defaultSelected = null,
  className,
}: TemplatePickerPanelProps) {
  const words: Required<TemplatePickerLabels> = { ...DEFAULT_LABELS, ...labels };
  const list = categoriesOf(templates, categories);
  const [query, setQuery] = useState(defaultQuery);
  const [category, setCategory] = useState(defaultCategory && list.some((item) => item.id === defaultCategory) ? defaultCategory : ALL_ID);
  const [selected, setSelected] = useState(defaultSelected ?? BLANK_ID);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sheet, setSheet] = useState(false);
  const working = useRef(false);
  const group = useRef<HTMLDivElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const searchBox = useRef<HTMLDivElement>(null);
  const allEntry = useRef<HTMLButtonElement>(null);
  const sheetId = useId();

  const matching = templates.filter((template) => matches(template, query));
  const shown = category === ALL_ID ? matching : matching.filter((template) => template.category === category);
  // What is chosen is what is on screen. A pick that the search or the category hides is kept aside and is chosen again when
  // the filter lets go of it; meanwhile Blank, which is always there, stands in, so the preview and the button never name
  // something that is not in the grid.
  const picked = templates.find((template) => template.id === selected) ?? null;
  const chosen = picked && shown.some((template) => template.id === picked.id) ? picked : null;
  const chosenId = chosen ? chosen.id : BLANK_ID;
  // The one card in the tab order: the chosen one, which is always on screen.
  const tabStop = chosenId;
  const categoryLabel = (id: string) => list.find((item) => item.id === id)?.label ?? id;

  const name = chosen?.name ?? words.blank;
  const description = chosen?.description ?? words.blankDescription;
  const meta = chosen ? categoryLabel(chosen.category) : words.blankCategory;
  const preview = chosen ? chosen.preview : (blankPreview ?? <BlankPage />);
  const confirmLabel = chosen ? fill(words.confirm, { name: chosen.name }) : words.confirmBlank;
  const countText = fill(isOne(shown.length, locale) ? words.countOne : words.countOther, { count: numberText(shown.length, locale) });
  const trimmed = query.trim();
  // A search that finds nothing in the open category while others have a match is not the search's fault: it says where the matches are.
  const elsewhere = Boolean(trimmed) && category !== ALL_ID && matching.length > 0;
  const emptyTitle = !trimmed ? words.emptyCategory : elsewhere ? fill(words.emptyInCategory, { category: categoryLabel(category), query: trimmed }) : fill(words.emptyTitle, { query: trimmed });
  const emptyHint = !trimmed ? words.emptyCategoryHint : elsewhere ? words.emptyInCategoryHint : words.emptyHint;

  // A new search or category shows a new list: it starts from its top, where Blank is.
  useEffect(() => {
    scroller.current?.scrollTo({ top: 0 });
  }, [category, query]);

  const choose = (id: string) => {
    if (!working.current) setSelected(id);
  };
  const filter = (id: string) => {
    if (!working.current) setCategory(id);
  };
  const clearSearch = () => {
    if (working.current) return;
    setQuery("");
    // The button that was pressed is gone with the empty state: the focus goes back to the field.
    searchBox.current?.querySelector("input")?.focus();
  };
  const searchEverywhere = () => {
    if (working.current) return;
    setCategory(ALL_ID);
    // The button that was pressed is gone with the empty state: the focus goes to the entry it chose, not to the field, which would raise a phone's keyboard.
    allEntry.current?.focus();
  };

  const cards = (): HTMLElement[] => Array.from(group.current?.querySelectorAll<HTMLElement>('[role="radio"]') ?? []);
  const focusCard = (id: string) => cards().find((card) => card.dataset.id === id)?.focus();

  function fail(problem: unknown) {
    const extra = messageOf(problem);
    setError(extra ? `${words.failed} ${extra}` : words.failed);
  }

  async function confirm() {
    if (working.current) return;
    setError("");
    let outcome: void | Promise<void>;
    try {
      outcome = onSelect(chosen ? chosen.id : null);
    } catch (problem) {
      fail(problem);
      return;
    }
    // An answer that is already here needs no busy state; a promise locks the panel while it runs.
    if (!isThenable(outcome)) {
      onClose?.();
      return;
    }
    working.current = true;
    setBusy(true);
    onBusyChange?.(true);
    let refusal: { reason: unknown } | null = null;
    try {
      await outcome;
    } catch (problem) {
      refusal = { reason: problem };
    }
    // Unlocked first, so a dialog that was holding on to the choice lets go of it and can close.
    working.current = false;
    setBusy(false);
    onBusyChange?.(false);
    if (refusal) fail(refusal.reason);
    else onClose?.();
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const current = (event.target as HTMLElement).closest<HTMLElement>('[role="radio"]');
    if (!current || working.current || event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.key === "Enter") {
      // Arrow keys choose, Enter makes it.
      event.preventDefault();
      void confirm();
      return;
    }
    const items = cards();
    const index = items.indexOf(current);
    const last = items.length - 1;
    const columns = columnsOf(items);
    let next = index;
    switch (event.key) {
      case "ArrowRight":
        next = Math.min(last, index + 1);
        break;
      case "ArrowLeft":
        next = Math.max(0, index - 1);
        break;
      case "ArrowDown":
        next = index + columns <= last ? index + columns : index;
        break;
      case "ArrowUp":
        next = index - columns >= 0 ? index - columns : index;
        break;
      case "Home":
        next = 0;
        break;
      case "End":
        next = last;
        break;
      default:
        return;
    }
    event.preventDefault();
    const target = items[next];
    if (!target?.dataset.id) return;
    target.focus();
    choose(target.dataset.id);
  }

  const rail = [{ id: ALL_ID, label: words.all }, ...list];
  const empty = shown.length === 0;

  return (
    <div data-slot="template-picker-panel" data-busy={busy || undefined} className={cn("flex min-h-0 flex-1 flex-col bg-background text-foreground", className)}>
      <div className="shrink-0 px-5 pt-5 pr-14 pb-4 sm:px-6 sm:pt-6">
        {standalone ? (
          <>
            <h2 className="text-lg leading-tight font-semibold tracking-[-0.02em]">{words.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground max-sm:sr-only [@media(max-height:40rem)]:sr-only">{words.description}</p>
          </>
        ) : (
          <>
            <DialogTitle className="text-lg tracking-[-0.02em]">{words.title}</DialogTitle>
            <DialogDescription className="mt-1 max-sm:sr-only [@media(max-height:40rem)]:sr-only">{words.description}</DialogDescription>
          </>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-3 px-4 pb-4 sm:px-6">
        <div ref={searchBox} data-escape-local={query ? "" : undefined} className="min-w-0 flex-1 sm:max-w-sm">
          <SearchInput
            aria-label={words.search}
            placeholder={words.search}
            value={query}
            readOnly={busy}
            onValueChange={(next) => {
              if (!working.current) setQuery(next);
            }}
            onKeyDown={(event) => {
              if (event.key === "ArrowDown" && !working.current) {
                event.preventDefault();
                focusCard(tabStop);
              }
            }}
          />
        </div>
        <p aria-hidden="true" className="ms-auto hidden shrink-0 text-xs text-muted-foreground tabular-nums sm:block">
          {countText}
        </p>
        <p aria-live="polite" className="sr-only">
          {empty ? emptyTitle : countText}
        </p>
      </div>

      <div className="flex min-h-0 flex-1 flex-col border-t border-border sm:grid sm:grid-cols-[9.5rem_minmax(0,1fr)_15rem] sm:grid-rows-[minmax(0,1fr)] lg:grid-cols-[11.5rem_minmax(0,1fr)_17.5rem]">
        <nav aria-label={words.categories} className="relative shrink-0 border-b border-border sm:overflow-y-auto sm:border-r sm:border-b-0 sm:p-3">
          <ul className="relative flex gap-1.5 overflow-x-auto px-4 py-2.5 [scrollbar-width:none] sm:flex-col sm:gap-0.5 sm:overflow-visible sm:p-0">
            {rail.map((item) => {
              const count = item.id === ALL_ID ? matching.length : matching.filter((template) => template.category === item.id).length;
              const active = category === item.id;
              return (
                <li key={item.id} className="shrink-0 sm:shrink">
                  <button
                    ref={item.id === ALL_ID ? allEntry : undefined}
                    type="button"
                    aria-pressed={active}
                    aria-disabled={busy || undefined}
                    onClick={() => filter(item.id)}
                    className={cn(
                      "flex h-8 w-full items-center justify-between gap-2.5 rounded-full border px-3 text-[0.8125rem] whitespace-nowrap outline-none sm:h-9 sm:rounded-md sm:border-transparent sm:text-sm",
                      "transition-colors duration-150 focus-visible:ring-[3px] focus-visible:ring-ring/40 motion-reduce:transition-none aria-disabled:pointer-events-none aria-disabled:opacity-60",
                      active
                        ? "border-foreground/30 bg-muted font-medium text-foreground"
                        : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground sm:bg-transparent",
                    )}
                  >
                    <span className="truncate">{item.label}</span>
                    <span className="text-xs font-normal text-muted-foreground tabular-nums">{numberText(count, locale)}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <div ref={scroller} className="relative min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain [scrollbar-width:thin]">
          <div className="grid gap-5 p-4 sm:p-5">
            <div
              ref={group}
              role="radiogroup"
              aria-label={words.templates}
              aria-busy={busy || undefined}
              onKeyDown={onKeyDown}
              className="grid grid-cols-2 gap-3 sm:grid-cols-[repeat(auto-fill,minmax(10rem,1fr))]"
            >
              <Card
                id={BLANK_ID}
                name={words.blank}
                meta={words.blankCategory}
                preview={blankPreview ?? <BlankPage />}
                checked={chosenId === BLANK_ID}
                tabbable={tabStop === BLANK_ID}
                busy={busy}
                onChoose={choose}
                onConfirm={() => void confirm()}
              />
              {shown.map((template) => (
                <Card
                  key={template.id}
                  id={template.id}
                  name={template.name}
                  meta={categoryLabel(template.category)}
                  preview={template.preview}
                  checked={chosenId === template.id}
                  tabbable={tabStop === template.id}
                  busy={busy}
                  onChoose={choose}
                  onConfirm={() => void confirm()}
                />
              ))}
            </div>
            {empty ? (
              <NoMatch title={emptyTitle} hint={emptyHint}>
                {trimmed ? (
                  <Button type="button" variant="outline" size="sm" onClick={elsewhere ? searchEverywhere : clearSearch}>
                    {elsewhere ? words.searchAll : words.clearSearch}
                  </Button>
                ) : null}
              </NoMatch>
            ) : null}
          </div>
        </div>

        <aside
          aria-label={words.details}
          className="relative flex shrink-0 flex-col border-t border-border bg-card sm:min-h-0 sm:overflow-y-auto sm:border-t-0 sm:border-l sm:bg-transparent"
        >
          <div className="flex items-center gap-3 px-4 py-3 sm:hidden">
            <Frame className="aspect-[4/3] w-12 shrink-0 rounded">{preview}</Frame>
            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 text-sm leading-snug font-medium tracking-[-0.01em]">{name}</p>
              <p className="truncate text-xs text-muted-foreground">{meta}</p>
            </div>
            <button
              type="button"
              aria-expanded={sheet}
              aria-controls={sheetId}
              onClick={() => setSheet((open) => !open)}
              className="inline-flex h-8 shrink-0 items-center gap-1 rounded-md px-2 text-xs font-medium text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40"
            >
              <span className="max-[23rem]:sr-only">{sheet ? words.hidePreview : words.showPreview}</span>
              <IconChevronUp aria-hidden="true" className={cn("size-3.5 transition-transform duration-150 motion-reduce:transition-none", sheet && "rotate-180")} />
            </button>
          </div>
          <div id={sheetId} className={cn("items-start gap-3 px-4 pb-4 sm:block sm:p-5", sheet ? "flex" : "hidden")}>
            <Frame className="aspect-[4/3] w-36 shrink-0 rounded-lg sm:w-full">{preview}</Frame>
            <div className="min-w-0 sm:mt-4">
              <h3 className="hidden text-base leading-snug font-semibold tracking-[-0.02em] sm:block">{name}</h3>
              <p className="hidden text-[0.8125rem] text-muted-foreground sm:mt-0.5 sm:block">{meta}</p>
              {chosen?.tags?.length ? (
                <ul aria-hidden="true" className="mt-2.5 hidden flex-wrap gap-1.5 sm:flex">
                  {chosen.tags.map((tag) => (
                    <li key={tag} className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                      {tag}
                    </li>
                  ))}
                </ul>
              ) : null}
              <p className="text-sm leading-relaxed text-pretty text-muted-foreground sm:mt-3">{description}</p>
            </div>
          </div>
        </aside>
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-2 border-t border-border bg-background px-4 py-3 sm:justify-end sm:px-6 sm:py-4">
        <p role="status" className="sr-only">
          {busy ? words.working : ""}
        </p>
        {error ? (
          <p role="alert" className={cn("flex w-full items-start gap-2 text-[0.8125rem] leading-snug sm:mr-auto sm:w-auto sm:flex-1", DANGER_TEXT)}>
            <IconAlertCircle aria-hidden="true" className="mt-px size-4 shrink-0" />
            <span className="min-w-0">{error}</span>
          </p>
        ) : null}
        {onClose ? (
          <Button type="button" variant="outline" aria-disabled={busy || undefined} onClick={() => !working.current && onClose()} className="flex-none px-5 aria-disabled:pointer-events-none aria-disabled:opacity-60">
            {words.cancel}
          </Button>
        ) : null}
        <Button
          type="button"
          aria-disabled={busy || undefined}
          aria-busy={busy || undefined}
          onClick={() => void confirm()}
          className="h-auto min-h-9 min-w-0 flex-1 py-1.5 whitespace-normal aria-disabled:pointer-events-none aria-disabled:opacity-70 sm:flex-none"
        >
          {busy ? <IconSpinner /> : null}
          <span className="min-w-0 text-center leading-tight text-balance">{confirmLabel}</span>
        </Button>
      </div>
    </div>
  );
}
