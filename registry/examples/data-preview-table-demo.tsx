"use client";

import { useState, type ReactNode } from "react";

import { DataPreviewTable, type PreviewColumn, type PreviewRow } from "@rhs-ui/dashboard/data-preview-table";

const customerColumns: PreviewColumn[] = [
  { name: "id", type: "text" },
  { name: "name", type: "text" },
  { name: "seats", type: "number" },
  { name: "trial_ends", type: "date" },
  { name: "active", type: "boolean" },
  { name: "settings", type: "json" },
  { name: "notes", type: "text" },
];

// A missing value is null, a blank one is an empty string: the table shows the difference.
const customers: PreviewRow[] = [
  ["C-20481", "Sofia Alvarez", 25, "2026-11-04", true, { theme: "dark", locale: "es-ES" }, "Renewal call booked for the first week of November. Asked about SSO and an annual invoice."],
  ["C-20480", "Mo Haddad", 8, null, true, { theme: "light" }, null],
  ["C-20479", "Priya Nair", 40, "2026-10-28", true, { theme: "system", locale: "en-GB", beta: ["ledger", "webhooks"] }, ""],
  ["C-20478", "Tom Jansen", 3, "2026-10-22", false, null, "Trial expired. Reached out twice, no reply yet."],
  ["C-20477", "Hana Okafor", 12, null, true, {}, null],
  ["C-20476", "Joost de Boer", 60, "2026-12-01", true, { theme: "dark" }, "Moved from the legacy plan. Needs the audit log export switched on before the board meeting on the fifteenth."],
  ["C-20475", "Anna de Vries", 2, "2026-10-25", true, { theme: "light", locale: "nl-NL" }, ""],
  ["C-20474", "Lena Fischer", 15, null, false, null, "Churned after the October invoice."],
  ["C-20473", "Ibrahim Said", 132, "2026-11-19", true, { theme: "dark" }, null],
  ["C-20472", "Mei Tanaka", 5, "2026-10-30", true, { theme: "system" }, "Interested in the yearly discount."],
];

const importColumns: PreviewColumn[] = [
  { name: "Order ID", type: "text" },
  { name: "Placed", type: "date" },
  { name: "Customer", type: "text" },
  { name: "Country", type: "text" },
  { name: "Items", type: "number" },
  { name: "Total", type: "number" },
  { name: "Paid", type: "boolean" },
];

// A CSV hands over every value as text: the totals arrive as "184.50", and the table shows them just like that.
const importRows: PreviewRow[] = [
  ["NW-10482", "2026-10-18T09:42:00Z", "Mara Visser", "NL", 3, "184.50", true],
  ["NW-10483", "2026-10-18T11:07:00Z", "Tom Jansen", "NL", 1, "49.00", true],
  ["NW-10484", "2026-10-19T08:15:00Z", "Priya Nair", "GB", 5, "612.75", false],
  ["NW-10485", "2026-10-19T14:30:00Z", "", "DE", 2, "96.20", true],
  ["NW-10486", "2026-10-20T07:58:00Z", "Joost de Boer", null, 4, "233.00", true],
  ["NW-10487", "2026-10-20T10:21:00Z", "Sofia Alvarez", "ES", null, "1280.40", false],
];

function Example({ title, description, children }: { title: string; description: ReactNode; children: ReactNode }): React.JSX.Element {
  return (
    <section className="min-w-0">
      <h3 className="text-base font-medium tracking-[-0.02em]">{title}</h3>
      <p className="mt-1 mb-5 max-w-3xl text-sm text-muted-foreground">{description}</p>
      {children}
    </section>
  );
}

export default function Demo(): React.JSX.Element {
  const [mapped, setMapped] = useState<PreviewColumn | null>(null);

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-14 px-4 py-10 sm:px-6">
      <Example
        title="Query results"
        description={
          <>
            {/* Two lines, so the statement fits a phone without wrapping mid-statement and without a box that scrolls. */}
            <code className="relative block w-fit max-w-full overflow-x-auto rounded-sm bg-muted px-2 py-1 font-mono text-xs leading-5 whitespace-pre text-foreground">{"SELECT * FROM customers\nORDER BY id DESC LIMIT 10"}</code>
            <span className="mt-2 block">A cut-off cell shows its whole value on hover, on focus and on a tap. Arrow keys move between cells; Ctrl+C copies one.</span>
          </>
        }
      >
        <DataPreviewTable caption="Query results: customers" columns={customerColumns} rows={customers} total={12430} truncateAt={30} locale="en-GB" />
      </Example>

      <Example title="Import preview" description="The first rows of an uploaded file, with the type each column was read as and every value as the file has it. Press a header to choose it.">
        <div className="grid gap-3">
          <p role="status" className="min-h-5 text-sm text-muted-foreground">
            {mapped ? (
              <>
                Mapping <span className="font-medium text-foreground">{mapped.name}</span> as a {mapped.type} column.
              </>
            ) : (
              "No column chosen yet."
            )}
          </p>
          <DataPreviewTable caption="Orders import preview" columns={importColumns} rows={importRows} total={2480} locale="en-GB" onColumnClick={(column) => setMapped(column)} />
        </div>
      </Example>
    </div>
  );
}
