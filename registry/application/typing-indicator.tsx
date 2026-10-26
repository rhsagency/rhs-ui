"use client";

import { Fragment, useEffect, useRef, useState, type ComponentProps } from "react";

import { LoadingDots } from "@rhs-ui/primitives/loading-dots";
import { cn } from "@/lib/utils";

/** The small words that join the sentence together, for translation. */
export interface TypingIndicatorLabels {
  /** Between the name and the activity when one person writes. Default "is". */
  is?: string;
  /** The same for two or more people. Default "are". */
  are?: string;
  /** Before the last name or the count of the others. Default "and". */
  and?: string;
  /** The people beyond `max`, with `{count}` filled in. Default "{count} others". */
  others?: string;
}

export interface TypingIndicatorProps extends Omit<ComponentProps<"div">, "children"> {
  /** The names of the people writing right now. Leave it empty and the line goes quiet but keeps its height. */
  people: readonly string[];
  /** How many names are spelled out before "and 2 others". Default 2. One person too many is always named, so "and 1 other" never appears. */
  max?: number;
  /** What they are doing, after "is" or "are": "typing" (the default), "replying", "recording a voice message". */
  label?: string;
  /** The fewest milliseconds between two announcements to a screen reader. The line itself changes at once; only the spoken copy waits. Default 4000. */
  announceEvery?: number;
  /** The words that join the sentence, for translation. */
  labels?: TypingIndicatorLabels;
}

const DEFAULT_LABELS = { is: "is", are: "are", and: "and", others: "{count} others" } satisfies Required<TypingIndicatorLabels>;

const SEPARATOR = "\u001f";

/** The names without blanks and repeats, in the order they came. */
function cleanNames(people: readonly string[]): string[] {
  return [...new Set(people.map((name) => name.trim()).filter(Boolean))];
}

interface Piece {
  text: string;
  /** A real name is set in a heavier weight than the count of the others. */
  name: boolean;
}

/** "Anna", "Anna and Tom", "Anna, Tom and 2 others". The last piece is joined with "and", the rest with commas. */
function piecesOf(names: readonly string[], max: number, words: Required<TypingIndicatorLabels>): Piece[] {
  const limit = Math.max(1, Math.floor(max));
  const overflow = names.length - limit;
  const spelled = overflow > 1 ? names.slice(0, limit) : names;
  const pieces: Piece[] = spelled.map((text) => ({ text, name: true }));
  if (overflow > 1) pieces.push({ text: words.others.replace("{count}", String(overflow)), name: false });
  return pieces;
}

/**
 * The line under a chat or comment thread that says who is writing: "Anna is
 * typing", "Anna and Tom are typing", "Anna, Tom and 2 others are typing". It
 * builds the sentence from the list, draws three pulsing dots only while
 * somebody is writing, and fades to nothing when nobody is, keeping its height
 * so the thread above never jumps. The drawn line changes at once, but the
 * spoken copy is a polite status that waits for a few seconds between
 * announcements, so a busy channel does not flood a screen reader. The dots
 * stand still under reduced motion.
 */
export function TypingIndicator({ people, max = 2, label = "typing", announceEvery = 4000, labels, className, ...props }: TypingIndicatorProps) {
  const words: Required<TypingIndicatorLabels> = { ...DEFAULT_LABELS, ...labels };
  const names = cleanNames(people);
  const key = names.join(SEPARATOR);
  const active = names.length > 0;

  // When the last writer stops, the line fades out still showing them, instead of blanking first.
  const [remembered, setRemembered] = useState(names);
  if (active && remembered.join(SEPARATOR) !== key) setRemembered(names);
  const shown = active ? names : remembered;

  const pieces = piecesOf(shown, max, words);
  const verb = shown.length === 1 ? words.is : words.are;
  const sentence = shown.length
    ? `${pieces.length > 1 ? `${pieces.slice(0, -1).map((piece) => piece.text).join(", ")} ${words.and} ${pieces[pieces.length - 1]?.text}` : pieces[0]?.text} ${verb} ${label}`
    : "";

  // The spoken copy: the first change goes out at once, later ones wait until `announceEvery` has passed since the last.
  const text = active ? sentence : "";
  const [spoken, setSpoken] = useState("");
  const lastSpoken = useRef(0);
  useEffect(() => {
    if (!text) {
      setSpoken("");
      return;
    }
    const wait = Math.max(0, lastSpoken.current + Math.max(0, announceEvery) - Date.now());
    const speak = () => {
      lastSpoken.current = Date.now();
      setSpoken(text);
    };
    if (wait === 0) {
      speak();
      return;
    }
    const timer = window.setTimeout(speak, wait);
    return () => window.clearTimeout(timer);
  }, [text, announceEvery]);

  return (
    <div data-slot="typing-indicator" data-active={active || undefined} className={cn("flex h-7 min-w-0 items-center text-[0.8125rem] text-muted-foreground", className)} {...props}>
      <p
        aria-hidden="true"
        title={sentence || undefined}
        className={cn(
          "inline-flex min-w-0 items-center gap-2 transition-[opacity,transform,visibility] duration-200 ease-out motion-reduce:transition-none",
          active ? "visible translate-y-0 opacity-100" : "invisible translate-y-0.5 opacity-0",
        )}
      >
        <span className="inline-flex h-5 shrink-0 items-center rounded-full bg-muted px-2.5">
          <LoadingDots size="sm" label="" />
        </span>
        <span className="truncate">
          {pieces.map((piece, index) => (
            <Fragment key={piece.text}>
              {index === 0 ? null : index === pieces.length - 1 ? ` ${words.and} ` : ", "}
              {piece.name ? <span className="font-medium text-foreground">{piece.text}</span> : piece.text}
            </Fragment>
          ))}{" "}
          {verb} {label}
        </span>
      </p>
      <span role="status" className="sr-only">
        {spoken}
      </span>
    </div>
  );
}
