"use client";

import { Fragment, useEffect, useRef, useState, type ComponentProps, type CSSProperties } from "react";

import { IconChevronRight, IconCornerDownRight, IconLink } from "@rhs-ui/icons";
import {
  DEFAULT_LABELS,
  chainTo,
  fill,
  isOne,
  pathOf,
  rowId,
  sectionsOf,
  splitUnion,
  type PropRow,
  type PropsTableLabels,
} from "@rhs-ui/application/props-table/props";
import { Badge } from "@rhs-ui/primitives/badge";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@rhs-ui/primitives/table";
import { cn } from "@/lib/utils";

export type { PropRow, PropsTableLabels } from "@rhs-ui/application/props-table/props";

export interface PropsTableProps extends Omit<ComponentProps<"div">, "children"> {
  /** The props, one row each: a name, a type, a default, whether it is required and what it does. A row with `children` has fields that open beneath it. A `group` puts rows under a heading. */
  rows: readonly PropRow[];
  /** Names the table for screen readers. Default "Props". */
  caption?: string;
  /** What every row id starts with, so two tables on one page do not share links: "button-" gives "#button-variant". Default "prop-". */
  idPrefix?: string;
  /** The paths of the rows that start open: "address", or "address.geo" for a field inside one. */
  defaultExpanded?: readonly string[];
  /** The language of the counts. Default "en-US". */
  locale?: string;
  /** The words the table says, for translation. */
  labels?: PropsTableLabels;
}

/** A row's text cells, as table cells on a wide screen and as stacked blocks on a narrow one. The table is `display: block` there, so every cell and row says what it is. */
const CELL = "px-4 py-3.5 align-top @max-2xl:mt-2.5 @max-2xl:block @max-2xl:p-0";

/** What a description may hold, styled with classes written out in full. */
const PROSE =
  "text-sm leading-relaxed text-pretty text-muted-foreground [&_code]:rounded-sm [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.8125rem] [&_code]:text-foreground";

/** A type in a mono chip. A union breaks at its pipes, each member whole, so a long list reads as a column and not as a wall. */
function TypeChip({ type }: { type: string }) {
  const parts = splitUnion(type);
  return (
    <code className="inline-block max-w-full rounded-md bg-muted px-2 py-1 align-top font-mono text-[0.8125rem] leading-[1.45] text-foreground [overflow-wrap:anywhere]">
      {parts.map((part, index) => (
        <span key={`${index}-${part}`}>
          {index > 0 ? " " : null}
          <span className="inline-block max-w-full">
            {index > 0 ? <span className="text-muted-foreground">| </span> : null}
            {part}
          </span>
        </span>
      ))}
    </code>
  );
}

/**
 * An API reference for docs: every prop with its type in a mono chip (a long union breaks at its pipes), the word
 * Required where it applies, its default or None, and what it does. A prop that takes an object has a button that opens
 * its fields beneath it, indented, and they can nest. Every row has an id and a link (`#prop-variant`): opening the page
 * at one scrolls to it and opens what holds it, and the row is highlighted. Below 42rem of width the table becomes a
 * stack of blocks, the name on top, so nothing scrolls sideways; the rows keep their table semantics for screen readers.
 */
