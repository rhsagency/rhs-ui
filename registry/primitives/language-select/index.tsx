"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { IconCheck, IconChevronsUpDown } from "@rhs-ui/icons";
import { Command, CommandGroup, CommandInput, CommandItem, CommandList } from "@rhs-ui/primitives/command";
import { fieldSurface } from "@rhs-ui/primitives/input";
import { DEFAULT_LANGUAGES, describeLanguage, rankLanguage, type LanguageEntry } from "@rhs-ui/primitives/language-select/languages";
import { Popover, PopoverContent, PopoverTrigger } from "@rhs-ui/primitives/popover";
import { cn } from "@/lib/utils";

const NAMES_IN_ENGLISH: readonly string[] = ["en"];

/** What the list says besides the language names. Every part can be replaced, for another language or your own voice. */
export interface LanguageSelectMessages {
  /** The heading over the suggested languages. */
  suggested: string;
  /** The heading over the full list, when suggestions are pinned above it. */
  allLanguages: string;
  /** Read by a screen reader after the language that is chosen: "German, selected". */
  selected: string;
  /** The name of the search box, from the name of the list: "Search language". */
  search: (label: string) => string;
}

const MESSAGES: LanguageSelectMessages = {
  suggested: "Suggested",
  allLanguages: "All languages",
  selected: "selected",
  search: (label) => `Search ${label.toLowerCase()}`,
};

export interface LanguageSelectProps {
  /** The language, as a BCP 47 code such as "de" or "pt-BR", when you control it. */
  value?: string | null;
  /** The language to start with, when you do not control the field; restored when the surrounding form resets. */
  defaultValue?: string | null;
  /** Called with the code of the language that was chosen. Only the code: it drops straight into a locale setting. */
  onValueChange?: (code: string) => void;
  /** The codes you support. Only the codes: the names come from the browser. Default: forty common languages. */
  languages?: readonly string[];
  /** Codes to pin on top while nothing is typed, in the order given: the languages most of your people use. */
  suggested?: readonly string[];
  /** The language the translated names are in, a BCP 47 code. Default "en". */
  locale?: string;
  /** Locales whose names the search matches as well, so someone who types "allem" finds German in an English list. The names in the list and in `locale` always match. Default English only. */
  alsoSearch?: readonly string[];
  /** Names the list for assistive technology. Default "Language". */
  label?: string;
  /** What the field says before a language is chosen. */
  placeholder?: string;
  /** What the search box says before anything is typed. */
  searchPlaceholder?: string;
  /** What the list says when nothing matches the search. */
  emptyText?: string;
  /** The other words of the list: the two headings, what a screen reader reads after the chosen language, and the name of the search box. Every part can be replaced. */
  messages?: Partial<LanguageSelectMessages>;
  /** Submits the code through a hidden input, so FormData and server actions see it. */
  name?: string;
  /** For <Label htmlFor>. */
  id?: string;
  /** Turns the field off and dims it. */
  disabled?: boolean;
  /** Marks the field as required for assistive technology. */
  required?: boolean;
  /** Start with the list open, for a preview or a tour. It never takes the focus until someone has used it. */
  defaultOpen?: boolean;
  /** Where the list opens: under the field and, when there is no room below, above it ("auto", the default); or always "bottom" or "top". */
  placement?: "auto" | "bottom" | "top";
  /** Merged onto the field (the trigger button). */
  className?: string;
  /** Marks the field invalid, with the destructive border. */
  "aria-invalid"?: boolean;
  /** The id of the line that describes the field: a hint, an error. */
  "aria-describedby"?: string;
}

