"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

import { IconContrast, IconMove, IconPlus, IconTrash } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { Kbd, KbdGroup } from "@rhs-ui/primitives/kbd";
import { UndoRedoButtons } from "@rhs-ui/primitives/undo-redo-buttons";
import { cn } from "@/lib/utils";

type Kind = "circle" | "square" | "bar" | "ring";
interface Layer {
  id: number;
  kind: Kind;
  slot: number;
  solid: boolean;
}
interface Doc {
  layers: Layer[];
  next: number;
}
interface Entry {
  label: string;
  doc: Doc;
}

const KINDS: readonly Kind[] = ["circle", "square", "bar", "ring"];
const SLOTS = 6;

const freeSlot = (doc: Doc, from = 0) => {
  for (let step = 0; step < SLOTS; step += 1) {
    const slot = (from + step) % SLOTS;
    if (!doc.layers.some((layer) => layer.slot === slot)) return slot;
  }
  return -1;
};

// Each edit is a plain function from one document to the next, with the name the history shows for it.
function addLayer(doc: Doc): Entry | null {
  const slot = freeSlot(doc);
  if (slot < 0) return null;
  const kind = KINDS[doc.next % KINDS.length] ?? "circle";
  return { label: `Add ${kind}`, doc: { layers: [...doc.layers, { id: doc.next + 1, kind, slot, solid: doc.next % 2 === 0 }], next: doc.next + 1 } };
}
function moveLayer(doc: Doc): Entry | null {
  const top = doc.layers[doc.layers.length - 1];
  if (!top) return null;
  const rest: Doc = { ...doc, layers: doc.layers.slice(0, -1) };
  return { label: `Move ${top.kind}`, doc: { ...doc, layers: [...rest.layers, { ...top, slot: freeSlot(rest, top.slot + 1) }] } };
}
function fillLayer(doc: Doc): Entry | null {
  const top = doc.layers[doc.layers.length - 1];
  return top ? { label: "Change fill", doc: { ...doc, layers: [...doc.layers.slice(0, -1), { ...top, solid: !top.solid }] } } : null;
}
function deleteLayer(doc: Doc): Entry | null {
  const top = doc.layers[doc.layers.length - 1];
  return top ? { label: `Delete ${top.kind}`, doc: { ...doc, layers: doc.layers.slice(0, -1) } } : null;
}

const OPEN: Entry = {
  label: "Open file",
  doc: {
    layers: [
      { id: 1, kind: "square", slot: 0, solid: true },
      { id: 2, kind: "circle", slot: 4, solid: false },
    ],
    next: 2,
  },
};

/** A few steps already taken, the last one undone: both buttons start on, so the preview shows them working. */
function seed(): { entries: Entry[]; at: number } {
  const entries: Entry[] = [OPEN];
  for (const edit of [addLayer, moveLayer, fillLayer]) {
    const previous = entries[entries.length - 1];
    const next = previous ? edit(previous.doc) : null;
    if (next) entries.push(next);
  }
  return { entries, at: entries.length - 2 };
}

function Shape({ layer }: { layer: Layer }) {
  const box = layer.kind === "bar" ? "h-4 w-[72%] rounded-full" : layer.kind === "square" ? "size-14 rounded-xl" : "size-14 rounded-full";
  const fill = layer.kind === "ring" ? "border-[6px] border-foreground bg-transparent" : layer.solid ? "bg-foreground" : "border-2 border-foreground bg-transparent";
  return <span className={cn("block transition-[background-color,border-color] duration-200 motion-reduce:transition-none", box, fill)} />;
}

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start justify-items-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

