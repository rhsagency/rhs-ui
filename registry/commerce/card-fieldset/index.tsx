"use client";

import { useId, useLayoutEffect, useRef, useState, type ChangeEvent, type ComponentProps, type FocusEvent, type KeyboardEvent, type ReactNode } from "react";

import { IconAlertCircle, IconCreditCard } from "@rhs-ui/icons";
import {
  BRANDS,
  UNKNOWN,
  caretAfter,
  codeProblem,
  detectBrand,
  digitsOf,
  expiryDigits,
  expiryProblem,
  expiryValue,
  formatExpiry,
  formatNumber,
  lengthOf,
  luhn,
  maxDigits,
  numberProblem,
  type CardBrand,
} from "@rhs-ui/commerce/card-fieldset/card";
import { Input } from "@rhs-ui/primitives/input";
import { Label } from "@rhs-ui/primitives/label";
import { cn } from "@/lib/utils";

export type { CardBrand } from "@rhs-ui/commerce/card-fieldset/card";

/** What the fieldset holds. The number is digits only, the expiry is "MM/YY" (or "09/2" while the year is half typed). */
export interface CardFieldsetValue {
  /** The card number, digits only: "4242424242424242". */
  number: string;
  /** The expiry as "MM/YY", or "09/2" while the year is half typed. */
  expiry: string;
  /** The security code, digits only: three, or four for American Express. */
  code: string;
  /** The name on the card, from the optional name field (`showName`). */
  name: string;
}

/** What the fieldset knows about the card, next to its value. */
export interface CardFieldsetState {
  /** The network, found from the first digits, or null while they do not say. */
  brand: CardBrand | null;
  /** Every part the fieldset checks itself (not the ones you mount with `renderField`) passes its check. Use it to enable your pay button. */
  valid: boolean;
}

/** The three parts of the frame that a processor's hosted fields can take over. */
export type CardPart = "number" | "expiry" | "code";

/** What `renderField` gets for the part it may replace: wire the hosted field to the same label, error and look. */
export interface CardFieldProps {
  /** Put it on the element that takes the focus: the label of the cell points at it. */
  id: string;
  /** The classes of the built-in field, so a hosted one can look the same (a mock, or the style you hand your processor). */
  className: string;
  /** Set while the part shows an error. */
  "aria-invalid"?: true;
  /** The error and the hint of the part. */
  "aria-describedby"?: string;
  /** Set while the whole fieldset is disabled: turn your hosted field off too. The frame around it is already dimmed. */
  disabled?: true;
}

export interface CardFieldsetLabels {
  /** Names the connected group for a screen reader. */
  group?: string;
  /** The label of the card number. */
  number?: string;
  /** The label of the expiry. */
  expiry?: string;
  /** The label of the security code. */
  code?: string;
  /** The label of the optional name field. */
  name?: string;
  /** What the empty card number shows. */
  numberPlaceholder?: string;
  /** What the empty expiry shows. */
  expiryPlaceholder?: string;
  /** What the empty security code shows. */
  codePlaceholder?: string;
  /** Beside the security code: how long it is. `{count}`. */
  codeHint?: string;
  /** Under the group when the card number is empty and its message is shown. */
  numberEmpty?: string;
  /** Under the group when the card number has fewer digits than its network asks for. `{count}` is how many digits a full number has. */
  numberIncomplete?: string;
  /** Under the group when the card number fails the Luhn check. */
  numberInvalid?: string;
  /** Under the group when the expiry is empty and its message is shown. */
  expiryEmpty?: string;
  /** Under the group when the expiry has no full month and year yet. */
  expiryIncomplete?: string;
  /** Under the group when the month of the expiry is not 01 to 12. */
  expiryMonth?: string;
  /** Under the group when the expiry is in the past. */
  expired?: string;
  /** Under the group when the security code is empty and its message is shown. */
  codeEmpty?: string;
  /** Under the group when the security code is shorter than its network asks. `{count}` is how many digits it should have. */
  codeIncomplete?: string;
}

