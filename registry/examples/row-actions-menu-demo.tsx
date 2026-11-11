"use client";

import { useCallback, useLayoutEffect, useRef, useState, type ReactNode } from "react";

import { IconCopy, IconDownload, IconEdit, IconFile, IconSend, IconTrash } from "@rhs-ui/icons";
import { RowActionsMenu, type RowAction } from "@rhs-ui/primitives/row-actions-menu";
import { StatusBadge } from "@rhs-ui/primitives/status-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@rhs-ui/primitives/table";

type Invoice = { id: string; number: string; customer: string; amount: number; status: "paid" | "pending" | "overdue" };

const INVOICES: readonly Invoice[] = [
  { id: "inv_1042", number: "Invoice 1042", customer: "Kestrel Analytics", amount: 1840, status: "pending" },
  { id: "inv_1041", number: "Invoice 1041", customer: "Halcyon Labs", amount: 620, status: "paid" },
  { id: "inv_1040", number: "Invoice 1040", customer: "Northwind Traders", amount: 2375.5, status: "overdue" },
  { id: "inv_1039", number: "Invoice 1039", customer: "Mirror Labs", amount: 840, status: "paid" },
];

const euro = new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR" });

const invoiceActions = (invoice: Invoice): readonly RowAction[] => [
  { id: "edit", label: "Edit", icon: <IconEdit />, shortcut: "⌘E", group: "change" },
  { id: "duplicate", label: "Duplicate", icon: <IconCopy />, shortcut: "⌘D", group: "change" },
  { id: "remind", label: "Send reminder", icon: <IconSend />, group: "share", disabled: invoice.status === "paid", disabledReason: "Already paid" },
  { id: "download", label: "Download PDF", icon: <IconDownload />, group: "share" },
  { id: "delete", label: "Delete", icon: <IconTrash />, group: "danger", destructive: true, confirmDescription: "The customer keeps the copy they received. You cannot undo this." },
];

const FILES = [
  { id: "f1", name: "Q3-board-pack.pdf", size: "2.4 MB" },
  { id: "f2", name: "Roadmap-2027.fig", size: "18.1 MB" },
  { id: "f3", name: "Budget-draft.xlsx", size: "640 KB" },
] as const;

const fileActions: readonly RowAction[] = [
  { id: "rename", label: "Rename", icon: <IconEdit />, group: "file" },
  { id: "download", label: "Download", icon: <IconDownload />, group: "file" },
  { id: "delete", label: "Delete", icon: <IconTrash />, group: "danger", destructive: true, confirmDescription: "It is removed from every folder it is in." },
];

const VERBS: Readonly<Record<string, string>> = { edit: "Editing", duplicate: "Duplicated", remind: "Reminder sent for", download: "Downloading", rename: "Renaming", delete: "Deleted" };

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

/** Where focus goes after a row is deleted: the actions button of a row, or the restore link. */
type Landing = { rowId: string } | "restore" | null;

/**
 * A deleted row takes its actions button, and the focus on it, with it: left alone, the focus drops to the top of the page and a
 * keyboard user starts again from the first row after every delete. Call `deleted(id)` where you remove the row; once the list has
 * rendered, the focus lands on the button of the row that moved up into its place (the one above when the last row went), or on the
 * restore link when nothing is left. Mark a row `data-row` and the link `data-restore`, and give `scope` to the box around them.
 */
function useFocusAfterDelete(rows: readonly { id: string }[]) {
  const scope = useRef<HTMLElement | null>(null);
  const landing = useRef<Landing>(null);
  const setScope = useCallback((node: HTMLElement | null) => {
    scope.current = node;
  }, []);
  useLayoutEffect(() => {
    const target = landing.current;
    landing.current = null;
    if (!target || !scope.current) return;
    const button =
      target === "restore"
        ? scope.current.querySelector<HTMLElement>("[data-restore]")
        : scope.current.querySelector<HTMLElement>(`[data-row="${CSS.escape(target.rowId)}"] [data-slot="row-actions-menu"] button`);
    button?.focus();
  }, [rows]);
  return {
    scope: setScope,
    deleted: (id: string) => {
      const at = rows.findIndex((row) => row.id === id);
      const neighbour = rows[at + 1] ?? rows[at - 1];
      landing.current = neighbour ? { rowId: neighbour.id } : "restore";
    },
    // The restore link is removed by its own press too: the focus goes to the first row that comes back.
    restored: (firstId: string) => {
      landing.current = { rowId: firstId };
    },
  };
}

