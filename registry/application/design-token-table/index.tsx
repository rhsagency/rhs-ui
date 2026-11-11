"use client";

import { useEffect, useId, useState, type ComponentProps, type CSSProperties, type ReactNode } from "react";

import { IconCheck, IconCheckDouble, IconChevronRight, IconClose, IconLink, IconWarning } from "@rhs-ui/icons";
import { contrastOn, formatRatio, gradeOf, parseColor, type ContrastGrade } from "@rhs-ui/application/color-token-card/color";
import { Badge } from "@rhs-ui/primitives/badge";
import { Button } from "@rhs-ui/primitives/button";
import { Collapsible, CollapsibleContent } from "@rhs-ui/primitives/collapsible";
import { CopyButton } from "@rhs-ui/primitives/copy-button";
import { SearchInput } from "@rhs-ui/primitives/search-input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@rhs-ui/primitives/table";
import { cn } from "@/lib/utils";

import { durationInMs, fill, groupTokens, isCssLength, lengthInPx, matchesQuery, splitMatches, uniqueIds, type TokenType } from "./tokens";

export type { TokenType } from "./tokens";

export interface DesignToken {
  /** The token's name as it is written in code: "--color-primary". It is the row's heading and its anchor, and it must be unique. */
  name: string;
  /** What it is set to, as CSS: "oklch(0.21 0.02 255)", "1rem", "0 1px 2px rgb(0 0 0 / 0.08)", "200ms". It is drawn as it is and copied as it is. */
  value: string;
  /** What kind of value it is, which decides how it is drawn: `color` a swatch, `size` a bar, `radius` a corner, `shadow` a raised tile, `font` a specimen and `duration` a track with a dot that runs along it for that long when the row is hovered. */
  type: TokenType;
  /** Where it is meant to be used: "Body text and headings". */
  usage?: string;
  /** The group it belongs to: "Colour", "Spacing". Groups fold and are listed in the order they first appear. Leave it out on every token for a flat table. */
  group?: string;
  /** For a colour: `false` leaves out the contrast ratio, for a token that is not text (a border, a surface, a text colour that sits on another one). Default true. */
  contrast?: boolean;
}

/** The words the table says on its own, for another language or your own wording. `{count}`, `{shown}`, `{total}`, `{name}`, `{value}`, `{ratio}`, `{background}`, `{grade}`, `{group}` and `{query}` are filled in. */
export interface DesignTokenTableLabels {
  /** Column heading. Default "Token". */
  token: string;
  /** Column heading. Default "Preview". */
  preview: string;
  /** Column heading. Default "Value". */
  value: string;
  /** Column heading. Default "Used for". */
  usage: string;
  /** The name of each kind of token, under its name and on a phone's card. */
  types: Record<TokenType, string>;
  /** The name of the table when there is no `caption`. Default "Design tokens". */
  table: string;
  /** The name of the search field. Default "Filter tokens". */
  filter: string;
  /** The hint in the empty search field. Default "Filter by name or value". */
  placeholder: string;
  /** How many tokens there are. Default "{count} tokens". */
  count: string;
  /** The same, for exactly one. Default "{count} token". */
  countOne: string;
  /** How many match what was typed. Default "{shown} of {total} tokens". */
  filtered: string;
  /** The button that folds every group. Default "Collapse all". */
  collapseAll: string;
  /** The button that opens every group. Default "Expand all". */
  expandAll: string;
  /** The group of tokens that have none. Default "Tokens". */
  ungrouped: string;
  /** The name of a group's list of tokens. Default "{group}". */
  groupList: string;
  /** The name of a copy button. Default "Copy {name} value". */
  copy: string;
  /** What a screen reader hears after a copy. Default "Copied {value}". */
  copied: string;
  /** The contrast of a colour, for a screen reader. Default "Contrast {ratio} against {background}: {grade}". */
  contrast: string;
  /** Marks the token the contrast is measured against. Default "Contrast reference". */
  reference: string;
  /** What a ratio reaches: AAA from 7, AA from 4.5, AA for large text only from 3, otherwise a fail. */
  grades: Record<ContrastGrade, string>;
  /** Said when nothing matches. Default "No token matches “{query}”." */
  noMatch: string;
  /** The button that clears the search. Default "Clear the filter". */
  clear: string;
  /** Said when there are no tokens at all. Default "No tokens to show yet." */
  empty: string;
  /** Said for a value that cannot be drawn as its type. Default "No preview". */
  noPreview: string;
}

