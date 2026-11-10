"use client";

import { useEffect, useId, useRef, useState, type ChangeEvent, type ComponentProps, type KeyboardEvent } from "react";

import { IconChevronDown, IconSpinner } from "@rhs-ui/icons";
import {
  DEFAULT_LABELS,
  SEARCH_AFTER,
  cleanFilters,
  countActive,
  fill,
  formatRange,
  isActive,
  plural,
  summaryOf,
  type CheckboxFilter,
  type FilterGroup,
  type FilterPopoverLabels,
  type FilterValue,
  type RadioFilter,
  type RangeFilter,
  type ToggleFilter,
} from "@rhs-ui/application/filter-popover/filters";
import { Button } from "@rhs-ui/primitives/button";
import { Checkbox } from "@rhs-ui/primitives/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@rhs-ui/primitives/collapsible";
import { Input } from "@rhs-ui/primitives/input";
import { RadioGroup, RadioGroupItem } from "@rhs-ui/primitives/radio-group";
import { SearchInput } from "@rhs-ui/primitives/search-input";
import { Slider } from "@rhs-ui/primitives/slider";
import { Switch } from "@rhs-ui/primitives/switch";
import { cn } from "@/lib/utils";

export interface FilterPanelProps extends Omit<ComponentProps<"div">, "children" | "onChange"> {
  /** The groups of filters, in the order they are listed. */
  groups: readonly FilterGroup[];
  /** The filters that are applied now. They are where the draft starts. */
  value?: FilterValue;
  /** The person took the draft. It receives the filters that are on, and nothing else. */
  onApply: (next: FilterValue) => void;
  /** The person pressed Reset: the draft is empty, and nothing is applied until Apply. */
  onReset?: () => void;
  /** Counts what the draft would leave, for the button: "Show 128 results". It may be asynchronous. It is asked when the panel opens and again, after a short pause, whenever the draft changes; an answer that comes late is thrown away. */
  resultCount?: (draft: FilterValue) => number | Promise<number>;
  /** The language of the numbers and of "1 result" against "2 results". Default "en-US". */
  locale?: string;
  /** The words the panel says, for translation. */
  labels?: FilterPopoverLabels;
}

const ROW = "flex min-h-9 cursor-pointer items-center gap-2.5 rounded-md px-1.5 text-sm transition-colors duration-150 hover:bg-muted/70 has-[[data-disabled]]:cursor-not-allowed has-[[data-disabled]]:opacity-60";

function OptionCount({ count }: { count: number | undefined }) {
  return count === undefined ? null : <span className="shrink-0 text-xs text-muted-foreground tabular-nums">{count}</span>;
}

function CheckboxBody({ group, value, onChange, labels }: { group: CheckboxFilter; value: string[]; onChange: (next: string[]) => void; labels: Required<FilterPopoverLabels> }) {
  const [query, setQuery] = useState("");
  const long = group.options.length > SEARCH_AFTER;
  const needle = query.trim().toLowerCase();
  const shown = needle ? group.options.filter((option) => option.label.toLowerCase().includes(needle)) : group.options;
  return (
    <div className="grid gap-2">
      {long ? (
        <SearchInput value={query} onValueChange={setQuery} placeholder={labels.searchPlaceholder} aria-label={fill(labels.searchIn, { group: group.label })} className="h-8 [&_input]:text-[0.8125rem]" />
      ) : null}
      <div className={cn("grid gap-0.5", long && "relative max-h-52 overflow-y-auto overscroll-contain [scrollbar-width:thin]")}>
        {shown.map((option) => (
          <label key={option.value} className={ROW}>
            <Checkbox
              checked={value.includes(option.value)}
              disabled={option.disabled}
              onCheckedChange={(checked) => onChange(checked === true ? [...value, option.value] : value.filter((entry) => entry !== option.value))}
            />
            <span className="min-w-0 flex-1 truncate">{option.label}</span>
            <OptionCount count={option.count} />
          </label>
        ))}
        {long && !shown.length ? <p className="px-1.5 py-3 text-center text-xs text-muted-foreground">{fill(labels.nothingMatches, { query: query.trim() })}</p> : null}
      </div>
    </div>
  );
}

