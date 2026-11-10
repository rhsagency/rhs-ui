"use client";

import { useEffect, useRef, useState, type ComponentProps, type ReactNode } from "react";

import { FormControl, FormField, FormLabel } from "@rhs-ui/primitives/form-field";
import { Input } from "@rhs-ui/primitives/input";
import { PHONE_COUNTRIES, PhoneInput } from "@rhs-ui/primitives/phone-input";
import { cn } from "@/lib/utils";

/** Who and how to reach them. Everything is text; the phone number is E.164 ("+31612345678"), or "" while it is empty or not a number yet. */
export interface ContactValue {
  firstName: string;
  lastName: string;
  /** Trimmed and in lower case, whatever was typed. */
  email: string;
  /** E.164: a plus, the country code and the number, digits only. */
  phone: string;
  company: string;
}

export type ContactField = keyof ContactValue;

/** The words the fieldset says, for translation. `{field}` is the name of the field in lower case. */
export interface ContactFieldsetLabels {
  /** Default "First name". */
  firstName?: string;
  /** Default "Last name". */
  lastName?: string;
  /** Default "Email address". */
  email?: string;
  /** Default "Phone number". */
  phone?: string;
  /** Default "Company". */
  company?: string;
  /** Beside the name of a field that is not required. Default "Optional". */
  optional?: string;
  /** Under an empty required field. Default "Enter your {field}." */
  missing?: string;
  /** Under an email address that does not look like one. Default "Enter an email address like name@example.com." */
  invalidEmail?: string;
  /** Under a phone number that is too short or too long, or that begins with a plus and was left unfinished. Default "Enter a complete phone number, without the country code." */
  invalidPhone?: string;
  /** Under a phone number that begins with a plus or 00 and a country code that is not in the list. Default "Pick the country in the list and leave out the +." */
  unknownCountry?: string;
}

export interface ContactFieldsetProps extends Omit<ComponentProps<"fieldset">, "value" | "defaultValue" | "onChange" | "children"> {
  /** The values, when you control them. */
  value?: ContactValue;
  /** The values to begin with, when the fieldset keeps them itself. */
  defaultValue?: Partial<ContactValue>;
  /** Called with all the values whenever one changes. The email arrives trimmed and in lower case. Nothing is sent anywhere. */
  onValueChange?: (value: ContactValue) => void;
  /** Problems to show under fields, from your own checks or the server. They take the place of the fieldset's own message for that field. */
  errors?: Partial<Record<ContactField, string>>;
  /** Which fields are required. Default the names and the email. */
  required?: readonly ContactField[];
  /** Show the company line. It is optional unless `required` names it. Default false. */
  showCompany?: boolean;
  /** What the group is called. It is the legend, so a screen reader names the group before the first field. Default "Contact details". */
  legend?: ReactNode;
  /** Keep the legend for screen readers only, when the page has a heading of its own. */
  hideLegend?: boolean;
  /** The country the dialling code starts on when the phone number has none, as an ISO code. Default "NL". */
  defaultCountry?: string;
  /** The words the fieldset says, for translation. */
  labels?: ContactFieldsetLabels;
}

const DEFAULT_LABELS = {
  firstName: "First name",
  lastName: "Last name",
  email: "Email address",
  phone: "Phone number",
  company: "Company",
  optional: "Optional",
  missing: "Enter your {field}.",
  invalidEmail: "Enter an email address like name@example.com.",
  invalidPhone: "Enter a complete phone number, without the country code.",
  unknownCountry: "Pick the country in the list and leave out the +.",
} satisfies Required<ContactFieldsetLabels>;

type Words = Required<ContactFieldsetLabels>;

const EMPTY: ContactValue = { firstName: "", lastName: "", email: "", phone: "", company: "" };
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE = /^\+\d{8,15}$/;

const normalizeEmail = (text: string) => text.trim().toLowerCase();

function fill(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => values[key] ?? match);
}

/** A number written to be dialled from abroad ("+31 6 1234 5678", "0031 6 1234 5678"): its country and the number without it, or why it is not one yet. */
type Abroad = { kind: "country"; dial: string; national: string } | { kind: "short" } | { kind: "unknown" };

