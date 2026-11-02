"use client";

import { useEffect, useId, useState, type ComponentProps } from "react";

import { IconCheck, IconInfo, IconPlus } from "@rhs-ui/icons";
import { Label } from "@rhs-ui/primitives/label";
import { addPhrase, DEFAULT_LABELS, locate, removePhrase, toPhrases, type QuickPhrase, type QuickPhrasesLabels } from "@rhs-ui/primitives/quick-phrases-field/phrases";
import { Textarea } from "@rhs-ui/primitives/textarea";
import { Toggle } from "@rhs-ui/primitives/toggle";
import { cn } from "@/lib/utils";

export type { QuickPhrase, QuickPhrasesLabels } from "@rhs-ui/primitives/quick-phrases-field/phrases";

export interface QuickPhrasesFieldProps extends Omit<ComponentProps<"textarea">, "value" | "defaultValue" | "onChange" | "children" | "rows" | "maxLength"> {
  /** The text, when you control it. */
  value?: string;
  /** The text to start with, when you do not control it. */
  defaultValue?: string;
  /** Called with the whole text on every change, whether it was typed or made by a phrase. */
  onValueChange?: (value: string) => void;
  /** The phrases on offer. A string is its own id; use `{ id, text }` when the same words appear twice or the text is translated. */
  phrases: readonly (string | QuickPhrase)[];
  /** What goes between two phrases. A line break by default; ", " or ". " keeps them in one sentence. */
  separator?: string;
  /** The name of the field, shown above it. */
  label: string;
  /** Keep `label` for assistive technology only. */
  hideLabel?: boolean;
  /** The small heading over the phrases. Default "Quick phrases". */
  phrasesLabel?: string;
  /** The most characters the text may hold. A phrase that no longer fits is disabled, and a line under the phrases says why. */
  maxLength?: number;
  /** How many lines of text show before the field grows or scrolls. Default 3. */
  rows?: number;
  /** The field's name for a plain form submit: the text as it is. */
  name?: string;
  /** The words the field says, for another language or your own voice. */
  labels?: Partial<QuickPhrasesLabels>;
}

/**
 * A textarea with one-tap phrases underneath: "Leave at the door", "Ring
 * twice", "Call on arrival". A tap adds the phrase to the end of the text on a
 * line of its own (or behind `separator`), and a phrase that is in the text
 * shows as pressed and comes out again with a second tap, whether it was tapped
 * or typed by hand. Writing freely stays the main way in: the phrases are
 * shortcuts, and the text is always plain text you can edit. Every add and
 * remove is announced politely, and a phrase that would push the text past
 * `maxLength` is disabled, with the reason in words under the phrases. It suits
 * delivery notes, support replies, review tags and appointment requests, where
 * most notes are the same five sentences.
 */
export function QuickPhrasesField({
  value,
  defaultValue = "",
  onValueChange,
  phrases,
  separator = "\n",
  label,
  hideLabel = false,
  phrasesLabel = "Quick phrases",
  maxLength,
  rows = 3,
  name,
  labels: labelOverrides,
  id,
  disabled,
  className,
  "aria-describedby": describedBy,
  ...props
}: QuickPhrasesFieldProps) {
  const uid = useId();
  const labels: QuickPhrasesLabels = { ...DEFAULT_LABELS, ...labelOverrides };
  const areaId = id ?? `${uid}-area`;
  const captionId = `${uid}-caption`;
  const noteId = `${uid}-note`;
  const [own, setOwn] = useState(defaultValue);
  const [said, setSaid] = useState("");
  const text = value ?? own;

  // What a screen reader was told stays only while it is news; the region is read as a whole.
  useEffect(() => {
    if (!said) return;
    const timer = window.setTimeout(() => setSaid(""), 4000);
    return () => window.clearTimeout(timer);
  }, [said]);

  function write(next: string) {
    if (value === undefined) setOwn(next);
    onValueChange?.(next);
  }

  const left = maxLength === undefined ? Number.POSITIVE_INFINITY : maxLength - text.length;
  const chips = toPhrases(phrases).map((phrase) => {
    const pressed = locate(text, phrase.text, separator) !== null;
    const need = pressed ? 0 : addPhrase(text, phrase.text, separator).length - text.length;
    return { phrase, pressed, need, blocked: !pressed && need > left };
  });
  const blocked = chips.filter((chip) => chip.blocked).length;
  const near = maxLength !== undefined && left <= Math.max(10, Math.round(maxLength * 0.1));

  function change(phrase: QuickPhrase, wanted: boolean) {
    const next = wanted ? addPhrase(text, phrase.text, separator) : removePhrase(text, phrase.text, separator);
    if (next === text) return;
    setSaid(wanted ? labels.added(phrase.text) : labels.removed(phrase.text));
    write(next);
  }

  const note =
    blocked === 0
      ? null
      : left <= 0
        ? labels.full(maxLength ?? 0)
        : labels.tooLong(blocked, left);

  return (
    <div data-slot="quick-phrases-field" className={cn("grid w-full min-w-0 grid-cols-1 gap-2", className)}>
      <div className="flex items-baseline justify-between gap-3">
        <Label htmlFor={areaId} className={cn(hideLabel && "sr-only")}>
          {label}
        </Label>
        {maxLength !== undefined ? (
          <span aria-live={near ? "polite" : "off"} className={cn("text-xs tabular-nums", left < 0 ? "font-medium text-destructive" : near ? "text-foreground" : "text-muted-foreground")}>
            {text.length}/{maxLength}
          </span>
        ) : null}
      </div>
      <Textarea
        {...props}
        id={areaId}
        name={name}
        rows={rows}
        maxLength={maxLength}
        disabled={disabled}
        value={text}
        aria-describedby={[describedBy, note ? noteId : ""].filter(Boolean).join(" ") || undefined}
        onChange={(event) => {
          setSaid("");
          write(event.target.value);
        }}
      />
      {chips.length > 0 ? (
        <div role="group" aria-labelledby={captionId} className="mt-1 grid grid-cols-1 gap-2">
          <p id={captionId} className="text-xs font-medium text-muted-foreground">
            {phrasesLabel}
          </p>
          <div className="flex flex-wrap gap-2">
            {chips.map(({ phrase, pressed, need, blocked: isBlocked }) => (
              // A long phrase wraps inside its chip rather than being cut off: whoever taps it should be able to read what is about to be written.
              // On a touch screen the chip grows to a thumb-sized target by padding, so the text stays centred and the layout stays a plain wrap.
              <Toggle
                key={phrase.id}
                variant="outline"
                size="sm"
                pressed={pressed}
                disabled={disabled || isBlocked}
                onPressedChange={(wanted) => change(phrase, wanted)}
                className="h-auto min-h-8 max-w-full min-w-0 shrink items-start py-1.5 leading-snug whitespace-normal [@media(pointer:coarse)]:py-2.5"
              >
                {pressed ? <IconCheck className="mt-0.5 size-3.5" /> : <IconPlus className="mt-0.5 size-3.5" />}
                <span className="min-w-0 text-left [overflow-wrap:anywhere]">{phrase.text}</span>
                {isBlocked ? (
                  <span className="sr-only">{labels.needs(need, Math.max(0, left))}</span>
                ) : null}
              </Toggle>
            ))}
          </div>
          {note ? (
            <p id={noteId} className="flex items-start gap-1.5 text-xs text-muted-foreground">
              <IconInfo aria-hidden="true" className="mt-px size-3.5 shrink-0" />
              {note}
            </p>
          ) : null}
        </div>
      ) : null}
      <span role="status" className="sr-only">
        {said}
      </span>
    </div>
  );
}
