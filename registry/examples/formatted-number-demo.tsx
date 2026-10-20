"use client";

import { useState, type ReactNode } from "react";

import { SegmentedControl } from "@rhs-ui/application/segmented-control";
import { FormattedNumber, type FormattedNumberKind, type FormattedNumberProps } from "@rhs-ui/primitives/formatted-number";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@rhs-ui/primitives/table";

// How each metric is written. FormattedNumberKind keeps a currency with its code and a unit with its unit, so a metric cannot lose them.
type Shape = Pick<FormattedNumberProps, "notation" | "maximumFractionDigits"> & FormattedNumberKind;

const METRICS: readonly { label: string; shape: Shape; now: number | null; before: number }[] = [
  { label: "Visitors", shape: { notation: "compact", maximumFractionDigits: 1 }, now: 1284300, before: 1142900 },
  { label: "Revenue", shape: { format: "currency", currency: "EUR", notation: "compact", maximumFractionDigits: 1 }, now: 2418000, before: 2105000 },
  { label: "Conversion", shape: { format: "percent", maximumFractionDigits: 1 }, now: 0.0432, before: 0.0411 },
  { label: "Median latency", shape: { format: "unit", unit: "millisecond" }, now: 182, before: 204 },
  { label: "Storage used", shape: { format: "unit", unit: "gigabyte" }, now: 842, before: 790 },
  { label: "Refund rate", shape: { format: "percent", maximumFractionDigits: 1 }, now: null, before: 0.004 },
];

const LOCALES = [
  { value: "en-US", label: "English" },
  { value: "de-DE", label: "Deutsch" },
  { value: "ja-JP", label: "日本語" },
] as const;

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start justify-items-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  const [locale, setLocale] = useState<string>("en-US");
  return (
    <div className="grid w-full max-w-3xl gap-9">
      <Example caption="One component, any locale. Hover or tap a dotted figure to see the full number.">
        <SegmentedControl className="w-full max-sm:[&>button]:flex-1 max-sm:[&>button]:px-2 sm:w-fit" label="Locale" value={locale} onValueChange={setLocale} options={LOCALES} />
        <div className="w-full rounded-xl border border-border bg-card shadow-xs">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="px-2 sm:px-3">Metric</TableHead>
                <TableHead className="px-2 text-right sm:px-3">This month</TableHead>
                <TableHead className="hidden text-right sm:table-cell">Last month</TableHead>
                <TableHead className="px-2 text-right sm:px-3">Change</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {METRICS.map((metric) => {
                const change = metric.now === null ? null : (metric.now - metric.before) / metric.before;
                return (
                  <TableRow key={metric.label}>
                    <TableCell className="px-2 font-medium sm:px-3">{metric.label}</TableCell>
                    <TableCell className="px-2 text-right sm:px-3">
                      <FormattedNumber value={metric.now} locale={locale} {...metric.shape} />
                    </TableCell>
                    <TableCell className="hidden text-right text-muted-foreground sm:table-cell">
                      <FormattedNumber value={metric.before} locale={locale} {...metric.shape} />
                    </TableCell>
                    <TableCell className="px-2 text-right sm:px-3">
                      <FormattedNumber value={change} format="percent" maximumFractionDigits={1} signDisplay="exceptZero" locale={locale} />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </Example>

      <Example caption="In running text it keeps the sentence's font. Tap the dotted figure, or Tab to it, for the full number">
        <p className="max-w-prose text-[0.9375rem] leading-7">
          The October launch reached <FormattedNumber value={1284300} notation="compact" maximumFractionDigits={1} locale={locale} focusable /> people, converted{" "}
          <FormattedNumber value={0.0432} format="percent" maximumFractionDigits={1} locale={locale} /> of them and moved{" "}
          <FormattedNumber value={842} format="unit" unit="gigabyte" locale={locale} /> of files through the new pipeline.
        </p>
      </Example>

      <Example caption="Negative numbers get a true minus; a missing number shows a placeholder you choose">
        <div className="flex flex-wrap items-baseline gap-x-8 gap-y-2 text-lg tracking-[-0.02em]">
          <FormattedNumber value={-1240} locale={locale} />
          <FormattedNumber value={-0.054} format="percent" maximumFractionDigits={1} locale={locale} />
          <FormattedNumber value={0.035} format="percent" maximumFractionDigits={1} signDisplay="always" locale={locale} />
          <FormattedNumber value={null} locale={locale} />
          <FormattedNumber value={Number.NaN} placeholder="n/a" locale={locale} />
        </div>
      </Example>
    </div>
  );
}
