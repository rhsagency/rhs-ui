"use client";

import { Fragment, useEffect, useRef, useState, type ComponentProps } from "react";

import { IconArrowUpRight, IconCheck, IconCopy, IconFileText } from "@rhs-ui/icons";
import { licenseFamily, licenseParts, reflowLicense, type OpenSourcePackage } from "@rhs-ui/marketing/open-source-credits/licenses";
import { Button } from "@rhs-ui/primitives/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@rhs-ui/primitives/dialog";
import { SearchInput } from "@rhs-ui/primitives/search-input";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@rhs-ui/primitives/table";
import { cn } from "@/lib/utils";

export type { OpenSourcePackage } from "@rhs-ui/marketing/open-source-credits/licenses";

export interface OpenSourceCreditsLabels {
  /** Head of the package column. */
  package: string;
  /** Head of the version column. */
  version: string;
  /** Head of the licence column. */
  licence: string;
  /** The search field's accessible name and placeholder. */
  search: string;
  /** The noun after a count of one. */
  noun: string;
  /** The noun after any other count. */
  nouns: string;
  /** Said as the search narrows the list. {shown}, {total} and {noun} stand for the two counts and the noun. */
  shown: string;
  /** Said when nothing is typed. {total} and {noun} stand for the count and the noun. */
  all: string;
  /** Said when nothing matches. {query} stands for what was typed. */
  noMatch: string;
  /** The button in the empty result that clears the search and shows every package again. It has its own words, because the search field's own clear button is called Clear search. */
  showAll: string;
  /** Said when there are no packages at all. */
  empty: string;
  /** Read out after a link that opens in a new tab. */
  newTab: string;
  /** The accessible name of a licence button. {license} stands for the identifier: "Read the {license} licence". */
  read: string;
  /** The title of the licence dialog: "{license} licence". */
  dialogTitle: string;
  /** Under that title. {count} and {noun} stand for how many packages use it. */
  dialogDescription: string;
  /** The accessible name of the scrolling licence text. */
  textRegion: string;
  /** The copy button. */
  copy: string;
  /** The copy button once it has copied, and the words announced to screen readers. */
  copied: string;
  /** Said when the browser would not copy, and the text has been selected instead. */
  copySelected: string;
  /** The word between the parts of a licence you may choose from: MIT OR Apache-2.0. */
  or: string;
  /** The word between the parts of a licence that applies together. */
  and: string;
  /** Said for a package whose licence is not known, such as an empty one in a scanner's report. */
  unknown: string;
}

export interface OpenSourceCreditsProps extends Omit<ComponentProps<"section">, "title" | "children"> {
  /** Every package you ship, in any order. They are grouped by licence family and sorted by name. */
  packages: readonly OpenSourcePackage[];
  /** The full licence text for each SPDX identifier, keyed by it: { MIT: "Permission is hereby granted..." }. A licence without a text is shown as plain words. */
  licenseTexts?: Readonly<Record<string, string>>;
  /** The table's accessible name, which screen readers announce on arrival: "Open source software in Northwind". */
  caption?: string;
  /** Adds a search field that filters by package name and announces how many are left. On by default. */
  searchable?: boolean;
  /** The page's own heading, when the page has no other: "Open source credits". */
  title?: string;
  /** One or two sentences under the title. */
  description?: string;
  /** The level of the title. */
  headingLevel?: 1 | 2 | 3;
  /** Words for the fixed text, for a site that is not in English. */
  labels?: Partial<OpenSourceCreditsLabels>;
  /** Locale for numbers and for sorting names. */
  locale?: string;
}

const LABELS: OpenSourceCreditsLabels = {
  package: "Package",
  version: "Version",
  licence: "Licence",
  search: "Search packages",
  noun: "package",
  nouns: "packages",
  shown: "{shown} of {total} {noun}",
  all: "{total} {noun}",
  noMatch: "No package is called “{query}”.",
  showAll: "Show all packages",
  empty: "No open source packages are listed yet.",
  newTab: "(opens in a new tab)",
  read: "Read the {license} licence",
  dialogTitle: "{license} licence",
  dialogDescription: "The licence of {count} {noun} in this product.",
  textRegion: "Licence text",
  copy: "Copy licence text",
  copied: "Copied",
  copySelected: "The text is selected: press Ctrl+C or Cmd+C to copy it.",
  or: "or",
  and: "and",
  unknown: "Unknown",
};

