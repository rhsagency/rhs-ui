"use client";

import { useId, useRef, useState, type ComponentProps } from "react";

import { IconClose, IconSearch } from "@rhs-ui/icons";
import { RecordLookupPanel } from "@rhs-ui/application/record-lookup/panel";
import { DEFAULT_LABELS, around, cellText, fill, type LookupColumn, type LookupPage, type LookupQuery, type LookupRecord, type RecordLookupLabels } from "@rhs-ui/application/record-lookup/lookup";
import { Button } from "@rhs-ui/primitives/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@rhs-ui/primitives/dialog";
import { fieldSurface } from "@rhs-ui/primitives/input";
import { cn } from "@/lib/utils";

export type { LookupColumn, LookupPage, LookupQuery, LookupRecord, LookupSort, RecordLookupLabels } from "@rhs-ui/application/record-lookup/lookup";

export interface RecordLookupProps extends Omit<ComponentProps<"div">, "defaultValue" | "onChange" | "children" | "title"> {
  /** The columns of the table in the dialog. The first one names a record in the field, and the second adds a muted line to it, unless `labelKey` and `detailKey` say otherwise. */
  columns: readonly LookupColumn[];
  /** Asks for one page of records: `{ search, page, pageSize, sort }` and an AbortSignal, answering `{ rows, total }`. Search, sorting and paging all go through it, so the data can stay on the server. */
  loadRows: (query: LookupQuery, signal: AbortSignal) => Promise<LookupPage>;
  /** The chosen record when you control the field, or `null` for none. */
  value?: LookupRecord | null;
  /** The record to begin with, when the field keeps it itself. */
  defaultValue?: LookupRecord | null;
  /** Called with the record that was chosen, or `null` when the choice is cleared. */
  onValueChange?: (value: LookupRecord | null) => void;
  /** The dialog's title, and the name of the table: "Choose a customer". */
  title: string;
  /** Rows to a page. Default 8. */
  pageSize?: number;
  /** The key of the value that names a record. Default the key of the first column. */
  labelKey?: string;
  /** The key of the value shown muted beside the name in the field. Default the key of the second column; `null` for none. */
  detailKey?: string | null;
  /** The name of the field for a plain form submit: the id of the chosen record. */
  name?: string;
  /** Turn the field off. */
  disabled?: boolean;
  /** Whether the dialog is open, when you control it. */
  open?: boolean;
  /** Whether the dialog is open to begin with. */
  defaultOpen?: boolean;
  /** Called when the dialog opens or closes. */
  onOpenChange?: (open: boolean) => void;
  /** The language of the plural rules. Default "en-US". */
  locale?: string;
  /** The words the lookup says, for translation. */
  labels?: RecordLookupLabels;
}

/**
 * For choosing a customer, a product or an account when one line of text is
 * not enough to tell records apart. The field shows the chosen record's name
 * with a muted line of detail, a clear button and a Look up button; the
 * button opens a dialog with a search field, a table with sortable columns and
 * a radio button on each row, paging and a Select button. Search, sorting and
 * paging run through `loadRows`, so the data can stay on the server, and a
 * late answer never replaces a newer one. Enter in the search field takes the
 * chosen row or the first result, Arrow Down moves into the rows, and the
 * result count is announced politely.
 */