function RadioBody({ group, value, onChange, labels }: { group: RadioFilter; value: string; onChange: (next: string) => void; labels: Required<FilterPopoverLabels> }) {
  const [query, setQuery] = useState("");
  const long = group.options.length > SEARCH_AFTER;
  const needle = query.trim().toLowerCase();
  const shown = needle ? group.options.filter((option) => option.label.toLowerCase().includes(needle)) : group.options;
  return (
    <div className="grid gap-2">
      {long ? (
        <SearchInput value={query} onValueChange={setQuery} placeholder={labels.searchPlaceholder} aria-label={fill(labels.searchIn, { group: group.label })} className="h-8 [&_input]:text-[0.8125rem]" />
      ) : null}
      <RadioGroup aria-label={group.label} value={value} onValueChange={onChange} className={cn("gap-0.5", long && "relative max-h-52 overflow-y-auto overscroll-contain [scrollbar-width:thin]")}>
        {shown.map((option) => (
          <label key={option.value} className={ROW}>
            <RadioGroupItem value={option.value} disabled={option.disabled} />
            <span className="min-w-0 flex-1 truncate">{option.label}</span>
            <OptionCount count={option.count} />
          </label>
        ))}
        {long && !shown.length ? <p className="px-1.5 py-3 text-center text-xs text-muted-foreground">{fill(labels.nothingMatches, { query: query.trim() })}</p> : null}
      </RadioGroup>
    </div>
  );
}

function RangeBody({ group, value, onChange, locale, labels }: { group: RangeFilter; value: [number, number]; onChange: (next: [number, number]) => void; locale: string; labels: Required<FilterPopoverLabels> }) {
  const [low, high] = value;
  const clamp = (amount: number) => Math.min(group.max, Math.max(group.min, amount));
  const field = "h-9 w-full min-w-0 tabular-nums";

  // What the two fields show. While someone types the text is theirs: it may be empty or half a number, and nothing is
  // committed until the field is left or Enter is pressed, so a bound is never moved by a number that is still being typed.
  const [texts, setTexts] = useState<[string, string]>(() => [String(low), String(high)]);
  const [seen, setSeen] = useState<[number, number]>([low, high]);
  // When the range changes from outside the fields (the slider, Reset, a commit) the text follows it.
  if (seen[0] !== low || seen[1] !== high) {
    setSeen([low, high]);
    setTexts([String(low), String(high)]);
  }

  /** The number a field holds, kept inside the group; an empty field is the open end of the range. */
  const read = (text: string, open: number) => {
    const amount = text.trim() === "" ? Number.NaN : Number(text);
    return Number.isFinite(amount) ? clamp(amount) : open;
  };

  /** Takes both fields as they stand: the smaller number is the minimum, and the text is written back as the number it became. */
  function commit(from: readonly [string, string]) {
    const a = read(from[0], group.min);
    const b = read(from[1], group.max);
    const next: [number, number] = [Math.min(a, b), Math.max(a, b)];
    const written: [string, string] = [String(next[0]), String(next[1])];
    setTexts((current) => (current[0] === written[0] && current[1] === written[1] ? current : written));
    if (next[0] !== low || next[1] !== high) onChange(next);
  }

  const fieldProps = (at: 0 | 1) => ({
    type: "number" as const,
    inputMode: "numeric" as const,
    className: field,
    value: texts[at],
    min: group.min,
    max: group.max,
    step: group.step ?? 1,
    onChange: (event: ChangeEvent<HTMLInputElement>) => {
      const text = event.target.value;
      // Typing, pasting and deleting are edits and carry an inputType. A step of the arrow keys or of the spinner does not: it is a number
      // the person chose, so it is taken at once, and it stops at the other end of the range instead of pushing it. A script that sets the
      // value is not a person stepping (its event is not trusted), and is treated as typing.
      if ((event.nativeEvent as Partial<InputEvent>).inputType || !event.nativeEvent.isTrusted) {
        setTexts((current) => (at === 0 ? [text, current[1]] : [current[0], text]));
        return;
      }
      const stepped = read(text, at === 0 ? group.min : group.max);
      commit(at === 0 ? [String(Math.min(stepped, high)), String(high)] : [String(low), String(Math.max(stepped, low))]);
    },
    onBlur: () => commit(texts),
    onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key !== "Enter") return;
      event.preventDefault();
      commit(texts);
    },
  });

  return (
    <div className="grid gap-4 px-1.5">
      <p className="text-sm font-medium tabular-nums">
        {formatRange(group, low, locale)} <span className="font-normal text-muted-foreground">–</span> {formatRange(group, high, locale)}
      </p>
      <Slider
        min={group.min}
        max={group.max}
        step={group.step ?? 1}
        value={[low, high]}
        thumbLabels={[`${labels.min} ${group.label.toLowerCase()}`, `${labels.max} ${group.label.toLowerCase()}`]}
        onValueChange={([a = low, b = high]) => onChange([a, b])}
        minStepsBetweenThumbs={0}
      />
      <div className="grid grid-cols-2 gap-3">
        <label className="grid gap-1 text-xs text-muted-foreground">
          {labels.min}
          <Input {...fieldProps(0)} />
        </label>
        <label className="grid gap-1 text-xs text-muted-foreground">
          {labels.max}
          <Input {...fieldProps(1)} />
        </label>
      </div>
    </div>
  );
}

