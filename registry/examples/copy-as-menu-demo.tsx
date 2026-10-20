"use client";

import { useState, type ReactNode } from "react";

import { CopyAsMenu, type CopyFormat } from "@rhs-ui/application/copy-as-menu";

const RESPONSE = {
  id: "inv_2041",
  customer: "Northwind Studio",
  status: "paid",
  amount: 486000,
  currency: "eur",
  issued: "2026-10-14",
};

const JSON_TEXT = JSON.stringify(RESPONSE, null, 2);

const API_FORMATS: CopyFormat[] = [
  { id: "json", label: "JSON", description: "The response body, formatted", serialize: () => JSON_TEXT },
  {
    id: "curl",
    label: "cURL",
    description: "The request, ready for a terminal",
    serialize: () => `curl https://api.halcyon.dev/v1/invoices/inv_2041 \\\n  -H "Authorization: Bearer $HALCYON_KEY"`,
  },
  { id: "markdown", label: "Markdown", description: "A fenced code block for a README or an issue", serialize: () => `\`\`\`json\n${JSON_TEXT}\n\`\`\`` },
  {
    id: "text",
    label: "Plain text",
    as: "plain text",
    description: "One line per field, for a chat message",
    serialize: () => Object.entries(RESPONSE).map(([key, value]) => `${key}: ${value}`).join("\n"),
  },
];

const ROWS = [
  { number: "INV-2041", customer: "Northwind Studio", amount: "4,860.00", status: "Paid" },
  { number: "INV-2042", customer: "Halcyon Labs", amount: "1,250.00", status: "Paid" },
  { number: "INV-2043", customer: "Kestrel Coffee", amount: "389.50", status: "Due" },
  { number: "INV-2044", customer: "Polder & Co", amount: "7,120.00", status: "Overdue" },
  { number: "INV-2045", customer: "Meridian Bikes", amount: "642.00", status: "Due" },
];

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start justify-items-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  const [format, setFormat] = useState("csv");
  const [built, setBuilt] = useState<Record<string, number>>({});
  const [last, setLast] = useState("Nothing copied yet.");
  // Counts the runs, to show that a format is only made when somebody picks it.
  const made = (id: string) => setBuilt((current) => ({ ...current, [id]: (current[id] ?? 0) + 1 }));

  const TABLE_FORMATS: CopyFormat[] = [
    {
      id: "csv",
      label: "CSV",
      description: "Comma separated, opens in a spreadsheet",
      serialize: async () => {
        // A big table would take a moment to turn into CSV.
        await wait(450);
        made("csv");
        return ["Number,Customer,Amount,Status", ...ROWS.map((row) => `${row.number},"${row.customer}",${row.amount.replace(",", "")},${row.status}`)].join("\n");
      },
    },
    {
      id: "markdown",
      label: "Markdown table",
      as: "a Markdown table",
      description: "Pipes and dashes, ready for a README",
      serialize: () => {
        made("markdown");
        return ["| Number | Customer | Amount | Status |", "| --- | --- | ---: | --- |", ...ROWS.map((row) => `| ${row.number} | ${row.customer} | ${row.amount} | ${row.status} |`)].join("\n");
      },
    },
    {
      id: "json",
      label: "JSON",
      description: "An array of objects, one per row",
      serialize: () => {
        made("json");
        return JSON.stringify(ROWS, null, 2);
      },
    },
    {
      id: "tsv",
      label: "Tab separated",
      as: "tab separated text",
      description: "Pastes cell by cell into a sheet",
      serialize: () => {
        made("tsv");
        return ROWS.map((row) => [row.number, row.customer, row.amount, row.status].join("\t")).join("\n");
      },
    },
  ];

  return (
    <div className="grid w-full max-w-2xl gap-9">
      <Example caption="An API response: the same call as JSON, cURL, Markdown or text">
        <div className="w-full overflow-hidden rounded-xl border border-border bg-card shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 border-b border-border px-4 py-3">
            <p className="flex min-w-0 items-center gap-2.5 text-sm">
              <span className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-xs font-medium">GET</span>
              <code className="truncate font-mono text-[0.8125rem] text-muted-foreground">/v1/invoices/inv_2041</code>
            </p>
            <CopyAsMenu formats={API_FORMATS} size="sm" onCopy={(item) => setLast(`Copied the response as ${item.label}.`)} />
          </div>
          <pre
            tabIndex={0}
            role="region"
            aria-label="API response"
            className="relative overflow-x-auto px-4 py-4 font-mono text-[0.8125rem] leading-relaxed text-foreground outline-none focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-ring/40"
          >
            {JSON_TEXT}
          </pre>
        </div>
      </Example>

      <Example caption="A table: formats are made only when picked, and the last choice is remembered">
        <div className="w-full overflow-hidden rounded-xl border border-border bg-card shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 border-b border-border px-4 py-3">
            <p className="text-sm font-medium">October invoices</p>
            <CopyAsMenu formats={TABLE_FORMATS} format={format} onFormatChange={setFormat} onCopy={(item) => setLast(`Copied the table as ${item.label}.`)} />
          </div>
          <div
            tabIndex={0}
            role="region"
            aria-label="October invoices"
            className="relative overflow-x-auto outline-none focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-ring/40"
          >
            <table className="w-full min-w-[30rem] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground">
                  <th className="px-4 py-2.5 font-medium">Number</th>
                  <th className="px-4 py-2.5 font-medium">Customer</th>
                  <th className="px-4 py-2.5 text-right font-medium">Amount (EUR)</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {ROWS.map((row) => (
                  <tr key={row.number}>
                    <td className="px-4 py-2.5 font-mono text-[0.8125rem]">{row.number}</td>
                    <td className="px-4 py-2.5">{row.customer}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{row.amount}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{row.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="border-t border-border bg-muted/40 px-4 py-2.5 text-xs text-muted-foreground tabular-nums">
            Made so far: {TABLE_FORMATS.map((item) => `${item.label} ${built[item.id] ?? 0}`).join(", ")}. Current format: {TABLE_FORMATS.find((item) => item.id === format)?.label}.
          </p>
        </div>
      </Example>

      <p role="status" className="text-xs text-muted-foreground">
        {last}
      </p>
    </div>
  );
}
