"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

import { IconArchive, IconCopy, IconDownload, IconEdit, IconMessage, IconPrinter, IconShare, IconTrash } from "@rhs-ui/icons";
import { OverflowActions, type OverflowAction } from "@rhs-ui/primitives/overflow-actions";
import { Slider } from "@rhs-ui/primitives/slider";

const REPORT_ACTIONS: readonly OverflowAction[] = [
  { id: "edit", label: "Edit", icon: <IconEdit />, pinned: true },
  { id: "share", label: "Share", icon: <IconShare />, priority: 5 },
  { id: "export", label: "Export", icon: <IconDownload />, priority: 4 },
  { id: "duplicate", label: "Duplicate", icon: <IconCopy />, priority: 3 },
  { id: "print", label: "Print", icon: <IconPrinter />, priority: 2, separatorBefore: true },
  { id: "archive", label: "Archive", icon: <IconArchive />, priority: 1 },
  { id: "delete", label: "Delete", icon: <IconTrash />, priority: 0, destructive: true, separatorBefore: true },
];

const TABLE_ACTIONS: readonly OverflowAction[] = [
  { id: "comment", label: "Comment", icon: <IconMessage />, priority: 3 },
  { id: "download", label: "Download", icon: <IconDownload />, priority: 2 },
  { id: "archive", label: "Archive", icon: <IconArchive />, priority: 1, disabled: true },
  { id: "delete", label: "Delete", icon: <IconTrash />, destructive: true },
];

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start justify-items-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

const LABELS = Object.fromEntries(REPORT_ACTIONS.map((action) => [action.id, action.label]));

function ResizableToolbar(): React.JSX.Element {
  const stage = useRef<HTMLDivElement>(null);
  const [wanted, setWanted] = useState(468);
  // The slider only offers widths the stage has room for, so the number it shows is the width the card really has.
  const [room, setRoom] = useState(680);
  const [moved, setMoved] = useState<readonly string[]>([]);
  useEffect(() => {
    const element = stage.current;
    if (!element) return;
    const measure = () => setRoom(Math.floor(element.clientWidth - (window.innerWidth < 640 ? 24 : 40)));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const max = Math.max(160, Math.min(680, room));
  const min = Math.min(220, max - 20);
  const width = Math.min(max, Math.max(min, wanted));
  const inRow = REPORT_ACTIONS.filter((action) => !moved.includes(action.id));
  return (
    <div className="grid w-full grid-cols-[minmax(0,1fr)] gap-5">
      <div className="flex items-center gap-4">
        <span className="shrink-0 text-xs font-medium text-foreground">Width</span>
        <Slider min={min} max={max} step={4} value={[width]} onValueChange={(next) => setWanted(next[0] ?? 468)} thumbLabels={["Width of the report card"]} className="max-w-md" />
        <output className="w-14 shrink-0 text-right text-xs text-muted-foreground tabular-nums">{width}px</output>
      </div>

      <div ref={stage} className="rounded-2xl border border-dashed border-border bg-muted/30 p-3 sm:p-5">
        <div className="rounded-xl border border-border bg-card p-4 shadow-xs" style={{ width, maxWidth: "100%" }}>
          <div className="mb-3.5">
            <p className="text-sm font-semibold tracking-[-0.01em]">Northwind Q3 revenue report</p>
            <p className="text-xs text-muted-foreground">Edited by Mara Jansen · 14 pages</p>
          </div>
          <OverflowActions actions={REPORT_ACTIONS} onOverflowChange={setMoved} aria-label="Report actions" />
        </div>
      </div>

      <p className="text-xs leading-relaxed text-muted-foreground">
        <span className="font-medium text-foreground">In the row:</span> {inRow.map((action) => LABELS[action.id]).join(", ") || "nothing"}.{" "}
        <span className="font-medium text-foreground">In the menu:</span> {moved.map((id) => LABELS[id]).join(", ") || "nothing"}.
      </p>
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="grid w-full max-w-3xl gap-x-12 gap-y-9 [grid-template-columns:repeat(auto-fit,minmax(min(100%,19rem),1fr))]">
      <div className="min-w-0 [grid-column:1/-1]">
        <Example caption="Drag the width. Edit is pinned; the rest leave by priority, Delete first, and come back when there is room.">
          <ResizableToolbar />
        </Example>
      </div>

      <Example caption="Ghost and small, in a narrow column">
        <div className="w-full max-w-[19rem] rounded-xl border border-border bg-card p-2.5 shadow-xs">
          <OverflowActions actions={TABLE_ACTIONS} variant="ghost" size="sm" aria-label="Row actions" />
        </div>
      </Example>

      <Example caption="At the narrowest width everything lives in the menu, and its button names the count">
        <div className="w-16 rounded-xl border border-border bg-card p-2.5 shadow-xs">
          <OverflowActions actions={TABLE_ACTIONS} aria-label="Row actions, collapsed" />
        </div>
      </Example>
    </div>
  );
}