/** The plus or the 00 that says what follows begins with a country code, with the brackets and spaces people put before it. */
const ABROAD = /^[\s(]*(?:\+|00)/;

/** What the text in the phone field says about its country, or null when it is a national number ("06 1234 5678"). */
function readAbroad(text: string): Abroad | null {
  const start = ABROAD.exec(text);
  if (!start) return null;
  const digits = text.slice(start[0].length).replace(/\D/g, "");
  const dials = PHONE_COUNTRIES.map((country) => country.dial);
  const dial = dials.filter((code) => digits.startsWith(code)).sort((a, b) => b.length - a.length)[0];
  if (dial) {
    // A zero after the country code ("+31 (0)6 ...") is the national prefix, which the network drops.
    const national = digits.slice(dial.length).replace(/^0+/, "");
    return national ? { kind: "country", dial, national } : { kind: "short" };
  }
  // "+3" could still become +31 or +34; "+81" is no country of the list.
  return dials.some((code) => code.startsWith(digits)) ? { kind: "short" } : { kind: "unknown" };
}

/** What is wrong with a field, in words, or nothing. An empty field is only wrong when it is required. */
function problemWith(field: ContactField, values: ContactValue, required: readonly ContactField[], text: Words): string | undefined {
  const raw = values[field];
  if (raw.trim() === "") return required.includes(field) ? fill(text.missing, { field: text[field].toLowerCase() }) : undefined;
  if (field === "email" && !EMAIL.test(normalizeEmail(raw))) return text.invalidEmail;
  if (field === "phone" && !PHONE.test(raw)) return text.invalidPhone;
  return undefined;
}

/**
 * The fieldset for who and how to reach them, for a checkout or an enquiry: first and last name side by side (stacked
 * on a phone), email, a phone number with its country code and an optional company line. Every input carries the right
 * autocomplete token (given-name, family-name, email, organization; the phone number's is tel-national, because the
 * country code is a control of its own) with its type and inputMode, so a browser or a password manager fills the whole
 * group in one go. A field is checked when it is left, not on every keystroke, and once it shows a problem it clears the
 * moment the problem is fixed. Messages are tied to their fields with `aria-describedby`. The email comes back trimmed and
 * in lower case. A phone number typed, pasted or filled in with its country code ("+31 6 1234 5678", "0031 6 1234 5678",
 * "+44 7911 123456") selects that country and keeps the national number, so it is never stored under the wrong code; a code
 * that is not in the list is explained instead of guessed. The group switches off as a whole with `disabled`, and nothing is
 * sent anywhere: the values only return through `onValueChange`.
 */
export function ContactFieldset({
  value,
  defaultValue,
  onValueChange,
  errors,
  required = ["firstName", "lastName", "email"],
  showCompany = false,
  legend = "Contact details",
  hideLegend = false,
  defaultCountry,
  labels,
  className,
  ...props
}: ContactFieldsetProps) {
  const text: Words = { ...DEFAULT_LABELS, ...labels };
  const [own, setOwn] = useState<ContactValue>({ ...EMPTY, ...defaultValue });
  const current = value ?? own;
  /** What this fieldset found wrong when a field was left. */
  const [found, setFound] = useState<Partial<Record<ContactField, string>>>({});
  /** What is in the email field while it is being typed, before it is tidied. */
  const [typing, setTyping] = useState<string | null>(null);

  // The phone field keeps its own text, so a value that arrives from outside has to start it over.
  const phoneSeen = useRef(current.phone);
  const [phoneKey, setPhoneKey] = useState(0);
  useEffect(() => {
    if (current.phone === phoneSeen.current) return;
    phoneSeen.current = current.phone;
    setPhoneKey((key) => key + 1);
  }, [current.phone]);

  // The text in the phone field, which is what tells a national number from one that starts with its country code.
  const phoneField = useRef<HTMLInputElement>(null);
  // Starting the field over replaces its input; when it had focus, the new one takes it, so typing carries on.
  const phoneFocus = useRef(false);
  useEffect(() => {
    if (!phoneFocus.current) return;
    phoneFocus.current = false;
    const input = phoneField.current;
    input?.focus();
    input?.setSelectionRange(input.value.length, input.value.length);
  }, [phoneKey]);

  function emit(patch: Partial<ContactValue>): ContactValue {
    const next = { ...current, ...patch };
    if (value === undefined) setOwn(next);
    onValueChange?.(next);
    return next;
  }

  function judge(field: ContactField, values: ContactValue) {
    setFound((previous) => ({ ...previous, [field]: problemWith(field, values, required, text) }));
  }

  function edit(field: ContactField, raw: string) {
    const next = emit({ [field]: field === "email" ? normalizeEmail(raw) : raw });
    // Not on every keystroke, but a problem that is on show goes the moment it is fixed.
    if (found[field]) judge(field, next);
  }

  function leave(field: ContactField) {
    const raw = current[field];
    // Stray spaces around a name go. The email is tidied as it comes back, and the phone number is digits already.
    const next = field === "firstName" || field === "lastName" || field === "company" ? (raw !== raw.trim() ? emit({ [field]: raw.trim() }) : current) : current;
    judge(field, next);
  }

  /** The phone field reports a number: in the country it shows, unless the text in it starts with a country code of its own. */
  function changePhone(e164: string) {
    const abroad = readAbroad(phoneField.current?.value ?? "");
    if (!abroad) {
      phoneFocus.current = false;
      phoneSeen.current = e164;
      edit("phone", e164);
      return;
    }
    if (abroad.kind === "country") {
      // "+31 6 1234 5678": the code picks the country and the field starts over on it, holding the national number.
      const number = `+${abroad.dial}${abroad.national}`;
      phoneFocus.current = document.activeElement === phoneField.current;
      edit("phone", number);
      // The number the field already holds would not start it over by itself, and the text in it is still in the other form.
      if (number === phoneSeen.current) setPhoneKey((key) => key + 1);
      return;
    }
    // Not a number yet, or a country the list does not have: nothing right to report. The field keeps what was typed, and says why when it is left.
    phoneSeen.current = "";
    emit({ phone: "" });
  }

  function leavePhone() {
    const abroad = readAbroad(phoneField.current?.value ?? "");
    if (abroad && abroad.kind !== "country") setFound((previous) => ({ ...previous, phone: abroad.kind === "unknown" ? text.unknownCountry : text.invalidPhone }));
    else leave("phone");
  }

  const isRequired = (field: ContactField) => required.includes(field);
  const shown = (field: ContactField) => errors?.[field] ?? found[field] ?? null;
  const optional = (field: ContactField) =>
    isRequired(field) ? null : (
      <span className="font-normal text-muted-foreground">
        <span className="sr-only">, </span>
        {text.optional}
      </span>
    );
  const emailShown = typing !== null && normalizeEmail(typing) === current.email ? typing : current.email;

  return (
    <fieldset data-slot="contact-fieldset" className={cn("m-0 min-w-0 border-0 p-0", className)} {...props}>
      <legend className={cn("mb-4 p-0 text-base leading-tight font-semibold tracking-[-0.015em]", hideLegend && "sr-only")}>{legend}</legend>
      <div className="@container">
        <div className="grid grid-cols-1 items-start gap-x-4 gap-y-5 @md:grid-cols-2">
          <FormField error={shown("firstName")} className="grid-cols-1">
            <FormLabel>
              {text.firstName}
              {optional("firstName")}
            </FormLabel>
            <FormControl>
              <Input
                name="firstName"
                autoComplete="given-name"
                autoCapitalize="words"
                required={isRequired("firstName")}
                value={current.firstName}
                onChange={(event) => edit("firstName", event.target.value)}
                onBlur={() => leave("firstName")}
                onInvalid={() => judge("firstName", current)}
              />
            </FormControl>
          </FormField>

          <FormField error={shown("lastName")} className="grid-cols-1">
            <FormLabel>
              {text.lastName}
              {optional("lastName")}
            </FormLabel>
            <FormControl>
              <Input
                name="lastName"
                autoComplete="family-name"
                autoCapitalize="words"
                required={isRequired("lastName")}
                value={current.lastName}
                onChange={(event) => edit("lastName", event.target.value)}
                onBlur={() => leave("lastName")}
                onInvalid={() => judge("lastName", current)}
              />
            </FormControl>
          </FormField>

          <FormField error={shown("email")} className="grid-cols-1 @md:col-span-2">
            <FormLabel>
              {text.email}
              {optional("email")}
            </FormLabel>
            <FormControl>
              <Input
                name="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                autoCapitalize="none"
                spellCheck={false}
                required={isRequired("email")}
                value={emailShown}
                onChange={(event) => {
                  setTyping(event.target.value);
                  edit("email", event.target.value);
                }}
                onBlur={() => {
                  setTyping(null);
                  leave("email");
                }}
                onInvalid={() => judge("email", current)}
              />
            </FormControl>
          </FormField>

          <FormField error={shown("phone")} className="grid-cols-1 @md:col-span-2">
            <FormLabel>
              {text.phone}
              {optional("phone")}
            </FormLabel>
            <FormControl>
              <PhoneInput
                key={phoneKey}
                ref={phoneField}
                value={current.phone}
                defaultCountry={defaultCountry}
                required={isRequired("phone")}
                onValueChange={changePhone}
                onBlur={leavePhone}
                onInvalid={() => judge("phone", current)}
              />
            </FormControl>
            {/* The field a person sees holds the national number; this is the one that is sent, in E.164. */}
            <input type="hidden" name="phone" value={current.phone} />
          </FormField>

          {showCompany ? (
            <FormField error={shown("company")} className="grid-cols-1 @md:col-span-2">
              <FormLabel>
                {text.company}
                {optional("company")}
              </FormLabel>
              <FormControl>
                <Input
                  name="company"
                  autoComplete="organization"
                  required={isRequired("company")}
                  value={current.company}
                  onChange={(event) => edit("company", event.target.value)}
                  onBlur={() => leave("company")}
                  onInvalid={() => judge("company", current)}
                />
              </FormControl>
            </FormField>
          ) : null}
        </div>
      </div>
    </fieldset>
  );
}