/** Puts values into a sentence: {query} becomes what was typed. Words stay plain strings, so they can cross from a Server Component. */
const fill = (template: string, values: Record<string, string | number>) => template.replace(/\{(\w+)\}/g, (match, key: string) => String(values[key] ?? match));

/** Lower case without accents, so "cafe" finds "café". */
const fold = (value: string) => value.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");

const LINK =
  "rounded-sm underline decoration-foreground/40 underline-offset-4 outline-none transition-colors duration-150 hover:decoration-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40 motion-reduce:transition-none";

/**
 * Puts the text on the clipboard. Browsers that refuse (a frame without the
 * permission, an old WebView) get the text selected instead, so the reader can
 * press the shortcut themselves; the caller says which of the two happened.
 */
async function copyText(text: string, node: HTMLElement | null): Promise<"copied" | "selected"> {
  try {
    await navigator.clipboard.writeText(text);
    return "copied";
  } catch {
    // Fall through to the selection below.
  }
  if (node) {
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(node);
    selection?.removeAllRanges();
    selection?.addRange(range);
    try {
      if (document.execCommand("copy")) {
        // It worked, so the selection has done its job and goes.
        selection?.removeAllRanges();
        return "copied";
      }
    } catch {
      // The text stays selected.
    }
  }
  return "selected";
}

/**
 * A package's name with room to break after a hyphen, a slash or a dot, so a long scoped name wraps where a
 * person would, and with the arrow glued to its last piece so it never sits alone on a line.
 */
function PackageName({ name, arrow = false }: { name: string; arrow?: boolean }) {
  const pieces = name.split(/(?<=[-/._])/);
  const last = pieces.pop() ?? name;
  return (
    <>
      {pieces.map((piece, index) => (
        <Fragment key={index}>
          {piece}
          <wbr />
        </Fragment>
      ))}
      <span className="whitespace-nowrap">
        {last}
        {arrow ? <IconArrowUpRight aria-hidden="true" className="ml-1 inline size-3.5 align-[-0.1em] text-muted-foreground" /> : null}
      </span>
    </>
  );
}

/** The licence text and its copy button. It mounts when the dialog opens, so its state starts fresh every time. */
function LicenseBody({ id, text, count, labels, locale }: { id: string; text: string; count: number; labels: OpenSourceCreditsLabels; locale: string }) {
  const pre = useRef<HTMLPreElement>(null);
  const [state, setState] = useState<"idle" | "copied" | "selected">("idle");
  useEffect(() => {
    if (state === "idle") return;
    const timer = window.setTimeout(() => setState("idle"), 2600);
    return () => window.clearTimeout(timer);
  }, [state]);
  return (
    <>
      <DialogHeader>
        <DialogTitle>{fill(labels.dialogTitle, { license: id })}</DialogTitle>
        <DialogDescription>{fill(labels.dialogDescription, { count: new Intl.NumberFormat(locale).format(count), noun: count === 1 ? labels.noun : labels.nouns })}</DialogDescription>
      </DialogHeader>
      <div
        role="region"
        tabIndex={0}
        aria-label={labels.textRegion}
        className="relative max-h-[min(24rem,50vh)] overflow-auto rounded-lg border border-border bg-muted/40 p-4 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40"
      >
        {/* Shown with the line breaks of hand-wrapped paragraphs joined, so it reads on a phone. The copy button copies `text` as it was given. */}
        <pre ref={pre} className="font-mono text-xs leading-relaxed break-words whitespace-pre-wrap">
          {reflowLicense(text)}
        </pre>
      </div>
      <DialogFooter className="sm:items-center">
        <p role="status" aria-live="polite" className={cn("text-sm text-muted-foreground sm:mr-auto", state !== "selected" && "sr-only")}>
          {state === "copied" ? labels.copied : state === "selected" ? labels.copySelected : ""}
        </p>
        <Button
          type="button"
          variant="outline"
          className="min-w-44"
          onClick={async () => {
            setState(await copyText(text, pre.current));
          }}
        >
          {state === "copied" ? <IconCheck aria-hidden="true" /> : <IconCopy aria-hidden="true" />}
          {state === "copied" ? labels.copied : labels.copy}
        </Button>
      </DialogFooter>
    </>
  );
}

