"use client";

import { Fragment, useEffect, useId, useMemo, useState, type ComponentProps } from "react";
import { Select as SelectPrimitive } from "radix-ui";

import { IconChevronDown } from "@rhs-ui/icons";
import {
  DEFAULT_LABELS,
  chosenIn,
  closesSentence,
  fill,
  optionsOf,
  sentenceText,
  tokensOf,
  type SentenceFieldsLabels,
  type SentencePiece,
  type SentenceSlot,
  type SentenceText,
  type SentenceValue,
  type SlotToken,
} from "@rhs-ui/application/sentence-fields/sentence";
import { Select, SelectContent, SelectItem, SelectValue } from "@rhs-ui/primitives/select";
import { cn } from "@/lib/utils";

export type { SentenceFieldsLabels, SentenceOption, SentencePiece, SentenceSlot, SentenceText, SentenceValue, SlotCondition } from "@rhs-ui/application/sentence-fields/sentence";

export interface SentenceFieldsProps extends Omit<ComponentProps<"div">, "children" | "defaultValue" | "onChange"> {
  /** The sentence: an array of plain words, `{ slot: "id" }` for a choice and `{ text: "at", withSlot: "time" }` for words that come and go with a slot, or one string with `{id}` marks ("Email me {frequency} at {time}."). Spaces between the pieces are added for you. */
  template: string | readonly SentencePiece[];
  /** The choices in the sentence: an id, the options, a placeholder, and when it is shown. */
  slots: readonly SentenceSlot[];
  /** What is chosen in each slot, by slot id, when you control the sentence. */
  value?: SentenceValue;
  /** What is chosen to begin with, when the sentence keeps that itself. */
  defaultValue?: SentenceValue;
  /** Called with the whole value whenever a slot changes. A slot that is hidden keeps its answer, so it is still there when it comes back. */
  onValueChange?: (value: SentenceValue) => void;
  /** Called with the sentence as plain text, and whether every slot that is shown has an answer, whenever either changes: for a confirmation step. */
  onSentenceChange?: (sentence: SentenceText) => void;
  /** The sentence's name for a plain form submit: one field `<name>.<slot id>` per slot that is shown. */
  name?: string;
  /** Turn the whole sentence off. */
  disabled?: boolean;
  /** The words the sentence says, for translation. */
  labels?: SentenceFieldsLabels;
}

/**
 * A slot is a word of the sentence that happens to be a control: underlined like a link in the text, a little heavier, and tinted on hover and while open.
 * Its words wrap inside it when the choice is longer than the line ("uptime drops below 99%" on a phone), and a very long word is broken, so nothing runs out of the card.
 */
const SLOT = cn(
  "group/slot -mx-0.5 inline-flex max-w-full items-baseline gap-1 rounded-sm px-0.5 text-start align-baseline font-medium [overflow-wrap:anywhere] whitespace-normal text-foreground outline-none",
  "underline decoration-foreground/45 decoration-[1.5px] underline-offset-[0.3em]",
  "transition-[background-color,text-decoration-color] duration-150 motion-reduce:transition-none",
  "hover:bg-muted hover:decoration-foreground data-[state=open]:bg-muted data-[state=open]:decoration-foreground",
  "focus-visible:ring-[3px] focus-visible:ring-ring/40",
  "data-[placeholder]:font-normal data-[placeholder]:text-muted-foreground data-[placeholder]:decoration-dashed data-[placeholder]:hover:text-foreground",
  "disabled:cursor-not-allowed disabled:opacity-60",
);

interface SlotSelectProps {
  token: SlotToken;
  value: SentenceValue;
  name: string | undefined;
  disabled: boolean;
  words: Required<SentenceFieldsLabels>;
  onChange: (id: string, next: string) => void;
  /** How many characters long the word kept in front of it is ("at"): the slot leaves room for that word on the line, so the two never run past it together. */
  lead?: number;
}