const WORDS = {
  group: "Card details",
  number: "Card number",
  expiry: "Expiry",
  code: "Security code",
  name: "Name on card",
  numberPlaceholder: "1234 1234 1234 1234",
  expiryPlaceholder: "MM / YY",
  codePlaceholder: "123",
  codeHint: "{count} digits",
  numberEmpty: "Enter the card number.",
  numberIncomplete: "The card number is not complete.",
  numberInvalid: "That card number is not valid. Check the digits.",
  expiryEmpty: "Enter the expiry date.",
  expiryIncomplete: "Enter the expiry as month and year, like 09 / 28.",
  expiryMonth: "The month must be between 01 and 12.",
  expired: "This card has expired.",
  codeEmpty: "Enter the security code.",
  codeIncomplete: "The security code has {count} digits.",
} satisfies Required<CardFieldsetLabels>;

export interface CardFieldsetProps extends Omit<ComponentProps<"div">, "defaultValue" | "onChange" | "children"> {
  /** The card as typed, to control the fieldset. A part you leave out is empty. */
  value?: Partial<CardFieldsetValue>;
  /** The card to start with, when you do not control the fieldset. */
  defaultValue?: Partial<CardFieldsetValue>;
  /** Called on every change with the value and what is known about the card. Nothing is stored, logged or sent: this is the only way out. */
  onChange?: (value: CardFieldsetValue, state: CardFieldsetState) => void;
  /** Add the optional "Name on card" field under the group. */
  showName?: boolean;
  /**
   * Mount your processor's hosted field in the frame instead of ours: return the element for a part, or undefined to keep
   * the built-in one. A part you replace is not checked here, so it does not count towards `valid`.
   */
  renderField?: (part: CardPart, field: CardFieldProps) => ReactNode | undefined;
  /** Show the error of every part now, empty ones too: set it when your own submit found the card incomplete. */
  showErrors?: boolean;
  /** The moment the expiry is checked against. Defaults to the current time; pass it to test. */
  now?: Date;
  /** Turns every field off and dims the whole frame, a part you mount with `renderField` included (it also gets `disabled`, to pass on to the hosted field). */
  disabled?: boolean;
  /** The words, for another language. */
  labels?: CardFieldsetLabels;
}

type Problem = "empty" | "incomplete" | "invalid" | "month" | "expired";

interface Parts {
  /** Digits only. */
  number: string;
  /** Digits only: month then year, "0928". */
  expiry: string;
  code: string;
  name: string;
}

const MESSAGE = {
  number: { empty: "numberEmpty", incomplete: "numberIncomplete", invalid: "numberInvalid" },
  expiry: { empty: "expiryEmpty", incomplete: "expiryIncomplete", month: "expiryMonth", expired: "expired" },
  code: { empty: "codeEmpty", incomplete: "codeIncomplete" },
} as const satisfies Record<CardPart, Partial<Record<Problem, keyof Required<CardFieldsetLabels>>>>;

const fill = (template: string, values: Record<string, string>): string => template.replace(/\{(\w+)\}/g, (match, key: string) => values[key] ?? match);

/** A value as it is held: digits where there are digits, so "4242 4242" and "4242-4242" are the same. */
function normal(value: Partial<CardFieldsetValue> | undefined): Parts {
  const number = digitsOf(value?.number ?? "");
  return { number: number.slice(0, maxDigits(detectBrand(number))), expiry: expiryDigits(value?.expiry ?? ""), code: digitsOf(value?.code ?? "").slice(0, 4), name: value?.name ?? "" };
}

function problemFor(part: CardPart, source: Parts, at: Date): Problem | null {
  const brand = detectBrand(source.number);
  if (part === "number") return numberProblem(source.number, brand);
  if (part === "expiry") return expiryProblem(source.expiry, at);
  return codeProblem(source.code, (brand ? BRANDS[brand] : UNKNOWN).cvc);
}

/** The look of the built-in fields. A hosted field gets the same string through `renderField`. */
const FIELD = "relative h-7 w-full min-w-0 bg-transparent text-sm tabular-nums outline-none placeholder:text-muted-foreground/80 disabled:cursor-not-allowed";

interface CellProps {
  label: string;
  htmlFor: string;
  /** Text or an icon at the end of the label row. */
  aside?: ReactNode;
  invalid: boolean;
  /** Clicking anywhere in the cell focuses its field. Off for a hosted field, whose frame would sit under the click. */
  overlay: boolean;
  className?: string;
  children: ReactNode;
}

