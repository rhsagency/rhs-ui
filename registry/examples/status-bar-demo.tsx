"use client";

import { useEffect, useState } from "react";

import { SegmentedControl } from "@rhs-ui/application/segmented-control";
import { IconBell, IconCheck, IconGitBranch, IconRefresh, IconWarning } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { StatusBar, type StatusBarSegment } from "@rhs-ui/primitives/status-bar";
import { cn } from "@/lib/utils";

const CODE = [
  `import { formatMoney } from "./money";`,
  `import type { Cart } from "./types";`,
  ``,
  `/** The total a customer pays, after discounts and VAT. */`,
  `export function orderTotal(cart: Cart): string {`,
  `  const subtotal = cart.lines.reduce((sum, line) => sum + line.price * line.quantity, 0);`,
  `  const discount = cart.code ? Math.round(subtotal * cart.code.rate) : 0;`,
  `  const vat = Math.round((subtotal - discount) * 0.21);`,
  ``,
  `  return formatMoney(subtotal - discount + vat, cart.currency);`,
  `}`,
];

type Sync = "synced" | "syncing";

/** One set of segments for a bar, with the handlers that make the buttons do something. */
function useEditorSegments() {
  const [branch, setBranch] = useState("main");
  const [sync, setSync] = useState<Sync>("synced");
  const [spaces, setSpaces] = useState(2);
  const [cursor, setCursor] = useState({ line: 8, col: 24 });
  const runSync = () => setSync("syncing");
  // A sync takes a moment, and then it is done again: the label changes twice, and a screen reader hears it both times.
  useEffect(() => {
    if (sync !== "syncing") return;
    const timer = window.setTimeout(() => setSync("synced"), 1400);
    return () => window.clearTimeout(timer);
  }, [sync]);

  const start: StatusBarSegment[] = [
    { id: "branch", label: branch, icon: <IconGitBranch />, onSelect: () => setBranch((current) => (current === "main" ? "feature/vat-rounding" : "main")), tooltip: "Switch branch" },
    {
      id: "sync",
      label: sync === "synced" ? "Synced" : "Syncing…",
      icon: sync === "synced" ? <IconCheck /> : <IconRefresh className="motion-safe:animate-spin" />,
      onSelect: runSync,
      tooltip: "Sync now",
      live: true,
      announcement: sync === "synced" ? "All changes synced" : "Syncing changes",
    },
    // Problems matter more than their place in the list says, so they stay longer than the segments before them.
    { id: "problems", label: "2 errors, 3 warnings", icon: <IconWarning />, onSelect: () => undefined, tooltip: "Show problems", ariaLabel: "Problems: 2 errors and 3 warnings", priority: 1 },
  ];
  const end: StatusBarSegment[] = [
    { id: "cursor", label: `Ln ${cursor.line}, Col ${cursor.col}`, onSelect: () => setCursor((current) => ({ line: (current.line % CODE.length) + 1, col: 1 })), tooltip: "Go to line" },
    { id: "spaces", label: `Spaces: ${spaces}`, onSelect: () => setSpaces((current) => (current === 2 ? 4 : 2)), tooltip: "Change the indentation" },
    { id: "encoding", label: "UTF-8", tooltip: "File encoding" },
    { id: "eol", label: "LF", tooltip: "End of line sequence" },
    { id: "language", label: "TypeScript", onSelect: () => undefined, tooltip: "Select the language mode" },
    { id: "notifications", label: "Notifications", icon: <IconBell />, iconOnly: true, onSelect: () => undefined, tooltip: "Notifications" },
  ];
  return { start, end, cursor, setCursor, sync, runSync };
}

