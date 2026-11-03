import type { ReactNode } from "react";

import { IconCalendar, IconCheck, IconClock, IconMinus, IconTrendDown, IconTrendUp, IconWarning } from "@rhs-ui/icons";
import { Badge } from "@rhs-ui/primitives/badge";
import { cn } from "@/lib/utils";

export interface DashboardNavItem {
  /** The label in the sidebar: "Invoices". */
  label: string;
  /** A glyph from @rhs-ui/icons. A quiet dot stands in when there is none. */
  icon?: ReactNode;
}

export interface DashboardKpi {
  /** What is measured: "Monthly revenue". */
  label: string;
  /** The figure, as you want it written: "$48.2k". */
  value: string;
  /** How it moved, as you want it written: "+12.4%". */
  change: string;
  /** Which arrow goes with the change. Worked out from a leading minus sign when left out. */
  trend?: "up" | "down" | "flat";
}

export type DashboardTone = "success" | "pending" | "error" | "neutral";

export interface DashboardRow {
  /** The first column: a person, a company, an order. */
  name: string;
  /** A line under the name: an email, an invoice number. */
  detail?: string;
  /** The status as a word: "Paid". It is never left to colour alone. */
  status: string;
  /** How the status looks: a check, a clock, a warning or nothing. Neutral when left out. */
  tone?: DashboardTone;
  /** The figure at the end of the row: "$2,400.00". It is drawn when the picture is at least 36rem wide, and the crop cuts it off at the right, so lead with the part that matters. */
  amount?: string;
}

export interface DashboardWindow {
  /** The title in the window's bar: "Northwind / Billing". */
  title: string;
  /** The sidebar, as labels or as labels with an icon. It is left out below 640px, where there is no room for it. */
  nav: readonly (string | DashboardNavItem)[];
  /** Which sidebar label is the current one. The first when left out. */
  activeNav?: string;
  /** The heading over the figures. The active sidebar label when left out. */
  heading?: string;
  /** A date range drawn as a chip beside the heading: "Last 30 days". */
  range?: string;
  /** A button-shaped label at the end of the heading: "New invoice". */
  action?: string;
  /** Three figures in tiles. */
  kpis: readonly DashboardKpi[];
  /** The heading of the table: "Recent invoices". */
  rowsTitle?: string;
  /** The three column headings: the name, the status and the amount. */
  columns?: readonly [string, string, string];
  /** The rows of the table, a few more than fit: the window is cropped, so the table carries on out of sight. */
  rows: readonly DashboardRow[];
  /** What a screen reader hears in place of the drawing. Written from the window's own figures when left out. */
  summary?: string;
}

/* An error is destructive text and border on the plain surface: the tinted fill of the destructive badge falls short of 4.5:1 in the light theme. */
const TONES: Record<DashboardTone, { variant: "secondary" | "outline" | "muted"; className?: string; icon: ReactNode }> = {
  success: { variant: "secondary", icon: <IconCheck /> },
  pending: { variant: "outline", icon: <IconClock /> },
  error: { variant: "outline", className: "border-destructive/40 text-destructive", icon: <IconWarning /> },
  neutral: { variant: "muted", icon: null },
};

const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => Array.from(word)[0] ?? "")
    .join("")
    .toUpperCase();

function trendOf(kpi: DashboardKpi): "up" | "down" | "flat" {
  return kpi.trend ?? (/^\s*[-−–]/.test(kpi.change) ? "down" : "up");
}

/** One sentence for a screen reader, made from the figures the drawing shows. */
export function summaryOf(view: DashboardWindow): string {
  if (view.summary) return view.summary;
  const figures = view.kpis.map((kpi) => `${kpi.label} ${kpi.value}, ${kpi.change}`).join("; ");
  return `A preview of ${view.title}: ${figures}. Under them, a table of ${view.rows.length} ${(view.rowsTitle ?? "rows").toLowerCase()}, each with a status.`;
}

/**
 * The window of the hero: a bar with three quiet dots and a title, an optional
 * sidebar, a heading, three figures and a table whose rows each end in a status
 * word. It is drawn from data, in the page's own tokens, and it is a picture:
 * the caller hides it from assistive technology and makes it inert.
 */
