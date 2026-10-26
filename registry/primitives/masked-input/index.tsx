"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type ComponentProps } from "react";

import { Input } from "@rhs-ui/primitives/input";
import { applyMask, cleanRaw, ghostChar, maskCapacity, parseMask, unmask, type MaskDefinitions } from "@rhs-ui/primitives/masked-input/mask";
import { cn } from "@/lib/utils";

export interface MaskedInputProps extends Omit<ComponentProps<"input">, "value" | "defaultValue" | "onChange" | "type" | "maxLength"> {
  /** The shape of the value. # is a digit, A a letter (made a capital) and * a letter or a digit; every other character is written for you. A backslash makes the next character a literal. "(###) ###-####", "AA-####", "#### AA". */
  mask: string;
  /** The characters without the literals ("5551234567"), when you control it. */
  value?: string;
  /** The characters to start with, when you do not control it. */
  defaultValue?: string;
  /** Called on every change with the characters without literals and the text as shown, and whether the mask is full. */
  onValueChange?: (raw: string, formatted: string, state: { complete: boolean }) => void;
  /** Show what is still to be filled as quiet text behind the typed part, with an underscore for every place: "(555) 01_ ___-____". Default false. */
  showMask?: boolean;
  /** Tokens of your own, by character: `{ H: /[0-9a-f]/i }` makes H a hexadecimal digit. They are added to #, A and *, or replace them. */
  definitions?: MaskDefinitions;
}

/**
 * A text input that formats as you type from a simple pattern, such as
 * (###) ###-#### for a phone number, #### AA for a postcode or AA-#### for
 * a reference: the literals are inserted for you, what a place does not accept
 * is not typed, and the value you get is the bare characters. The caret keeps
 * its logical place after every edit, in the middle of the value too: typing,
 * Backspace and Delete step over the literals, and a paste keeps what the mask
 * allows and drops the rest. `showMask` draws the unfilled part as quiet text
 * behind what was typed. It chooses the numeric keyboard when the mask only
 * takes digits. It is the base for postal codes, plates, references and ids
 * that have no field of their own.
 */
export function MaskedInput({ mask, value, defaultValue = "", onValueChange, showMask = false, definitions, className, placeholder, ref, ...props }: MaskedInputProps) {
  const input = useRef<HTMLInputElement | null>(null);
  // The field keeps the ref you pass and uses its own to write the text it shows.
  const attach = useCallback(
    (node: HTMLInputElement | null) => {
      input.current = node;
      if (typeof ref === "function") ref(node);
      else if (ref) ref.current = node;
    },
    [ref],
  );
  const slots = useMemo(() => parseMask(mask, definitions), [mask, definitions]);
  const [own, setOwn] = useState(() => cleanRaw(value ?? defaultValue, slots));
  const raw = value === undefined ? own : cleanRaw(value, slots);
  const { text, used } = applyMask(raw, slots);
  // What the field starts with. It is never changed afterwards: the effect below keeps it in step.
  const [initial] = useState(text);

  // The field is not controlled by React: the caret has to be set by hand after every edit, and React would put it at the end when it rewrote the text. So
  // the text is written here whenever it is not what the field shows (a value from outside, or one your state refused).
  useEffect(() => {
    const node = input.current;
    if (node && node.value !== text) node.value = text;
  });

  function change(event: ChangeEvent<HTMLInputElement>) {
    const node = event.currentTarget;
    const native = event.nativeEvent as InputEvent;
    let { raw: next, before } = unmask(node.value, slots, node.selectionStart ?? node.value.length);
    // Backspace or Delete next to a literal removed only the literal, which the mask writes straight back: the person meant the character beside it.
    if (next === raw && node.value.length === text.length - 1) {
      if (native.inputType === "deleteContentBackward" && before > 0) {
        next = next.slice(0, before - 1) + next.slice(before);
        before -= 1;
      } else if (native.inputType === "deleteContentForward" && before < next.length) {
        next = next.slice(0, before) + next.slice(before + 1);
      }
    }
    const shown = applyMask(next, slots);
    node.value = shown.text;
    const caret = before >= next.length ? shown.text.length : before === 0 ? (shown.ends[0] ?? 1) - 1 : (shown.ends[before - 1] ?? shown.text.length);
    node.setSelectionRange(caret, caret);
    if (value === undefined) setOwn(next);
    onValueChange?.(next, shown.text, { complete: next.length === maskCapacity(slots) });
  }

  const digits = slots.some((slot) => slot.kind === "token") && slots.every((slot) => slot.kind === "literal" || (slot.token.pattern.test("5") && !slot.token.pattern.test("a")));
  const capitals = slots.some((slot) => slot.kind === "token" && slot.token.transform);

  return (
    <div data-slot="masked-input" className={cn("relative w-full", className)}>
      <Input
        ref={attach}
        type="text"
        inputMode={digits ? "numeric" : "text"}
        autoComplete="off"
        autoCapitalize={capitals ? "characters" : "off"}
        autoCorrect="off"
        spellCheck={false}
        {...props}
        defaultValue={initial}
        onChange={change}
        placeholder={showMask ? undefined : placeholder}
        className="tabular-nums"
      />
      {showMask ? (
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 flex items-center overflow-hidden px-[calc(0.75rem+1px)] text-sm whitespace-pre tabular-nums">
          <span className="invisible">{text}</span>
          <span className="text-muted-foreground/80">
            {/* A little air between the places so they can be counted; the literals stay as tight as they will be once typed. */}
            {slots.slice(used).map((slot, index) =>
              slot.kind === "token" ? (
                <span key={index} className="tracking-[0.12em]">
                  {ghostChar(slot)}
                </span>
              ) : (
                ghostChar(slot)
              ),
            )}
          </span>
        </div>
      ) : null}
    </div>
  );
}
