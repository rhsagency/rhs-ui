"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { IconCheck, IconChevronsUpDown, IconInfo } from "@rhs-ui/icons";
import { Command, CommandGroup, CommandInput, CommandItem, CommandList } from "@rhs-ui/primitives/command";
import {
  DEFAULT_GROUPS,
  DEFAULT_SAMPLE,
  fallbackOf,
  familiesOf,
  groupFonts,
  isInstalled,
  matchesFont,
  sameStack,
  type FontOption,
} from "@rhs-ui/primitives/font-family-select/fonts";
import { fieldSurface } from "@rhs-ui/primitives/input";
import { Popover, PopoverAnchor, PopoverContent, PopoverTrigger } from "@rhs-ui/primitives/popover";
import { cn } from "@/lib/utils";

export type { FontOption } from "@rhs-ui/primitives/font-family-select/fonts";

export interface FontFamilySelectProps {
  /** The fonts you offer, as `{ family, stack, label?, group? }`. The field lists these and nothing else, and loads nothing: the page decides which fonts exist and when they load. */
  fonts: readonly FontOption[];
  /** The chosen font as its CSS font-family list (a font's `stack`), when you control it. */
  value?: string | null;
  /** The font to start with, when you do not control the field; restored when the surrounding form resets. */
  defaultValue?: string | null;
  /** Called with the CSS font-family list that was chosen, and the font it belongs to. */
  onValueChange?: (value: string, font: FontOption) => void;
  /** The sentence the preview is set in. Default "Sphinx of black quartz, judge my vow." */
  sample?: string;
  /** How many lines tall the sample box is: 1, 2 or 3, or "auto" for 2, and 3 in a field narrower than about 17rem, where a wide face needs the third. The box is always this tall, whatever font it shows, so the list under it never moves while a font is previewed; a sample that needs more lines ends in an ellipsis. Default "auto". */
  sampleLines?: "auto" | 1 | 2 | 3;
  /** The order of the headings. Fonts in a group that is not listed come after, in the order they appear. Default Sans, Serif, Mono, Display. */
  groups?: readonly string[];
  /** The lists (stacks) to pin under "Recent", newest first, when you keep them yourself. Without it the field remembers what was chosen since it appeared. */
  recent?: readonly string[];
  /** The most fonts under "Recent". Default 3. */
  maxRecent?: number;
  /** Names the list for assistive technology. Default "Font family". */
  label?: string;
  /** What the field says before a font is chosen. */
  placeholder?: string;
  /** What the search box says before anything is typed. */
  searchPlaceholder?: string;
  /** What the list says when no font matches the search. */
  emptyText?: string;
  /** The other words of the field: the heading over the recent fonts, the captions over the sample, the mark on a font that is not loaded, and what a screen reader adds. Every part can be replaced. */
  messages?: Partial<FontFamilySelectMessages>;
  /** Submits the CSS font-family list through a hidden input, so FormData and server actions see it. */
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
  /** Merged onto the root element. */
  className?: string;
  /** Marks the field invalid, with the destructive border. */
  "aria-invalid"?: boolean;
  /** The id of the line that describes the field: a hint, an error. */
  "aria-describedby"?: string;
}

/** What the field says besides the font names. Every part can be replaced, for another language or your own voice. */
export interface FontFamilySelectMessages {
  /** The heading over the pinned fonts. */
  recent: string;
  /** The caption over the sample. */
  sample: string;
  /** The caption over the sample while a font that is not chosen is highlighted. */
  previewing: string;
  /** The mark on a font the page cannot draw, in the list, and what a screen reader adds to it. */
  notLoaded: string;
  /** The line under the sample when the font on show is not loaded, from the family the sample is set in instead: "Not loaded, set in Arial." */
  fallback: (family: string) => string;
  /** Read by a screen reader after the font that is chosen: "Georgia, Serif, selected". */
  selected: string;
  /** The name of the search box, from the name of the list: "Search font family". */
  search: (label: string) => string;
}