export interface DesignTokenTableLabelOverrides extends Partial<Omit<DesignTokenTableLabels, "types" | "grades">> {
  /** Any of the type names: the rest keep their defaults. */
  types?: Partial<DesignTokenTableLabels["types"]>;
  /** Any of the grade words: the rest keep their defaults. */
  grades?: Partial<DesignTokenTableLabels["grades"]>;
}

export interface DesignTokenTableProps extends Omit<ComponentProps<"section">, "children" | "onCopy"> {
  /** The tokens, in the order you want them. */
  tokens: readonly DesignToken[];
  /** The name of the colour token the contrast is measured against: "--surface". Every colour row then shows its ratio against it, as a grade in words with a glyph. Leave it out for no ratios. A colour it cannot read (hsl, a named colour, a var) shows none. */
  background?: string;
  /** The groups that start folded, by name. A search opens every group that has a match. */
  defaultFolded?: readonly string[];
  /** Put before every anchor: "token-" makes the link of "--color-primary" "#token-color-primary". Needed only when two tables share a page. Default "". */
  idPrefix?: string;
  /** The locale that writes the numbers. Default "en-US". */
  locale?: string;
  /** What the table is, shown above it and read out as its name: "Halcyon design tokens, v4.2". */
  caption?: ReactNode;
  /** Called with the token after its value was copied. */
  onCopy?: (token: DesignToken) => void;
  /** The words the table says, for translation. */
  labels?: DesignTokenTableLabelOverrides;
}

const LABELS: DesignTokenTableLabels = {
  token: "Token",
  preview: "Preview",
  value: "Value",
  usage: "Used for",
  types: { color: "Colour", size: "Size", radius: "Radius", shadow: "Shadow", font: "Font", duration: "Duration" },
  table: "Design tokens",
  filter: "Filter tokens",
  placeholder: "Filter by name or value",
  count: "{count} tokens",
  countOne: "{count} token",
  filtered: "{shown} of {total} tokens",
  collapseAll: "Collapse all",
  expandAll: "Expand all",
  ungrouped: "Tokens",
  groupList: "{group}",
  copy: "Copy {name} value",
  copied: "Copied {value}",
  contrast: "Contrast {ratio} against {background}: {grade}",
  reference: "Contrast reference",
  grades: { aaa: "AAA", aa: "AA", large: "AA large", fail: "Fail" },
  noMatch: "No token matches “{query}”.",
  clear: "Clear the filter",
  empty: "No tokens to show yet.",
  noPreview: "No preview",
};

/** The failure text, darkened toward the foreground so the small red word reaches 4.5:1 on its pale fill. */
const DANGER_TEXT = "text-[color:color-mix(in_oklch,var(--destructive),var(--foreground)_30%)]";

/** A pass is a check, the narrow pass is a warning and a fail is a cross, so the result reads without colour. */
const GRADE: Record<ContrastGrade, { variant: "outline" | "muted" | "destructive"; icon: typeof IconCheck; className?: string }> = {
  aaa: { variant: "outline", icon: IconCheckDouble },
  aa: { variant: "outline", icon: IconCheck },
  large: { variant: "muted", icon: IconWarning },
  fail: { variant: "destructive", icon: IconClose, className: DANGER_TEXT },
};

const CHECKERBOARD = "repeating-conic-gradient(color-mix(in oklch, var(--foreground) 12%, transparent) 0 25%, transparent 0 50%)";

/** The longest a size is drawn: a bar this wide, and a chevron after it for a size that is longer. */
const BAR_MAX = 96;

