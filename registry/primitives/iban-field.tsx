"use client";

import { useId, useState } from "react";

import { IconCheck } from "@rhs-ui/icons";
import { cn } from "@/lib/utils";

export interface IbanFieldProps {
  value: string;
  /** The IBAN without spaces, upper case; valid tells whether the check digits add up. */
  onValueChange: (iban: string, valid: boolean) => void;
  label?: string;
  name?: string;
  required?: boolean;
  className?: string;
}

/** ISO 13616 check: move the first four characters to the end, letters to numbers, mod 97 must be 1. */
export function isValidIban(raw: string): boolean {
  const iban = raw.replace(/\s/g, "").toUpperCase();
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{10,30}$/.test(iban)) return false;
  const digits = `${iban.slice(4)}${iban.slice(0, 4)}`.replace(/[A-Z]/g, (char) => String(char.charCodeAt(0) - 55));
  let rest = 0;
  for (const digit of digits) rest = (rest * 10 + Number(digit)) % 97;
  return rest === 1;
}

/**
 * A bank account field for direct debits and payouts: the IBAN grouped in
 * fours as people type or paste it, upper case, checked with the real mod-97
 * check digits once it is long enough, and the verdict in words under the
 * field. The value you get has no spaces.
 */
export function IbanField({ value, onValueChange, label = "IBAN", name, required, className }: IbanFieldProps) {
  const id = useId();
  const [touched, setTouched] = useState(false);
  const clean = value.replace(/[^a-z0-9]/gi, "").toUpperCase().slice(0, 34);
  const grouped = clean.replace(/(.{4})(?=.)/g, "$1 ");
  const valid = isValidIban(clean);
  const show = touched && clean.length >= 15;
  return (
    <div data-slot="iban-field" className={cn("grid gap-1.5", className)}>
      <label htmlFor={id} className="text-sm font-medium">{label}</label>
      <div className="relative">
        <input
          id={id}
          value={grouped}
          onChange={(event) => {
            const next = event.target.value.replace(/[^a-z0-9]/gi, "").toUpperCase().slice(0, 34);
            onValueChange(next, isValidIban(next));
          }}
          onBlur={() => setTouched(true)}
          autoComplete="off"
          spellCheck={false}
          inputMode="text"
          placeholder="NL91 ABNA 0417 1643 00"
          required={required}
          aria-invalid={show && !valid ? true : undefined}
          aria-describedby={`${id}-hint`}
          className="h-10 w-full rounded-md border border-input bg-background px-3 pr-9 font-mono text-sm tracking-wider uppercase outline-none placeholder:text-muted-foreground/60 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40 aria-invalid:border-destructive"
        />
        {show && valid ? <IconCheck aria-hidden="true" className="absolute top-1/2 right-3 size-4 -translate-y-1/2" /> : null}
      </div>
      <p id={`${id}-hint`} className={cn("text-xs", show && !valid ? "text-destructive" : "text-muted-foreground")} aria-live="polite">
        {show ? (valid ? "This IBAN checks out." : "This IBAN does not add up. Check the digits.") : "Starts with your country code, like NL or BE."}
      </p>
      {name ? <input type="hidden" name={name} value={clean} /> : null}
    </div>
  );
}