export function ProductWindow({ view }: { view: DashboardWindow }) {
  const nav = view.nav.map((item) => (typeof item === "string" ? { label: item } : item));
  const current = view.activeNav ?? nav[0]?.label;
  const [nameHead, statusHead, amountHead] = view.columns ?? ["Name", "Status", "Amount"];
  return (
    <div className="flex h-full flex-col text-[0.8125rem] leading-snug text-card-foreground">
      <div className="grid h-10 shrink-0 grid-cols-[4rem_minmax(0,1fr)_4rem] items-center border-b border-border px-4">
        <span className="flex gap-1.5">
          {[0, 1, 2].map((dot) => (
            <span key={dot} className="size-2.5 rounded-full bg-foreground/15" />
          ))}
        </span>
        <span className="truncate text-center text-xs text-muted-foreground">{view.title}</span>
      </div>

      <div className="flex min-h-0 flex-1">
        <div className="hidden w-44 shrink-0 flex-col gap-0.5 border-r border-border bg-muted/40 p-3 sm:flex">
          {nav.map((item) => (
            <span
              key={item.label}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-2.5 py-1.5",
                item.label === current ? "bg-background font-medium text-foreground shadow-xs ring-1 ring-border" : "text-muted-foreground",
              )}
            >
              {item.icon ? (
                <span className="grid size-4 shrink-0 place-items-center [&_svg]:size-4">{item.icon}</span>
              ) : (
                // A dot, not a box: an outlined square in a column reads as a checkbox, and a list of them as a to-do list.
                <span className="grid size-4 shrink-0 place-items-center">
                  <span className="size-1.5 rounded-full bg-current opacity-40" />
                </span>
              )}
              {item.label}
            </span>
          ))}
        </div>

        <div className="min-w-0 flex-1 p-4 sm:p-5">
          <div className="flex items-center gap-2.5">
            <p className="mr-1.5 text-base font-medium tracking-[-0.02em] text-foreground">{view.heading ?? current}</p>
            {view.range ? (
              <span className="hidden items-center gap-1.5 rounded-md border border-border bg-background px-2 py-1 text-xs text-muted-foreground sm:flex">
                <IconCalendar className="size-3.5" />
                {view.range}
              </span>
            ) : null}
            {view.action ? <span className="rounded-md bg-primary px-2.5 py-1 text-xs font-medium whitespace-nowrap text-primary-foreground">{view.action}</span> : null}
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2.5 sm:gap-3">
            {view.kpis.slice(0, 3).map((kpi) => {
              const trend = trendOf(kpi);
              const Arrow = trend === "down" ? IconTrendDown : trend === "flat" ? IconMinus : IconTrendUp;
              return (
                <div key={kpi.label} className="min-w-0 rounded-lg border border-border bg-background p-3">
                  <p className="truncate text-xs text-muted-foreground">{kpi.label}</p>
                  <p className="mt-1.5 text-lg font-medium tracking-[-0.03em] text-foreground tabular-nums sm:text-xl">{kpi.value}</p>
                  <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground tabular-nums">
                    <Arrow className="size-3 shrink-0" />
                    {kpi.change}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="mt-5">
            {view.rowsTitle ? <p className="mb-2 font-medium text-foreground">{view.rowsTitle}</p> : null}
            <div className="grid grid-cols-[minmax(0,1fr)_7.5rem] gap-3 pb-2 text-xs text-muted-foreground @xl:grid-cols-[minmax(0,1fr)_6.75rem_5.5rem]">
              <span>{nameHead}</span>
              <span>{statusHead}</span>
              <span className="hidden text-right @xl:block">{amountHead}</span>
            </div>
            {view.rows.map((row) => {
              const tone = TONES[row.tone ?? "neutral"];
              return (
                <div key={`${row.name}-${row.detail ?? ""}`} className="grid grid-cols-[minmax(0,1fr)_7.5rem] items-center gap-3 border-t border-border py-2.5 @xl:grid-cols-[minmax(0,1fr)_6.75rem_5.5rem]">
                  <span className="flex min-w-0 items-center gap-2.5">
                    <span className="grid size-7 shrink-0 place-items-center rounded-full bg-muted text-[0.6875rem] font-medium text-muted-foreground">{initialsOf(row.name)}</span>
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-foreground">{row.name}</span>
                      {row.detail ? <span className="block truncate text-xs text-muted-foreground">{row.detail}</span> : null}
                    </span>
                  </span>
                  <span>
                    <Badge variant={tone.variant} className={tone.className}>
                      {tone.icon}
                      {row.status}
                    </Badge>
                  </span>
                  <span className="hidden text-right text-foreground tabular-nums @xl:block">{row.amount}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