/** One licence as a button that opens its full text in a dialog. */
function LicenseButton({ id, text, count, labels, locale }: { id: string; text: string; count: number; labels: OpenSourceCreditsLabels; locale: string }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button type="button" aria-label={fill(labels.read, { license: id })} className={cn(LINK, "inline-flex items-center gap-1.5 text-sm font-medium whitespace-nowrap")}>
          <IconFileText aria-hidden="true" className="size-3.5 text-muted-foreground" />
          {id}
        </button>
      </DialogTrigger>
      <DialogContent className="gap-5 sm:max-w-2xl">
        <LicenseBody id={id} text={text} count={count} labels={labels} locale={locale} />
      </DialogContent>
    </Dialog>
  );
}

/**
 * The libraries your product ships, with their version and licence, as the
 * attribution page that MIT, Apache, BSD and other licences ask for. Packages
 * are grouped by licence family with a count for each, and sorted by name
 * within a licence. A licence's name opens its full text in a dialog, so the
 * requirement is met without leaving the page, and a button copies that one
 * text for a notice file; a browser that will not copy gets the text selected
 * instead. A dual licence such as "MIT OR Apache-2.0" opens either text. The
 * search field narrows the list by package name and says how many are left.
 * Package names link to their repositories and are read out as opening a new
 * tab. Licence texts are yours to supply, because the one that applies carries
 * each project's own copyright line.
 */
