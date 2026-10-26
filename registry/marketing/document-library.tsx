"use client";

import { useId, useRef, useState, type ComponentProps } from "react";

import { IconDownload } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { SearchInput } from "@rhs-ui/primitives/search-input";
import { cn } from "@/lib/utils";

export interface LibraryDocument {
  /** The document's title as people ask for it: "Annual report 2025". */
  title: string;
  /** One line on what is inside. */
  description?: string;
  /** The file type: "PDF", "DOCX", "XLSX". It is written on the file's tile and in the download link's name. */
  format: string;
  /** The size as people say it: "2 MB". It is part of the download link's name. */
  size: string;
  /** The number of pages, for documents that have them. */
  pages?: number;
  /** The language the document is written in: "English", "Nederlands". */
  language?: string;
  /** When it last changed, as an ISO date: "2026-03-12". */
  updated?: string;
  /** The file itself. */
  href: string;
  /** The name the file is saved under, when it should differ from the one on the server. */
  filename?: string;
}

export interface LibraryGroup {
  /** The category: "Annual reports", "Policies", "Brochures". */
  title: string;
  /** One line on what belongs here. */
  description?: string;
  documents: readonly LibraryDocument[];
}

export interface DocumentLibraryLabels {
  /** The visible words of every download link. The title, type and size follow, for screen readers. */
  download: string;
  /** The search field's accessible name and placeholder. */
  search: string;
  /** The noun after a count of one: "1 page". */
  page: string;
  /** The noun after any other count: "84 pages". */
  pages: string;
  /** The words before the date of the last change. */
  updated: string;
  /** The noun after a count of one: "1 document". */
  document: string;
  /** The noun after any other count. */
  documents: string;
  /** Said as the search narrows the list: "3 of 12 documents". {shown}, {total} and {noun} stand for the two counts and the noun. */
  filtered: string;
  /** Said when nothing matches the search. {query} stands for what was typed. */
  noMatch: string;
  /** The button that clears the search. */
  clear: string;
  /** Said when there are no documents at all. */
  empty: string;
}

export interface DocumentLibraryProps extends Omit<ComponentProps<"section">, "title" | "children"> {
  /** The documents, grouped by category. Groups and documents keep the order you give them. */
  groups: readonly LibraryGroup[];
  /** Adds a search field that filters by title, description, type and language as you type. */
  searchable?: boolean;
  /** The page's own heading, when the page has no other: "Documents". */
  title?: string;
  /** One or two sentences under the title. */
  description?: string;
  /** The level of the title. Group headings sit one level below it, or take this level when there is no title. */
  headingLevel?: 1 | 2 | 3;
  /** Words for the fixed text, for a site that is not in English. */
  labels?: Partial<DocumentLibraryLabels>;
  /** Locale for numbers and dates. */
  locale?: string;
  /** Time zone for an updated date that carries a time; a date without one is never shifted. */
  timeZone?: string;
}

const LABELS: DocumentLibraryLabels = {
  download: "Download",
  search: "Search documents",
  page: "page",
  pages: "pages",
  updated: "Updated",
  document: "document",
  documents: "documents",
  filtered: "{shown} of {total} {noun}",
  noMatch: "No documents match “{query}”.",
  clear: "Clear search",
  empty: "No documents yet.",
};

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

function formatDate(value: string, locale: string, timeZone: string): string {
  const time = Date.parse(value);
  if (Number.isNaN(time)) return value;
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone: DATE_ONLY.test(value) ? "UTC" : timeZone }).format(time);
}

/** Puts values into a sentence: {query} becomes what was typed. Words stay plain strings, so they can cross from a Server Component. */
const fill = (template: string, values: Record<string, string | number>) => template.replace(/\{(\w+)\}/g, (match, key: string) => String(values[key] ?? match));

/** Lower case without accents, so "cafe" finds "Café" and "ANNUAL" finds "annual". */
const fold = (value: string) => value.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");

/**
 * A page of downloads for sites that live on their PDFs: investor
 * relations, municipalities, schools, associations. Documents are grouped by
 * category, and each row says what it is before it asks for a click: a tile
 * with the file type, the title, a line about it, and the size, page count,
 * language and date. Each Download is a real link with the download
 * attribute, and its accessible name carries the title, the type and the size
 * ("Download Annual report 2025, PDF, 2 MB"), so a list of twelve of them is
 * not twelve identical words. An optional search narrows the list as you type
 * and announces how many documents are left. Rows stack on a phone with the
 * button across the full width. The links are plain anchors on purpose: a
 * download is not a route.
 */
