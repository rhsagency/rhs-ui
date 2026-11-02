"use client";

import { useCallback, useEffect, useId, useRef, useState, type ChangeEvent, type ComponentProps, type FocusEvent, type ReactNode } from "react";

import { IconAlertCircle, IconBarcode, IconCheck, IconPlus } from "@rhs-ui/icons";
import { BARCODE_FORMATS, checkDigit, cleanBarcode, groupBarcode, readBarcode, type BarcodeFormat, type BarcodeFormatOption } from "@rhs-ui/primitives/barcode-field/gs1";
import { Button } from "@rhs-ui/primitives/button";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@rhs-ui/primitives/input-group";
import { cn } from "@/lib/utils";

/** What the field reports. */
export interface BarcodeValue {
  /** The digits, without spaces. */
  digits: string;
  /** The format they are read as, or null while a number in `auto` is not yet long enough to tell. */
  format: BarcodeFormat | null;
  /** The number is complete and its check digit is right. */
  valid: boolean;
}

export interface BarcodeFieldProps extends Omit<ComponentProps<"input">, "value" | "defaultValue" | "onChange" | "type" | "inputMode" | "autoComplete" | "maxLength" | "children" | "size" | "name"> {
  /** The digits, without spaces, when you control the field. */
  value?: string;
  /** The digits to start with, when you do not control the field. */
  defaultValue?: string;
  /** Called on every change with the digits, the format they are read as and whether the number is valid. */
  onValueChange?: (value: BarcodeValue) => void;
  /** `ean13`, `upca`, `ean8`, or `auto` (the default), which tells the format from the number of digits: 13 is an EAN-13, 12 a UPC-A, 8 an EAN-8. */
  format?: BarcodeFormatOption;
  /** Something of your own at the end of the field, such as a Scan button. */
  trailing?: ReactNode;
  /** The field's name for a plain form submit: the digits, without spaces, go out in a hidden input. */
  name?: string;
}

// InputGroup keeps its neutral focus ring even on an invalid field; a wrong number keeps its error colour while someone is fixing it.
const STAYS_RED = "has-[input[aria-invalid=true]:focus-visible]:border-destructive has-[input[aria-invalid=true]:focus-visible]:ring-destructive/30";

/** The text, once it has stopped changing for `delay` ms. Starting text is never said, and an emptied one is cleared at once. */
function useSettled(text: string, delay: number): string {
  const [said, setSaid] = useState("");
  const last = useRef(text);
  useEffect(() => {
    if (text === last.current) return;
    last.current = text;
    if (!text) {
      setSaid("");
      return;
    }
    const timer = window.setTimeout(() => setSaid(text), delay);
    return () => window.clearTimeout(timer);
  }, [text, delay]);
  return said;
}

/** Where the caret goes in grouped text so that it stays after the same number of digits. */
function caretAfter(grouped: string, digitsBefore: number): number {
  if (digitsBefore <= 0) return 0;
  let seen = 0;
  for (let index = 0; index < grouped.length; index += 1) {
    if (/\d/.test(grouped[index] ?? "")) {
      seen += 1;
      if (seen === digitsBefore) return index + 1;
    }
  }
  return grouped.length;
}

/** A real number in each format, for the placeholder. */
const SAMPLES: Readonly<Record<BarcodeFormat, string>> = { ean13: "4 006381 333931", upca: "0 36000 29145 2", ean8: "7351 3537" };

const lengthsOf = (formats: readonly BarcodeFormat[]) => {
  const lengths = formats.map((name) => BARCODE_FORMATS[name].length);
  return lengths.length > 1 ? `${lengths.slice(0, -1).join(", ")} or ${lengths[lengths.length - 1]}` : String(lengths[0]);
};

/**
 * A field for the number under a barcode: EAN-13, UPC-A and EAN-8. The digits
 * are written in groups as they are printed on a pack ("4 006381 333931"),
 * whatever way they are typed or pasted, and the caret stays where it was. The
 * GS1 check digit is checked as soon as the number is complete: a wrong last
 * digit is told what it should have been, and a number that is one digit short
 * gets the check digit it asks for as a button ("Add check digit 1"). Under the
 * field a line says which format it has read and how far along it is. `format`
 * fixes one format or, as `auto`, reads it from the length. Put a Scan button
 * of your own in `trailing`. Nothing blocks a submit by itself: `onValueChange`
 * reports `{ digits, format, valid }`, and the same arithmetic is exported from
 * `barcode-field/gs1` for the server.
 */
