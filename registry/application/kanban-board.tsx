"use client";

import { useId, useState, type DragEvent, type KeyboardEvent, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface KanbanCard {
  id: string;
  title: string;
  /** Small facts under the title: a tag, an owner, a due date. */
  meta?: ReactNode;
}

export interface KanbanColumn {
  id: string;
  title: string;
  cards: readonly KanbanCard[];
  /** Work-in-progress limit; the count turns into a warning above it. */
  limit?: number;
}

export interface KanbanBoardProps {
  columns: readonly KanbanColumn[];
  /** Called with the new board after a move. Persist it on your side. */
  onMove: (cardId: string, toColumn: string, toIndex: number) => void;
  label?: string;
  className?: string;
}

/**
 * A board you can work with a mouse or a keyboard: drag cards between
 * columns, or focus a card and press Alt with an arrow key to move it left,
 * right, up or down, with every move announced. Columns show their count
 * and an optional work-in-progress limit.
 */
export function KanbanBoard({ columns, onMove, label = "Board", className }: KanbanBoardProps) {
  const help = useId();
  const [dragging, setDragging] = useState<string | null>(null);
  const [over, setOver] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const locate = (cardId: string) => {
    const column = columns.findIndex((col) => col.cards.some((card) => card.id === cardId));
    return { column, index: columns[column]?.cards.findIndex((card) => card.id === cardId) ?? -1 };
  };
  function move(cardId: string, toColumn: number, toIndex: number) {
    const target = columns[toColumn];
    const card = columns.flatMap((col) => col.cards).find((item) => item.id === cardId);
    if (!target || !card) return;
    onMove(cardId, target.id, toIndex);
    setAnnouncement(`${card.title} moved to ${target.title}, position ${toIndex + 1}.`);
    requestAnimationFrame(() => document.querySelector<HTMLElement>(`[data-kanban-card="${cardId}"]`)?.focus());
  }
  function keys(event: KeyboardEvent<HTMLLIElement>, cardId: string) {
    if (!event.altKey) return;
    const { column, index } = locate(cardId);
    const delta = ({ ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] } as Record<string, [number, number]>)[event.key];
    if (!delta) return;
    event.preventDefault();
    const nextColumn = column + delta[0]!;
    if (nextColumn < 0 || nextColumn >= columns.length) return;
    const size = columns[nextColumn]!.cards.length;
    const nextIndex = delta[0] ? Math.min(index, size) : Math.max(0, Math.min(size - 1, index + delta[1]!));
    if (nextColumn === column && nextIndex === index) return;
    move(cardId, nextColumn, nextIndex);
  }
  function drop(event: DragEvent, columnIndex: number) {
    event.preventDefault();
    const cardId = event.dataTransfer.getData("text/plain");
    setOver(null);
    setDragging(null);
    if (cardId) move(cardId, columnIndex, columns[columnIndex]?.cards.filter((card) => card.id !== cardId).length ?? 0);
  }
  return (
    <section data-slot="kanban-board" aria-label={label} className={cn("relative", className)}>
      <p className="sr-only" id={help}>Press Alt and an arrow key to move a card.</p>
      <div className="relative flex gap-3 overflow-x-auto pb-2">
        {columns.map((column, columnIndex) => {
          const full = column.limit !== undefined && column.cards.length > column.limit;
          return (
            <section
              key={column.id}
              aria-label={column.title}
              onDragOver={(event) => { event.preventDefault(); setOver(column.id); }}
              onDragLeave={() => setOver((value) => (value === column.id ? null : value))}
              onDrop={(event) => drop(event, columnIndex)}
              className={cn("flex w-72 shrink-0 flex-col rounded-2xl bg-muted/60 p-2 transition-colors", over === column.id && "bg-muted ring-2 ring-foreground/20")}
            >
              <h3 className="flex items-center justify-between px-2 py-1.5 text-sm font-medium">
                {column.title}
                <span className={cn("rounded-full px-2 py-0.5 text-xs tabular-nums", full ? "bg-destructive/10 text-destructive" : "text-muted-foreground")}>
                  {column.cards.length}{column.limit !== undefined ? ` / ${column.limit}` : ""}{full ? <span className="sr-only"> (over the limit)</span> : null}
                </span>
              </h3>
              <ol className="grid min-h-16 gap-2">
                {column.cards.map((card) => (
                  <li
                    key={card.id}
                    data-kanban-card={card.id}
                    tabIndex={0}
                    draggable
                    aria-describedby={help}
                    onDragStart={(event) => { event.dataTransfer.setData("text/plain", card.id); setDragging(card.id); }}
                    onDragEnd={() => setDragging(null)}
                    onKeyDown={(event) => keys(event, card.id)}
                    className={cn("cursor-grab rounded-xl border border-border bg-background p-3 text-sm shadow-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40 active:cursor-grabbing", dragging === card.id && "opacity-40")}
                  >
                    <p className="font-medium">{card.title}</p>
                    {card.meta ? <div className="mt-2 text-xs text-muted-foreground">{card.meta}</div> : null}
                  </li>
                ))}
              </ol>
            </section>
          );
        })}
      </div>
      <p role="status" className="sr-only">{announcement}</p>
    </section>
  );
}