function Editor(): React.JSX.Element {
  const [history, setHistory] = useState(seed);
  const { entries, at } = history;
  const doc = entries[at]?.doc ?? OPEN.doc;

  // The list follows the step you are on. Only its own scroll position moves (scrollIntoView could scroll the page too).
  const list = useRef<HTMLOListElement>(null);
  useEffect(() => {
    const box = list.current;
    const row = box?.querySelector<HTMLElement>("[aria-current='step']");
    if (!box || !row) return;
    const inside = box.getBoundingClientRect();
    const current = row.getBoundingClientRect();
    if (current.top < inside.top) box.scrollTop -= inside.top - current.top;
    else if (current.bottom > inside.bottom) box.scrollTop += current.bottom - inside.bottom;
  }, [at, entries]);

  const commit = (entry: Entry | null) => {
    if (!entry) return;
    const kept = [...entries.slice(0, at + 1), entry].slice(-12);
    setHistory({ entries: kept, at: kept.length - 1 });
  };
  const go = (to: number) => setHistory(({ entries: list }) => ({ entries: list, at: Math.min(list.length - 1, Math.max(0, to)) }));

  const current = entries[at];
  const upcoming = entries[at + 1];
  const full = freeSlot(doc) < 0;
  const empty = doc.layers.length === 0;
  return (
    <div className="w-full overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-xs">
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium tracking-[-0.01em]">Halcyon launch poster</p>
          <p className="text-xs text-muted-foreground tabular-nums">
            {doc.layers.length} {doc.layers.length === 1 ? "layer" : "layers"}
          </p>
        </div>
        <UndoRedoButtons
          canUndo={at > 0}
          canRedo={at < entries.length - 1}
          undoLabel={at > 0 && current ? `Undo: ${current.label}` : "Undo"}
          redoLabel={upcoming ? `Redo: ${upcoming.label}` : "Redo"}
          onUndo={() => go(at - 1)}
          onRedo={() => go(at + 1)}
        />
      </div>

      <div className="grid sm:grid-cols-[minmax(0,1fr)_12rem]">
        <div className="bg-muted/40 p-4">
          <div role="img" aria-label={`Poster with ${doc.layers.length} layers`} className="relative mx-auto aspect-[4/3] max-w-sm rounded-md border border-border bg-background shadow-xs">
            <span aria-hidden="true" className="absolute top-2 left-2.5 text-[0.625rem] font-medium text-muted-foreground">
              Poster · 1600 × 1200
            </span>
            <div className="absolute inset-0 grid grid-cols-3 grid-rows-2 px-1 pt-7 pb-1">
              {doc.layers.map((layer) => (
                <span key={layer.id} className="grid place-items-center" style={{ gridColumn: (layer.slot % 3) + 1, gridRow: Math.floor(layer.slot / 3) + 1 }}>
                  <Shape layer={layer} />
                </span>
              ))}
            </div>
          </div>
          <div className="mx-auto mt-4 flex max-w-sm flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => commit(addLayer(doc))} disabled={full}>
              <IconPlus /> Add
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => commit(moveLayer(doc))} disabled={empty}>
              <IconMove /> Move
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => commit(fillLayer(doc))} disabled={empty}>
              <IconContrast /> Fill
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => commit(deleteLayer(doc))} disabled={empty}>
              <IconTrash /> Delete
            </Button>
          </div>
        </div>

        <div className="border-t border-border bg-card p-4 sm:border-t-0 sm:border-l">
          <p className="mb-2 text-xs font-medium text-muted-foreground">History</p>
          <ol ref={list} aria-label="History" className="relative max-h-56 space-y-0.5 overflow-y-auto pr-1 text-[0.8125rem]">
            {entries.map((entry, index) => (
              <li
                key={`${index}-${entry.label}`}
                aria-current={index === at ? "step" : undefined}
                className={cn("flex items-center gap-2 rounded-md px-2 py-1", index === at ? "bg-muted font-medium text-foreground" : "text-muted-foreground")}
              >
                <span aria-hidden="true" className={cn("size-1.5 shrink-0 rounded-full", index === at ? "bg-foreground" : index > at ? "border border-dashed border-muted-foreground/60" : "bg-muted-foreground/50")} />
                <span className="truncate">{entry.label}</span>
                {index > at ? <span className="sr-only">(can be redone)</span> : null}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}

// The pair owns no history; the rows below only show how it looks.
function noop() {}

export default function Demo(): React.JSX.Element {
  return (
    <div className="grid w-full max-w-3xl gap-x-12 gap-y-9 [grid-template-columns:repeat(auto-fit,minmax(min(100%,20rem),1fr))]">
      <div className="min-w-0 [grid-column:1/-1]">
        <Example caption="Press a step, or use the keys. Hover a button to see the next step and its shortcut.">
          <Editor />
          <p className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              Undo
              <KbdGroup>
                <Kbd>Ctrl</Kbd>
                <Kbd>Z</Kbd>
              </KbdGroup>
            </span>
            <span className="inline-flex items-center gap-1.5">
              Redo
              <KbdGroup>
                <Kbd>Ctrl</Kbd>
                <Kbd>Y</Kbd>
              </KbdGroup>
            </span>
            <span>⌘ replaces Ctrl on a Mac. A field you type in keeps its own undo.</span>
          </p>
        </Example>
      </div>

      <Example caption="Three sizes">
        <div className="flex items-center gap-5">
          <UndoRedoButtons size="sm" canUndo canRedo onUndo={noop} onRedo={noop} bindKeys={false} aria-label="History, small" />
          <UndoRedoButtons size="md" canUndo canRedo onUndo={noop} onRedo={noop} bindKeys={false} aria-label="History, medium" />
          <UndoRedoButtons size="lg" canUndo canRedo onUndo={noop} onRedo={noop} bindKeys={false} aria-label="History, large" />
        </div>
      </Example>

      <Example caption="Nothing to step through: the buttons keep their place">
        <div className="flex flex-wrap items-center gap-5">
          <UndoRedoButtons canUndo={false} canRedo onRedo={noop} onUndo={noop} redoLabel="Redo: Rename page" bindKeys={false} aria-label="History, nothing to undo" />
          <UndoRedoButtons canUndo={false} canRedo={false} onRedo={noop} onUndo={noop} bindKeys={false} aria-label="History, empty" />
        </div>
      </Example>

      <Example caption="Ghost, inside a toolbar that already has a surface">
        <div role="toolbar" aria-label="Page tools" className="inline-flex max-w-full items-center gap-1 rounded-xl border border-border bg-card p-1 shadow-xs">
          <UndoRedoButtons variant="ghost" canUndo canRedo onUndo={noop} onRedo={noop} bindKeys={false} undoLabel="Undo: Resize image" redoLabel="Redo: Rename page" />
          <span aria-hidden="true" className="mx-1 h-5 w-px bg-border" />
          <Button type="button" variant="ghost" size="sm">
            Share
          </Button>
          <Button type="button" size="sm">
            Publish
          </Button>
        </div>
      </Example>
    </div>
  );
}