function ToggleRow({ group, value, onChange }: { group: ToggleFilter; value: boolean; onChange: (next: boolean) => void }) {
  return (
    <label className="flex min-h-12 cursor-pointer items-center justify-between gap-4 px-4 py-2.5 transition-colors duration-150 hover:bg-muted/50">
      <span className="grid min-w-0 gap-0.5">
        <span className="text-sm font-medium">{group.label}</span>
        {group.description ? <span className="text-xs text-muted-foreground">{group.description}</span> : null}
      </span>
      <Switch checked={value} onCheckedChange={onChange} />
    </label>
  );
}

/** What is chosen in a group, in the shape the group takes: the empty one when nothing is. */
function entryOf(group: FilterGroup, draft: FilterValue): string[] | string | [number, number] | boolean {
  const entry = draft[group.id];
  switch (group.kind) {
    case "checkbox":
      return Array.isArray(entry) ? (entry as string[]) : [];
    case "radio":
      return typeof entry === "string" ? entry : (group.defaultValue ?? "");
    case "range":
      return Array.isArray(entry) && typeof entry[0] === "number" ? [entry[0], Number(entry[1])] : [group.min, group.max];
    case "toggle":
      return entry === true;
  }
}

/**
 * What the popover holds, and usable on its own in a sheet on a phone: the
 * groups of filters as sections that fold, a Reset in the head and one button at
 * the foot that says what it will do. Every change is a draft; nothing happens
 * until the button is pressed, and the panel starts from the applied `value`
 * each time it appears. A group with more than eight options gets a search
 * field and scrolls inside itself, and a closed group says what is chosen in
 * it. With `resultCount` the button counts what the draft would leave, as
 * "Show 128 results", and goes quiet when it would leave nothing.
 */