function Editor({ width, segments }: { width: string; segments: ReturnType<typeof useEditorSegments> }): React.JSX.Element {
  const { start, end, cursor, setCursor } = segments;
  // The line that is highlighted is the line the cursor is on: one state, so the bar and the editor cannot disagree.
  const active = cursor.line;
  return (
    <div className="max-w-full overflow-hidden rounded-xl border border-border bg-card shadow-xs" style={{ width }}>
      <div className="flex items-end gap-px border-b border-border bg-muted/40 px-2 pt-2">
        <span className="rounded-t-md border-x border-t border-border bg-card px-3.5 py-1.5 text-xs font-medium">checkout.ts</span>
        <span className="px-3.5 py-1.5 text-xs text-muted-foreground">money.ts</span>
      </div>
      {/* A picture of code, not a field: it stands in for the editor so the bar has something to sit under. */}
      {/* It scrolls sideways on a phone, so it takes focus itself and the keyboard can reach the rest of a line. */}
      <div
        role="img"
        aria-label="checkout.ts: orderTotal adds up a cart, takes off a discount and adds the VAT"
        tabIndex={0}
        className="relative overflow-x-auto py-2 font-mono text-[0.8125rem] leading-6 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:ring-inset [font-variant-ligatures:none]"
      >
        {CODE.map((text, index) => (
          <div
            key={index}
            onClick={(event) => {
              const box = event.currentTarget.getBoundingClientRect();
              const col = Math.max(1, Math.min(text.length + 1, Math.round((event.clientX - box.left - 56) / 7.8) + 1));
              setCursor({ line: index + 1, col });
            }}
            className={cn("flex w-max min-w-full cursor-text items-baseline gap-4 px-4 whitespace-pre", active === index + 1 ? "bg-muted/70" : "hover:bg-muted/40")}
          >
            <span className="w-5 shrink-0 text-end text-muted-foreground tabular-nums select-none">{index + 1}</span>
            <span className={text.startsWith("/**") ? "text-muted-foreground" : undefined}>{text || " "}</span>
          </div>
        ))}
      </div>
      <StatusBar label="Editor status" start={start} end={end} />
    </div>
  );
}

/**
 * A bar of one fixed width. On a screen narrower than that the bar keeps its width and its wrapper scrolls, so the segments that are
 * showing are the ones the caption names whatever the screen is, and not whatever the screen has room for.
 */
function Specimen({ width, caption, separators = false }: { width: string; caption: string; separators?: boolean }): React.JSX.Element {
  const { start, end } = useEditorSegments();
  return (
    <figure className="grid min-w-0 grid-cols-1 gap-2">
      <figcaption className="text-xs text-muted-foreground">{caption}</figcaption>
      <div className="relative max-w-full overflow-x-auto rounded-lg border border-border" style={{ width }}>
        <div style={{ width }}>
          <StatusBar label={`Status bar, ${width} wide`} start={start} end={end} separators={separators} className="border-t-0" />
        </div>
      </div>
    </figure>
  );
}

const WIDTHS = { wide: "100%", medium: "36rem", narrow: "24rem" } as const;
type Width = keyof typeof WIDTHS;

export default function Demo(): React.JSX.Element {
  const [width, setWidth] = useState<Width>("wide");
  // The editor's own segments live here, so the button next to the width control and the Synced segment in the bar are one state.
  const editor = useEditorSegments();
  return (
    <div className="mx-auto grid w-full max-w-4xl grid-cols-1 gap-12 px-4 py-8 sm:px-6">
      <section aria-labelledby="sb-editor">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
          <div>
            <h2 id="sb-editor" className="text-lg font-semibold tracking-[-0.02em]">
              The foot of an editor
            </h2>
            <p className="mt-0.5 max-w-lg text-sm text-muted-foreground">Run a sync and the status changes by itself and is announced. Click a line to move the cursor. Narrow the window and the least important segments step aside.</p>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
            {/* The same sync as the Synced segment, for a bar that is too narrow to show it. */}
            <Button variant="outline" size="sm" onClick={editor.runSync}>
              <IconRefresh className={editor.sync === "syncing" ? "motion-safe:animate-spin" : undefined} />
              {editor.sync === "syncing" ? "Syncing…" : "Run a sync"}
            </Button>
            {/* On a phone every width is the width of the screen, so the choice has nothing to change there. */}
            <SegmentedControl
              label="Width of the window"
              className="hidden sm:inline-flex"
              value={width}
              onValueChange={(value) => setWidth(value === "narrow" ? "narrow" : value === "medium" ? "medium" : "wide")}
              options={(Object.keys(WIDTHS) as Width[]).map((key) => ({ value: key, label: key === "wide" ? "Wide" : key === "medium" ? "Medium" : "Narrow" }))}
            />
          </div>
        </div>
        <Editor width={WIDTHS[width]} segments={editor} />
      </section>

      <section aria-labelledby="sb-room" className="grid grid-cols-1 gap-5">
        <div>
          <h2 id="sb-room" className="text-lg font-semibold tracking-[-0.02em]">
            Running out of room
          </h2>
          <p className="mt-0.5 max-w-lg text-sm text-muted-foreground">The same segments in three widths. A segment leaves whole, the least important first, and never gets cut in half. On a phone, scroll a bar sideways to see all of it.</p>
        </div>
        <Specimen width="46rem" caption="Room for everything" />
        <Specimen width="37.5rem" caption="Less room: the language and the bell are gone" />
        <Specimen width="22rem" caption="Less still, with hairlines: the problems outlast the sync status, because they have a higher priority" separators />
      </section>
    </div>
  );
}
