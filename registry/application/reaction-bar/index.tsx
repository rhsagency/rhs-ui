"use client";

import { useEffect, useOptimistic, useRef, useState, useTransition } from "react";
import type { ComponentProps, KeyboardEvent } from "react";

import { IconAlertCircle, IconPlus, IconSmile } from "@rhs-ui/icons";
import { REACTION_PALETTE, applyReaction, reactionName, whoReacted, type PaletteEmoji, type Reaction } from "@rhs-ui/application/reaction-bar/palette";
import { Button } from "@rhs-ui/primitives/button";
import { Popover, PopoverContent, PopoverTrigger } from "@rhs-ui/primitives/popover";
import { Toggle } from "@rhs-ui/primitives/toggle";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@rhs-ui/primitives/tooltip";
import { cn } from "@/lib/utils";

export type { PaletteEmoji, Reaction };

export interface ReactionBarProps extends Omit<ComponentProps<"div">, "onToggle" | "children"> {
  /** What is on the message now: one entry per emoji, in the order the chips should appear. */
  reactions: readonly Reaction[];
  /**
   * You pressed a chip or picked from the palette. `reacted` is the state you
   * asked for. Save it and update `reactions`; if the promise rejects, the
   * bar puts everything back and says so.
   */
  onToggle: (emoji: string, reacted: boolean) => void | Promise<void>;
  /** The emoji offered by the add button, sixteen by default. Eight per row. */
  palette?: readonly PaletteEmoji[];
  /** The most different reactions one message can carry. At the limit the palette only lets you toggle what is already there. Default 12. */
  max?: number;
  /** Shows the reactions but lets nobody change them: an archived thread, a read-only role. The chips keep their full contrast, their tooltip and their place in the tab order; only the add button is dimmed. */
  disabled?: boolean;
  /** For the list of names in the tooltip. Default "en-US". */
  locale?: string;
  /** The group's name for screen readers. Default "Reactions". */
  label?: string;
}

const COLUMNS = 8;

/**
 * Emoji reactions under a message or a comment. Each chip is a toggle with
 * the emoji and a count, your own reactions pressed, and a tooltip that says
 * who reacted. The add button opens a compact palette you can walk with the
 * arrow keys. Presses are optimistic: the chip answers at once, and a
 * rejected `onToggle` puts the count back and explains why in words. Read
 * only keeps the counts and the who-reacted tooltip at full strength (the
 * chips stay focusable and say they are disabled) and dims just the add button.
 */
export function ReactionBar({ reactions, onToggle, palette = REACTION_PALETTE, max = 12, disabled = false, locale = "en-US", label = "Reactions", className, ...props }: ReactionBarProps) {
  const [shown, applyChange] = useOptimistic(reactions, (list: readonly Reaction[], change: { emoji: string; reacted: boolean; label: string }) => applyReaction(list, change.emoji, change.reacted, change.label));
  const [, startTransition] = useTransition();
  const inFlight = useRef(new Set<string>());
  const [note, setNote] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (note?.tone !== "error") return;
    const timer = window.setTimeout(() => setNote(null), 6000);
    return () => window.clearTimeout(timer);
  }, [note]);

  function toggle(emoji: string, name: string) {
    if (disabled || inFlight.current.has(emoji)) return;
    const reacted = !shown.find((item) => item.emoji === emoji)?.reacted;
    const words = name.toLowerCase();
    inFlight.current.add(emoji);
    setNote(null);
    startTransition(async () => {
      applyChange({ emoji, reacted, label: name });
      try {
        await onToggle(emoji, reacted);
        setNote({ tone: "ok", text: reacted ? `You reacted with ${words}.` : `You removed your ${words} reaction.` });
      } catch {
        setNote({ tone: "error", text: `Could not ${reacted ? "add" : "remove"} ${words}. Nothing was saved.` });
      } finally {
        inFlight.current.delete(emoji);
      }
    });
  }

  const present = new Set(shown.map((item) => item.emoji));
  const mine = new Set(shown.filter((item) => item.reacted).map((item) => item.emoji));
  const full = shown.length >= max;

  return (
    <div data-slot="reaction-bar" className={cn("grid gap-1.5", className)} {...props}>
      <TooltipProvider delayDuration={200}>
        <div role="group" aria-label={label} className="flex flex-wrap items-center gap-1.5">
          {shown.map((reaction) => {
            // Read only is aria-disabled, never the native attribute: a disabled button is dimmed, cannot take focus and shows no tooltip, and the counts are the whole point of a read-only bar.
            const name = reactionName(reaction, palette);
            const people = `${reaction.count} ${reaction.count === 1 ? "person" : "people"}`;
            return (
              <Tooltip key={reaction.emoji}>
                <TooltipTrigger asChild>
                  <Toggle
                    variant="outline"
                    pressed={Boolean(reaction.reacted)}
                    onPressedChange={() => toggle(reaction.emoji, name)}
                    aria-disabled={disabled || undefined}
                    data-readonly={disabled ? "" : undefined}
                    aria-label={`${name}, ${people}${reaction.reacted ? ", you reacted" : ""}`}
                    className={cn(
                      "h-7 min-w-0 gap-1.5 rounded-full px-2.5 text-[0.8125rem] font-medium shadow-none transition-[background-color,border-color,color,transform] duration-150 select-none motion-reduce:transition-none aria-pressed:border-foreground/30 aria-pressed:bg-muted aria-pressed:text-foreground",
                      disabled
                        ? "cursor-default not-aria-pressed:hover:bg-background not-aria-pressed:hover:text-muted-foreground"
                        : "active:scale-[0.96] motion-reduce:active:scale-100",
                    )}
                  >
                    <span aria-hidden="true" className="text-base leading-none">{reaction.emoji}</span>
                    <span aria-hidden="true" className="tabular-nums">{reaction.count}</span>
                  </Toggle>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-56 leading-snug">
                  <span className="font-medium">{whoReacted(reaction, locale)}</span>
                  <span className="text-background/70"> reacted with {name.toLowerCase()}</span>
                </TooltipContent>
              </Tooltip>
            );
          })}
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                disabled={disabled}
                aria-label="Add reaction"
                className="h-7 gap-0.5 rounded-full px-2 text-muted-foreground shadow-none hover:text-foreground"
              >
                <IconSmile className="size-4" />
                <IconPlus className="size-3" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" collisionPadding={8} aria-label="Pick a reaction" className="w-auto max-w-[calc(100vw-1rem)] p-1.5">
              <PaletteGrid
                palette={palette}
                mine={mine}
                present={present}
                full={full}
                max={max}
                onPick={(item) => {
                  toggle(item.emoji, item.label);
                  setOpen(false);
                }}
              />
            </PopoverContent>
          </Popover>
        </div>
      </TooltipProvider>
      {note?.tone === "error" ? (
        <p role="alert" className="flex items-center gap-1.5 text-xs text-destructive">
          <IconAlertCircle className="size-3.5 shrink-0" />
          {note.text}
        </p>
      ) : null}
      <p role="status" className="sr-only">{note?.tone === "ok" ? note.text : ""}</p>
    </div>
  );
}

