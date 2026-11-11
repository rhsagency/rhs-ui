"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

import { IconFileCode, IconFileImage, IconFileSheet, IconFileText, IconPackage } from "@rhs-ui/icons";
import { Badge } from "@rhs-ui/primitives/badge";
import { Slider } from "@rhs-ui/primitives/slider";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@rhs-ui/primitives/table";
import { TruncateTooltip } from "@rhs-ui/primitives/truncate-tooltip";

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  const [width, setWidth] = useState(300);
  const { box, cut, total } = useCutCount(width);
  return (
    <div className="@container grid w-full max-w-2xl gap-10">
      <Example caption="Narrow the box: only a text that is cut off gets a tooltip and a tab stop. Hover it, Tab to it, or tap it">
        <div className="grid grid-cols-[minmax(0,1fr)] gap-4 rounded-xl border border-border bg-card p-4 shadow-xs">
          <div className="grid gap-2">
            <div className="flex items-baseline justify-between gap-4 text-xs text-muted-foreground">
              <span aria-hidden="true">Width of the list</span>
              <span className="tabular-nums" aria-live="off">
                {width} px
              </span>
            </div>
            <Slider min={160} max={560} step={2} value={[width]} onValueChange={(next) => setWidth(next[0] ?? 300)} thumbLabels={["Width of the list"]} />
          </div>
          <div ref={box} className="overflow-hidden rounded-lg border border-dashed border-border bg-background" style={{ width, maxWidth: "100%" }}>
            <ul className="divide-y divide-border">
              {FILES.map((file) => (
                <li key={file.name} className="flex items-center gap-3 px-3 py-2.5">
                  <file.icon aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
                  <TruncateTooltip className="flex-1 text-sm font-medium">{file.name}</TruncateTooltip>
                  <span className="shrink-0 text-xs text-muted-foreground tabular-nums">{file.size}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground" aria-live="polite">
            <Badge variant="outline" className="tabular-nums">
              {cut} of {total}
            </Badge>
            <span>cut off, so {cut === 1 ? "one tab stop" : `${cut} tab stops`}. The rest carry no extra behaviour.</span>
          </div>
        </div>
      </Example>

      <Example caption="A clamp to two lines, for cards and feeds: the short title shows whole and has no tooltip">
        <ul className="grid gap-3 @xl:grid-cols-3">
          {STORIES.map((story) => (
            <li key={story.id} className="grid content-start gap-2 rounded-xl border border-border bg-card p-4 shadow-xs">
              <TruncateTooltip as="h2" lines={2} className="text-sm leading-snug font-medium tracking-[-0.01em]">
                {story.title}
              </TruncateTooltip>
              <p className="text-xs text-muted-foreground">{story.meta}</p>
            </li>
          ))}
        </ul>
      </Example>

      <Example caption="In a table with a fixed layout, where a long name would otherwise push the other columns off the screen">
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
          <Table className="table-fixed">
            <TableHeader>
              {/* The Owner column leaves a narrow box, so that the names and the statuses that fit are shown whole and only the long project names are cut. */}
              <TableRow>
                <TableHead className="w-[62%] @sm:w-[46%]">Project</TableHead>
                <TableHead className="hidden w-[28%] @sm:table-cell">Owner</TableHead>
                <TableHead className="w-[38%] @sm:w-[26%]">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {PROJECTS.map((project) => (
                <TableRow key={project.name}>
                  <TableCell>
                    <TruncateTooltip className="font-medium">{project.name}</TruncateTooltip>
                  </TableCell>
                  <TableCell className="hidden @sm:table-cell">
                    <TruncateTooltip className="text-muted-foreground">{project.owner}</TruncateTooltip>
                  </TableCell>
                  <TableCell>
                    <TruncateTooltip className="text-muted-foreground">{project.status}</TruncateTooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Example>
    </div>
  );
}

const FILES = [
  { name: "Kestrel_Q3-board-update_final-v7_approved-by-legal.pdf", size: "4.2 MB", icon: IconFileText },
  { name: "README.md", size: "2 KB", icon: IconFileCode },
  { name: "IMG_20261012_184233_HDR-panorama-harbour.jpg", size: "6.1 MB", icon: IconFileImage },
  { name: "budget-v7.xlsx", size: "86 KB", icon: IconFileSheet },
  { name: "backup-halcyon-prod-2026-10-18-nightly-full.tar.gz", size: "1.4 GB", icon: IconPackage },
] as const;

const STORIES = [
  { id: "a", title: "Kestrel moves its nightly exports to the new regional warehouse and drops the CSV step entirely", meta: "Product, 3 min" },
  { id: "b", title: "Pricing update for November", meta: "Company, 1 min" },
  { id: "c", title: "What we learned from forty customer calls about onboarding a team of more than two hundred people", meta: "Research, 9 min" },
] as const;

const PROJECTS = [
  { name: "Halcyon storefront redesign: checkout, cart drawer and the new order confirmation emails", owner: "Mara Okafor", status: "In review" },
  { name: "Q4 reporting", owner: "Jonas Weber", status: "Planned" },
  { name: "Northwind catalogue import and the one-off clean-up of 12,400 duplicate variants", owner: "Aiko Tanaka", status: "In progress" },
] as const;

/** How many of the texts inside are cut off right now, read from what the component reports on itself. */
function useCutCount(width: number) {
  const box = useRef<HTMLDivElement>(null);
  const [cut, setCut] = useState({ cut: 0, total: 0 });
  useEffect(() => {
    const element = box.current;
    if (!element) return;
    const read = () => {
      const all = element.querySelectorAll('[data-slot="truncate-tooltip"]');
      setCut({ cut: element.querySelectorAll('[data-slot="truncate-tooltip"][data-truncated]').length, total: all.length });
    };
    read();
    const observer = new MutationObserver(read);
    observer.observe(element, { subtree: true, attributes: true, attributeFilter: ["data-truncated"] });
    // The texts measure themselves a moment after the box changes.
    const timer = window.setTimeout(read, 120);
    return () => {
      window.clearTimeout(timer);
      observer.disconnect();
    };
  }, [width]);
  return { box, ...cut };
}