export function DocumentLibrary({
  groups,
  searchable = false,
  title,
  description,
  headingLevel = 2,
  labels: custom,
  locale = "en-US",
  timeZone = "UTC",
  className,
  ...props
}: DocumentLibraryProps) {
  const labels = { ...LABELS, ...custom };
  const id = useId();
  const [query, setQuery] = useState("");
  const search = useRef<HTMLDivElement>(null);
  const Title = `h${headingLevel}` as "h1" | "h2" | "h3";
  const Group = `h${title ? headingLevel + 1 : headingLevel}` as "h1" | "h2" | "h3" | "h4";
  const numbers = new Intl.NumberFormat(locale);

  const terms = fold(query.trim()).split(/\s+/).filter(Boolean);
  const matches = (doc: LibraryDocument) => {
    if (!terms.length) return true;
    const haystack = fold([doc.title, doc.description, doc.format, doc.language].filter(Boolean).join(" "));
    return terms.every((term) => haystack.includes(term));
  };
  const shownGroups = groups.map((group) => ({ group, documents: group.documents.filter(matches) })).filter((entry) => entry.documents.length > 0);
  const total = groups.reduce((sum, group) => sum + group.documents.length, 0);
  const shown = shownGroups.reduce((sum, entry) => sum + entry.documents.length, 0);
  const noun = (n: number) => (n === 1 ? labels.document : labels.documents);
  const status = terms.length ? (shown === 0 ? fill(labels.noMatch, { query: query.trim() }) : fill(labels.filtered, { shown, total, noun: noun(total) })) : `${numbers.format(total)} ${noun(total)}`;

  return (
    <section data-slot="document-library" className={cn("w-full break-words", className)} {...props}>
      {title || description ? (
        <header className="mb-8 max-w-2xl">
          {title ? <Title className="text-4xl leading-[1.05] font-medium tracking-[-0.04em] text-balance sm:text-5xl">{title}</Title> : null}
          {description ? <p className={cn("text-base leading-relaxed text-pretty text-muted-foreground sm:text-lg", title && "mt-4")}>{description}</p> : null}
        </header>
      ) : null}

      {searchable ? (
        <div ref={search} className="mb-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
          <SearchInput aria-label={labels.search} placeholder={labels.search} value={query} onValueChange={setQuery} className="sm:max-w-sm" />
          {/* With nothing left, the box below says it in words; this line then speaks to screen readers only. */}
          <p role="status" aria-live="polite" className={cn("text-sm text-muted-foreground tabular-nums", shown === 0 && terms.length > 0 && "sr-only")}>
            {status}
          </p>
        </div>
      ) : null}

      {total === 0 ? (
        <p className="rounded-xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">{labels.empty}</p>
      ) : shownGroups.length === 0 && terms.length ? (
        <div className="rounded-xl border border-dashed border-border px-4 py-10 text-center">
          <p className="text-sm text-muted-foreground">{fill(labels.noMatch, { query: query.trim() })}</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => {
              setQuery("");
              // The button is about to leave the page: keep the keyboard where the reader was typing.
              search.current?.querySelector("input")?.focus();
            }}
          >
            {labels.clear}
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-12">
          {shownGroups.map(({ group, documents }, groupIndex) => (
            <div key={group.title}>
              <div className="mb-4 flex items-baseline justify-between gap-4 border-b border-foreground pb-3">
                <Group id={`${id}-${groupIndex}`} className="min-w-0 text-xl leading-snug font-semibold tracking-[-0.025em]">
                  {group.title}
                </Group>
                <p className="shrink-0 text-sm text-muted-foreground">
                  <span className="tabular-nums">{numbers.format(documents.length)}</span> {noun(documents.length)}
                </p>
              </div>
              {group.description ? <p className="mb-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">{group.description}</p> : null}
              <ul role="list" aria-labelledby={`${id}-${groupIndex}`} className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
                {documents.map((doc) => {
                  // What the file is, kept on one line; when it changed goes on its own line on a phone, so a separator never starts a line.
                  const facts = [doc.size, doc.pages !== undefined ? `${numbers.format(doc.pages)} ${doc.pages === 1 ? labels.page : labels.pages}` : null, doc.language ?? null].filter(
                    (item): item is string => Boolean(item),
                  );
                  return (
                    <li key={`${doc.title}-${doc.format}-${doc.language ?? ""}`} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:gap-6 sm:p-5">
                      <div className="flex min-w-0 flex-1 gap-4">
                        {/* A short type keeps the same 44px tile, so the titles of a list line up; a long one ("Keynote", "Spreadsheet") widens its tile instead of spilling out of it. */}
                        <span
                          aria-hidden="true"
                          className={cn(
                            "grid h-11 shrink-0 place-items-center rounded-lg border border-border bg-muted/50 text-xs font-semibold tracking-[0.02em] uppercase",
                            Array.from(doc.format).length > 4 ? "min-w-11 px-1.5" : "w-11",
                          )}
                        >
                          {doc.format}
                        </span>
                        <div className="min-w-0">
                          <p className="text-[0.9375rem] leading-snug font-medium tracking-[-0.01em]">{doc.title}</p>
                          {doc.description ? <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{doc.description}</p> : null}
                          <p className="mt-2 flex flex-col gap-y-1 text-xs text-muted-foreground tabular-nums sm:flex-row sm:flex-wrap">
                            <span>
                              {facts.map((item, index) => (
                                <span key={`${index}-${item}`}>
                                  {index > 0 ? (
                                    <>
                                      <span aria-hidden="true" className="px-1.5">
                                        &middot;
                                      </span>
                                      <wbr />
                                      <span className="sr-only">, </span>
                                    </>
                                  ) : null}
                                  {item}
                                </span>
                              ))}
                            </span>
                            {doc.updated ? (
                              <>
                                <span aria-hidden="true" className="px-1.5 max-sm:hidden">
                                  &middot;
                                </span>
                                <span className="sr-only">, </span>
                                <span>
                                  {labels.updated} <time dateTime={doc.updated}>{formatDate(doc.updated, locale, timeZone)}</time>
                                </span>
                              </>
                            ) : null}
                          </p>
                        </div>
                      </div>
                      <Button asChild variant="outline" size="sm" className="w-full sm:w-auto">
                        <a href={doc.href} download={doc.filename ?? ""}>
                          <IconDownload aria-hidden="true" />
                          {labels.download}
                          <span className="sr-only">
                            {" "}
                            {doc.title}, {doc.format}, {doc.size}
                          </span>
                        </a>
                      </Button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