export function RecordLookup({
  columns,
  loadRows,
  value,
  defaultValue = null,
  onValueChange,
  title,
  pageSize = 8,
  labelKey,
  detailKey,
  name,
  disabled = false,
  open,
  defaultOpen = false,
  onOpenChange,
  locale = "en-US",
  labels,
  className,
  ...props
}: RecordLookupProps) {
  const words = { ...DEFAULT_LABELS, ...labels };
  const base = useId();
  const trigger = useRef<HTMLButtonElement>(null);
  const [own, setOwn] = useState<LookupRecord | null>(defaultValue);
  const [ownOpen, setOwnOpen] = useState(defaultOpen);
  const [picked, setPicked] = useState<LookupRecord | null>(value === undefined ? defaultValue : value);
  const current = value === undefined ? own : value;
  const isOpen = open ?? ownOpen;
  const nameKey = labelKey ?? columns[0]?.key ?? "id";
  const lineKey = detailKey === undefined ? columns[1]?.key : (detailKey ?? undefined);
  const label = current ? cellText(current, nameKey) || current.id : "";
  const detail = current && lineKey ? cellText(current, lineKey) : "";
  const [selectedBefore, selectedAfter] = around(words.selected, "label");

  function setOpen(next: boolean) {
    // The dialog starts from what is chosen, and what is picked in it counts only once it is taken.
    if (next) setPicked(current);
    if (open === undefined) setOwnOpen(next);
    onOpenChange?.(next);
  }

  function choose(record: LookupRecord | null) {
    if (value === undefined) setOwn(record);
    onValueChange?.(record);
  }

  function take(record: LookupRecord | null) {
    if (!record) return;
    choose(record);
    setOpen(false);
  }

  return (
    <div data-slot="record-lookup" data-state={current ? "chosen" : "empty"} className={cn("@container flex w-full min-w-0 items-stretch gap-2", className)} {...props}>
      <div className={cn(fieldSurface, "flex h-9 min-w-0 flex-1 items-center gap-2 pr-1.5 pl-3 text-sm", disabled && "opacity-50")}>
        <span id={`${base}-value`} className="flex min-w-0 flex-1 items-baseline gap-2">
          {current ? (
            <>
              <span className="truncate font-medium">{label}</span>
              {detail ? <span className="hidden min-w-0 shrink truncate text-xs text-muted-foreground @xs:inline">{detail}</span> : null}
            </>
          ) : (
            <span className="truncate text-muted-foreground">{words.placeholder}</span>
          )}
        </span>
        {current && !disabled ? (
          <button
            type="button"
            aria-label={fill(words.clear, { label })}
            onClick={() => {
              choose(null);
              trigger.current?.focus();
            }}
            className="grid size-6 shrink-0 place-items-center rounded text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40"
          >
            <IconClose aria-hidden="true" size={14} />
          </button>
        ) : null}
      </div>

      <Dialog open={isOpen} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button ref={trigger} type="button" variant="outline" disabled={disabled} aria-describedby={`${base}-value`} className="shrink-0 px-3 @xs:px-4">
            <IconSearch aria-hidden="true" />
            {/* In a narrow place the button is the glass alone; its name is still there for assistive technology. */}
            <span className="sr-only @xs:not-sr-only">{words.lookUp}</span>
          </Button>
        </DialogTrigger>
        <DialogContent
          // Escape empties a search field that has words in it, and only then closes the dialog: the field's own handler does the emptying.
          onEscapeKeyDown={(event) => {
            const field = event.target;
            if (field instanceof HTMLInputElement && field.type === "search" && field.value !== "") event.preventDefault();
          }}
          className="flex max-h-[calc(100dvh-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl"
        >
          <DialogHeader className="gap-1 px-4 pt-5 pb-4 pr-12 sm:px-6">
            <DialogTitle className="text-base tracking-[-0.01em]">{title}</DialogTitle>
            <DialogDescription>{words.hint}</DialogDescription>
          </DialogHeader>
          <RecordLookupPanel
            columns={columns}
            loadRows={loadRows}
            picked={picked}
            onPickedChange={setPicked}
            onConfirm={take}
            title={title}
            pageSize={pageSize}
            labelKey={labelKey}
            locale={locale}
            labels={labels}
            className="min-h-0 flex-1"
          />
          <DialogFooter className="flex-col items-stretch gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p className="min-w-0 truncate text-sm text-muted-foreground">
              {picked ? (
                <span>
                  {selectedBefore}
                  <span className="font-medium text-foreground">{cellText(picked, nameKey) || picked.id}</span>
                  {selectedAfter}
                </span>
              ) : (
                words.nothingSelected
              )}
            </p>
            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                {words.cancel}
              </Button>
              <Button type="button" disabled={!picked} onClick={() => take(picked)}>
                {words.select}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {name ? <input type="hidden" name={name} value={current?.id ?? ""} /> : null}
    </div>
  );
}
