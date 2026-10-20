"use client";

import { useId, useMemo, useState } from "react";

import { IconCheck, IconClock, IconDownload, IconFileDownload, IconMail, IconSpinner } from "@rhs-ui/icons";
import { EmptyState } from "@rhs-ui/application/empty-state";
import { SegmentedControl } from "@rhs-ui/application/segmented-control";
import { Badge } from "@rhs-ui/primitives/badge";
import { Button } from "@rhs-ui/primitives/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@rhs-ui/primitives/card";
import { CheckboxGroup } from "@rhs-ui/primitives/checkbox-group";
import { cn } from "@/lib/utils";

export type DataExportFormat = "json" | "csv";
export type DataExportStatus = "preparing" | "ready" | "expired";

/** One kind of data someone can include in an export. */
export interface DataExportGroup {
  id: string;
  label: string;
  /** One line on what is inside. */
  description?: string;
}

/** An export that was requested earlier. */
export interface DataExportRecord {
  id: string;
  /** ISO 8601 date and time of the request. */
  requestedAt: string;
  status: DataExportStatus;
  /** Size of the file in bytes, once it exists. */
  size?: number;
  /** ISO 8601 date and time after which the file is deleted. */
  expiresAt?: string;
  /** Where the file can be fetched. A plain link, so it works with a right click too. */
  href?: string;
}

export interface DataExportSectionProps {
  /** The groups of data someone can include. */
  groups: readonly DataExportGroup[];
  /** Earlier exports, newest first. With none, the list becomes a short message. */
  exports: readonly DataExportRecord[];
  /** Called with the chosen group ids and the format. Resolve once the request is accepted; reject to show an error. */
  onRequest: (request: { groups: string[]; format: DataExportFormat }) => Promise<void> | void;
  /** The group ids ticked at first. Every group by default. */
  defaultGroups?: readonly string[];
  /** The format selected at first. */
  defaultFormat?: DataExportFormat;
  /** IANA time zone every date is shown in. Defaults to "UTC" so server and browser agree. */
  timeZone?: string;
  /** Language and region of dates and sizes. */
  locale?: string;
  /** The moment "Expires in 5 days" counts from. Defaults to the time of the first render. */
  now?: Date | string | number;
  /** The heading. */
  title?: string;
  /** The line under the heading. */
  description?: string;
  /** Heading level of the title; 2 for a page section, 3 inside another section. */
  headingLevel?: 2 | 3;
  /** Extra classes for the outermost element. */
  className?: string;
}

const FORMAT_HINT: Record<DataExportFormat, string> = {
  json: "Structured data, ready for other tools and developers.",
  csv: "One spreadsheet per group, opens in Excel or Numbers.",
};

const STATUS: Record<DataExportStatus, { label: string; variant: "muted" | "default" | "outline" }> = {
  preparing: { label: "Preparing", variant: "muted" },
  ready: { label: "Ready", variant: "default" },
  expired: { label: "Expired", variant: "outline" },
};

/** Bytes as "48.2 MB": decimal units, one decimal for small numbers. */
function formatSize(bytes: number, locale: string): string {
  const units = ["byte", "kilobyte", "megabyte", "gigabyte"] as const;
  let value = bytes;
  let step = 0;
  while (value >= 1000 && step < units.length - 1) {
    value /= 1000;
    step += 1;
  }
  return new Intl.NumberFormat(locale, { style: "unit", unit: units[step], unitDisplay: "short", maximumFractionDigits: step > 0 && value < 100 ? 1 : 0 }).format(value);
}

/**
 * The right of access without a support ticket: tick the kinds of data you
 * want, pick JSON or CSV and request a copy. Below it the earlier exports
 * with the date, the size, a status in words and, on a ready one, a real
 * download link and when it expires. While an export is being prepared the
 * button rests and the card says "We will email you when it is ready" rather
 * than spinning for ever.
 */
