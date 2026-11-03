"use client";

import { useState, type ReactNode } from "react";

import { IconPlus, IconRefresh } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { CollapsiblePanes, type CollapsiblePane } from "@rhs-ui/primitives/collapsible-panes";
import { cn } from "@/lib/utils";

const SYMBOLS = [
  ["orderTotal", "function"],
  ["applyDiscount", "function"],
  ["formatMoney", "function"],
  ["roundToCents", "function"],
  ["splitPayment", "function"],
  ["currencyOf", "function"],
  ["CartLine", "interface"],
  ["Cart", "interface"],
  ["Totals", "interface"],
  ["Discount", "type"],
  ["Rounding", "enum"],
  ["VAT_RATE", "const"],
  ["DEFAULT_CURRENCY", "const"],
  ["roundHalfEven", "function"],
];

const COMMITS = [
  ["Round the VAT per line, not per order", "Maya Chen", "2 hours ago"],
  ["Add the HALCYON10 code", "Jonas de Vries", "Yesterday"],
  ["Fix the rounding on refunds", "Priya Nair", "29 Oct"],
  ["Split a payment across two cards", "Lukas Brandt", "27 Oct"],
  ["Move money helpers into their own file", "Maya Chen", "24 Oct"],
  ["Cover the zero-total cart", "Sofia Marino", "22 Oct"],
  ["Format totals for nl-NL and de-DE", "Tom Okafor", "20 Oct"],
  ["Initial checkout flow", "Maya Chen", "14 Oct"],
];

const FILES = [
  ["checkout.ts", "src/cart"],
  ["money.ts", "src/cart"],
  ["cart.test.ts", "src/cart"],
  ["types.ts", "src/cart"],
  ["README.md", "root"],
  ["package.json", "root"],
];

function Symbols(): React.JSX.Element {
  return (
    <ul className="grid px-2 pb-2">
      {SYMBOLS.map(([name, kind]) => (
        <li key={name}>
          <button type="button" className="flex w-full items-baseline justify-between gap-3 rounded-md px-2 py-1 text-start outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/40">
            <span className="truncate font-mono text-[0.8125rem]">{name}</span>
            <span className="shrink-0 text-xs text-muted-foreground">{kind}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}

function Commits(): React.JSX.Element {
  return (
    <ol className="grid px-2 pb-2">
      {COMMITS.map(([message, author, when]) => (
        <li key={message} className="rounded-md px-2 py-1.5 hover:bg-muted">
          <p className="truncate text-[0.8125rem]">{message}</p>
          <p className="truncate text-xs text-muted-foreground">
            {author} · {when}
          </p>
        </li>
      ))}
    </ol>
  );
}

function Files(): React.JSX.Element {
  return (
    <ul className="grid px-2 pb-2">
      {FILES.map(([name, folder]) => (
        <li key={name}>
          <button type="button" className="flex w-full items-baseline justify-between gap-3 rounded-md px-2 py-1 text-start outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/40">
            <span className="truncate text-[0.8125rem]">{name}</span>
            <span className="shrink-0 text-xs text-muted-foreground">{folder}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}

const ICON_BUTTON = "size-6 text-muted-foreground hover:text-foreground";

const PANES: readonly CollapsiblePane[] = [
  {
    id: "outline",
    title: "Outline",
    count: SYMBOLS.length,
    actions: (
      <Button variant="ghost" size="icon-sm" className={ICON_BUTTON} aria-label="Refresh the outline">
        <IconRefresh className="size-3.5" />
      </Button>
    ),
    content: <Symbols />,
  },
  {
    id: "timeline",
    title: "Timeline",
    count: COMMITS.length,
    actions: (
      <Button variant="ghost" size="icon-sm" className={ICON_BUTTON} aria-label="Refresh the timeline">
        <IconRefresh className="size-3.5" />
      </Button>
    ),
    content: <Commits />,
  },
  {
    id: "files",
    title: "Open files",
    count: FILES.length,
    actions: (
      <Button variant="ghost" size="icon-sm" className={ICON_BUTTON} aria-label="Open a file">
        <IconPlus className="size-3.5" />
      </Button>
    ),
    content: <Files />,
  },
];

function Specimen({ title, note, height, children, footer }: { title: string; note: string; height: string; children: ReactNode; footer?: ReactNode }): React.JSX.Element {
  return (
    <figure className="grid min-w-0 content-start gap-3">
      {/* Room for a title and three lines, so the frames of figures side by side start on one edge whatever their notes run to. */}
      <figcaption className="md:min-h-[4.5rem]">
        <h2 className="text-sm font-semibold tracking-[-0.01em]">{title}</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">{note}</p>
      </figcaption>
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-xs" style={{ height }}>
        {children}
      </div>
      {footer}
    </figure>
  );
}

export default function Demo(): React.JSX.Element {
  const [openIds, setOpenIds] = useState<string[]>(["outline", "timeline"]);
  return (
    <div className="mx-auto grid w-full max-w-6xl gap-x-8 gap-y-10 px-4 py-8 sm:px-6 md:grid-cols-2 lg:grid-cols-3">
      <Specimen
        title="Two open, one folded"
        note="The open panes share the height. Close one and the other takes its room."
        height="28rem"
        footer={<p className={cn("font-mono text-xs text-muted-foreground")}>openIds: [{openIds.join(", ")}]</p>}
      >
        <CollapsiblePanes panes={PANES} openIds={openIds} onOpenIdsChange={setOpenIds} aria-label="Explorer" role="group" />
      </Specimen>

      <Specimen title="Not enough room" note="All three are open, but a short window has room for one at 120px. The last fold; click a header and that pane takes the room." height="16rem">
        <CollapsiblePanes panes={PANES} defaultOpenIds={["outline", "timeline", "files"]} aria-label="Explorer in a short window" role="group" />
      </Specimen>

      <Specimen title="One at a time" note="With multiple off, opening a pane closes the other. Use Up, Down, Home and End to move between the headers." height="28rem">
        <CollapsiblePanes panes={PANES} defaultOpenIds={["files"]} multiple={false} aria-label="Explorer, one pane at a time" role="group" />
      </Specimen>
    </div>
  );
}