/** One language in a row: its own name large, the translated name quietly beside it, and the code at the end. */
function Names({ entry, chosen, selected }: { entry: LanguageEntry; chosen: boolean; selected: string }) {
  return (
    <>
      <span className="flex min-w-0 flex-1 items-baseline gap-2">
        {/* <bdi> isolates a right-to-left name so it keeps its own direction and its punctuation stays put, while the row stays left to right. */}
        <span lang={entry.code} className="max-w-[70%] shrink-0 truncate text-[0.9375rem] font-medium text-foreground">
          <bdi>{entry.native}</bdi>
        </span>
        {entry.translated !== entry.native ? <span className="min-w-0 truncate text-xs text-muted-foreground">{entry.translated}</span> : null}
      </span>
      {/* The code is for people who set a locale; it gives way when the list is narrow, and the names keep the room. */}
      <span aria-hidden="true" className="hidden shrink-0 font-mono text-[0.6875rem] text-muted-foreground @[22rem]:block">
        {entry.code}
      </span>
      {chosen ? (
        <>
          <IconCheck size={14} className="absolute right-2" />
          <span className="sr-only">{`, ${selected}`}</span>
        </>
      ) : null}
    </>
  );
}

/**
 * A language picker that ships no data: the names come from Intl.DisplayNames, so each option shows the
 * language in itself, large, and in your language, quietly beside it. The search matches both names (and the
 * code) and ignores accents and capitals, so "ger", "deut" and, with `alsoSearch`, "allem" all find the same
 * row. A short list of `suggested` languages is pinned on top until someone types. A right-to-left
 * language keeps its own direction inside its row while the layout stays left to right, and every name
 * carries `lang`, so a Chinese and a Japanese name get their own letterforms. It returns the code only.
 * Arrow keys move, Enter chooses, Escape closes and gives the focus back to the field. The words of the
 * list itself (its headings, and what a screen reader adds) are in `messages`, so they can follow `locale`.
 */
