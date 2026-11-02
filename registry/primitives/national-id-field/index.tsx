"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState, type ChangeEvent, type ComponentProps, type FocusEvent } from "react";

import { IconAlertCircle, IconCheck, IconEye, IconEyeOff } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@rhs-ui/primitives/input-group";
import { NATIONAL_IDS, maskNationalId, nationalIdMessage, type NationalIdRule } from "@rhs-ui/primitives/national-id-field/ids";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@rhs-ui/primitives/select";
import { cn } from "@/lib/utils";

export interface NationalIdFieldProps extends Omit<ComponentProps<"input">, "value" | "defaultValue" | "onChange" | "type" | "inputMode" | "autoComplete" | "maxLength" | "children" | "size" | "name"> {
  /** The number, when you control it. Spaces and hyphens do not matter: it is read the same either way. */
  value?: string;
  /** The number to start with, when you do not control it. */
  defaultValue?: string;
  /** Called on every change with the number without separators ("111222333") and whether it is complete and right for the country. */
  onValueChange?: (id: string, state: { valid: boolean; country: string }) => void;
  /** The country, as its ISO code ("NL"), when you control it. */
  country?: string;
  /** The country to start with, when you do not control it. Default: the first in the list. */
  defaultCountry?: string;
  /** Called when another country is chosen. */
  onCountryChange?: (country: string) => void;
  /** Rules of your own, by country code, added to the built-in table or replacing a country in it. */
  countries?: Readonly<Record<string, NationalIdRule>>;
  /** Hide the number behind dots as soon as the field is left, with a button to show it. Default true. */
  masked?: boolean;
  /** The field's name for a plain form submit: the number without separators goes out in a hidden input, and the country as `<name>-country`. */
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

/** Where the caret goes in the written number so that it stays after the same number of letters and digits. */
function caretAfter(written: string, before: number): number {
  if (before <= 0) return 0;
  let seen = 0;
  for (let index = 0; index < written.length; index += 1) {
    if (/[A-Za-z0-9]/.test(written[index] ?? "")) {
      seen += 1;
      if (seen === before) return index + 1;
    }
  }
  return written.length;
}

/**
 * A field for a personal identity number that knows the country: a Dutch BSN,
 * a US SSN, a UK National Insurance number, a Spanish DNI or NIE, an Italian
 * codice fiscale and seven more, from a table you can extend. It writes the
 * number as it is printed ("111 222 333"), keeps to the characters the country
 * uses, and checks the number with that country's own arithmetic: the eleven
 * test, the Luhn digit, a check letter, the areas that are never issued. A number
 * that is wrong is explained in words ("A BSN has nine digits and passes the
 * eleven test") once the field has been left, or at once when the number is as
 * long as it gets, and the words never repeat the number, so nothing about it
 * is read out or kept in a message. As soon as the field is left the number is
 * hidden behind dots; a button shows it again. The field turns autocomplete
 * off, and nothing is logged, stored or sent by it. The checks are arithmetic
 * only: they catch a typo, not a number that was never issued.
 */
export function NationalIdField({
  value,
  defaultValue = "",
  onValueChange,
  country: countryProp,
  defaultCountry,
  onCountryChange,
  countries,
  masked = true,
  name,
  disabled,
  required,
  placeholder,
  className,
  onFocus,
  onBlur,
  ref,
  id,
  "aria-describedby": describedBy,
  ...props
}: NationalIdFieldProps) {
  const base = useId();
  const input = useRef<HTMLInputElement | null>(null);
  const attach = useCallback(
    (node: HTMLInputElement | null) => {
      input.current = node;
      if (typeof ref === "function") ref(node);
      else if (ref) ref.current = node;
    },
    [ref],
  );
  const rules = useMemo(() => {
    if (!countries) return NATIONAL_IDS;
    return { ...NATIONAL_IDS, ...Object.fromEntries(Object.entries(countries).map(([code, rule]) => [code.trim().toUpperCase(), rule])) };
  }, [countries]);
  const codes = useMemo(() => Object.keys(rules).sort((a, b) => (rules[a]?.name ?? a).localeCompare(rules[b]?.name ?? b, "en")), [rules]);

  const [ownCountry, setOwnCountry] = useState(() => (defaultCountry ?? countryProp ?? codes[0] ?? "").toUpperCase());
  const country = (countryProp ?? ownCountry).toUpperCase();
  const rule = rules[country];
  const [text, setText] = useState(value ?? defaultValue);
  const [synced, setSynced] = useState(value);
  const [focused, setFocused] = useState(false);
  const [touched, setTouched] = useState(false);
  const [revealed, setRevealed] = useState(false);

  // A number that arrives from outside replaces what is typed, unless it is only the same number written differently.
  if (value !== undefined && value !== synced) {
    setSynced(value);
    if ((rule?.clean(value) ?? value) !== (rule?.clean(text) ?? text)) setText(value);
  }

  const clean = rule ? rule.clean(text) : text;
  const written = rule ? rule.format(clean) : clean;
  const problem = rule && clean !== "" ? rule.check(clean) : null;
  const valid = Boolean(rule) && clean !== "" && problem === null;
  const complete = rule ? clean.length >= rule.maxLength : false;
  const settled = touched && !focused;
  const hidden = masked && !focused && !revealed && clean !== "";
  const shown = hidden ? maskNationalId(written) : written;

  // A number as long as it gets cannot be improved by more typing, so it is judged at once; a shorter one waits until the field is left.
  const showProblem = problem !== null && (settled || complete);
  const error = showProblem && problem ? nationalIdMessage(country, problem, rules) : settled && clean === "" && required && rule ? `Enter your ${rule.label}.` : null;

  const said = useSettled(error ?? (valid ? `Valid ${rule?.label ?? "number"}.` : ""), 700);

  function report(nextText: string, nextCountry: string) {
    const nextRule = rules[nextCountry];
    const nextClean = nextRule ? nextRule.clean(nextText) : nextText;
    onValueChange?.(nextClean, { valid: Boolean(nextRule) && nextClean !== "" && nextRule?.check(nextClean) === null, country: nextCountry });
  }

  function change(event: ChangeEvent<HTMLInputElement>) {
    // A country that is not in the table has no rules: what is typed is kept as it is.
    if (!rule) {
      setText(event.currentTarget.value);
      report(event.currentTarget.value, country);
      return;
    }
    const node = event.currentTarget;
    const typed = node.value;
    const inputType = (event.nativeEvent as InputEvent).inputType;
    // A key pressed in a full field changes nothing, rather than pushing the last character out.
    if (inputType === "insertText" && typed.toUpperCase().replace(/[^A-Z0-9]/g, "").length > rule.maxLength) {
      const caret = Math.max(0, (node.selectionStart ?? 1) - 1);
      node.value = written;
      node.setSelectionRange(caret, caret);
      return;
    }
    let before = rule.clean(typed.slice(0, node.selectionStart ?? typed.length)).length;
    let next = rule.clean(typed);
    // Backspace or Delete next to a separator took away only the separator, which is written straight back: the person meant the character beside it.
    if (next === clean && typed.length === written.length - 1) {
      if (inputType === "deleteContentBackward" && before > 0) {
        next = next.slice(0, before - 1) + next.slice(before);
        before -= 1;
      } else if (inputType === "deleteContentForward" && before < next.length) {
        next = next.slice(0, before) + next.slice(before + 1);
      }
    }
    // The text is put right here, before React looks at it, so the caret does not jump to the end when a separator is written in the middle.
    const nextWritten = rule.format(next);
    node.value = nextWritten;
    const caret = caretAfter(nextWritten, before);
    node.setSelectionRange(caret, caret);
    setText(next);
    report(next, country);
  }

  function choose(next: string) {
    setOwnCountry(next);
    onCountryChange?.(next);
    // A number that is already there is checked against the new country at once.
    if (clean !== "") setTouched(true);
    report(text, next);
  }

  function enter(event: FocusEvent<HTMLInputElement>) {
    onFocus?.(event);
    setFocused(true);
  }

  function leave(event: FocusEvent<HTMLInputElement>) {
    onBlur?.(event);
    setFocused(false);
    setTouched(true);
  }

  const hintId = `${base}-hint`;
  const numeric = rule?.keyboard === "numeric";

  return (
    <div data-slot="national-id-field" data-state={error ? "invalid" : valid ? "valid" : "idle"} className={cn("@container grid w-full", className)}>
      <div className="flex min-w-0 flex-col gap-2 @sm:flex-row @sm:gap-0">
        <Select value={country} onValueChange={choose} disabled={disabled} name={name ? `${name}-country` : undefined}>
          <SelectTrigger aria-label="Country" className="relative focus-visible:z-10 @sm:w-44 @sm:shrink-0 @sm:rounded-r-none @sm:border-r-0">
            <SelectValue placeholder="Country" />
          </SelectTrigger>
          <SelectContent>
            {codes.map((code) => (
              <SelectItem key={code} value={code} description={rules[code]?.label}>
                {rules[code]?.name ?? code}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <InputGroup className={cn(STAYS_RED, "relative focus-within:z-10 @sm:rounded-l-none")}>
          <InputGroupInput
            ref={attach}
            id={id}
            type="text"
            inputMode={numeric ? "numeric" : "text"}
            // Not a password and not an address: a browser or a password manager should offer nothing, and keep nothing.
            autoComplete="off"
            autoCapitalize={numeric ? "off" : "characters"}
            autoCorrect="off"
            spellCheck={false}
            data-1p-ignore=""
            data-lpignore="true"
            data-form-type="other"
            disabled={disabled}
            required={required}
            placeholder={placeholder ?? rule?.example}
            readOnly={hidden}
            {...props}
            value={shown}
            onChange={change}
            onFocus={enter}
            onBlur={leave}
            aria-invalid={error ? true : undefined}
            aria-describedby={[describedBy, hintId].filter(Boolean).join(" ")}
            className="font-mono tracking-[0.02em] tabular-nums @max-[20rem]:text-[0.8125rem]"
          />
          {valid ? (
            // The line under the field says so too; where the field is narrower than a phone the number gets the room.
            <InputGroupAddon aria-hidden="true" className="pr-1.5 @max-[20rem]:hidden">
              <IconCheck />
            </InputGroupAddon>
          ) : null}
          {masked ? (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              disabled={disabled || clean === ""}
              // The name stays the same and the pressed state says which way it is, so a screen reader never hears "Hide number, pressed".
              aria-pressed={revealed}
              aria-label="Show number"
              onClick={() => setRevealed((on) => !on)}
              className="mr-0.5 shrink-0 text-muted-foreground hover:text-foreground"
            >
              {revealed ? <IconEyeOff aria-hidden="true" /> : <IconEye aria-hidden="true" />}
            </Button>
          ) : null}
        </InputGroup>
      </div>
      <div id={hintId} className="mt-1.5 min-h-5 text-xs">
        {error ? (
          <p className="flex min-w-0 items-start gap-1.5 text-destructive">
            <IconAlertCircle aria-hidden="true" className="mt-px size-3.5 shrink-0" />
            <span className="min-w-0 [overflow-wrap:anywhere]">{error}</span>
          </p>
        ) : valid ? (
          <p className="font-medium text-foreground">Valid {rule?.label}.</p>
        ) : (
          <p className="text-muted-foreground [overflow-wrap:anywhere]">{rule ? rule.describe : "Choose a country to check the number against."}</p>
        )}
      </div>
      <span role="status" className="sr-only">
        {said}
      </span>
      {name ? <input type="hidden" name={name} value={clean} disabled={disabled} /> : null}
    </div>
  );
}