/** One slot: a select whose trigger is a word. The select is the house one (Radix underneath), so the list, typeahead and arrow keys come with it. */
function SlotSelect({ token, value, name, disabled, words, onChange, lead }: SlotSelectProps) {
  const { slot } = token;
  const options = optionsOf(slot);
  const held = chosenIn(slot, value);
  const placeholder = slot.placeholder ?? words.choose;
  const selected = options.find((option) => option.value === held)?.label ?? placeholder;
  const label = slot.label ?? (token.words || slot.id.replace(/[-_]+/g, " "));
  return (
    <Select value={held} onValueChange={(next) => onChange(slot.id, next)} disabled={disabled} name={name}>
      <SelectPrimitive.Trigger data-slot="sentence-slot" aria-label={fill(words.slotName, { label, value: selected })} className={SLOT} style={lead ? { maxWidth: `calc(100% - ${lead + 1}ch)` } : undefined}>
        <SelectValue placeholder={placeholder} />
        <IconChevronDown aria-hidden="true" className="size-[0.7em] shrink-0 self-center opacity-60 transition-transform duration-150 group-data-[state=open]/slot:rotate-180 motion-reduce:transition-none" />
      </SelectPrimitive.Trigger>
      <SelectContent align="start" className="max-h-72">
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/**
 * A rule that reads as a sentence, with its choices inside it: "Email me
 * every Monday at 09:00 about new orders." Each choice is a slot, a select
 * dressed as an underlined word that opens a small list; Tab walks the slots
 * in reading order and the list has typeahead and arrow keys. The sentence is
 * a group named by its own words, written out in full for a screen reader, and
 * each slot is named by what stands in front of it ("Email me: every
 * Monday"), or by its `label` ("Frequency: every Monday"). A slot can depend
 * on another and go away with its words when the other changes, as the time
 * does when the frequency is "as it happens"; it keeps its answer for when it
 * comes back. The finished sentence is also given as plain text through
 * onSentenceChange, with whether it is complete, for a confirmation step, and
 * sentenceText() writes it from a saved value anywhere else.
 */
export function SentenceFields({ template, slots, value, defaultValue, onValueChange, onSentenceChange, name, disabled = false, labels, className, ...props }: SentenceFieldsProps) {
  const words = { ...DEFAULT_LABELS, ...labels };
  const plainId = useId();
  const [own, setOwn] = useState<SentenceValue>(defaultValue ?? {});
  const current = value ?? own;

  const tokens = useMemo(() => tokensOf(template, slots, current), [template, slots, current]);
  const sentence = useMemo(() => sentenceText(template, slots, current, words.blank), [template, slots, current, words.blank]);

  useEffect(() => {
    onSentenceChange?.(sentence);
  }, [sentence.text, sentence.complete]);

  function change(id: string, next: string) {
    if (disabled) return;
    const merged = { ...current, [id]: next };
    if (value === undefined) setOwn(merged);
    onValueChange?.(merged);
  }

  return (
    <div
      data-slot="sentence-fields"
      role="group"
      aria-labelledby={plainId}
      className={cn("text-lg leading-[2.4rem] tracking-[-0.01em] text-pretty text-foreground sm:text-xl sm:leading-[2.75rem]", className)}
      {...props}
    >
      {/* The sentence in plain words: the name of the group, and what a screen reader hears first. */}
      <span id={plainId} aria-hidden="true" className="sr-only">
        {sentence.text}
      </span>
      {tokens.map((token, index) => {
        const lead = index > 0 && !(token.kind === "text" && closesSentence(token.text)) ? " " : null;
        if (token.kind === "slot") {
          // A slot that follows words is drawn with them, below; the last word in front of it is kept with it ("at 09:00"), so a line never ends on "at" and starts on the time.
          if (tokens[index - 1]?.kind === "text") return null;
          return (
            <Fragment key={`slot-${token.slot.id}`}>
              {lead}
              <SlotSelect token={token} value={current} name={name ? `${name}.${token.slot.id}` : undefined} disabled={disabled} words={words} onChange={change} />
            </Fragment>
          );
        }
        const next = tokens[index + 1];
        if (next?.kind !== "slot") {
          return (
            <Fragment key={`text-${index}-${token.text}`}>
              {lead}
              {token.text}
            </Fragment>
          );
        }
        const cut = token.text.lastIndexOf(" ");
        return (
          <Fragment key={`text-${index}-${token.text}`}>
            {lead}
            {cut < 0 ? null : `${token.text.slice(0, cut)} `}
            {/* The word and its slot never part, so a line does not end on "at": only the word is held on one line, and the words of a long choice wrap inside the slot. */}
            <span className="whitespace-nowrap">
              {token.text.slice(cut + 1)}{" "}
              <SlotSelect token={next} value={current} name={name ? `${name}.${next.slot.id}` : undefined} disabled={disabled} words={words} onChange={change} lead={token.text.length - cut - 1} />
            </span>
          </Fragment>
        );
      })}
    </div>
  );
}