export default function Demo(): React.JSX.Element {
  const [invoices, setInvoices] = useState<readonly Invoice[]>(INVOICES);
  const [files, setFiles] = useState<readonly (typeof FILES)[number][]>(FILES);
  const [last, setLast] = useState("Nothing yet. Open a menu, or right-click a row.");
  const done = (id: string, what: string) => setLast(`${VERBS[id] ?? id} ${what}`);
  const invoiceFocus = useFocusAfterDelete(invoices);
  const fileFocus = useFocusAfterDelete(files);
  return (
    <div className="grid w-full max-w-2xl gap-10">
      <Example caption="Each button is named for its row: 'Actions for Invoice 1042'. Right-click a row, or press Shift+F10 in it, to open the same menu at the pointer. Paid invoices cannot be reminded, and the item says why">
        <div ref={invoiceFocus.scope} className="@container overflow-hidden rounded-xl border border-border bg-card shadow-xs">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead scope="col">Invoice</TableHead>
                <TableHead scope="col" className="hidden sm:table-cell">
                  Customer
                </TableHead>
                <TableHead scope="col" className="text-right">
                  Amount
                </TableHead>
                <TableHead scope="col" className="hidden @sm:table-cell">
                  Status
                </TableHead>
                <TableHead scope="col" className="w-px">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice) => (
                <TableRow key={invoice.id} data-row={invoice.id}>
                  <TableCell className="font-medium whitespace-nowrap">{invoice.number}</TableCell>
                  <TableCell className="hidden text-muted-foreground sm:table-cell">{invoice.customer}</TableCell>
                  <TableCell className="text-right tabular-nums">{euro.format(invoice.amount)}</TableCell>
                  <TableCell className="hidden @sm:table-cell">
                    <StatusBadge status={invoice.status} />
                  </TableCell>
                  <TableCell className="py-1.5 pl-0 text-right">
                    <RowActionsMenu
                      label={invoice.number}
                      actions={invoiceActions(invoice)}
                      contextMenu
                      onAction={(id) => {
                        if (id === "delete") {
                          invoiceFocus.deleted(invoice.id);
                          setInvoices((rows) => rows.filter((row) => row.id !== invoice.id));
                        }
                        done(id, invoice.number);
                      }}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {invoices.length < INVOICES.length ? (
            <div className="border-t border-border px-4 py-2">
              <button
                type="button"
                data-restore
                onClick={() => {
                  invoiceFocus.restored(INVOICES[0]?.id ?? "");
                  setInvoices(INVOICES);
                }}
                className="rounded-sm text-xs text-muted-foreground underline underline-offset-4 outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40"
              >
                Restore the sample invoices
              </button>
            </div>
          ) : null}
        </div>
      </Example>

      <Example caption="The same component in a list: no table needed">
        <ul ref={fileFocus.scope} className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card shadow-xs">
          {files.map((file) => (
            <li key={file.id} data-row={file.id} className="flex items-center gap-3 px-4 py-2.5">
              <span aria-hidden="true" className="grid size-8 shrink-0 place-items-center rounded-lg border border-border bg-muted text-muted-foreground">
                <IconFile size={16} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{file.name}</p>
                <p className="text-xs text-muted-foreground">{file.size}</p>
              </div>
              <RowActionsMenu
                label={file.name}
                actions={fileActions}
                contextMenu
                onAction={(id) => {
                  if (id === "delete") {
                    fileFocus.deleted(file.id);
                    setFiles((rows) => rows.filter((row) => row.id !== file.id));
                  }
                  done(id, file.name);
                }}
              />
            </li>
          ))}
          {files.length === 0 ? (
            <li className="flex items-center justify-between gap-3 px-4 py-3 text-sm text-muted-foreground">
              No files left.
              <button
                type="button"
                data-restore
                onClick={() => {
                  fileFocus.restored(FILES[0].id);
                  setFiles(FILES);
                }}
                className="rounded-sm underline underline-offset-4 outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40"
              >
                Restore
              </button>
            </li>
          ) : null}
        </ul>
      </Example>

      <p role="status" className="text-xs text-muted-foreground">
        {last}
      </p>
    </div>
  );
}
