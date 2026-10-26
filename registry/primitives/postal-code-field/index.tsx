"use client";

import { useEffect, useId, useMemo, useRef, useState, type ChangeEvent, type ComponentProps, type FocusEvent } from "react";

import { IconAlertCircle, IconCheck } from "@rhs-ui/icons";
import { Input } from "@rhs-ui/primitives/input";
import { askForPostalCode, describePostalCode, formatPostalCode, isPostalCode, POSTAL_CODES, type PostalRule } from "@rhs-ui/primitives/postal-code-field/postcodes";
import { cn } from "@/lib/utils";

export interface PostalCodeFieldProps extends Omit<ComponentProps<"input">, "value" | "defaultValue" | "onChange" | "type" | "inputMode" | "autoComplete" | "name"> {
  /** The country whose codes are expected, as its ISO code: "NL", "GB", "US". Change it and the code that is there is checked again, against the new country. */
  country: string;
  /** The code, when you control it. It is the formatted code ("1234 AB") once it is valid and the text as typed until then, the same one `onValueChange` reports. */
  value?: string;
  /** The code to start with, when you do not control it. */
  defaultValue?: string;
  /** Called on every change with the code as the country writes it once it is well formed, and with the text as typed (trimmed) while it is not, together with whether it is well formed for that country. Also called when the country changes the answer. */
  onValueChange?: (code: string, state: { valid: boolean }) => void;
  /** Rules of your own, by country code, added to the built-in table or replacing a country in it. */
  countries?: Readonly<Record<string, PostalRule>>;
  /** The field's name for a plain form submit: the formatted code goes out in a hidden input. */
  name?: string;
}

/**
 * A postcode field that knows the country. It takes the country's pattern,
 * placeholder, keyboard (digits for 90210, letters for 1234 AB) and capitals,
 * and writes the code the way that country does when the field is left: spacing
 * and case are never forced on someone who is still typing, so the caret stays
 * where it is. A code that is not right is explained with what a valid one
 * looks like ("Dutch postcodes look like 1234 AB."), live once the field has
 * been left, and a right one gets a quiet check. Changing `country` checks the
 * code that is there against the new rules at once. The table behind it covers
 * thirty countries, can be extended with `countries`, and is exported from
 * postal-code-field/postcodes for an address form to share. The field carries
 * autocomplete="postal-code", so the browser can fill it. Like the other fields
 * it never blocks a submit by itself.
 */
export function PostalCodeField({
  country,
  value,
  defaultValue = "",
  onValueChange,
  countries,
  name,
  required,
  placeholder,
  disabled,
  className,
  onBlur,
  "aria-describedby": describedBy,
  ...props
}: PostalCodeFieldProps) {
  const messageId = useId();
  const rules = useMemo(() => (countries ? { ...POSTAL_CODES, ...countries } : POSTAL_CODES), [countries]);
  const [text, setText] = useState(value ?? defaultValue);
  const [synced, setSynced] = useState(value);
  // Nothing is said while someone is still on the way to a code. Once the field has been left, or the country changed under a code, what is wrong is said, and kept up to date.
  const [checked, setChecked] = useState(false);
  const [lastCountry, setLastCountry] = useState(country);
  const rule = rules[country.trim().toUpperCase()];
  const valid = isPostalCode(country, text, rules);
  // A right code is written the way its country writes it. A wrong one stays exactly as typed, so what is reported and posted is what the person sees, never a re-spaced string nobody typed.
  const code = valid ? formatPostalCode(country, text, rules) : text.trim();
  const reported = useRef({ code, valid });

  // A code that arrives from outside replaces what is typed, unless it is only the formatted form of it.
  if (value !== undefined && value !== synced) {
    setSynced(value);
    if (value !== code) setText(value);
  }
  // Another country: a code that is right for it is written the way it writes it, and one that is not is said to be wrong at once.
  if (country !== lastCountry) {
    setLastCountry(country);
    if (text.trim()) {
      setChecked(true);
      if (valid && code !== text) setText(code);
    }
  }

  function report(nextCode: string, nextValid: boolean) {
    if (nextCode === reported.current.code && nextValid === reported.current.valid) return;
    reported.current = { code: nextCode, valid: nextValid };
    onValueChange?.(nextCode, { valid: nextValid });
  }

  // A change of country, or of the rules, changes the answer without a keystroke: it is reported here, once.
  useEffect(() => {
    report(code, valid);
  }, [code, valid]);

  function type(event: ChangeEvent<HTMLInputElement>) {
    const next = event.target.value;
    setText(next);
    const right = isPostalCode(country, next, rules);
    report(right ? formatPostalCode(country, next, rules) : next.trim(), right);
  }

  function leave(event: FocusEvent<HTMLInputElement>) {
    onBlur?.(event);
    setChecked(true);
    // The code is written the way the country writes it, now that nobody is typing: "1017cj" becomes "1017 CJ". A code that is not right stays as it was typed, so the message is about what is there.
    if (text.trim() && code !== text) setText(code);
  }

  const empty = text.trim() === "";
  const message = !checked ? null : empty ? (required ? askForPostalCode(country, rules) : null) : valid ? null : describePostalCode(country, rules);

  return (
    <div data-slot="postal-code-field" className={cn("grid w-full", className)}>
      <div className="relative">
        <Input
          type="text"
          inputMode={rule?.numeric ? "numeric" : "text"}
          autoComplete="postal-code"
          autoCapitalize={rule?.numeric === false ? "characters" : "off"}
          autoCorrect="off"
          spellCheck={false}
          aria-required={required || undefined}
          disabled={disabled}
          placeholder={placeholder ?? rule?.example}
          {...props}
          value={text}
          onChange={type}
          onBlur={leave}
          aria-invalid={message ? true : undefined}
          aria-describedby={[describedBy, messageId].filter(Boolean).join(" ")}
          className={cn("pr-9 tabular-nums", rule?.numeric === false && "uppercase placeholder:normal-case")}
        />
        {valid && rule && !disabled ? <IconCheck aria-hidden="true" size={16} className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground" /> : null}
      </div>
      <div id={messageId} aria-live="polite">
        {message ? (
          <p className="mt-1.5 flex items-start gap-1.5 text-xs text-destructive">
            <IconAlertCircle aria-hidden="true" className="mt-px size-3.5 shrink-0" />
            {message}
          </p>
        ) : null}
      </div>
      {name ? <input type="hidden" name={name} value={code} disabled={disabled} /> : null}
    </div>
  );
}
