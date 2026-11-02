"use client";

import { useEffect, useId, useRef, useState, type ComponentProps } from "react";

import { IconAlertCircle, IconInfo, IconSmartphone } from "@rhs-ui/icons";
import { Label } from "@rhs-ui/primitives/label";
import { countSms, DEFAULT_LABELS, describeCharacter, hasPlainForm, plainText, type SmsCount, type SmsLabels } from "@rhs-ui/primitives/sms-message-field/sms";
import { Textarea } from "@rhs-ui/primitives/textarea";
import { cn } from "@/lib/utils";

export type { SmsCount, SmsEncoding, SmsLabels } from "@rhs-ui/primitives/sms-message-field/sms";

export interface SmsMessageFieldProps extends Omit<ComponentProps<"textarea">, "value" | "defaultValue" | "onChange" | "children" | "rows" | "maxLength"> {
  /** The message, when you control it. */
  value?: string;
  /** The message to start with, when you do not control it. */
  defaultValue?: string;
  /** Called with the message and what it will cost as text messages, on every change. */
  onValueChange?: (value: string, count: SmsCount) => void;
  /** The most messages one text may take. Past it the counter and the bar turn to the error colour and the field is `aria-invalid`; nothing is cut off. */
  maxSegments?: number;
  /** The name the messages arrive from, shown beside the label: "Northwind". It is not part of the count. */
  senderLabel?: string;
  /** The name of the field, shown above it. */
  label?: string;
  /** Keep `label` for assistive technology only. */
  hideLabel?: boolean;
  /** How many lines of text show before the field grows or scrolls. Default 4. */
  rows?: number;
  /** The field's name for a plain form submit: the message as it is. */
  name?: string;
  /** The words the field says, for another language or your own voice. */
  labels?: Partial<SmsLabels>;
}

/** At most this many bars show; a message longer than that fills them all. */
const MAX_BARS = 8;

/** Variation selectors and the joiner inside an emoji sequence: part of the emoji, not something to name. */
const INVISIBLE = new Set([0xfe0e, 0xfe0f, 0x200d]);