function Cell({ label, htmlFor, aside, invalid, overlay, className, children }: CellProps) {
  return (
    <div
      data-invalid={invalid || undefined}
      className={cn(
        "group/cell relative flex min-w-0 flex-col gap-0.5 px-3.5 pt-2.5 pb-2 transition-colors duration-150 focus-within:z-10 focus-within:-outline-offset-1 focus-within:outline-1 focus-within:outline-ring focus-within:ring-[3px] focus-within:ring-inset focus-within:ring-ring/40 data-[invalid]:bg-destructive/5 motion-reduce:transition-none",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3">
        {/* On the destructive tint the plain destructive red is under 4.5:1 at this size, so the label takes the darkened red the other items use for danger text. */}
        <label
          htmlFor={htmlFor}
          className={cn("text-xs font-medium text-muted-foreground group-data-[invalid]/cell:text-[color:color-mix(in_oklch,var(--destructive),var(--foreground)_30%)]", overlay && "after:absolute after:inset-0")}
        >
          {label}
        </label>
        {aside}
      </div>
      {children}
    </div>
  );
}

/**
 * The look and the checks of a card form, with no payment in it: card number, expiry and security code joined in one
 * bordered group, and an optional name under it. The number is spaced as you type (four groups of four, or 4-6-5
 * for American Express), the network is named in words beside the field, the code length follows it, and the Luhn
 * check and "not in the past" are run when a field is left, each message tied to its input. Focus moves on to the
 * expiry and the code only when the part before is complete, and Backspace in an empty field goes back. Every field
 * carries its `cc-*` autocomplete token and a numeric keyboard. It never stores, logs or sends anything and the
 * inputs have no `name`, so a surrounding form cannot post them: values come out through `onChange`, and
 * `renderField` mounts your processor's hosted fields in the same frame.
 */
export function CardFieldset({ value, defaultValue, onChange, showName = false, renderField, showErrors = false, now, disabled = false, labels, className, ...props }: CardFieldsetProps) {
  const words: Required<CardFieldsetLabels> = { ...WORDS, ...labels };
  const id = useId();
  const [own, setOwn] = useState<Parts>(() => normal(defaultValue));
  const [shown, setShown] = useState<Partial<Record<CardPart, Problem>>>({});
  const parts = value ? normal(value) : own;
  const numberRef = useRef<HTMLInputElement>(null);
  const expiryRef = useRef<HTMLInputElement>(null);
  const codeRef = useRef<HTMLInputElement>(null);
  const caret = useRef<{ input: HTMLInputElement; digits: number } | null>(null);

  // After the text was reformatted the caret is put back behind the digit it was behind, whichever spaces came or went.
  useLayoutEffect(() => {
    const target = caret.current;
    caret.current = null;
    if (!target || document.activeElement !== target.input) return;
    const position = caretAfter(target.input.value, target.digits);
    target.input.setSelectionRange(position, position);
  });

  const brand = detectBrand(parts.number);
  const info = brand ? BRANDS[brand] : UNKNOWN;
  const full = lengthOf(info.groups);
  const at = (): Date => now ?? new Date();

  const ids = { number: `${id}-number`, expiry: `${id}-expiry`, code: `${id}-code`, name: `${id}-name` };
  const brandId = `${id}-brand`;
  const hintId = `${id}-hint`;
  const messageId = (part: CardPart): string => `${id}-${part}-message`;

  // A message shows once its field was left, follows the typing while it shows, and goes as soon as the part is right.
  const hostedNode = (part: CardPart, describedBy: string | undefined, invalid: boolean): ReactNode | undefined =>
    renderField?.(part, { id: ids[part], className: FIELD, "aria-invalid": invalid ? true : undefined, "aria-describedby": describedBy, disabled: disabled ? true : undefined });
  const hosted: Record<CardPart, ReactNode | undefined> = {
    number: renderField ? hostedNode("number", [brandId, shown.number ? messageId("number") : null].filter(Boolean).join(" ") || undefined, Boolean(shown.number)) : undefined,
    expiry: renderField ? hostedNode("expiry", shown.expiry ? messageId("expiry") : undefined, Boolean(shown.expiry)) : undefined,
    code: renderField ? hostedNode("code", [hintId, shown.code ? messageId("code") : null].filter(Boolean).join(" ") || undefined, Boolean(shown.code)) : undefined,
  };
  const builtIn = (part: CardPart): boolean => hosted[part] === undefined;
  const visible: Record<CardPart, Problem | null> = {
    number: builtIn("number") ? (shown.number ?? (showErrors ? problemFor("number", parts, at()) : null)) : null,
    expiry: builtIn("expiry") ? (shown.expiry ?? (showErrors ? problemFor("expiry", parts, at()) : null)) : null,
    code: builtIn("code") ? (shown.code ?? (showErrors ? problemFor("code", parts, at()) : null)) : null,
  };
  const messages = (["number", "expiry", "code"] as const).flatMap((part) => {
    const problem = visible[part];
    const key = problem ? (MESSAGE[part] as Partial<Record<Problem, keyof Required<CardFieldsetLabels>>>)[problem] : undefined;
    return key ? [{ part, id: messageId(part), text: fill(words[key], { count: String(part === "code" ? info.cvc : full) }) }] : [];
  });

  function setProblem(part: CardPart, problem: Problem | null) {
    setShown((previous) => {
      if ((previous[part] ?? null) === problem) return previous;
      const next = { ...previous };
      if (problem) next[part] = problem;
      else delete next[part];
      return next;
    });
  }

  function report(next: Parts) {
    const checked = (["number", "expiry", "code"] as const).filter(builtIn);
    const valid = checked.every((part) => problemFor(part, next, at()) === null);
    onChange?.({ number: next.number, expiry: expiryValue(next.expiry), code: next.code, name: next.name }, { brand: detectBrand(next.number) ?? null, valid });
  }

  function update(change: Partial<Parts>, part?: CardPart) {
    const next = { ...parts, ...change };
    if (!value) setOwn(next);
    // A message that is showing follows the typing; a new one waits for the field to be left.
    if (part && shown[part]) {
      const problem = problemFor(part, next, at());
      setProblem(part, problem === "empty" ? null : problem);
    }
    report(next);
  }

  function focusEnd(input: HTMLInputElement | null) {
    if (!input) return;
    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);
  }

  function typeNumber(event: ChangeEvent<HTMLInputElement>) {
    const input = event.target;
    const typed = digitsOf(input.value);
    const nextBrand = detectBrand(typed);
    const digits = typed.slice(0, maxDigits(nextBrand));
    const before = digitsOf(input.value.slice(0, input.selectionStart ?? input.value.length)).length;
    caret.current = { input, digits: Math.min(before, digits.length) };
    const nextInfo = nextBrand ? BRANDS[nextBrand] : UNKNOWN;
    update({ number: digits, code: parts.code.slice(0, nextInfo.cvc) }, "number");
    // On to the expiry when the number has just become complete: a known network at its full length, any other once it passes the Luhn check at 16.
    const done = lengthOf(nextInfo.groups);
    if (parts.number.length < done && digits.length === done && (nextBrand || luhn(digits))) focusEnd(expiryRef.current);
  }

  function typeExpiry(event: ChangeEvent<HTMLInputElement>) {
    const input = event.target;
    const digits = expiryDigits(input.value);
    // A leading zero that was added ("3" becomes "03") sits before the caret too.
    const before = digitsOf(input.value.slice(0, input.selectionStart ?? input.value.length)).length + Math.max(0, digits.length - digitsOf(input.value).length);
    caret.current = { input, digits: Math.min(before, digits.length) };
    update({ expiry: digits }, "expiry");
    const month = Number(digits.slice(0, 2));
    if (parts.expiry.length < 4 && digits.length === 4 && month >= 1 && month <= 12) focusEnd(codeRef.current);
  }

  function typeCode(event: ChangeEvent<HTMLInputElement>) {
    update({ code: digitsOf(event.target.value).slice(0, info.cvc) }, "code");
  }

  // The field is read from the page, not from state: when focus moves on by itself the state of the last key is not rendered yet.
  function leave(part: CardPart, event: FocusEvent<HTMLInputElement>) {
    const text = event.currentTarget.value;
    const source: Parts = { ...parts, number: part === "number" ? digitsOf(text) : parts.number, expiry: part === "expiry" ? expiryDigits(text) : parts.expiry, code: part === "code" ? digitsOf(text) : parts.code };
    const problem = problemFor(part, source, at());
    setProblem(part, problem === "empty" ? null : problem);
  }

  function goBack(previous: HTMLInputElement | null, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace" && event.currentTarget.value === "") {
      event.preventDefault();
      focusEnd(previous);
    }
  }

  const invalid = (part: CardPart): boolean => visible[part] !== null;
  const describedBy = (part: CardPart, extra?: string): string | undefined => [extra, visible[part] ? messageId(part) : null].filter(Boolean).join(" ") || undefined;

  return (
    <div data-slot="card-fieldset" data-brand={brand} className={cn("@container grid min-w-0 grid-cols-[minmax(0,1fr)] gap-3", className)} {...props}>
      {/* A disabled fieldset dims as a whole, like InputGroup: the labels and values too, and a hosted field mounted in it, which has no input of ours to dim. */}
      <div
        role="group"
        aria-label={words.group}
        aria-disabled={disabled || undefined}
        className={cn("grid grid-cols-2 overflow-hidden rounded-lg border border-input bg-background shadow-xs", disabled && "cursor-not-allowed opacity-50")}
      >
        <Cell
          label={words.number}
          htmlFor={ids.number}
          invalid={invalid("number")}
          overlay={builtIn("number")}
          className="col-span-2 border-b border-input"
          aside={
            <span id={brandId} className="inline-flex items-center gap-1.5 text-xs font-medium text-foreground">
              <IconCreditCard aria-hidden="true" className="size-3.5 text-muted-foreground" />
              {brand ? info.name : null}
            </span>
          }
        >
          {hosted.number !== undefined ? (
            hosted.number
          ) : (
            <input
              ref={numberRef}
              id={ids.number}
              type="text"
              inputMode="numeric"
              autoComplete="cc-number"
              autoCapitalize="off"
              spellCheck={false}
              enterKeyHint="next"
              placeholder={words.numberPlaceholder}
              value={formatNumber(parts.number, info.groups)}
              disabled={disabled}
              aria-invalid={invalid("number") || undefined}
              aria-describedby={describedBy("number", brandId)}
              onChange={typeNumber}
              onBlur={(event) => leave("number", event)}
              className={FIELD}
            />
          )}
        </Cell>
        <Cell label={words.expiry} htmlFor={ids.expiry} invalid={invalid("expiry")} overlay={builtIn("expiry")} className="border-r border-input">
          {hosted.expiry !== undefined ? (
            hosted.expiry
          ) : (
            <input
              ref={expiryRef}
              id={ids.expiry}
              type="text"
              inputMode="numeric"
              autoComplete="cc-exp"
              autoCapitalize="off"
              spellCheck={false}
              enterKeyHint="next"
              placeholder={words.expiryPlaceholder}
              value={formatExpiry(parts.expiry)}
              disabled={disabled}
              aria-invalid={invalid("expiry") || undefined}
              aria-describedby={describedBy("expiry")}
              onChange={typeExpiry}
              onBlur={(event) => leave("expiry", event)}
              onKeyDown={(event) => goBack(numberRef.current, event)}
              className={FIELD}
            />
          )}
        </Cell>
        <Cell
          label={words.code}
          htmlFor={ids.code}
          invalid={invalid("code")}
          overlay={builtIn("code")}
          aside={
            <span id={hintId} className="hidden text-xs text-muted-foreground @[22rem]:inline">
              {fill(words.codeHint, { count: String(info.cvc) })}
            </span>
          }
        >
          {hosted.code !== undefined ? (
            hosted.code
          ) : (
            <input
              ref={codeRef}
              id={ids.code}
              type="text"
              inputMode="numeric"
              autoComplete="cc-csc"
              autoCapitalize="off"
              spellCheck={false}
              enterKeyHint={showName ? "next" : "done"}
              placeholder={info.cvc === 4 ? "1234" : words.codePlaceholder}
              value={parts.code}
              disabled={disabled}
              aria-invalid={invalid("code") || undefined}
              aria-describedby={describedBy("code", hintId)}
              onChange={typeCode}
              onBlur={(event) => leave("code", event)}
              onKeyDown={(event) => goBack(expiryRef.current, event)}
              className={FIELD}
            />
          )}
        </Cell>
      </div>

      <div aria-live="polite" className="grid gap-1.5 empty:-mt-3">
        {messages.map((message) => (
          <p key={message.part} id={message.id} className="flex items-start gap-1.5 text-xs text-destructive">
            <IconAlertCircle aria-hidden="true" className="mt-px size-3.5 shrink-0" />
            {message.text}
          </p>
        ))}
      </div>

      {showName ? (
        <div data-disabled={disabled || undefined} className="group grid gap-2">
          <Label htmlFor={ids.name}>{words.name}</Label>
          <Input
            id={ids.name}
            autoComplete="cc-name"
            autoCapitalize="words"
            spellCheck={false}
            enterKeyHint="done"
            value={parts.name}
            disabled={disabled}
            onChange={(event) => update({ name: event.target.value })}
          />
        </div>
      ) : null}
    </div>
  );
}
