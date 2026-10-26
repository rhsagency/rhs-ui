"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";

import { IconSearch } from "@rhs-ui/icons";
import { LETTERS, OTHER, groupId, normalise } from "@rhs-ui/commerce/brand-index/groups";
import { Button } from "@rhs-ui/primitives/button";
import { SearchInput } from "@rhs-ui/primitives/search-input";

/** One brand, ready to draw: its link is already rendered, so the router's Link never has to cross into this module. */
export interface BrandEntry {
  /** Identity for the list. */
  key: string;
  name: string;
  /** The group it sits under: A to Z or "#". */
  letter: string;
  /** The name as it is searched: lower case, without accents. */
  search: string;
  /** The rendered link, with the name and the count in it. */
  link: ReactNode;
}

export interface BrandListWords {
  searchLabel: string;
  searchPlaceholder: string;
  jump: string;
  group: string;
  groupOther: string;
  matchOne: string;
  matchOther: string;
  none: string;
  noneHint: string;
  clear: string;
  empty: string;
}

export interface BrandListProps {
  entries: readonly BrandEntry[];
  /** The title block that sits beside the search field. */
  heading: ReactNode;
  /** The popular tiles. They are shown while the search is empty and give way to the results once someone types. */
  popular?: ReactNode;
  words: BrandListWords;
  locale: string;
}

const fill = (template: string, values: Record<string, string>): string => template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? "");

/** Says a sentence once typing settles, so a screen reader hears the result and not every keystroke. The first render says nothing. */
function useCalmStatus(text: string, delay = 450): string {
  const [said, setSaid] = useState("");
  const spoken = useRef(text);
  useEffect(() => {
    if (spoken.current === text) return;
    spoken.current = text;
    const timeout = window.setTimeout(() => setSaid(text), delay);
    return () => window.clearTimeout(timeout);
  }, [text, delay]);
  return said;
}

/**
 * The searchable part of a brand index: the search field, the popular tiles, the A to Z jump bar and every
 * brand under its letter. Typing filters the list as you go and a polite status says how many brands match;
 * letters with no brand left stop being links. The groups are real headings, so a screen reader can move from
 * letter to letter, and on a wide screen they flow into balanced columns.
 */
export function BrandList({ entries, heading, popular, words, locale }: BrandListProps) {
  const base = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const [query, setQuery] = useState("");
  const search = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLOListElement>(null);
  const needle = normalise(query.trim());
  const shown = needle ? entries.filter((entry) => entry.search.includes(needle)) : entries;
  const numbers = new Intl.NumberFormat(locale);
  const plural = new Intl.PluralRules(locale);

  const groups = new Map<string, BrandEntry[]>();
  for (const entry of shown) groups.set(entry.letter, [...(groups.get(entry.letter) ?? []), entry]);
  const letters = [...(entries.some((entry) => entry.letter === OTHER) ? [OTHER] : []), ...LETTERS];

  const result = needle ? fill(plural.select(shown.length) === "one" ? words.matchOne : words.matchOther, { count: numbers.format(shown.length), query: query.trim() }) : "";
  const said = useCalmStatus(needle ? (shown.length ? result : fill(words.none, { query: query.trim() })) : "");

  // The bar follows the matches: when the first letter that still has a brand is out of sight, it is scrolled to, so a phone is not left looking at a row of dim letters.
  useEffect(() => {
    const list = bar.current;
    const first = list?.querySelector<HTMLElement>("a")?.closest("li");
    if (list && first) list.scrollTo({ left: Math.max(0, first.offsetLeft - 8) });
  }, [needle, shown.length]);

  if (entries.length === 0) {
    return (
      <div data-slot="brand-list" className="contents">
        {heading}
        <p className="rounded-xl border border-dashed border-border px-6 py-14 text-center text-sm text-muted-foreground">{words.empty}</p>
      </div>
    );
  }

  return (
    <div data-slot="brand-list" className="contents">
      <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-5">
        {heading}
        <div ref={search} className="w-full @2xl:w-80">
          <SearchInput value={query} onValueChange={setQuery} placeholder={words.searchPlaceholder} aria-label={words.searchLabel} autoComplete="off" spellCheck={false} />
          <p aria-hidden="true" className="mt-2 h-4 text-xs text-muted-foreground tabular-nums">
            {shown.length ? result : ""}
          </p>
        </div>
      </div>

      {needle ? null : popular}

      <nav aria-label={words.jump} className="sticky top-[var(--sticky-top,0px)] z-10 min-w-0 border-y border-border bg-background">
        {/* The padding keeps the focus ring of the first and the last letter from being cut off by the scroller. On a narrow bar each cell is sized so that nine and a half of them fit, whatever the width, which leaves the next letter half in view: that is what says the bar scrolls. */}
        <ol ref={bar} role="list" className="relative flex overflow-x-auto px-1 py-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {letters.map((letter) => {
            const present = groups.has(letter);
            return (
              <li key={letter} className="min-w-8 flex-1 @max-md:min-w-[calc((100cqw_-_0.5rem)_/_9.5)]">
                {present ? (
                  <a
                    href={`#${groupId(base, letter)}`}
                    className="grid h-9 w-full place-items-center rounded-md text-sm font-medium text-foreground outline-none transition-colors hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/40 motion-reduce:transition-none"
                  >
                    {letter}
                  </a>
                ) : (
                  <span aria-hidden="true" className="grid h-9 w-full place-items-center text-sm font-medium text-muted-foreground/40">
                    {letter}
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </nav>

      {shown.length ? (
        <div className="columns-1 gap-x-12 @xl:columns-2 @4xl:columns-3">
          {letters
            .filter((letter) => groups.has(letter))
            .map((letter) => {
              const id = groupId(base, letter);
              return (
                <div key={letter} data-letter={letter} className="mb-8 break-inside-avoid">
                  <h3 id={id} className="scroll-mt-[calc(var(--sticky-top,0px)+3.75rem)] border-b border-border pb-2 text-2xl leading-none font-medium tracking-[-0.04em]">
                    <span className="sr-only">{letter === OTHER ? words.groupOther : fill(words.group, { letter })} </span>
                    <span aria-hidden="true">{letter}</span>
                  </h3>
                  <ul role="list" className="mt-2">
                    {(groups.get(letter) ?? []).map((entry) => (
                      <li key={entry.key}>{entry.link}</li>
                    ))}
                  </ul>
                </div>
              );
            })}
        </div>
      ) : (
        <div className="grid justify-items-center gap-3 rounded-xl border border-dashed border-border px-6 py-14 text-center">
          <span aria-hidden="true" className="grid size-11 place-items-center rounded-xl border border-border bg-muted">
            <IconSearch className="size-5" />
          </span>
          <p className="text-base font-medium text-balance">{fill(words.none, { query: query.trim() })}</p>
          <p className="max-w-sm text-sm text-muted-foreground">{words.noneHint}</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setQuery("");
              search.current?.querySelector("input")?.focus();
            }}
          >
            {words.clear}
          </Button>
        </div>
      )}

      <p role="status" className="sr-only">
        {said}
      </p>
    </div>
  );
}