export function PropsTable({ rows, caption = "Props", idPrefix = "prop-", defaultExpanded, locale = "en-US", labels, className, ...props }: PropsTableProps) {
  const words: Required<PropsTableLabels> = { ...DEFAULT_LABELS, ...labels };
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(() => new Set(defaultExpanded));
  const [linked, setLinked] = useState("");
  const handled = useRef("");
  const scrollTo = useRef("");

  // A link to a row marks that row, and opens the rows that hold it when it is nested. A row that is on screen is the browser's to scroll to; one that was folded away is ours.
  useEffect(() => {
    const reveal = () => {
      const hash = window.location.hash.slice(1);
      if (handled.current === hash) return;
      handled.current = hash;
      let id = hash;
      try {
        id = decodeURIComponent(hash);
      } catch {
        // A hash that is not valid text is used as it is.
      }
      const chain = id.startsWith(idPrefix) ? chainTo(rows, idPrefix, id) : null;
      setLinked(chain ? id : "");
      if (!chain?.length) return;
      scrollTo.current = id;
      setExpanded((before) => new Set([...before, ...chain]));
    };
    reveal();
    window.addEventListener("hashchange", reveal);
    return () => window.removeEventListener("hashchange", reveal);
  }, [rows, idPrefix]);

  // The row that was folded away is on screen once the rows that hold it have been drawn: then it is scrolled to.
  useEffect(() => {
    if (!scrollTo.current) return;
    const row = document.getElementById(scrollTo.current);
    if (!row) return;
    scrollTo.current = "";
    row.scrollIntoView({ block: "center" });
  }, [expanded]);

  const toggle = (path: string) =>
    setExpanded((before) => {
      const next = new Set(before);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });

  function renderRow(row: PropRow, depth: number, parent: string) {
    const path = pathOf(parent, row.name);
    const id = rowId(idPrefix, path);
    const fields = row.children ?? [];
    const open = expanded.has(path);
    const fieldsText = fill(isOne(fields.length, locale) ? words.fieldsOne : words.fieldsOther, { count: String(fields.length) });
    return (
      <Fragment key={path}>
        <TableRow
          role="row"
          id={id}
          data-depth={depth}
          data-linked={linked === id ? "" : undefined}
          style={{ "--depth": depth } as CSSProperties}
          className={cn(
            "group/row scroll-mt-6 target:bg-[color-mix(in_oklch,var(--muted),var(--foreground)_4%)] data-[linked]:bg-[color-mix(in_oklch,var(--muted),var(--foreground)_4%)]",
            "@max-2xl:block @max-2xl:py-4 @max-2xl:pr-4 @max-2xl:pl-[calc(1rem+var(--depth)*1rem)]",
            depth > 0 && "bg-muted/30",
          )}
        >
          <TableHead role="rowheader" scope="row" className="h-auto px-4 py-3.5 text-left align-top font-normal whitespace-normal text-foreground @max-2xl:block @max-2xl:p-0">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5" style={{ paddingInlineStart: depth ? `${depth * 1.25}rem` : undefined }}>
              {depth > 0 ? <IconCornerDownRight aria-hidden="true" className="size-3.5 shrink-0 text-muted-foreground" /> : null}
              <code className="font-mono text-[0.8125rem] font-semibold text-foreground [overflow-wrap:anywhere]">
                {depth > 0 ? <span className="sr-only">{parent}.</span> : null}
                {row.name}
              </code>
              {row.required ? <Badge variant="outline">{words.required}</Badge> : null}
              <a
                href={`#${id}`}
                aria-label={fill(words.link, { name: path })}
                className={cn(
                  "relative inline-flex size-6 items-center justify-center rounded-md text-muted-foreground outline-none",
                  "opacity-0 transition-[opacity,background-color,color] duration-150 group-hover/row:opacity-100 focus-visible:opacity-100 pointer-coarse:opacity-100 motion-reduce:transition-none",
                  "hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40 before:absolute before:-inset-1.5 before:content-['']",
                )}
              >
                <IconLink size={14} />
              </a>
            </div>
            {fields.length ? (
              <button
                type="button"
                aria-expanded={open}
                aria-label={fill(words.fieldsOf, { fields: fieldsText, name: path })}
                onClick={() => toggle(path)}
                className={cn(
                  "mt-2 inline-flex h-6 items-center gap-1 rounded-md border border-border bg-background px-1.5 text-xs font-medium text-muted-foreground outline-none",
                  "transition-[background-color,color] duration-150 motion-reduce:transition-none hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40",
                  open && "text-foreground",
                )}
                style={{ marginInlineStart: depth ? `${depth * 1.25 + 1.375}rem` : undefined }}
              >
                <IconChevronRight aria-hidden="true" size={12} className={cn("transition-transform duration-150 motion-reduce:transition-none", open && "rotate-90")} />
                {fieldsText}
              </button>
            ) : null}
          </TableHead>
          <TableCell role="cell" className={CELL}>
            <TypeChip type={row.type} />
          </TableCell>
          <TableCell role="cell" className={CELL}>
            <span className="me-1.5 text-xs text-muted-foreground @2xl:hidden">{words.defaultValue}</span>
            {row.defaultValue ? <code className="font-mono text-[0.8125rem] text-foreground [overflow-wrap:anywhere]">{row.defaultValue}</code> : <span className="text-muted-foreground">{words.none}</span>}
          </TableCell>
          <TableCell role="cell" className={CELL}>
            {row.description ? <div className={PROSE}>{row.description}</div> : null}
          </TableCell>
        </TableRow>
        {open ? fields.map((field) => renderRow(field, depth + 1, path)) : null}
      </Fragment>
    );
  }

  const sections = sectionsOf(rows);

  if (!rows.length) {
    return (
      <div data-slot="props-table" className={cn("w-full min-w-0", className)} {...props}>
        <p className="rounded-xl border border-dashed border-border px-6 py-10 text-center text-sm text-muted-foreground">{words.empty}</p>
      </div>
    );
  }

  return (
    <div data-slot="props-table" className={cn("@container w-full min-w-0", className)} {...props}>
      <div className="overflow-hidden rounded-xl border border-border bg-card text-card-foreground">
        <Table role="table" className="table-fixed @max-2xl:block">
          <TableCaption className="sr-only">{caption}</TableCaption>
          <colgroup className="@max-2xl:hidden">
            <col className="w-[24%]" />
            <col className="w-[30%]" />
            <col className="w-[14%]" />
            <col />
          </colgroup>
          <TableHeader role="rowgroup" className="bg-muted/40 @max-2xl:hidden">
            <TableRow role="row" className="hover:bg-transparent">
              <TableHead role="columnheader" scope="col" className="h-10 px-4 text-xs">
                {words.prop}
              </TableHead>
              <TableHead role="columnheader" scope="col" className="h-10 px-4 text-xs">
                {words.type}
              </TableHead>
              <TableHead role="columnheader" scope="col" className="h-10 px-4 text-xs">
                {words.defaultValue}
              </TableHead>
              <TableHead role="columnheader" scope="col" className="h-10 px-4 text-xs">
                {words.description}
              </TableHead>
            </TableRow>
          </TableHeader>
          {sections.map((section, index) => (
            <TableBody key={`${index}-${section.group ?? ""}`} role="rowgroup" className="@max-2xl:block">
              {section.group !== undefined ? (
                <TableRow role="row" className="bg-muted/40 hover:bg-muted/40 @max-2xl:block">
                  <TableHead colSpan={4} scope="rowgroup" className="h-auto px-4 py-2.5 text-left text-[0.8125rem] font-semibold text-foreground @max-2xl:block">
                    {section.group}
                  </TableHead>
                </TableRow>
              ) : null}
              {section.rows.map((row) => renderRow(row, 0, ""))}
            </TableBody>
          ))}
        </Table>
      </div>
    </div>
  );
}
