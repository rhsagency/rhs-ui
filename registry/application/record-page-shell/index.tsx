import { Fragment, useId, type ComponentProps, type ElementType, type ReactNode } from "react";

import { IconArrowLeft } from "@rhs-ui/icons";
import { ScrollTabs, type ScrollTab } from "@rhs-ui/primitives/scroll-tabs";
import { cn } from "@/lib/utils";

export type RecordTab = ScrollTab;

export interface RecordPageShellLabels {
  /** The back link's text when you give no `backLabel`. Default "Back". */
  back?: string;
  /** Said before `backLabel` to screen readers: "Back to Orders". Default "Back to". */
  backTo?: string;
  /** The tab row's name for screen readers. Default "Sections of this record". */
  tabs?: string;
}

/** Tabs come as a set: the row, the one that is current, and what happens when another is pressed. */
type RecordTabsProps =
  | { tabs?: undefined; activeTab?: undefined; onTabChange?: undefined }
  | {
      /** The tabs under the header, in the ScrollTabs shape: `{ id, label, count? }`. They scroll sideways with faded edges when they do not fit. */
      tabs: readonly RecordTab[];
      /** The `id` of the current tab. Show its content in `main`. */
      activeTab: string;
      /** A tab was pressed. Switch `activeTab` and the content of `main` in response. */
      onTabChange: (id: string) => void;
    };

export type RecordPageShellProps = Omit<ComponentProps<"div">, "title" | "children"> &
  RecordTabsProps & {
    /** Where the list this record belongs to lives. A real link: it works without script and with middle click. */
    backHref: string;
    /** The list's name: "Orders". Written as the link, and read as "Back to Orders". Leave it out for a plain "Back". */
    backLabel?: string;
    /** Renders the back link. Defaults to "a"; pass your router's Link. */
    linkAs?: ElementType;
    /** The record's name: an order number, a contact, a ticket subject. It is the page's h1. */
    title: string;
    /** The title's element: "h1" (the default) because this is the page, "h2" inside a preview. */
    titleAs?: "h1" | "h2";
    /** Next to the title: StatusBadge or Badge, one or two. */
    status?: ReactNode;
    /** The line under the title: when it was made, by whom, how big. Give one node, or a list of them to have them set off with dots. */
    meta?: ReactNode | readonly ReactNode[];
    /** Buttons at the right of the title. They wrap under it on a narrow screen. */
    actions?: ReactNode;
    /** The main column: what the current tab shows. */
    main: ReactNode;
    /** The Details rail, usually a DescriptionList with layout="stacked". From lg it sits at the right, 20rem wide and sticky; below lg it follows the main column. */
    rail?: ReactNode;
    /** The rail's heading and its landmark name. Default "Details". */
    railTitle?: string;
    /** The words the shell uses, for translation. */
    labels?: RecordPageShellLabels;
  };

/**
 * The frame for one record: an order, a contact, a ticket. A back link to
 * the list, the record's name as the page's h1 with its status beside it, a
 * line of facts, the actions, a row of tabs, then a main column and a Details
 * rail at its right that drops under it on a narrow screen. Every detail view
 * in an app gets the same shape, and what goes in is yours: the tab's content
 * in `main`, a description list in `rail`. The rail is a labelled complementary
 * region and the main column is the tab panel of the current tab. It renders
 * on the server; pass your router's Link as linkAs.
 */
export function RecordPageShell({
  backHref,
  backLabel,
  linkAs: Link = "a",
  title,
  titleAs: Title = "h1",
  status,
  meta,
  actions,
  tabs,
  activeTab,
  onTabChange,
  main,
  rail,
  railTitle = "Details",
  labels,
  className,
  ...props
}: RecordPageShellProps) {
  const text = { back: "Back", backTo: "Back to", tabs: "Sections of this record", ...labels };
  const railId = useId();
  const facts: readonly ReactNode[] = Array.isArray(meta) ? (meta as readonly ReactNode[]) : meta ? [meta as ReactNode] : [];
  const current = tabs?.find((tab) => tab.id === activeTab);

  return (
    <div data-slot="record-page-shell" className={cn("mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8", className)} {...props}>
      <header data-slot="record-page-shell-header">
        <Link
          href={backHref}
          className="-ml-2 inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-sm text-muted-foreground outline-none transition-colors duration-150 hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40 motion-reduce:transition-none"
        >
          <IconArrowLeft className="size-4" />
          {backLabel ? (
            <>
              <span className="sr-only">{text.backTo} </span>
              {backLabel}
            </>
          ) : (
            text.back
          )}
        </Link>
        <div className="mt-3 flex flex-wrap items-start justify-between gap-x-6 gap-y-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <Title className="text-2xl font-medium tracking-[-0.03em] text-balance sm:text-3xl">{title}</Title>
              {status ? <div className="flex flex-wrap items-center gap-1.5">{status}</div> : null}
            </div>
            {facts.length ? (
              // One fact to a line on a phone, where a dot would be left hanging at the end of a line; set off with dots from sm.
              <p className="mt-2 flex flex-col gap-y-0.5 text-sm text-muted-foreground sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-2.5 sm:gap-y-1">
                {facts.map((fact, index) => (
                  <Fragment key={index}>
                    {index > 0 ? (
                      <span aria-hidden="true" className="max-sm:hidden">
                        ·
                      </span>
                    ) : null}
                    <span>{fact}</span>
                  </Fragment>
                ))}
              </p>
            ) : null}
          </div>
          {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
        </div>
      </header>

      {tabs ? <ScrollTabs tabs={tabs} value={activeTab} onValueChange={onTabChange} label={text.tabs} className="mt-6" /> : null}

      <div className={cn("mt-6 grid gap-8", rail && "lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start lg:gap-10")}>
        <div data-slot="record-page-shell-main" role={current ? "tabpanel" : undefined} aria-label={current?.label} className="min-w-0">
          {main}
        </div>
        {rail ? (
          <aside data-slot="record-page-shell-rail" aria-labelledby={railId} className="rounded-xl border border-border bg-card lg:sticky lg:top-[var(--sticky-top,1.5rem)]">
            <h2 id={railId} className="border-b border-border px-5 py-3.5 text-sm font-semibold">
              {railTitle}
            </h2>
            <div className="p-5">{rail}</div>
          </aside>
        ) : null}
      </div>
    </div>
  );
}
