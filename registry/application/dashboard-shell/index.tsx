import type { ComponentProps, CSSProperties, ReactNode } from "react";

import { UpdatedAt } from "@rhs-ui/application/dashboard-shell/updated-at";
import { PageHeader } from "@rhs-ui/primitives/page-header";
import { Skeleton } from "@rhs-ui/primitives/skeleton";
import { cn } from "@/lib/utils";

export type DashboardArea = "kpis" | "main" | "side" | "table";

export interface DashboardShellProps extends Omit<ComponentProps<"div">, "title"> {
  /** The dashboard's title. */
  title: string;
  /** The title's element: "h1" (the default) because this is the page, "h2" inside a preview. */
  titleAs?: "h1" | "h2";
  /** One line under the title: what this dashboard answers. */
  description?: string;
  /** Buttons at the right of the title: Export, Refresh. */
  actions?: ReactNode;
  /** The controls of the bar under the title: a period picker, quick filters. The bar sticks to the top from md up; on a phone it scrolls away with the page. */
  filters?: ReactNode;
  /** The key figures, in a strip across the top. Lay the cards out yourself, for example with AutoGrid. */
  kpis?: ReactNode;
  /** The main area: three quarters of the width from lg. */
  main?: ReactNode;
  /** The side column: a quarter of the width from lg, and after the main area on a narrower screen. */
  side?: ReactNode;
  /** A full-width zone under the rest, for a table. */
  table?: ReactNode;
  /** When the data was last refreshed, written as "Updated 2 minutes ago" in the filter bar. */
  updatedAt?: Date | string | number;
  /** The words before the time. Default "Updated". */
  updatedLabel?: string;
  /** For the wording of the time. Default "en-US". */
  locale?: string;
  /** The time zone of the full date in the tooltip. Default "UTC". */
  timeZone?: string;
  /** Shows a skeleton in every area you filled, and marks the page busy. */
  loading?: boolean;
  /** The name of each area for screen readers, who can jump between them. Defaults: Key figures, Overview, Highlights, Details. */
  labels?: Partial<Record<DashboardArea, string>>;
}

const LABELS: Record<DashboardArea, string> = { kpis: "Key figures", main: "Overview", side: "Highlights", table: "Details" };

/** The class that puts an area in its cell, written out whole so Tailwind generates it. */
const CELL: Record<DashboardArea, string> = {
  kpis: "lg:[grid-area:kpis]",
  main: "lg:[grid-area:main]",
  side: "lg:[grid-area:side]",
  table: "lg:[grid-area:table]",
};

const SKELETON: Record<DashboardArea, ReactNode> = {
  kpis: (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {[0, 1, 2, 3].map((index) => (
        <Skeleton key={index} delay={index * 120} className="h-28 rounded-xl" />
      ))}
    </div>
  ),
  main: <Skeleton className="h-80 rounded-xl" />,
  side: <Skeleton delay={200} className="h-80 rounded-xl" />,
  table: <Skeleton delay={320} className="h-72 rounded-xl" />,
};

/** The grid-template-areas for the areas that exist: an empty one leaves no hole, its neighbour takes the width. */
function templateFor(present: Record<DashboardArea, boolean>): string {
  const rows: string[] = [];
  if (present.kpis) rows.push('"kpis kpis kpis kpis"');
  if (present.main && present.side) rows.push('"main main main side"');
  else if (present.main) rows.push('"main main main main"');
  else if (present.side) rows.push('"side side side side"');
  if (present.table) rows.push('"table table table table"');
  return rows.join(" ");
}

/**
 * A dashboard frame with named areas: a page header, a filter bar (sticky
 * from md up) with the "Updated 2 minutes ago" line, a strip of key figures, a main
 * area with a side column, and a full-width table zone. From lg the areas
 * sit in four columns; below it they follow each other in reading order. An
 * area you leave out collapses without a hole, every area is a labelled
 * region screen reader users can jump to, and the rhythm (24px gaps, one
 * radius, one border) is the shell's, so mixed content reads as one page.
 * It draws no charts: put yours in the slots. It renders on the server.
 */
export function DashboardShell({
  title,
  titleAs,
  description,
  actions,
  filters,
  kpis,
  main,
  side,
  table,
  updatedAt,
  updatedLabel,
  locale,
  timeZone,
  loading = false,
  labels,
  className,
  style,
  ...props
}: DashboardShellProps) {
  const slots: Record<DashboardArea, ReactNode> = { kpis, main, side, table };
  const present = { kpis: Boolean(kpis), main: Boolean(main), side: Boolean(side), table: Boolean(table) };
  const name = { ...LABELS, ...labels };
  const order: DashboardArea[] = ["kpis", "main", "side", "table"];

  return (
    <div
      data-slot="dashboard-shell"
      aria-busy={loading || undefined}
      style={{ ...style, "--areas": templateFor(present) } as CSSProperties}
      className={cn("relative mx-auto w-full max-w-[88rem] px-4 pb-10 sm:px-6", className)}
      {...props}
    >
      <PageHeader title={title} titleAs={titleAs} description={description} actions={actions} className="border-b-0 pt-8 sm:pt-10" />
      {filters || updatedAt ? (
        // Pinned only from md: on a phone the bar is two rows of controls, too much of the screen to keep.
        <div data-slot="dashboard-shell-filters" className="z-30 -mx-4 border-b border-border bg-background px-4 sm:-mx-6 sm:px-6 md:sticky md:top-[var(--sticky-top,0px)]">
          <div className="flex min-h-14 flex-wrap items-center gap-x-4 gap-y-2 py-2.5">
            <div role="group" aria-label="Filters" className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
              {filters}
            </div>
            {/* Below sm the line has a row of its own under the controls, left aligned, instead of floating between them. */}
            {updatedAt ? <UpdatedAt value={updatedAt} prefix={updatedLabel} locale={locale} timeZone={timeZone} className="max-sm:order-last max-sm:basis-full" /> : null}
          </div>
        </div>
      ) : null}
      <div className="grid grid-cols-1 gap-6 pt-6 lg:grid-cols-4 lg:[grid-template-areas:var(--areas)]">
        {order.map((area) =>
          present[area] ? (
            <section key={area} aria-label={name[area]} aria-busy={loading || undefined} data-area={area} className={cn("flex min-w-0 flex-col gap-6 [&>:only-child]:flex-auto", CELL[area])}>
              {loading ? SKELETON[area] : slots[area]}
            </section>
          ) : null,
        )}
      </div>
    </div>
  );
}