const MESSAGES: FontFamilySelectMessages = {
  recent: "Recent",
  sample: "Sample",
  previewing: "Previewing",
  notLoaded: "Not loaded",
  fallback: (family) => `Not loaded, set in ${family}.`,
  selected: "selected",
  search: (label) => `Search ${label.toLowerCase()}`,
};

const nameOf = (font: FontOption): string => font.label ?? font.family;

/** The sample box is as tall as its lines whatever the font, so nothing under it moves while a font is previewed. Written out, so the classes are found. */
const SAMPLE_BOX: Record<"auto" | 1 | 2 | 3, string> = {
  auto: "min-h-[2lh] line-clamp-2 @max-[15.5rem]:min-h-[3lh] @max-[15.5rem]:line-clamp-3",
  1: "min-h-[1lh] line-clamp-1",
  2: "min-h-[2lh] line-clamp-2",
  3: "min-h-[3lh] line-clamp-3",
};

/**
 * A list of typefaces where every option is set in its own face, for an editor or a brand setting. Under the
 * field a sample sentence shows the chosen font, and while the list is open it follows the highlighted one,
 * with arrow keys or a pointer, so a font is seen before it is chosen; Escape closes the list and the sample
 * goes back to the chosen font. The list opens under the sample, so the sample is never covered, and nothing
 * above the list changes height with the font on show, so the list never moves under the pointer. Fonts are
 * grouped (Sans, Serif, Mono, Display) with the last few chosen under Recent, the search matches the name and
 * the group, and a screen reader hears each font's name and its group. The field only lists what you pass and
 * never loads a font. A font that is not available on the page is marked in the list, and the sample says
 * in words which font it falls back to along the font's list. The words of the field itself are in `messages`.
 */
