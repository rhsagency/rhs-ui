"use client";

import { useEffect, useRef, useState } from "react";

import { IconCheck, IconClock, IconFileSheet, IconFileSignature, IconImage, IconPalette, IconPresentation, IconTrash, IconUndo } from "@rhs-ui/icons";
import { Badge } from "@rhs-ui/primitives/badge";
import { IconButton } from "@rhs-ui/primitives/icon-button";
import { Toaster } from "@rhs-ui/primitives/toast";
import { toastUndo } from "@rhs-ui/primitives/undo-toast";

interface LibraryFile {
  id: string;
  name: string;
  meta: string;
  icon: React.JSX.Element;
}

const FILES: readonly LibraryFile[] = [
  { id: "halcyon", name: "Halcyon brand kit", meta: "Brand kit, 48 MB, edited 2 days ago", icon: <IconPalette /> },
  { id: "kestrel", name: "Kestrel onboarding deck", meta: "Slides, 12 MB, edited yesterday", icon: <IconPresentation /> },
  { id: "pricing", name: "Northwind pricing sheet", meta: "Spreadsheet, 340 KB, edited 5 days ago", icon: <IconFileSheet /> },
  { id: "polder", name: "Polder Bakery photos", meta: "42 images, 186 MB, edited last week", icon: <IconImage /> },
  { id: "lumen", name: "Lumen Labs contract", meta: "PDF, 1.2 MB, signed 14 Oct", icon: <IconFileSignature /> },
];

type Outcome = "waiting" | "deleted" | "restored";

interface Entry {
  key: number;
  name: string;
  outcome: Outcome;
  /** Seconds between the delete and the outcome. */
  after: number;
}

const OUTCOME = {
  waiting: { icon: <IconClock />, badge: "Waiting", variant: "muted" },
  deleted: { icon: <IconCheck />, badge: "Deleted", variant: "outline" },
  restored: { icon: <IconUndo />, badge: "Restored", variant: "outline" },
} as const;

const NOTE: Record<Outcome, (after: number) => string> = {
  waiting: () => "Undo is open, nothing has been sent",
  deleted: (after) => `DELETE sent after ${after.toFixed(1)} s`,
  restored: (after) => `Undo pressed after ${after.toFixed(1)} s, nothing was sent`,
};

export default function Demo(): React.JSX.Element {
  const [gone, setGone] = useState<readonly string[]>([]);
  const [log, setLog] = useState<readonly Entry[]>([]);
  const counter = useRef(0);
  const started = useRef(false);

  function remove(file: LibraryFile) {
    const key = ++counter.current;
    const at = Date.now();
    const settle = (outcome: Outcome) => setLog((entries) => entries.map((entry) => (entry.key === key ? { ...entry, outcome, after: (Date.now() - at) / 1000 } : entry)));
    // The row leaves the list at once, as it would with an optimistic update. The server hears about it only when the commit runs.
    setGone((ids) => [...ids, file.id]);
    setLog((entries) => [{ key, name: file.name, outcome: "waiting" as Outcome, after: 0 }, ...entries].slice(0, 5));
    toastUndo({
      message: `Deleted ${file.name}`,
      onUndo: () => {
        setGone((ids) => ids.filter((id) => id !== file.id));
        settle("restored");
      },
      onCommit: () => settle("deleted"),
    });
  }

  // The preview opens with one delete under way, so the toast and the log have something to show.
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const first = FILES[1];
    if (first) remove(first);
  }, []);

  const files = FILES.filter((file) => !gone.includes(file.id));
  return (
    <div className="mx-auto grid min-h-[28rem] w-full max-w-5xl grid-cols-1 content-center gap-x-8 gap-y-9 px-6 py-10 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
      <section aria-labelledby="library-title" className="grid grid-cols-1 content-start gap-3">
        <p className="text-xs text-muted-foreground">Delete a file: it leaves the list at once and the toast gives you six seconds to take it back</p>
        <div className="rounded-xl border border-border bg-card shadow-xs">
          <header className="flex items-center justify-between gap-3 border-b border-border px-5 py-3.5">
            <h2 id="library-title" className="text-sm font-medium tracking-[-0.01em]">
              Brand library
            </h2>
            <span className="text-xs text-muted-foreground tabular-nums">{files.length === 1 ? "1 file" : `${files.length} files`}</span>
          </header>
          {files.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-muted-foreground">Every file is deleted. Undo is still open on the last one.</p>
          ) : (
            <ul className="divide-y divide-border">
              {files.map((file) => (
                <li key={file.id} className="flex items-center gap-3 px-5 py-3">
                  <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-lg border border-border bg-muted text-foreground [&_svg]:size-4">
                    {file.icon}
                  </span>
                  <div className="grid min-w-0 flex-1 gap-0.5">
                    <p className="truncate text-sm font-medium">{file.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{file.meta}</p>
                  </div>
                  <IconButton icon={<IconTrash />} label={`Delete ${file.name}`} variant="ghost" onClick={() => remove(file)} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section aria-labelledby="server-title" className="grid grid-cols-1 content-start gap-3">
        <p className="text-xs text-muted-foreground">What your server has been told: the delete is sent only when the time is up</p>
        <div className="rounded-xl border border-border bg-card shadow-xs">
          <header className="border-b border-border px-5 py-3.5">
            <h2 id="server-title" className="text-sm font-medium tracking-[-0.01em]">
              Sent to the server
            </h2>
          </header>
          {log.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-muted-foreground">Nothing yet. Delete a file.</p>
          ) : (
            <ol className="divide-y divide-border">
              {log.map((entry) => {
                const look = OUTCOME[entry.outcome];
                return (
                  <li key={entry.key} className="grid grid-cols-1 gap-1.5 px-5 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="min-w-0 truncate text-sm font-medium">{entry.name}</p>
                      <Badge variant={look.variant} className="shrink-0">
                        {look.icon}
                        {look.badge}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground tabular-nums">{NOTE[entry.outcome](entry.after)}</p>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      </section>
      <Toaster />
    </div>
  );
}