/** A search match, marked. `mark` keeps the text colour and sits on a soft plate, so it reads in both themes. */
function Marked({ text, query }: { text: string; query: string }) {
  return splitMatches(text, query).map((piece, index) =>
    piece.match ? (
      <mark key={index} className="rounded-sm bg-foreground/15 px-0.5 text-inherit">
        {piece.text}
      </mark>
    ) : (
      piece.text
    ),
  );
}

/** What a preview shows when the value cannot be drawn as its type: a short dash, and the words for a screen reader. */
function NoPreview({ children }: { children: ReactNode }) {
  return (
    <span className="flex h-9 w-28 items-center text-muted-foreground">
      <span aria-hidden="true" className="inline-block h-px w-3.5 bg-muted-foreground/70" />
      <span className="sr-only">{children}</span>
    </span>
  );
}

/**
 * The token drawn: a swatch for a colour (over a checkerboard when it is see-through), a bar as long as a size, the
 * corner of a radius, a raised tile for a shadow, a specimen in a font, and a track with a dot for a duration. The value
 * is written beside it, so the drawing is for the eye only and is hidden from a screen reader.
 */
function Preview({ token, noPreview }: { token: DesignToken; noPreview: string }) {
  const { value } = token;
  if (token.type === "color") {
    const parsed = parseColor(value);
    return (
      <span aria-hidden="true" className="relative block size-9 shrink-0 overflow-hidden rounded-lg">
        {parsed !== null && parsed.a < 1 ? <span className="absolute inset-0" style={{ backgroundImage: CHECKERBOARD, backgroundSize: "10px 10px" }} /> : null}
        <span className="absolute inset-0" style={{ backgroundColor: value }} />
        <span className="absolute inset-0 rounded-lg ring-1 ring-foreground/15 ring-inset" />
      </span>
    );
  }
  if (token.type === "size") {
    if (!isCssLength(value)) return <NoPreview>{noPreview}</NoPreview>;
    const px = lengthInPx(value);
    const clipped = px !== null && px > BAR_MAX;
    return (
      <span aria-hidden="true" className="flex h-9 w-28 items-center gap-1">
        <span className="block h-2 min-w-0.5 shrink-0 rounded-full bg-foreground" style={{ width: clipped ? BAR_MAX : value, maxWidth: BAR_MAX }} />
        {clipped ? <IconChevronRight className="size-3.5 shrink-0 text-muted-foreground" /> : null}
      </span>
    );
  }
  if (token.type === "radius") {
    return <span aria-hidden="true" className="block size-9 shrink-0 border-t-2 border-l-2 border-foreground/70" style={{ borderTopLeftRadius: value }} />;
  }
  if (token.type === "shadow") {
    // Nothing clips the box: a large shadow (a 16px drop with a 32px blur) reaches well below the tile, into the padding of its row, and a plate with overflow hidden would cut it off and make every shadow look alike. The tile is big enough for a shadow with a negative spread to keep most of its strength (a 48 x 32 tile leaves a 32 x 16 shadow, which is a faint smudge), and it is a surface lifted off a plain ground: the card colour on a light page, and in the dark theme the lighter muted colour, because a black shadow cannot show on a dark ground and a raised surface is the lighter one there. A hairline gives its edge a line in both themes (a border, not a ring, so the token's own box-shadow is left alone). It sits at the left of its box, in line with the swatches and bars of the other rows.
    return (
      <span aria-hidden="true" className="grid h-14 w-20 shrink-0 items-center justify-items-start overflow-visible">
        <span className="h-10 w-16 rounded-lg border border-foreground/10 bg-card dark:bg-muted" style={{ boxShadow: value }} />
      </span>
    );
  }
  if (token.type === "font") {
    return (
      <span aria-hidden="true" className="flex h-9 w-28 items-baseline gap-2 self-center overflow-hidden" style={{ fontFamily: value }}>
        <span className="text-2xl leading-9">Aa</span>
        <span className="truncate text-xs leading-9 text-muted-foreground">Quick fox</span>
      </span>
    );
  }
  const ms = durationInMs(value);
  if (ms === null) return <NoPreview>{noPreview}</NoPreview>;
  // The track grows with the time (a second is the whole width) on a square-root scale: a straight scale makes 120 ms and 200 ms two stubs of 13 and 22 px, which the 10 px dot barely moves along and which look alike. Here they are about 39 and 50 px, and a longer time is always a longer track. The dot runs along it for that long when the row is hovered or has focus inside it.
  return (
    <span aria-hidden="true" className="flex h-9 w-28 items-center">
      <span className="relative block h-5" style={{ width: `${Math.min(1, Math.max(0.25, Math.sqrt(ms / 1000))) * 100}%` }}>
        <span className="absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2 rounded-full bg-border" />
        <span
          className="absolute top-1/2 left-0 size-2.5 -translate-y-1/2 rounded-full bg-foreground transition-[left] ease-out group-focus-within/token:left-[calc(100%-0.625rem)] group-hover/token:left-[calc(100%-0.625rem)] motion-reduce:transition-none motion-reduce:group-focus-within/token:left-0 motion-reduce:group-hover/token:left-0"
          style={{ transitionDuration: value } as CSSProperties}
        />
      </span>
    </span>
  );
}