export function FontFamilySelect({
  fonts,
  value,
  defaultValue = null,
  onValueChange,
  sample = DEFAULT_SAMPLE,
  sampleLines = "auto",
  groups = DEFAULT_GROUPS,
  recent,
  maxRecent = 3,
  label = "Font family",
  placeholder = "Choose a font",
  searchPlaceholder = "Search fonts...",
  emptyText = "No font matches that.",
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
}: FontFamilySelectProps) {
  const [open, setOpen] = useState(defaultOpen);
  const [query, setQuery] = useState("");
  const [uncontrolled, setUncontrolled] = useState<string | null>(defaultValue);
  const [ownRecent, setOwnRecent] = useState<readonly string[]>([]);
  // Fonts the page cannot draw, by stack, with the family each one falls back to. Known only in the browser, once the page has settled.
  const [missing, setMissing] = useState<ReadonlyMap<string, string>>(() => new Map());
  const root = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLDivElement>(null);
  // A list that starts open is a preview: it must not take the focus from the page, until someone has used it.
  const used = useRef(false);

  const selected = value !== undefined ? value : uncontrolled;
  const messages: FontFamilySelectMessages = { ...MESSAGES, ...overrides };
  const chosenIndex = selected === null || selected === undefined ? -1 : fonts.findIndex((font) => sameStack(font.stack, selected));
  const chosen = chosenIndex >= 0 ? fonts[chosenIndex] : selected ? fonts.find((font) => font.family === selected) : undefined;

  const pinned = useMemo(
    () =>
      (recent ?? ownRecent)
        .map((stack) => fonts.findIndex((font) => sameStack(font.stack, stack)))
        .filter((index, position, all) => index >= 0 && all.indexOf(index) === position)
        .slice(0, maxRecent),
    [recent, ownRecent, fonts, maxRecent],
  );
  const typed = query.trim() !== "";
  const sections = useMemo(
    () => groupFonts(fonts, groups).map((section) => ({ ...section, fonts: section.fonts.filter((entry) => matchesFont(entry.font, query)) })).filter((section) => section.fonts.length > 0),
    [fonts, groups, query],
  );

  const nothingToList = sections.length === 0 && (typed || pinned.length === 0);

  /** The row of the chosen font the list opens on: under Recent when it is there, else in its own group. */
  const rowOf = (font: FontOption | undefined): string => {
    const index = font ? fonts.indexOf(font) : -1;
    if (index < 0) return "";
    return pinned.includes(index) ? `recent:${index}` : `font:${index}`;
  };
  // The row the list highlights: what the pointer or the arrow keys are on. A list that starts open starts on the chosen font.
  const [highlight, setHighlight] = useState(() => (defaultOpen ? rowOf(chosen) : ""));
  const highlightedFont = highlight ? fonts[Number(highlight.split(":")[1])] : undefined;

  // The sample follows the highlighted font while the list is open, and is the chosen font otherwise.
  const previewing = open && highlightedFont !== undefined && highlightedFont !== chosen;
  const shown = previewing ? highlightedFont : chosen;

  useEffect(() => {
    const form = root.current?.closest("form");
    if (!form || value !== undefined) return;
    const reset = () => setUncontrolled(defaultValue);
    form.addEventListener("reset", reset);
    return () => form.removeEventListener("reset", reset);
  }, [defaultValue, value]);

  // Which fonts the page can draw. A web font that finishes loading changes the answer, so it is asked again then.
  useEffect(() => {
    const check = () => {
      const next = new Map<string, string>();
      for (const font of fonts) {
        // The first family of the list is the one the font is meant to be drawn in; the rest is what it falls back to.
        if (!isInstalled(familiesOf(font.stack)[0] ?? font.family)) next.set(font.stack, fallbackOf(font.stack));
      }
      setMissing((now) => (now.size === next.size && [...next].every(([stack, fallback]) => now.get(stack) === fallback) ? now : next));
    };
    check();
    document.fonts?.addEventListener?.("loadingdone", check);
    return () => document.fonts?.removeEventListener?.("loadingdone", check);
  }, [fonts]);

  // The list opens on the chosen font, and scrolls to it once it has been drawn.
  useEffect(() => {
    if (!open) return;
    const frame = window.requestAnimationFrame(() => list.current?.querySelector('[data-selected="true"]')?.scrollIntoView({ block: "nearest" }));
    return () => window.cancelAnimationFrame(frame);
  }, [open]);

  function show(next: boolean) {
    used.current = true;
    setOpen(next);
    setQuery("");
    // The list opens on the chosen font; closing forgets the highlight, so the sample is the chosen font again.
    setHighlight(next ? rowOf(chosen) : "");
  }

  function choose(font: FontOption) {
    if (value === undefined) setUncontrolled(font.stack);
    if (recent === undefined) setOwnRecent((now) => [font.stack, ...now.filter((stack) => !sameStack(stack, font.stack))].slice(0, maxRecent));
    onValueChange?.(font.stack, font);
    show(false);
  }

  // The family the sample is really drawn in, when the font on show is one the page cannot draw.
  const fallback = shown ? missing.get(shown.stack) : undefined;
  const anyMissing = missing.size > 0;

  const row = (font: FontOption, index: number, group: "recent" | "font") => {
    const isChosen = font === chosen;
    const gone = missing.has(font.stack);
    return (
      <CommandItem
        key={`${group}:${index}`}
        value={`${group}:${index}`}
        data-checked={isChosen || undefined}
        onSelect={() => choose(font)}
        className="pr-8"
      >
        <span className="flex min-w-0 flex-1 items-baseline justify-between gap-3">
          <span style={{ fontFamily: font.stack }} className="truncate text-base leading-6 text-foreground">
            {nameOf(font)}
          </span>
          {gone ? (
            <span aria-hidden="true" className="shrink-0 text-[0.6875rem] text-muted-foreground">
              {messages.notLoaded}
            </span>
          ) : null}
        </span>
        <span className="sr-only">
          {font.group ? `, ${font.group}` : ""}
          {gone ? `, ${messages.notLoaded}` : ""}
        </span>
        {isChosen ? (
          <>
            <IconCheck size={14} className="absolute right-2" />
            <span className="sr-only">{`, ${messages.selected}`}</span>
          </>
        ) : null}
      </CommandItem>
    );
  };

  return (
    <div ref={root} data-slot="font-family-select" aria-disabled={disabled || undefined} className={cn("grid w-full min-w-0 gap-2", className)}>
      <Popover open={open && !disabled} onOpenChange={show}>
        {/* The list hangs from the bottom of this block, so it opens below the sample and never covers it. Nothing in the block changes height with the font on show (the sample box has a fixed height, and the note keeps its row), so the list never moves under the pointer. */}
        <PopoverAnchor asChild>
          <div className="grid min-w-0 gap-2">
            <PopoverTrigger
              id={id}
              disabled={disabled}
              aria-invalid={ariaInvalid}
              aria-describedby={ariaDescribedBy}
              aria-required={required || undefined}
              data-placeholder={chosen ? undefined : ""}
              className={cn(fieldSurface, "flex h-9 w-full min-w-0 items-center justify-between gap-2 px-3 text-left whitespace-nowrap data-[placeholder]:text-muted-foreground")}
            >
              {chosen ? (
                <span className="flex min-w-0 items-baseline justify-between gap-3">
                  <span style={{ fontFamily: chosen.stack }} className="truncate text-base">
                    {nameOf(chosen)}
                  </span>
                  {chosen.group ? <span className="shrink-0 text-xs text-muted-foreground">{chosen.group}</span> : null}
                </span>
              ) : (
                <span className="truncate">{placeholder}</span>
              )}
              <IconChevronsUpDown size={16} className="shrink-0 text-muted-foreground" />
            </PopoverTrigger>
            <div data-slot="font-family-select-sample" data-previewing={previewing || undefined} className={cn("@container rounded-lg bg-muted/50 px-3.5 py-3 transition-colors duration-150 motion-reduce:transition-none", disabled && "opacity-50")}>
              <p className="mb-1.5 flex items-baseline justify-between gap-3 font-mono text-[0.6875rem] tracking-wide text-muted-foreground">
                <span>{previewing ? messages.previewing : messages.sample}</span>
                {shown ? <span className="truncate">{nameOf(shown)}</span> : null}
              </p>
              <p style={shown ? { fontFamily: shown.stack } : undefined} className={cn("text-xl leading-snug tracking-[-0.01em] [overflow-wrap:anywhere]", SAMPLE_BOX[sampleLines])}>
                {sample}
              </p>
            </div>
            {/* One line, kept even when the font on show needs no note, as long as some font in the list is not loaded. */}
            {anyMissing ? (
              <p role="status" className="flex h-5 items-center gap-1.5 text-xs leading-5 text-muted-foreground">
                {fallback ? (
                  <>
                    <IconInfo aria-hidden="true" className="size-3.5 shrink-0" />
                    <span className="min-w-0 truncate">{messages.fallback(fallback)}</span>
                  </>
                ) : null}
              </p>
            ) : null}
          </div>
        </PopoverAnchor>
        {name ? <input type="hidden" name={name} value={selected ?? ""} /> : null}
        <PopoverContent
          align="start"
          side={placement === "top" ? "top" : "bottom"}
          avoidCollisions={placement === "auto"}
          aria-label={label}
          className="w-(--radix-popover-trigger-width) min-w-64 overflow-hidden p-0"
          onOpenAutoFocus={(event) => {
            if (!used.current) event.preventDefault();
          }}
        >
          <Command shouldFilter={false} loop value={highlight} onValueChange={setHighlight} className="rounded-none bg-transparent">
            <CommandInput value={query} onValueChange={setQuery} placeholder={searchPlaceholder} aria-label={messages.search(label)} />
            {/* The message sits beside the list and not inside it, so the list stays a clean listbox for assistive technology. */}
            {nothingToList ? (
              <p role="status" className="px-4 py-8 text-center text-sm text-muted-foreground">
                {emptyText}
              </p>
            ) : null}
            <CommandList ref={list} className={cn(nothingToList && "hidden")}>
              {!typed && pinned.length ? <CommandGroup heading={messages.recent}>{pinned.map((index) => (fonts[index] ? row(fonts[index], index, "recent") : null))}</CommandGroup> : null}
              {sections.map((section) => (
                <CommandGroup key={section.name || "fonts"} heading={section.name || undefined}>
                  {section.fonts.map((entry) => row(entry.font, entry.index, "font"))}
                </CommandGroup>
              ))}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