/** A list in words: "a", "a and b", "a, b and c". */
function inWords(items: readonly string[]): string {
  return items.length < 2 ? (items[0] ?? "") : `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

/**
 * A text message box that counts messages, not characters. One message holds
 * 160 characters in the standard alphabet and only 70 once a single character
 * is outside it, and a text that runs longer is split into parts of 153 or 67.
 * The counter reads "2 messages, 214 characters, Unicode" next to a bar that
 * fills one segment per message, and a line names the characters that forced
 * Unicode (an emoji, a curly apostrophe) so they can be taken out, with one
 * button that swaps the look-alikes for plain ones. Characters of the extension
 * table (the euro sign, brackets, braces and a few more) count double, and in
 * Unicode so does an emoji, which the line says as soon as one is in the text. The count is announced
 * politely only when the number of messages changes. The helpers `countSms` and
 * `plainText` live in `sms-message-field/sms`.
 */
export function SmsMessageField({
  value,
  defaultValue = "",
  onValueChange,
  maxSegments,
  senderLabel,
  label,
  hideLabel = false,
  rows = 4,
  name,
  labels: labelOverrides,
  id,
  disabled,
  readOnly,
  className,
  "aria-label": ariaLabel,
  "aria-labelledby": labelledBy,
  "aria-describedby": describedBy,
  ...props
}: SmsMessageFieldProps) {
  const uid = useId();
  const areaId = id ?? `${uid}-area`;
  const counterId = `${uid}-counter`;
  const noteId = `${uid}-note`;
  const labels: SmsLabels = { ...DEFAULT_LABELS, ...labelOverrides };
  const [own, setOwn] = useState(defaultValue);
  const [said, setSaid] = useState("");
  const text = value ?? own;
  const area = useRef<HTMLTextAreaElement | null>(null);
  const count = countSms(text);
  const before = useRef(count.segments);

  // The number of messages is announced when it changes, not on every key.
  useEffect(() => {
    if (before.current === count.segments) return;
    before.current = count.segments;
    setSaid(count.segments === 0 ? "" : labels.announce(count.segments, count.encoding));
  }, [count.segments, count.encoding, labels]);

  useEffect(() => {
    if (!said) return;
    const timer = window.setTimeout(() => setSaid(""), 4000);
    return () => window.clearTimeout(timer);
  }, [said]);

  function write(next: string) {
    if (value === undefined) setOwn(next);
    onValueChange?.(next, countSms(next));
  }

  function replace() {
    const node = area.current;
    const next = plainText(text);
    if (!node || next === text) return;
    node.focus();
    node.select();
    // insertText is an edit the browser knows about, so Ctrl or Cmd+Z brings the curly quotes back.
    let done = false;
    try {
      done = document.execCommand("insertText", false, next);
    } catch {
      done = false;
    }
    if (!done) write(next);
    setSaid(labels.replaced);
  }

  const over = maxSegments !== undefined && count.segments > maxSegments;
  const forcing = count.forcing.filter((character) => !INVISIBLE.has(character.codePointAt(0) ?? 0));
  const names = forcing.slice(0, 4).map((character) => (/\s/.test(character) ? describeCharacter(character) : `${character} (${describeCharacter(character)})`));
  if (forcing.length > names.length) names.push(`${forcing.length - names.length} more`);
  const standard = 160;
  const bars = Math.min(MAX_BARS, Math.max(1, maxSegments ?? Math.max(3, count.segments)));
  const hasPlain = forcing.some((character) => hasPlainForm(character));
  const doubled = count.doubled.map((character) => (character === "\f" ? "form feed" : character));
  // In Unicode an emoji takes two places while the counter counts it once, so the limit and the count only add up with that said.
  const wide = count.encoding === "unicode" && count.units > count.characters;
  const note =
    count.encoding === "unicode" ? `${labels.forcedBy(inWords(names), 70, standard)}${wide ? ` ${labels.emojiDoubled}` : ""}` : doubled.length > 0 ? labels.doubled(doubled.join(" ")) : null;
  /** How full the bar of one message is, from 0 to 1. */
  const fill = (index: number) => Math.min(1, (count.parts[index] ?? 0) / count.perSegment);
  const named = label !== undefined || id !== undefined || ariaLabel !== undefined || labelledBy !== undefined;

  return (
    <div data-slot="sms-message-field" className={cn("grid w-full min-w-0 grid-cols-1 gap-2", className)}>
      {label || senderLabel ? (
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          {label ? (
            <Label htmlFor={areaId} className={cn(hideLabel && "sr-only")}>
              {label}
            </Label>
          ) : (
            <span />
          )}
          {senderLabel ? (
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <IconSmartphone aria-hidden="true" className="size-3.5" />
              <span>
                From <span className="font-medium text-foreground">{senderLabel}</span>
              </span>
            </span>
          ) : null}
        </div>
      ) : null}
      <Textarea
        {...props}
        ref={area}
        id={areaId}
        name={name}
        rows={rows}
        readOnly={readOnly}
        disabled={disabled}
        value={text}
        aria-label={named ? ariaLabel : labels.name}
        aria-labelledby={labelledBy}
        aria-invalid={over ? true : undefined}
        aria-describedby={[describedBy, counterId, note ? noteId : ""].filter(Boolean).join(" ")}
        onChange={(event) => {
          setSaid("");
          write(event.target.value);
        }}
      />
      <div aria-hidden="true" className="flex gap-1">
        {Array.from({ length: bars }, (_, index) => (
          <span key={index} className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-muted">
            <span
              className={cn("block h-full rounded-full transition-[width] duration-150 motion-reduce:transition-none", over ? "bg-destructive" : "bg-foreground")}
              style={{ width: `${Math.round(fill(index) * 100)}%` }}
            />
          </span>
        ))}
      </div>
      <p id={counterId} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 text-xs text-muted-foreground tabular-nums">
        <span>
          <span className={cn("font-medium", over ? "text-destructive" : "text-foreground")}>{labels.messages(count.segments)}</span>
          {", "}
          {labels.characters(count.characters)}
          {", "}
          <span className={cn(count.encoding === "unicode" && "font-medium text-foreground")}>{count.encoding === "unicode" ? labels.unicode : labels.gsm}</span>
        </span>
        {count.segments > 0 ? <span>{labels.left(count.left, count.segments)}</span> : null}
      </p>
      {note || over ? (
        <div id={noteId} className="grid gap-1.5 text-xs">
          {over && maxSegments !== undefined ? (
            <p className="flex items-start gap-1.5 text-destructive">
              <IconAlertCircle aria-hidden="true" className="mt-px size-3.5 shrink-0" />
              {labels.over(count.segments, maxSegments)}
            </p>
          ) : null}
          {note ? (
            <p className="flex items-start gap-1.5 text-muted-foreground">
              <IconInfo aria-hidden="true" className="mt-px size-3.5 shrink-0" />
              <span className="min-w-0 [overflow-wrap:anywhere]">
                {note}
                {hasPlain && !readOnly && !disabled ? (
                  <>
                    {" "}
                    <button
                      type="button"
                      onClick={replace}
                      className="-mx-0.5 rounded-sm px-0.5 font-medium text-foreground underline decoration-foreground/30 underline-offset-4 outline-none hover:decoration-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40"
                    >
                      {labels.usePlain}
                    </button>
                  </>
                ) : null}
              </span>
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