export function LanguageSelect({
  value,
  defaultValue = null,
  onValueChange,
  languages = DEFAULT_LANGUAGES,
  suggested,
  locale = "en",
  alsoSearch = NAMES_IN_ENGLISH,
  label = "Language",
  placeholder = "Choose a language",
  searchPlaceholder = "Search languages...",
  emptyText = "No language matches that.",
  messages: overrides,
  name,
  id,
  disabled,
  required,
  defaultOpen = false,
  placement = "auto",
  className,
  "aria-invalid": ariaInvalid,
  "aria-describedby": ariaDescribedBy,
}: LanguageSelectProps) {
  const [open, setOpen] = useState(defaultOpen);
  const [query, setQuery] = useState("");
  const [uncontrolled, setUncontrolled] = useState<string | null>(defaultValue);
  const trigger = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLDivElement>(null);
  // A list that starts open is a preview: it must not take the focus from the page, until someone has used it.
  const used = useRef(false);
  const selected = value !== undefined ? value : uncontrolled;
  const messages: LanguageSelectMessages = { ...MESSAGES, ...overrides };

  useEffect(() => {
    const form = trigger.current?.closest("form");
    if (!form || value !== undefined) return;
    const reset = () => setUncontrolled(defaultValue);
    form.addEventListener("reset", reset);
    return () => form.removeEventListener("reset", reset);
  }, [defaultValue, value]);

  const everything = useMemo(() => [...new Set([...languages, ...(suggested ?? []), ...(selected ? [selected] : [])])], [languages, suggested, selected]);
  const entries = useMemo(() => {
    const collator = new Intl.Collator(locale);
    // In the order of the reader's alphabet, with Brazilian Portuguese next to Portuguese and not under B.
    return everything
      .map((code) => describeLanguage(code, locale, alsoSearch))
      .sort((a, b) => collator.compare(a.family, b.family) || Number(a.variant) - Number(b.variant) || collator.compare(a.translated, b.translated));
  }, [everything, locale, alsoSearch]);
  const byCode = useMemo(() => new Map(entries.map((entry) => [entry.code, entry])), [entries]);
  const current = selected ? byCode.get(selected) : undefined;

  const typed = query.trim() !== "";
  const pinned = !typed ? (suggested ?? []).map((code) => byCode.get(code)).filter((entry): entry is LanguageEntry => Boolean(entry)) : [];
  const matches = typed
    ? entries
        .map((entry, order) => ({ entry, order, rank: rankLanguage(entry, query) }))
        .filter((match): match is { entry: LanguageEntry; order: number; rank: number } => match.rank !== null)
        .sort((a, b) => a.rank - b.rank || a.order - b.order)
        .map((match) => match.entry)
    : entries;

  // The list opens on the language that is chosen, and scrolls to it.
  const start = selected ? `${pinned.some((entry) => entry.code === selected) ? "suggested" : "all"}:${selected}` : undefined;
  useEffect(() => {
    if (!open) return;
    const frame = window.requestAnimationFrame(() => list.current?.querySelector('[data-checked="true"]')?.scrollIntoView({ block: "center" }));
    return () => window.cancelAnimationFrame(frame);
  }, [open]);

  function show(next: boolean) {
    used.current = true;
    setOpen(next);
    if (!next) setQuery("");
  }

  function choose(code: string) {
    if (value === undefined) setUncontrolled(code);
    onValueChange?.(code);
    show(false);
  }

  const row = (entry: LanguageEntry, group: "suggested" | "all") => {
    const chosen = entry.code === selected;
    return (
      <CommandItem key={`${group}:${entry.code}`} value={`${group}:${entry.code}`} data-checked={chosen || undefined} onSelect={() => choose(entry.code)} className="pr-8">
        <Names entry={entry} chosen={chosen} selected={messages.selected} />
      </CommandItem>
    );
  };

  return (
    <Popover open={open && !disabled} onOpenChange={show}>
      <PopoverTrigger
        ref={trigger}
        id={id}
        disabled={disabled}
        aria-invalid={ariaInvalid}
        aria-describedby={ariaDescribedBy}
        aria-required={required || undefined}
        data-slot="language-select"
        data-placeholder={current ? undefined : ""}
        className={cn(
          fieldSurface,
          "flex h-9 w-full min-w-0 items-center justify-between gap-2 px-3 text-left whitespace-nowrap data-[placeholder]:text-muted-foreground",
          className,
        )}
      >
        {current ? (
          <span className="flex min-w-0 items-baseline gap-2">
            <span lang={current.code} suppressHydrationWarning className="truncate">
              <bdi suppressHydrationWarning>{current.native}</bdi>
            </span>
            {current.translated !== current.native ? (
              <span suppressHydrationWarning className="truncate text-xs text-muted-foreground">
                {current.translated}
              </span>
            ) : null}
          </span>
        ) : (
          <span className="truncate">{placeholder}</span>
        )}
        <IconChevronsUpDown size={16} className="shrink-0 text-muted-foreground" />
      </PopoverTrigger>
      {name ? <input type="hidden" name={name} value={selected ?? ""} /> : null}
      <PopoverContent
        align="start"
        side={placement === "top" ? "top" : "bottom"}
        avoidCollisions={placement === "auto"}
        aria-label={label}
        className="@container w-(--radix-popover-trigger-width) min-w-64 overflow-hidden p-0"
        onOpenAutoFocus={(event) => {
          if (!used.current) event.preventDefault();
        }}
      >
        <Command shouldFilter={false} loop defaultValue={start} className="rounded-none bg-transparent">
          <CommandInput value={query} onValueChange={setQuery} placeholder={searchPlaceholder} aria-label={messages.search(label)} />
          {/* The message sits beside the list and not inside it, so the list stays a clean listbox for assistive technology. */}
          {matches.length === 0 ? (
            <p role="status" className="px-4 py-8 text-center text-sm text-muted-foreground">
              {emptyText}
            </p>
          ) : null}
          <CommandList ref={list} className={cn(matches.length === 0 && "hidden")}>
            {pinned.length ? <CommandGroup heading={messages.suggested}>{pinned.map((entry) => row(entry, "suggested"))}</CommandGroup> : null}
            {matches.length ? <CommandGroup heading={pinned.length ? messages.allLanguages : undefined}>{matches.map((entry) => row(entry, "all"))}</CommandGroup> : null}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