interface PaletteGridProps {
  palette: readonly PaletteEmoji[];
  /** Emoji you have reacted with. */
  mine: ReadonlySet<string>;
  /** Emoji that already have a chip. */
  present: ReadonlySet<string>;
  full: boolean;
  max: number;
  onPick: (item: PaletteEmoji) => void;
}

/** A grid you walk with the arrow keys: one tab stop, Home and End for the row, Ctrl with them for the whole palette. */
function PaletteGrid({ palette, mine, present, full, max, onPick }: PaletteGridProps) {
  const [active, setActive] = useState(0);
  const cells = useRef<(HTMLButtonElement | null)[]>([]);
  const last = palette.length - 1;
  const rows = Array.from({ length: Math.ceil(palette.length / COLUMNS) }, (_, row) => palette.slice(row * COLUMNS, row * COLUMNS + COLUMNS));

  function walk(event: KeyboardEvent<HTMLDivElement>) {
    const column = active % COLUMNS;
    const target: Record<string, number> = {
      ArrowRight: Math.min(last, active + 1),
      ArrowLeft: Math.max(0, active - 1),
      ArrowDown: active + COLUMNS <= last ? active + COLUMNS : active,
      ArrowUp: active - COLUMNS >= 0 ? active - COLUMNS : active,
      Home: event.ctrlKey ? 0 : active - column,
      End: event.ctrlKey ? last : Math.min(last, active - column + COLUMNS - 1),
    };
    const next = target[event.key];
    if (next === undefined) return;
    event.preventDefault();
    setActive(next);
    cells.current[next]?.focus();
  }

  return (
    <div>
      <div role="grid" aria-label="Reactions" onKeyDown={walk}>
        {rows.map((items, row) => (
          <div key={row} role="row" className="flex">
            {items.map((item, column) => {
              const index = row * COLUMNS + column;
              const blocked = full && !present.has(item.emoji);
              return (
                <div key={`${item.emoji}-${index}`} role="gridcell">
                  <button
                    ref={(element) => {
                      cells.current[index] = element;
                    }}
                    type="button"
                    tabIndex={index === active ? 0 : -1}
                    aria-label={item.label}
                    aria-pressed={mine.has(item.emoji)}
                    aria-disabled={blocked || undefined}
                    onFocus={() => setActive(index)}
                    onClick={() => {
                      if (!blocked) onPick(item);
                    }}
                    className={cn(
                      "grid size-9 place-items-center rounded-md text-xl leading-none outline-none transition-[background-color,transform] duration-150 hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/40 active:scale-90 motion-reduce:transition-none motion-reduce:active:scale-100",
                      mine.has(item.emoji) && "bg-muted ring-1 ring-border",
                      blocked && "cursor-not-allowed opacity-35 hover:bg-transparent active:scale-100",
                    )}
                  >
                    <span aria-hidden="true">{item.emoji}</span>
                  </button>
                </div>
              );
            })}
          </div>
        ))}
      </div>
      {full ? (
        <p className="max-w-72 px-2 pt-2 pb-1 text-xs leading-snug text-muted-foreground">
          This message has {max} different reactions, the most it can hold. Press one that is there to add yours or take it back.
        </p>
      ) : null}
    </div>
  );
}