export function DataExportSection({ groups, exports: records, onRequest, defaultGroups, defaultFormat = "json", timeZone = "UTC", locale = "en-US", now, title = "Export your data", description = "Download a copy of what we hold about you. Large exports take a few minutes, so we email you a link when yours is ready.", headingLevel = 2, className }: DataExportSectionProps) {
  const Heading = headingLevel === 3 ? "h3" : "h2";
  const Sub = headingLevel === 3 ? "h4" : "h3";
  const id = useId();
  const [chosen, setChosen] = useState<string[]>(() => [...(defaultGroups ?? groups.map((group) => group.id))]);
  const [format, setFormat] = useState<DataExportFormat>(defaultFormat);
  const [busy, setBusy] = useState(false);
  const [requested, setRequested] = useState(false);
  const [failed, setFailed] = useState(false);
  const [mountedAt] = useState(() => Date.now());

  // A request the list does not show yet keeps the button at rest, until the list changes.
  const signature = records.map((record) => `${record.id}:${record.status}`).join("|");
  const [seen, setSeen] = useState(signature);
  if (seen !== signature) {
    setSeen(signature);
    setRequested(false);
  }

  const when = useMemo(() => new Intl.DateTimeFormat(locale, { timeZone, day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }), [locale, timeZone]);
  const day = useMemo(() => new Intl.DateTimeFormat(locale, { timeZone, day: "numeric", month: "short", year: "numeric" }), [locale, timeZone]);
  const relative = useMemo(() => new Intl.RelativeTimeFormat(locale, { numeric: "auto" }), [locale]);
  const reference = now === undefined ? mountedAt : new Date(now).getTime();

  const show = (formatter: Intl.DateTimeFormat, iso: string) => {
    const date = new Date(iso);
    return Number.isNaN(date.getTime()) ? iso : formatter.format(date);
  };
  const expires = (iso: string) => {
    const left = new Date(iso).getTime() - reference;
    if (Number.isNaN(left) || left <= 0) return null;
    const hours = left / 3_600_000;
    if (hours < 1) return "Expires within the hour";
    if (hours < 24) return `Expires ${relative.format(Math.floor(hours), "hour")}`;
    return `Expires ${relative.format(Math.floor(hours / 24), "day")}`;
  };

  const inProgress = busy || requested || records.some((record) => record.status === "preparing");
  const picked = groups.map((group) => group.id).filter((groupId) => chosen.includes(groupId));
  // aria-disabled, not disabled: a button that rests keeps the keyboard focus it has, instead of dropping it on the page.
  const blocked = !picked.length || inProgress;

  async function request() {
    if (blocked) return;
    setBusy(true);
    setFailed(false);
    try {
      await onRequest({ groups: picked, format });
      setRequested(true);
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section data-slot="data-export-section" aria-labelledby={`${id}-title`} className={cn("w-full", className)}>
      <Card className="gap-0 overflow-hidden py-0">
        <CardHeader className="px-6 pt-6 pb-6">
          <CardTitle asChild className="text-lg tracking-[-0.02em]">
            <Heading id={`${id}-title`}>{title}</Heading>
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-7 px-6 pb-6">
          <CheckboxGroup
            legend="What to include"
            selectAll
            options={groups.map((group) => ({ value: group.id, label: group.label, description: group.description }))}
            value={chosen}
            onValueChange={setChosen}
            className="grid-cols-1 gap-y-4 sm:grid-cols-2 sm:gap-x-8 sm:[&>label]:col-span-2"
          />
          <div className="grid gap-2.5">
            <p aria-hidden="true" className="text-sm font-medium">Format</p>
            <SegmentedControl label="Export format" value={format} onValueChange={(next) => setFormat(next as DataExportFormat)} options={[{ value: "json", label: "JSON" }, { value: "csv", label: "CSV" }]} className="justify-self-start" />
            <p className="text-sm text-muted-foreground">{FORMAT_HINT[format]}</p>
          </div>
        </CardContent>
        <div data-slot="data-export-footer" className="flex flex-col gap-3 border-t border-border bg-muted/40 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div aria-live="polite" className="min-w-0 text-sm">
            {failed ? (
              <p className="text-destructive">We could not start the export. Please try again in a moment.</p>
            ) : inProgress ? (
              <p className="flex items-center gap-2">
                <IconMail className="size-4 shrink-0" />
                We will email you when it is ready.
              </p>
            ) : picked.length ? (
              <p className="text-muted-foreground tabular-nums">
                {picked.length === groups.length ? `All ${groups.length} groups` : `${picked.length} of ${groups.length} groups`} as {format === "json" ? "JSON" : "CSV"}.
              </p>
            ) : (
              <p className="text-muted-foreground">Choose at least one group.</p>
            )}
          </div>
          <Button type="button" onClick={() => void request()} aria-disabled={blocked || undefined} aria-busy={busy || undefined} className="aria-disabled:pointer-events-none aria-disabled:opacity-50 sm:shrink-0">
            {busy ? <IconSpinner /> : inProgress ? <IconCheck /> : <IconFileDownload />}
            {busy ? "Requesting" : inProgress ? "Export requested" : "Request export"}
          </Button>
        </div>
      </Card>

      <div className="mt-10">
        <Sub id={`${id}-earlier`} className="text-sm font-medium">Earlier exports</Sub>
        <p className="mt-1 text-sm text-muted-foreground">A file stays available for a few days, then it is deleted.</p>
        {records.length ? (
          <ul aria-labelledby={`${id}-earlier`} className="mt-4 divide-y divide-border rounded-xl border border-border bg-card shadow-xs">
            {records.map((record) => {
              const expired = record.status === "expired" || (record.status === "ready" && record.expiresAt !== undefined && expires(record.expiresAt) === null);
              const status = expired ? "expired" : record.status;
              const look = STATUS[status];
              const date = show(when, record.requestedAt);
              const parts: string[] = [];
              if (status === "preparing") parts.push("We will email you when it is ready");
              else {
                if (record.size !== undefined) parts.push(formatSize(record.size, locale));
                if (status === "ready" && record.expiresAt) parts.push(expires(record.expiresAt) ?? "");
                if (status === "expired" && record.expiresAt) parts.push(`Expired ${show(day, record.expiresAt)}`);
              }
              return (
                <li key={record.id} className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-4 gap-y-3 px-4 py-4 sm:grid-cols-[auto_minmax(0,1fr)_6rem_8rem] sm:px-5">
                  <span aria-hidden="true" className={cn("grid size-9 place-items-center rounded-lg border border-border bg-muted text-muted-foreground", status === "ready" && "text-foreground")}>
                    {status === "ready" ? <IconFileDownload className="size-4" /> : <IconClock className="size-4" />}
                  </span>
                  <div className="min-w-0">
                    <p className={cn("truncate text-sm font-medium", status === "expired" && "text-muted-foreground")}>
                      Requested <time dateTime={record.requestedAt}>{date}</time>
                    </p>
                    <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground tabular-nums">
                      {parts.filter(Boolean).map((part, index) => (
                        <span key={part} suppressHydrationWarning className="inline-flex items-center gap-2">
                          {index > 0 ? (
                            <>
                              <span aria-hidden="true" className="size-[3px] rounded-full bg-current opacity-60" />
                              <span className="sr-only">, </span>
                            </>
                          ) : null}
                          {part}
                        </span>
                      ))}
                    </p>
                  </div>
                  <div className="col-start-2 flex items-center gap-2 sm:contents">
                    <Badge variant={look.variant} className="sm:justify-self-start">
                      {status === "ready" ? <IconCheck /> : status === "preparing" ? <span aria-hidden="true" className="size-1.5 rounded-full bg-current motion-safe:animate-pulse" /> : null}
                      {look.label}
                    </Badge>
                    {status === "ready" && record.href ? (
                      <Button asChild size="sm" variant="outline" className="sm:justify-self-end">
                        <a href={record.href} download>
                          <IconDownload />
                          Download<span className="sr-only"> the export requested {date}</span>
                        </a>
                      </Button>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <EmptyState
            className="mt-4 py-8"
            icon={<IconFileDownload className="size-5" />}
            title="No exports yet"
            description="When you request one, it shows up here with its status."
          />
        )}
      </div>
    </section>
  );
}