export function BarcodeField({
  value,
  defaultValue = "",
  onValueChange,
  format = "auto",
  trailing,
  name,
  disabled,
  required,
  placeholder,
  className,
  onFocus,
  onBlur,
  ref,
  "aria-describedby": describedBy,
  ...props
}: BarcodeFieldProps) {
  const base = useId();
  const input = useRef<HTMLInputElement | null>(null);
  // The field keeps the ref you pass and uses its own to put the focus back after the check digit is added.
  const attach = useCallback(
    (node: HTMLInputElement | null) => {
      input.current = node;
      if (typeof ref === "function") ref(node);
      else if (ref) ref.current = node;
    },
    [ref],
  );
  const longest = format === "auto" ? 13 : BARCODE_FORMATS[format].length;
  const [own, setOwn] = useState(() => cleanBarcode(value ?? defaultValue, longest));
  const [synced, setSynced] = useState(value);
  const [focused, setFocused] = useState(false);
  const [touched, setTouched] = useState(false);
  const [note, setNote] = useState("");

  // Digits that arrive from outside replace what is typed.
  if (value !== undefined && value !== synced) {
    setSynced(value);
    const clean = cleanBarcode(value, longest);
    if (clean !== own) setOwn(clean);
  }

  const reading = readBarcode(own, format);
  const shown = groupBarcode(reading.digits, reading.groupAs);
  const info = format === "auto" ? null : BARCODE_FORMATS[format];
  const count = reading.digits.length;
  const last = reading.digits.slice(-1);
  const settledAfterLeaving = touched && !focused;
  // Twelve digits that are a right UPC-A can just as well be the front of an EAN-13 (about one number in ten is both). While the field is in use it does not call itself finished, and the check digit of the EAN-13 stays one tap away.
  const undecided = format === "auto" && reading.state === "valid" && reading.format === "upca" && focused;
  const completion = reading.state === "offer" ? reading.expected : undecided ? checkDigit(reading.digits) : null;

  // What is wrong, in words. A wrong check digit is said at once, since the number is as long as it gets; being short of digits only once the field has been left.
  let error: string | null = null;
  if (reading.state === "wrong") error = `The check digit should be ${reading.expected}, not ${last}. Check the other digits too.`;
  else if (settledAfterLeaving && reading.state === "empty" && required) error = "Enter the barcode number.";
  else if (settledAfterLeaving && reading.state === "offer" && reading.asUpca !== null) error = `Not a valid UPC-A: its last digit should be ${reading.asUpca}. If this is an EAN-13, add its check digit.`;
  else if (settledAfterLeaving && (reading.state === "partial" || reading.state === "offer")) {
    error = info ? `${info.label} has ${info.length} digits; this has ${count}.` : `A barcode number has ${lengthsOf(["ean8", "upca", "ean13"])} digits; this has ${count}.`;
  }

  const formatName = reading.format ? BARCODE_FORMATS[reading.format].label : null;
  const hint = (() => {
    if (undecided) return "Valid as a UPC-A. Typing an EAN-13? One more digit.";
    if (reading.state === "valid") return `${formatName}. Check digit ${last} verified.`;
    if (reading.state === "offer") return info ? `${count} of ${info.length} digits. The last one is the check digit.` : "Looks like an EAN-13 without its check digit.";
    if (reading.state === "empty") return info ? `${info.label}: ${info.length} digits, as printed under the barcode.` : "As printed under the barcode: 13 digits for an EAN-13, 12 for a UPC-A, 8 for an EAN-8.";
    return info ? `${count} of ${info.length} digits.` : `${count} ${count === 1 ? "digit" : "digits"} so far. A barcode number has ${lengthsOf(reading.candidates)} digits.`;
  })();

  const said = useSettled(error ?? (reading.state === "valid" || reading.state === "offer" ? hint : ""), 700);
  useEffect(() => {
    if (!note) return;
    const timer = window.setTimeout(() => setNote(""), 4000);
    return () => window.clearTimeout(timer);
  }, [note]);

  function write(digits: string) {
    const next = readBarcode(digits, format);
    setOwn(next.digits);
    onValueChange?.({ digits: next.digits, format: next.format, valid: next.valid });
    return next;
  }

  function change(event: ChangeEvent<HTMLInputElement>) {
    const node = event.currentTarget;
    const typed = node.value;
    const inputType = (event.nativeEvent as InputEvent).inputType;
    // A key pressed in a full field changes nothing, rather than pushing the last digit out.
    if (inputType === "insertText" && typed.replace(/\D/g, "").length > longest) {
      const caret = Math.max(0, (node.selectionStart ?? 1) - 1);
      node.value = shown;
      node.setSelectionRange(caret, caret);
      return;
    }
    let before = cleanBarcode(typed.slice(0, node.selectionStart ?? typed.length), longest).length;
    let digits = cleanBarcode(typed, longest);
    // Backspace or Delete next to a space took away only the space, which is written straight back: the person meant the digit beside it.
    if (digits === reading.digits && typed.length === shown.length - 1) {
      if (inputType === "deleteContentBackward" && before > 0) {
        digits = digits.slice(0, before - 1) + digits.slice(before);
        before -= 1;
      } else if (inputType === "deleteContentForward" && before < digits.length) {
        digits = digits.slice(0, before) + digits.slice(before + 1);
      }
    }
    const next = write(digits);
    // The text is put right here, before React looks at it, so the caret does not jump to the end when a space is written in the middle.
    const grouped = groupBarcode(next.digits, next.groupAs);
    node.value = grouped;
    const caret = caretAfter(grouped, before);
    node.setSelectionRange(caret, caret);
  }

  function complete() {
    if (completion === null) return;
    const next = write(reading.digits + completion);
    setNote(`Check digit ${completion} added. ${next.format ? BARCODE_FORMATS[next.format].label : "The number"} is valid.`);
    input.current?.focus();
  }

  // The field has been left only when focus is outside all of it: the input, the check digit button and whatever is in `trailing`.
  function leave(event: FocusEvent<HTMLDivElement>) {
    if (event.relatedTarget instanceof Node && event.currentTarget.contains(event.relatedTarget)) return;
    setFocused(false);
    setTouched(true);
  }

  const hintId = `${base}-hint`;
  const sample = SAMPLES[format === "auto" ? "ean13" : format];

  return (
    <div data-slot="barcode-field" data-state={reading.state} onFocus={() => setFocused(true)} onBlur={leave} className={cn("@container grid w-full", className)}>
      <InputGroup className={STAYS_RED}>
        {/* The two icons are for the eye only; where the field is narrower than a phone they give way to the number. */}
        <InputGroupAddon aria-hidden="true" className="@max-[20rem]:hidden">
          <IconBarcode />
        </InputGroupAddon>
        <InputGroupInput
          ref={attach}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          disabled={disabled}
          required={required}
          placeholder={placeholder ?? sample}
          {...props}
          value={shown}
          onChange={change}
          onFocus={onFocus}
          onBlur={onBlur}
          aria-invalid={error ? true : undefined}
          aria-describedby={[describedBy, hintId].filter(Boolean).join(" ")}
          className="font-mono tracking-[0.02em] tabular-nums @max-[20rem]:text-[0.8125rem]"
        />
        {reading.valid && !undecided ? (
          <InputGroupAddon aria-hidden="true" className="pr-2 @max-[20rem]:hidden">
            <IconCheck />
          </InputGroupAddon>
        ) : null}
        {trailing ? <div className="flex shrink-0 items-center gap-1 pr-1">{trailing}</div> : null}
      </InputGroup>
      <div id={hintId} className="mt-1.5 flex min-h-8 flex-wrap items-center gap-x-3 gap-y-1.5 text-xs">
        {error ? (
          <p className="flex min-w-0 items-start gap-1.5 text-destructive">
            <IconAlertCircle aria-hidden="true" className="mt-px size-3.5 shrink-0" />
            <span className="min-w-0 [overflow-wrap:anywhere]">{error}</span>
          </p>
        ) : (
          <p className={cn("min-w-0 [overflow-wrap:anywhere]", reading.valid && !undecided ? "font-medium text-foreground" : "text-muted-foreground")}>{hint}</p>
        )}
        {completion !== null ? (
          // A press must not take the focus from the input: the hint would turn into an error, move this button and the press would miss it.
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled}
            onMouseDown={(event) => event.preventDefault()}
            onClick={complete}
            className="h-7 gap-1 px-2.5 text-xs tabular-nums [&_svg:not([class*='size-'])]:size-3.5"
          >
            <IconPlus aria-hidden="true" />
            Add check digit {completion}
          </Button>
        ) : null}
      </div>
      <span role="status" className="sr-only">
        {note || said}
      </span>
      {name ? <input type="hidden" name={name} value={reading.digits} disabled={disabled} /> : null}
    </div>
  );
}