export function FilterPanel({ groups, value = {}, onApply, onReset, resultCount, locale = "en-US", labels, className, ...props }: FilterPanelProps) {
  const words: Required<FilterPopoverLabels> = { ...DEFAULT_LABELS, ...labels };
  const base = useId();
  const [draft, setDraft] = useState<FilterValue>(() => cleanFilters(groups, value));
  const [opened, setOpened] = useState<Set<string>>(() => new Set(groups.filter((group, at) => group.kind !== "toggle" && (group.defaultOpen ?? (at === 0 || isActive(group, value[group.id])))).map((group) => group.id)));
  const [count, setCount] = useState<number | null>(null);
  const [counting, setCounting] = useState(false);
  const counted = useRef(resultCount);
  useEffect(() => {
    counted.current = resultCount;
  });

  const cleaned = cleanFilters(groups, draft);
  const key = JSON.stringify(cleaned);
  const active = countActive(groups, cleaned);
  const hadFilters = countActive(groups, value) > 0;
  const counts = resultCount !== undefined;

  // The count is asked for when the panel opens, and after a short pause whenever the draft changes; a late answer to an old question is dropped.
  const first = useRef(true);
  // Whether the last answer was a promise: then the label is stale from the moment the draft changes, not only once the pause is over.
  const slow = useRef(false);
  useEffect(() => {
    const ask = counted.current;
    if (!ask) return;
    let wanted = true;
    const run = () => {
      const answer = ask(JSON.parse(key) as FilterValue);
      if (typeof answer === "number") {
        slow.current = false;
        setCount(answer);
        setCounting(false);
        return;
      }
      slow.current = true;
      setCounting(true);
      answer.then(
        (total) => {
          if (!wanted) return;
          setCount(total);
          setCounting(false);
        },
        () => {
          if (!wanted) return;
          setCount(null);
          setCounting(false);
        },
      );
    };
    if (first.current) {
      first.current = false;
      run();
      return () => {
        wanted = false;
      };
    }
    if (slow.current) setCounting(true);
    const timer = window.setTimeout(run, 180);
    return () => {
      wanted = false;
      window.clearTimeout(timer);
    };
  }, [key]);

  function set(group: FilterGroup, next: FilterValue[string]) {
    setDraft((current) => ({ ...current, [group.id]: next }));
  }

  function toggleOpen(id: string, open: boolean) {
    setOpened((current) => {
      const next = new Set(current);
      if (open) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  const number = new Intl.NumberFormat(locale);
  const none = counts && count === 0 && !counting;
  const label = counts
    ? count === null
      ? words.showPending
      : count === 0
        ? words.noResults
        : fill(plural(count, words.showOne, words.showMany, locale), { count: number.format(count) })
    : active > 0
      ? fill(plural(active, words.applyOne, words.applyMany, locale), { count: number.format(active) })
      : hadFilters
        ? words.clear
        : words.apply;
  const status = counts && count !== null && !counting ? (count === 0 ? words.noResults : fill(plural(count, words.resultOne, words.resultMany, locale), { count: number.format(count) })) : "";

  return (
    <div data-slot="filter-panel" className={cn("flex min-h-0 min-w-0 flex-col", className)} {...props}>
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border py-2 pr-2.5 pl-4">
        <h2 className="text-sm font-semibold tracking-[-0.01em]">{words.title}</h2>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          // Not `disabled`: pressing Reset empties the draft and turns it off, and a disabled button would drop the focus it has.
          aria-disabled={active === 0 || undefined}
          onClick={() => {
            if (active === 0) return;
            setDraft({});
            onReset?.();
          }}
          className="text-muted-foreground hover:text-foreground aria-disabled:pointer-events-none aria-disabled:opacity-50"
        >
          {words.reset}
        </Button>
      </div>

      <div data-slot="filter-panel-groups" className="relative min-h-0 flex-1 overflow-y-auto overscroll-contain [scrollbar-width:thin]">
        {groups.map((group) => {
          if (group.kind === "toggle") {
            return (
              <div key={group.id} className="border-b border-border last:border-b-0">
                <ToggleRow group={group} value={entryOf(group, draft) === true} onChange={(next) => set(group, next)} />
              </div>
            );
          }
          const open = opened.has(group.id);
          const entry = entryOf(group, draft);
          const summary = summaryOf(group, draft[group.id], words, locale);
          const headingId = `${base}-${group.id}`;
          return (
            <Collapsible key={group.id} open={open} onOpenChange={(next) => toggleOpen(group.id, next)} className="border-b border-border last:border-b-0">
              <CollapsibleTrigger className="group/trigger flex min-h-12 w-full items-center justify-between gap-3 px-4 py-3 text-left outline-none transition-colors duration-150 hover:bg-muted/50 focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:ring-inset">
                <span id={headingId} className="min-w-0 truncate text-sm font-medium">
                  {group.label}
                </span>
                <span className="flex min-w-0 items-center gap-2">
                  {!open && summary ? <span className="min-w-0 truncate text-xs text-muted-foreground tabular-nums">{summary}</span> : null}
                  <IconChevronDown aria-hidden="true" className="size-4 shrink-0 text-muted-foreground transition-transform duration-150 group-data-[state=open]/trigger:rotate-180 motion-reduce:transition-none" />
                </span>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div role="group" aria-labelledby={headingId} className="px-3 pt-0.5 pb-3.5">
                  {group.kind === "checkbox" ? <CheckboxBody group={group} value={entry as string[]} onChange={(next) => set(group, next)} labels={words} /> : null}
                  {group.kind === "radio" ? <RadioBody group={group} value={entry as string} onChange={(next) => set(group, next === group.defaultValue ? "" : next)} labels={words} /> : null}
                  {group.kind === "range" ? <RangeBody group={group} value={entry as [number, number]} onChange={(next) => set(group, next)} locale={locale} labels={words} /> : null}
                </div>
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </div>

      <div className="grid shrink-0 gap-2 border-t border-border p-3">
        <Button type="button" disabled={none} aria-busy={counting || undefined} onClick={() => onApply(cleaned)} className="w-full">
          {counting ? <IconSpinner aria-hidden="true" /> : null}
          <span className={cn("tabular-nums transition-opacity duration-150 motion-reduce:transition-none", counting && count !== null && "opacity-70")}>{label}</span>
        </Button>
        {none ? <p className="text-center text-xs text-muted-foreground">{words.noResultsHint}</p> : null}
      </div>

      {/* Kept in the page when empty: a live region that appears together with its message is often never read. */}
      <p role="status" aria-live="polite" className="sr-only">
        {status}
      </p>
    </div>
  );
}
