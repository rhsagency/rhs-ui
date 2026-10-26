import type { ComponentProps, ReactNode } from "react";

import { Badge } from "@rhs-ui/primitives/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@rhs-ui/primitives/table";
import { DiffRow, UnchangedFields } from "@rhs-ui/dashboard/field-diff-table/diff-rows";
import { ROW_GRID, describeValue, isEmptyValue, isLongText, kindOf, labelOf, type FieldChange, type FieldFormatter } from "@rhs-ui/dashboard/field-diff-table/diff";
import { cn } from "@/lib/utils";

export type { FieldChange, FieldChangeKind, FieldFormatter } from "@rhs-ui/dashboard/field-diff-table/diff";

export interface FieldDiffTableProps extends Omit<ComponentProps<"div">, "children"> {
  /** Every field of the record with its old and new value. Fields that did not change fold away on their own. */
  changes: readonly FieldChange[];
  /** Draw a field's values your way, by field name: a price as money, a date in your format. Called only for values that are not empty. */
  formatters?: Readonly<Record<string, FieldFormatter>>;
  /** Names the table for screen readers. */
  caption?: string;
  /** Lines of text shown before a long value is clamped behind "Show full text". */
  lines?: number;
  /** BCP 47 locale for numbers, dates and lists. */
  locale?: string;
  /** IANA zone for dates. */
  timeZone?: string;
}

/**
 * What changed on a record, for an audit trail, an approval screen or an
 * edit review: each field with its old and new value side by side. The old
 * value is struck through and muted and the new one is at full strength, so
 * the change reads in monochrome, and every row also reads in words ("Status:
 * was Draft, now Published"). A value that was empty says "was empty", one
 * that was cleared says "removed". Fields that did not change fold under "n
 * unchanged fields", and long text is clamped behind a "Show full text"
 * button that appears only when something is hidden. On a narrow container
 * the field takes a line of its own, and long text stacks old above new.
 * Formatters are plain functions, so the table renders on the server; only
 * the two buttons run in the browser.
 */
export function FieldDiffTable({
  changes,
  formatters,
  caption = "Changes to this record",
  lines = 3,
  locale = "en-US",
  timeZone = "UTC",
  className,
  ...props
}: FieldDiffTableProps) {
  const context = { locale, timeZone };
  const clamp = Math.max(1, Math.floor(lines));
  const draw = (change: FieldChange, value: unknown): ReactNode => {
    const formatter = formatters?.[change.field];
    if (formatter) return formatter(value, change);
    const { text, mono } = describeValue(value, context);
    return mono ? <code className="font-mono text-[0.8125rem]">{text}</code> : text;
  };

  const rows = changes.map((change) => ({ change, kind: kindOf(change), label: labelOf(change) }));
  const edits = rows.filter((row) => row.kind !== "unchanged");
  const unchanged = rows.filter((row) => row.kind === "unchanged");
  const added = edits.filter((row) => row.kind === "added").length;
  const removed = edits.filter((row) => row.kind === "removed").length;
  const edited = edits.length - added - removed;
  const detail = [edited > 0 && added + removed > 0 ? `${edited} edited` : "", added > 0 ? `${added} added` : "", removed > 0 ? `${removed} removed` : ""].filter(Boolean).join(" · ");

  return (
    <div data-slot="field-diff-table" className={cn("@container w-full min-w-0 overflow-hidden rounded-xl border border-border bg-card text-card-foreground", className)} {...props}>
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 border-b border-border px-4 py-3">
        <p className="text-sm font-medium tracking-[-0.01em]">{edits.length === 0 ? "No fields changed" : `${edits.length} ${edits.length === 1 ? "field" : "fields"} changed`}</p>
        {detail ? <p className="text-xs text-muted-foreground">{detail}</p> : null}
      </div>

      <Table role="table" aria-label={caption} className="block">
        {edits.length > 0 ? (
          <TableHeader role="rowgroup" className="block">
            <TableRow role="row" className={cn(ROW_GRID, "bg-muted/30 px-4 py-2 hover:bg-muted/30 @max-xl:sr-only")}>
              <TableHead role="columnheader" scope="col" className="h-auto p-0 text-xs">
                Field
              </TableHead>
              <TableHead role="columnheader" scope="col" className="h-auto p-0 text-xs">
                Before
              </TableHead>
              <TableHead role="columnheader" aria-hidden="true" className="h-auto p-0" />
              <TableHead role="columnheader" scope="col" className="h-auto p-0 text-xs">
                After
              </TableHead>
            </TableRow>
          </TableHeader>
        ) : null}

        <TableBody role="rowgroup" className="block">
          {edits.length === 0 ? (
            <TableRow role="row" className="block hover:bg-transparent">
              <TableCell role="cell" className="block px-4 py-8 text-center text-sm text-muted-foreground">
                Nothing differs between the two versions.
              </TableCell>
            </TableRow>
          ) : null}
          {edits.map(({ change, kind, label }) => (
            <DiffRow
              key={change.field}
              kind={kind}
              label={label}
              lines={clamp}
              stacked={isLongText(change.before) || isLongText(change.after)}
              field={
                <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="text-[0.8125rem] leading-5 font-medium">{label}</span>
                  {kind === "added" ? <Badge variant="outline">Added</Badge> : kind === "removed" ? <Badge variant="muted">Removed</Badge> : null}
                </span>
              }
              before={
                isEmptyValue(change.before) ? (
                  <span className="text-muted-foreground italic">was empty</span>
                ) : (
                  <>
                    <span className="sr-only">was </span>
                    <del className="text-muted-foreground line-through decoration-muted-foreground/60 decoration-1">{draw(change, change.before)}</del>
                  </>
                )
              }
              after={
                <>
                  <span className="sr-only">now </span>
                  {isEmptyValue(change.after) ? (
                    <span className="text-muted-foreground italic">removed</span>
                  ) : (
                    <ins className="font-medium text-foreground no-underline">{draw(change, change.after)}</ins>
                  )}
                </>
              }
            />
          ))}
        </TableBody>

        {unchanged.length > 0 ? (
          <UnchangedFields count={unchanged.length}>
            {unchanged.map(({ change, kind, label }) => (
              <DiffRow
                key={change.field}
                kind={kind}
                label={label}
                lines={clamp}
                field={<span className="text-[0.8125rem] leading-5 font-medium">{label}</span>}
                after={isEmptyValue(change.after) && isEmptyValue(change.before) ? <span className="italic">Empty</span> : draw(change, isEmptyValue(change.after) ? change.before : change.after)}
              />
            ))}
          </UnchangedFields>
        ) : null}
      </Table>
    </div>
  );
}
