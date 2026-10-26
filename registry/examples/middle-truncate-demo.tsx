"use client";

import { useState, type ReactNode } from "react";

import { IconFileCode, IconFileImage, IconFileSheet, IconFileText, IconPackage } from "@rhs-ui/icons";
import { MiddleTruncate } from "@rhs-ui/primitives/middle-truncate";
import { Slider } from "@rhs-ui/primitives/slider";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@rhs-ui/primitives/table";

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

const SAMPLES = [
  { kind: "File", text: "quarterly-report-final-2026.pdf", tail: undefined },
  { kind: "SHA-256", text: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855", tail: 8 },
  { kind: "URL", text: "https://northwind.example/docs/getting-started/installation-guide", tail: 18 },
  { kind: "Path", text: "~/Projects/halcyon/apps/web/src/components/billing/invoice-table.tsx", tail: 17 },
] as const;

const FILES = [
  { name: "quarterly-report-final-2026.pdf", size: "4.2 MB", modified: "14 Oct", icon: IconFileText },
  { name: "Northwind_brand-guidelines_v3_approved-by-legal.pdf", size: "12.8 MB", modified: "9 Oct", icon: IconFileText },
  { name: "IMG_20261012_184233_HDR-panorama-harbour.jpg", size: "6.1 MB", modified: "12 Oct", icon: IconFileImage },
  { name: "kestrel-analytics-export-2026-10-01-to-2026-10-31.csv", size: "318 KB", modified: "1 Nov", icon: IconFileSheet },
  { name: "backup-halcyon-prod-2026-10-18.tar.gz", size: "1.4 GB", modified: "18 Oct", icon: IconPackage },
  { name: "README.md", size: "2 KB", modified: "3 Sep", icon: IconFileCode },
] as const;

const ATTACHMENTS = [
  { name: "Signed-service-agreement-Kestrel-Analytics-2026.pdf", size: "1.1 MB", icon: IconFileText },
  { name: "site-visit-photos_north-elevation_20261016.jpg", size: "3.4 MB", icon: IconFileImage },
  { name: "budget-v7.xlsx", size: "86 KB", icon: IconFileSheet },
] as const;

export default function Demo(): React.JSX.Element {
  const [width, setWidth] = useState(300);
  return (
    <div className="grid w-full max-w-2xl gap-10">
      <Example caption="Narrow the box: the beginning gives way, the ending never does">
        {/* One column that may shrink: with an automatic column the 300px box sets its minimum and a phone scrolls sideways. */}
        <div className="grid grid-cols-[minmax(0,1fr)] gap-4 rounded-xl border border-border bg-card p-4 shadow-xs">
          <div className="grid gap-2">
            <div className="flex items-baseline justify-between gap-4 text-xs text-muted-foreground">
              <span aria-hidden="true">Width of the box</span>
              <span className="tabular-nums" aria-live="off">
                {width} px
              </span>
            </div>
            <Slider min={150} max={560} step={2} value={[width]} onValueChange={(next) => setWidth(next[0] ?? 300)} thumbLabels={["Width of the box"]} />
          </div>
          <div className="overflow-hidden rounded-lg border border-dashed border-border bg-background p-3" style={{ width, maxWidth: "100%" }}>
            <dl className="grid gap-2.5 text-sm">
              {SAMPLES.map((sample) => (
                <div key={sample.kind} className="grid grid-cols-[3.75rem_minmax(0,1fr)] items-baseline gap-x-3">
                  <dt className="text-xs text-muted-foreground">{sample.kind}</dt>
                  <dd className="min-w-0">
                    <MiddleTruncate text={sample.text} tail={sample.tail} className={sample.kind === "SHA-256" || sample.kind === "Path" ? "font-mono text-[0.8125rem]" : undefined} />
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </Example>

      <Example caption="In a table with a fixed layout: names keep their extension, short ones show whole">
        <div className="max-w-lg overflow-hidden rounded-xl border border-border bg-card shadow-xs">
          <Table className="table-fixed">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[60%] sm:w-[56%]">Name</TableHead>
                <TableHead className="text-right">Size</TableHead>
                <TableHead className="hidden w-[22%] text-right sm:table-cell">Modified</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {FILES.map((file) => (
                <TableRow key={file.name}>
                  <TableCell>
                    <span className="flex min-w-0 items-center gap-2.5">
                      <file.icon aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
                      <MiddleTruncate text={file.name} className="font-medium" />
                    </span>
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap text-muted-foreground tabular-nums">{file.size}</TableCell>
                  <TableCell className="hidden text-right whitespace-nowrap text-muted-foreground tabular-nums sm:table-cell">{file.modified}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Example>

      <Example caption="In a flex row: give the text min-w-0 and it shares the row with whatever sits beside it">
        <ul className="w-full max-w-sm divide-y divide-border rounded-xl border border-border bg-card shadow-xs">
          {ATTACHMENTS.map((file) => (
            <li key={file.name} className="flex items-center gap-3 px-4 py-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
                <file.icon aria-hidden="true" className="size-4" />
              </span>
              <span className="grid min-w-0 flex-1 gap-0.5">
                <MiddleTruncate text={file.name} className="text-sm font-medium" />
                <span className="text-xs text-muted-foreground tabular-nums">{file.size}</span>
              </span>
            </li>
          ))}
        </ul>
      </Example>
    </div>
  );
}