export function OpenSourceCredits({
  packages,
  licenseTexts = {},
  caption,
  searchable = true,
  title,
  description,
  headingLevel = 2,
  labels: custom,
  locale = "en-US",
  className,
  ...props
}: OpenSourceCreditsProps) {
  const labels = { ...LABELS, ...custom };
  const [query, setQuery] = useState("");
  const Title = `h${headingLevel}` as "h1" | "h2" | "h3";
  const numbers = new Intl.NumberFormat(locale);
  const collator = new Intl.Collator(locale, { sensitivity: "base", numeric: true });
  const noun = (count: number) => (count === 1 ? labels.noun : labels.nouns);

  // How many packages use each licence, counted over the whole list so the dialog says the same thing however the list is filtered.
  const usedBy = new Map<string, number>();
  const familySize = new Map<string, number>();
  for (const pkg of packages) {
    for (const part of new Set(licenseParts(pkg.license).parts)) usedBy.set(part, (usedBy.get(part) ?? 0) + 1);
    const family = licenseFamily(pkg.license);
    familySize.set(family, (familySize.get(family) ?? 0) + 1);
  }

  const terms = fold(query.trim()).split(/\s+/).filter(Boolean);
  const matching = packages.filter((pkg) => terms.every((term) => fold(pkg.name).includes(term)));
  const groups = new Map<string, OpenSourcePackage[]>();
  for (const pkg of matching) {
    const family = licenseFamily(pkg.license);
    groups.set(family, [...(groups.get(family) ?? []), pkg]);
  }
  // Biggest family first, and the same order whatever the search: a family does not jump about as you type.
  const families = [...groups.keys()].sort((a, b) => (familySize.get(b) ?? 0) - (familySize.get(a) ?? 0) || collator.compare(a, b));

  const total = packages.length;
  const shown = matching.length;
  const nothing = terms.length > 0 && shown === 0;
  const status = terms.length ? fill(labels.shown, { shown: numbers.format(shown), total: numbers.format(total), noun: noun(total) }) : fill(labels.all, { total: numbers.format(total), noun: noun(total) });

  const licence = (license: string) => {
    const { parts, joiner } = licenseParts(license);
    return (
      <span className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
        {parts.map((part, index) => {
          const text = licenseTexts[part];
          return (
            <Fragment key={part}>
              {index > 0 ? <span className="text-sm text-muted-foreground">{labels[joiner]}</span> : null}
              {text ? <LicenseButton id={part} text={text} count={usedBy.get(part) ?? 0} labels={labels} locale={locale} /> : <span className="text-sm">{part || labels.unknown}</span>}
            </Fragment>
          );
        })}
      </span>
    );
  };

  return (
    <section data-slot="open-source-credits" className={cn("w-full break-words", className)} {...props}>
      {title || description ? (
        <header className="mb-8 max-w-2xl">
          {title ? <Title className="text-4xl leading-[1.05] font-medium tracking-[-0.04em] text-balance sm:text-5xl">{title}</Title> : null}
          {description ? <p className={cn("text-base leading-relaxed text-pretty text-muted-foreground sm:text-lg", title && "mt-4")}>{description}</p> : null}
        </header>
      ) : null}

      {searchable ? (
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
          <SearchInput aria-label={labels.search} placeholder={labels.search} value={query} onValueChange={setQuery} className="sm:max-w-sm" />
          {/* With nothing left, the box below says it in words; this line then speaks to screen readers only. */}
          <p role="status" aria-live="polite" className={cn("text-sm text-muted-foreground tabular-nums", nothing && "sr-only")}>
            {status}
          </p>
        </div>
      ) : null}

      {total === 0 ? (
        <p className="rounded-xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">{labels.empty}</p>
      ) : nothing ? (
        <div className="rounded-xl border border-dashed border-border px-4 py-10 text-center">
          <p className="text-sm text-muted-foreground">{fill(labels.noMatch, { query: query.trim() })}</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={(event) => {
              // The button leaves with the message, so focus goes back to the field the reader was typing in.
              const field = event.currentTarget.closest("section")?.querySelector<HTMLInputElement>('input[type="search"]');
              setQuery("");
              field?.focus();
            }}
          >
            {labels.showAll}
          </Button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          {/* The package and version columns have their own width. Sized by their widest cell, the columns would re-flow on every keystroke in the search, because the widest name still on screen decides. A cell that does not fit still makes its column grow, so nothing is ever cut off or overlaps. */}
          <Table>
            {caption ? <TableCaption className="sr-only">{caption}</TableCaption> : null}
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead scope="col" className="w-[52%] pl-4 sm:w-[46%] sm:pl-5">
                  {labels.package}
                </TableHead>
                <TableHead scope="col" className="hidden w-28 sm:table-cell">
                  {labels.version}
                </TableHead>
                <TableHead scope="col" className="pr-4 sm:pr-5">
                  {labels.licence}
                </TableHead>
              </TableRow>
            </TableHeader>
            {families.map((family) => {
              const rows = [...(groups.get(family) ?? [])].sort((a, b) => collator.compare(a.license, b.license) || collator.compare(a.name, b.name));
              return (
                <TableBody key={family}>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead scope="rowgroup" colSpan={3} className="h-auto py-2.5 pr-4 pl-4 sm:pr-5 sm:pl-5">
                      <div className="flex items-baseline justify-between gap-4">
                        <span className="text-sm font-medium text-foreground">{family || labels.unknown}</span>
                        <span className="text-xs font-normal text-muted-foreground tabular-nums">
                          {numbers.format(rows.length)} {noun(rows.length)}
                        </span>
                      </div>
                    </TableHead>
                  </TableRow>
                  {rows.map((pkg, index) => (
                    <TableRow key={`${pkg.name}@${pkg.version}-${index}`}>
                      <TableHead scope="row" className="h-auto py-3 pl-4 text-left text-sm font-medium whitespace-normal text-foreground sm:pl-5">
                        {pkg.repository ? (
                          <a href={pkg.repository} target="_blank" rel="noopener noreferrer" className={LINK}>
                            <PackageName name={pkg.name} arrow />
                            <span className="sr-only"> {labels.newTab}</span>
                          </a>
                        ) : (
                          <PackageName name={pkg.name} />
                        )}
                        {/* On a phone the version moves under the name, so the name keeps the width. */}
                        <span className="mt-0.5 block font-mono text-xs font-normal text-muted-foreground tabular-nums sm:hidden">{pkg.version}</span>
                      </TableHead>
                      <TableCell className="hidden py-3 font-mono text-[0.8125rem] whitespace-nowrap text-muted-foreground tabular-nums sm:table-cell">{pkg.version}</TableCell>
                      <TableCell className="py-3 pr-4 sm:pr-5">{licence(pkg.license)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              );
            })}
          </Table>
        </div>
      )}
    </section>
  );
}