interface Entry {
  token: DesignToken;
  id: string;
  group?: string;
}

/**
 * Design tokens documented as a table: the name, a drawing of the value itself (a swatch, a bar as long as the size, a
 * corner, a raised tile, a font specimen, a duration track), the value in mono with a copy button, and where it is
 * used. Groups fold, and a search field filters by name or value and marks what matched, opening every group that has
 * a match. Each name is a link to its own row, so a token can be linked to, and a link to a token inside a folded group
 * opens the group and scrolls to it. Name a background token and every colour shows its WCAG contrast against it, as a
 * grade in words with a glyph, never colour alone. Narrower than 56rem the table becomes one card per token.
 */
export function DesignTokenTable({ tokens, background, defaultFolded = [], idPrefix = "", locale = "en-US", caption, onCopy, labels: custom, className, ...props }: DesignTokenTableProps) {
  const words: DesignTokenTableLabels = { ...LABELS, ...custom, types: { ...LABELS.types, ...custom?.types }, grades: { ...LABELS.grades, ...custom?.grades } };
  const captionId = useId();
  const numbers = new Intl.NumberFormat(locale);
  const [query, setQuery] = useState("");
  const [folded, setFolded] = useState<ReadonlySet<string>>(() => new Set(defaultFolded));
  const [target, setTarget] = useState<string | null>(null);

  const ids = uniqueIds(
    tokens.map((token) => token.name),
    idPrefix,
  );
  const entries: Entry[] = tokens.map((token, index) => ({ token, id: ids[index] ?? "", group: token.group }));
  const searching = query.trim() !== "";
  const shown = entries.filter((entry) => matchesQuery(entry.token, query));
  const hasGroups = tokens.some((token) => token.group?.trim());
  const groups = groupTokens(shown, words.ungrouped);
  const everyGroup = groupTokens(entries, words.ungrouped);
  const allFolded = everyGroup.length > 0 && everyGroup.every((group) => folded.has(group.name));

  // The colour the ratios are measured against, found by name.
  const reference = background === undefined ? undefined : tokens.find((token) => token.type === "color" && (token.name === background || token.name.replace(/^-+/, "") === background.replace(/^-+/, "")));
  const referenceColor = reference ? parseColor(reference.value) : null;

  const toggle = (name: string) =>
    setFolded((before) => {
      const next = new Set(before);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });

  // A link to a token opens its group, clears a search that hides it, and scrolls the row (or, on a phone, the card) into view.
  const key = entries.map((entry) => `${entry.id}:${entry.group ?? ""}`).join("|");
  useEffect(() => {
    const go = () => {
      let wanted = "";
      try {
        wanted = decodeURIComponent(window.location.hash.slice(1));
      } catch {
        wanted = "";
      }
      const entry = entries.find((item) => item.id === wanted);
      setTarget(entry ? entry.id : null);
      if (!entry) return;
      setQuery((before) => (matchesQuery(entry.token, before) ? before : ""));
      setFolded((before) => {
        const name = entry.group?.trim() || words.ungrouped;
        if (!before.has(name)) return before;
        const next = new Set(before);
        next.delete(name);
        return next;
      });
      // After the groups have opened and the page has laid itself out again.
      window.requestAnimationFrame(() => {
        const found = [...document.querySelectorAll<HTMLElement>(`[data-slug="${CSS.escape(entry.id)}"]`)].find((element) => element.getClientRects().length > 0);
        found?.scrollIntoView({ block: "center", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
      });
    };
    go();
    window.addEventListener("hashchange", go);
    return () => window.removeEventListener("hashchange", go);
    // The anchors and groups are what the hash is read against; `entries` is rebuilt every render and `key` says when it really changed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const typeName = (token: DesignToken) => words.types[token.type];

  /** The ratio of a colour against the reference, as a grade: the numbers and the word for the eye, and one sentence for a screen reader. */
  function contrastOf(token: DesignToken) {
    if (token.type !== "color" || token.contrast === false || !referenceColor || !reference) return null;
    if (token === reference) return { reference: true as const };
    const color = parseColor(token.value);
    if (!color) return null;
    const ratio = contrastOn(color, referenceColor);
    const grade = gradeOf(ratio);
    return { reference: false as const, ratio: formatRatio(ratio, locale), grade, look: GRADE[grade], sentence: fill(words.contrast, { ratio: formatRatio(ratio, locale), background: reference.name, grade: words.grades[grade] }) };
  }

  function judgement(token: DesignToken, inline = false) {
    const result = contrastOf(token);
    if (!result) return null;
    if (result.reference) {
      return (
        <Badge variant="muted" className="shrink-0">
          {words.reference}
        </Badge>
      );
    }
    return (
      <span className={cn("shrink-0", inline ? "flex items-center gap-2" : "grid gap-1")}>
        <span aria-hidden="true" className="text-xs leading-none font-medium tabular-nums">
          {result.ratio}
        </span>
        <Badge aria-hidden="true" variant={result.look.variant} className={cn("w-fit", result.look.className)}>
          <result.look.icon />
          {words.grades[result.grade]}
        </Badge>
        <span className="sr-only">{result.sentence}</span>
      </span>
    );
  }

  const copyButton = (token: DesignToken) => (
    <CopyButton
      iconOnly
      size="sm"
      variant="ghost"
      value={token.value}
      label={fill(words.copy, { name: token.name })}
      copiedLabel={fill(words.copied, { value: token.value })}
      onCopy={() => onCopy?.(token)}
      className="shrink-0 text-muted-foreground hover:text-foreground"
    />
  );

  const nameLink = (entry: Entry, className?: string) => (
    <a
      href={`#${entry.id}`}
      className={cn("inline-flex max-w-full items-center gap-1.5 rounded-sm font-mono text-[0.8125rem] leading-5 font-medium text-foreground underline-offset-4 outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/40", className)}
    >
      <span className="[overflow-wrap:anywhere]">
        <Marked text={entry.token.name} query={query} />
      </span>
      <IconLink
        aria-hidden="true"
        className="size-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-focus-within/token:opacity-100 group-hover/token:opacity-100 motion-reduce:transition-none"
      />
    </a>
  );

  const valueText = (token: DesignToken) => (
    <code className="min-w-0 font-mono text-xs leading-5 [overflow-wrap:anywhere]">
      <Marked text={token.value} query={query} />
    </code>
  );

  /** For a size in rem or em, what it comes to in pixels: the number a design tool shows. */
  const inPixels = (token: DesignToken) => {
    if (token.type !== "size" && token.type !== "radius") return null;
    const px = lengthInPx(token.value);
    return px === null || /px$/.test(token.value.trim()) || token.value.trim() === "0" ? null : `${numbers.format(px)} px`;
  };

  const countText = searching
    ? fill(words.filtered, { shown: numbers.format(shown.length), total: numbers.format(entries.length) })
    : fill(entries.length === 1 ? words.countOne : words.count, { count: numbers.format(entries.length) });

  const groupHead = (name: string, count: number, open: boolean, interactive: boolean) => {
    const label = (
      <>
        {interactive ? <IconChevronRight aria-hidden="true" className={cn("size-3.5 shrink-0 text-muted-foreground transition-transform duration-150 motion-reduce:transition-none", open && "rotate-90")} /> : null}
        <span>{fill(words.groupList, { group: name })}</span>
        <Badge variant="muted" className="tabular-nums">
          {numbers.format(count)}
        </Badge>
      </>
    );
    return interactive ? (
      <button
        type="button"
        aria-expanded={open}
        onClick={() => toggle(name)}
        className="flex w-full items-center gap-2 px-5 py-2.5 text-left text-[0.8125rem] font-medium text-foreground outline-none hover:bg-muted/60 focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:ring-inset motion-safe:transition-colors motion-safe:duration-150"
      >
        {label}
      </button>
    ) : (
      <div className="flex w-full items-center gap-2 px-5 py-2.5 text-left text-[0.8125rem] font-medium text-foreground">{label}</div>
    );
  };

  if (entries.length === 0) {
    return (
      <section data-slot="design-token-table" className={cn("w-full min-w-0", className)} {...props}>
        <p className="rounded-xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">{words.empty}</p>
      </section>
    );
  }

  return (
    <section data-slot="design-token-table" className={cn("@container w-full min-w-0", className)} {...props}>
      <div className="mb-4 flex flex-col gap-3 @xl:flex-row @xl:items-center @xl:justify-between">
        <SearchInput aria-label={words.filter} placeholder={words.placeholder} value={query} onValueChange={setQuery} className="@xl:max-w-sm" />
        <div className="flex items-center justify-between gap-3 @xl:justify-end">
          <p role="status" className="text-sm text-muted-foreground tabular-nums">
            {countText}
          </p>
          {hasGroups && !searching && everyGroup.length > 1 ? (
            <Button type="button" variant="ghost" size="sm" onClick={() => setFolded(allFolded ? new Set() : new Set(everyGroup.map((group) => group.name)))}>
              {allFolded ? words.expandAll : words.collapseAll}
            </Button>
          ) : null}
        </div>
      </div>

      {shown.length === 0 ? (
        <div role="status" className="grid justify-items-center gap-3 rounded-xl border border-dashed border-border px-4 py-12 text-center">
          <p className="text-sm text-muted-foreground">{fill(words.noMatch, { query: query.trim() })}</p>
          <Button type="button" variant="outline" size="sm" onClick={() => setQuery("")}>
            {words.clear}
          </Button>
        </div>
      ) : (
        <>
          {/* From 56rem wide: a table. */}
          <div className="hidden @4xl:block">
            <div className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
              {caption ? (
                <p id={captionId} className="px-5 pt-5 pb-4 text-base font-medium tracking-[-0.01em] text-foreground">
                  {caption}
                </p>
              ) : null}
              <Table aria-labelledby={caption ? captionId : undefined} aria-label={caption ? undefined : words.table} className={caption ? "border-t border-border" : undefined}>
                <TableHeader className="bg-muted/40">
                  <TableRow>
                    <TableHead scope="col" className="w-60 pl-5">
                      {words.token}
                    </TableHead>
                    <TableHead scope="col" className="w-40">
                      {words.preview}
                    </TableHead>
                    <TableHead scope="col" className="w-72">
                      {words.value}
                    </TableHead>
                    <TableHead scope="col" className="pr-5">
                      {words.usage}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                {groups.map((group) => {
                  const open = !hasGroups || searching || !folded.has(group.name);
                  return (
                    <TableBody key={group.name}>
                      {hasGroups ? (
                        <TableRow className="bg-muted/30 hover:bg-muted/30">
                          <th scope="rowgroup" colSpan={4} className="p-0 text-left font-normal">
                            {groupHead(group.name, group.tokens.length, open, !searching)}
                          </th>
                        </TableRow>
                      ) : null}
                      {open
                        ? group.tokens.map((entry) => {
                            const px = inPixels(entry.token);
                            return (
                              <TableRow key={entry.id} id={entry.id} data-slug={entry.id} data-target={target === entry.id || undefined} className="group/token scroll-mt-24 transition-colors duration-300 data-[target]:bg-muted motion-reduce:transition-none">
                                <th scope="row" className="py-3 pr-3 pl-5 text-left align-middle font-normal">
                                  {nameLink(entry)}
                                  <span className="mt-0.5 block text-xs text-muted-foreground">{typeName(entry.token)}</span>
                                </th>
                                <TableCell className="py-3">
                                  <span className="flex items-center gap-3">
                                    <Preview token={entry.token} noPreview={words.noPreview} />
                                    {judgement(entry.token)}
                                  </span>
                                </TableCell>
                                <TableCell className="py-3 pr-3">
                                  <span className="flex items-center gap-1.5">
                                    <span className="min-w-0">
                                      {valueText(entry.token)}
                                      {px ? <span className="block text-xs leading-5 text-muted-foreground tabular-nums">{px}</span> : null}
                                    </span>
                                    <span className="ml-auto">{copyButton(entry.token)}</span>
                                  </span>
                                </TableCell>
                                <TableCell className="py-3 pr-5 text-muted-foreground">{entry.token.usage}</TableCell>
                              </TableRow>
                            );
                          })
                        : null}
                    </TableBody>
                  );
                })}
              </Table>
            </div>
          </div>

          {/* Narrower: one card per token. */}
          <div className="grid gap-5 @4xl:hidden">
            {caption ? <p className="text-base font-medium tracking-[-0.01em] text-foreground">{caption}</p> : null}
            {groups.map((group) => {
              const open = !hasGroups || searching || !folded.has(group.name);
              const cards = (
                <ul role="list" className="grid gap-3 @xl:grid-cols-2">
                  {group.tokens.map((entry) => {
                    const px = inPixels(entry.token);
                    const verdict = judgement(entry.token, true);
                    return (
                      <li
                        key={entry.id}
                        data-slug={entry.id}
                        data-target={target === entry.id || undefined}
                        className="group/token grid scroll-mt-4 content-start gap-3 rounded-xl border border-border bg-card p-4 shadow-xs transition-colors duration-300 data-[target]:border-foreground/40 data-[target]:bg-muted/50 motion-reduce:transition-none"
                      >
                        <div className="flex items-start justify-between gap-3">
                          {nameLink(entry)}
                          <Badge variant="muted" className="shrink-0">
                            {typeName(entry.token)}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3">
                          <Preview token={entry.token} noPreview={words.noPreview} />
                          <span className="min-w-0 flex-1">
                            {valueText(entry.token)}
                            {px ? <span className="block text-xs leading-5 text-muted-foreground tabular-nums">{px}</span> : null}
                          </span>
                          {copyButton(entry.token)}
                        </div>
                        {verdict ? <div className="flex items-center gap-2">{verdict}</div> : null}
                        {entry.token.usage ? <p className="text-sm leading-snug text-muted-foreground">{entry.token.usage}</p> : null}
                      </li>
                    );
                  })}
                </ul>
              );
              return hasGroups ? (
                <Collapsible key={group.name} open={open} onOpenChange={() => toggle(group.name)}>
                  <div className="overflow-hidden rounded-xl border border-border bg-muted/30">{groupHead(group.name, group.tokens.length, open, !searching)}</div>
                  <CollapsibleContent>
                    <div className="pt-3">{cards}</div>
                  </CollapsibleContent>
                </Collapsible>
              ) : (
                <div key={group.name}>{cards}</div>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}
