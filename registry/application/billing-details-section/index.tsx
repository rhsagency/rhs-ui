"use client";

import { useEffect, useId, useMemo, useRef, useState, type ChangeEvent, type ComponentProps, type FormEvent } from "react";

import { IconCheck, IconInfo, IconWarning } from "@rhs-ui/icons";
import {
  DEFAULT_TAX_ID_FORMATS,
  FALLBACK_TAX_ID_FORMAT,
  matchesTaxId,
  normaliseTaxId,
  type TaxIdFormat,
} from "@rhs-ui/application/billing-details-section/tax-ids";
import { Badge } from "@rhs-ui/primitives/badge";
import { Button } from "@rhs-ui/primitives/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@rhs-ui/primitives/card";
import { CountrySelect } from "@rhs-ui/primitives/country-select";
import { FormControl, FormDescription, FormField, FormLabel } from "@rhs-ui/primitives/form-field";
import { Input } from "@rhs-ui/primitives/input";
import { Spinner } from "@rhs-ui/primitives/spinner";
import { TagInput } from "@rhs-ui/primitives/tag-input";
import { cn } from "@/lib/utils";

/** What appears on an invoice. */
export interface BillingDetails {
  company: string;
  /** Street and number. */
  line1: string;
  /** Floor, suite or building. */
  line2?: string;
  postalCode: string;
  city: string;
  /** ISO 3166-1 alpha-2 code, "NL". */
  country: string;
  /** The tax or VAT number, as typed. */
  taxId?: string;
  /** Every address an invoice is emailed to. */
  emails: string[];
  /** A purchase order or reference printed on each invoice. */
  reference?: string;
}

export type BillingField = keyof BillingDetails;
export type BillingErrors = Partial<Record<BillingField, string>>;

export interface BillingDetailsSectionProps {
  /** The details on file. Pass new ones after a save and the form follows. */
  value: BillingDetails;
  /** Country codes to offer. Every country by default. A new array with the same codes on every render is fine. */
  countries?: readonly string[];
  /**
   * Saves the details. Return or resolve to a message to show a failure, to an
   * object of messages to put them against their fields, or to nothing when it worked.
   */
  onSave: (value: BillingDetails) => Promise<string | BillingErrors | void> | string | BillingErrors | void;
  /** Looks the tax number up for a live "Valid" or "Could not verify". Resolve to true when it checks out. */
  onValidateTaxId?: (country: string, id: string) => Promise<boolean> | boolean;
  /** What the tax number is called per country, with an example and a pattern. Merged over the built-in table. */
  taxIdLabels?: Readonly<Record<string, TaxIdFormat>>;
  /** Language of the country names. */
  locale?: string;
  /** The heading. */
  title?: string;
  /** The line under the heading. */
  description?: string;
  /** Heading level of the title; 2 for a page section, 3 inside another section. */
  headingLevel?: 2 | 3;
  /** Extra classes for the outermost element. */
  className?: string;
}

type TextField = "company" | "line1" | "line2" | "postalCode" | "city" | "reference";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// A fresh array on every render would make the country list rebuild itself (about 250 names, sorted) on every keystroke.
const NO_SUGGESTED: readonly string[] = [];

/** Trims every value and gives optional ones an empty string, so a draft and the saved details compare equal. */
function tidy(details: BillingDetails): BillingDetails {
  return {
    company: details.company.trim(),
    line1: details.line1.trim(),
    line2: (details.line2 ?? "").trim(),
    postalCode: details.postalCode.trim(),
    city: details.city.trim(),
    country: details.country,
    taxId: (details.taxId ?? "").trim(),
    emails: details.emails.map((email) => email.trim()).filter(Boolean),
    reference: (details.reference ?? "").trim(),
  };
}

function problemsOf(details: BillingDetails, format: TaxIdFormat): BillingErrors {
  const found: BillingErrors = {};
  if (!details.company.trim()) found.company = "Enter the company name as it should read on an invoice.";
  if (!details.line1.trim()) found.line1 = "Enter the street and number.";
  if (!details.postalCode.trim()) found.postalCode = "Enter the postal code.";
  if (!details.city.trim()) found.city = "Enter the city.";
  if (!details.country) found.country = "Choose the country.";
  if (details.taxId?.trim() && !matchesTaxId(format, details.taxId)) {
    found.taxId = format.example ? `Check the format: ${format.example}` : `That does not look like a ${format.label}.`;
  }
  if (!details.emails.length) found.emails = "Add at least one address for invoices.";
  return found;
}

const FIELD_ORDER: BillingField[] = ["company", "line1", "postalCode", "city", "country", "taxId", "emails"];

interface FieldProps extends Omit<ComponentProps<typeof Input>, "id"> {
  field: BillingField;
  label: string;
  optional?: boolean;
  hint?: string;
  error?: string;
  wrapperClassName?: string;
}

/** A labelled text field with its hint and its error against it. */
function TextFieldRow({ field, label, optional, hint, error, wrapperClassName, ...input }: FieldProps) {
  return (
    <FormField data-field={field} error={error} described={Boolean(hint)} className={wrapperClassName}>
      <FormLabel className="min-h-5">
        {label}
        {optional ? <span className="text-xs font-normal text-muted-foreground">Optional</span> : null}
      </FormLabel>
      <FormControl>
        <Input {...input} />
      </FormControl>
      {hint ? <FormDescription>{hint}</FormDescription> : null}
    </FormField>
  );
}

function TaxStatus({ state }: { state: "idle" | "checking" | "valid" | "unverified" }) {
  return (
    <span aria-live="polite" className="inline-flex min-h-5 items-center">
      {state === "checking" ? (
        <Badge variant="muted">
          <Spinner size={12} label="" />
          Checking
        </Badge>
      ) : state === "valid" ? (
        <Badge variant="secondary">
          <IconCheck />
          Valid
        </Badge>
      ) : state === "unverified" ? (
        <Badge variant="outline">
          <IconWarning />
          Could not verify
        </Badge>
      ) : null}
    </span>
  );
}

/**
 * The form a company looks for before it can pay its first invoice: the name
 * and address that must appear on it, a tax or VAT number that is checked for
 * shape as you type and, if you pass `onValidateTaxId`, looked up live, the
 * addresses invoices are emailed to and an optional reference. Save lights up
 * when something changed, the fields lock while it runs so nothing typed in
 * the meantime is lost, errors sit against their field, and a note says
 * that invoices already issued keep the details they were sent with, so a
 * change never surprises accounting.
 */
export function BillingDetailsSection({ value, countries, onSave, onValidateTaxId, taxIdLabels, locale = "en-US", title = "Billing details", description = "These details appear on every invoice we send to your company.", headingLevel = 2, className }: BillingDetailsSectionProps) {
  const Heading = headingLevel === 3 ? "h3" : "h2";
  const id = useId();
  const form = useRef<HTMLFormElement>(null);
  const [base, setBase] = useState<BillingDetails>(() => tidy(value));
  const [draft, setDraft] = useState<BillingDetails>(() => tidy(value));
  const [touched, setTouched] = useState<Partial<Record<BillingField, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [serverErrors, setServerErrors] = useState<BillingErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  // Where the focus goes once the fields unlock again: a field the server refused (a selector) or the one that had it.
  const focusAfter = useRef<string | HTMLElement | null>(null);

  // New details from outside replace the draft. The echo of our own save is not new: it is already the saved baseline,
  // so it waits until the save is done and then changes nothing, and whatever was typed in the meantime stays.
  const incoming = JSON.stringify(tidy(value));
  const [seen, setSeen] = useState(incoming);
  if (seen !== incoming && !saving) {
    setSeen(incoming);
    if (incoming !== JSON.stringify(base)) {
      setBase(tidy(value));
      setDraft(tidy(value));
      setTouched({});
      setSubmitted(false);
    }
  }

  // A locked field drops the focus it had: put it back when the save is over, or on the field the server refused.
  useEffect(() => {
    if (saving) return;
    const wanted = focusAfter.current;
    focusAfter.current = null;
    if (!wanted) return;
    const target = typeof wanted === "string" ? form.current?.querySelector<HTMLElement>(wanted) : wanted;
    const active = document.activeElement;
    const lost = !active || active === document.body || active === target || active.matches(":disabled");
    if (target?.isConnected && (typeof wanted === "string" || lost)) target.focus();
  }, [saving]);

  // The country list is kept by what is in it, so a new array with the same countries does not rebuild the picker.
  const countryKey = countries?.join(",");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const only = useMemo(() => countries, [countryKey]);
  const formats = { ...DEFAULT_TAX_ID_FORMATS, ...taxIdLabels };
  const format = formats[draft.country] ?? FALLBACK_TAX_ID_FORMAT;
  const errors = problemsOf(draft, format);
  const dirty = JSON.stringify(tidy(draft)) !== JSON.stringify(base);
  const blank = (field: BillingField) => (field === "emails" ? draft.emails.length === 0 : !String(draft[field] ?? "").trim());
  const shown = (field: BillingField) => serverErrors[field] ?? (errors[field] && (submitted || (touched[field] && !blank(field))) ? errors[field] : undefined);

  // The live tax number lookup: once the shape is right, after a pause in typing, and remembered per number.
  const number = normaliseTaxId(draft.taxId ?? "");
  const lookupKey = `${draft.country}:${number}`;
  const checkable = Boolean(onValidateTaxId && number && draft.country && matchesTaxId(format, number));
  const [results, setResults] = useState<Record<string, "valid" | "unverified">>({});
  const validator = useRef(onValidateTaxId);
  const lookups = useRef(0);
  useEffect(() => {
    validator.current = onValidateTaxId;
  });
  const known = results[lookupKey];
  useEffect(() => {
    if (!checkable || known) return;
    let live = true;
    const timer = window.setTimeout(
      () => {
        lookups.current += 1;
        Promise.resolve()
          .then(() => validator.current?.(draft.country, number))
          .then(
            (ok) => ok === true,
            () => false,
          )
          .then((ok) => {
            if (live) setResults((current) => ({ ...current, [lookupKey]: ok ? "valid" : "unverified" }));
          });
      },
      lookups.current === 0 ? 0 : 500,
    );
    return () => {
      live = false;
      window.clearTimeout(timer);
    };
  }, [checkable, known, lookupKey, draft.country, number]);
  const taxState = !checkable ? "idle" : (known ?? "checking");

  function change(patch: Partial<BillingDetails>, field: BillingField) {
    setDraft((current) => ({ ...current, ...patch }));
    setServerErrors((current) => {
      const { [field]: _gone, ...rest } = current;
      return rest;
    });
    setSaved(false);
    setFormError(null);
  }

  const bind = (field: TextField) => ({
    field,
    name: field,
    value: draft[field] ?? "",
    error: shown(field),
    onChange: (event: ChangeEvent<HTMLInputElement>) => change({ [field]: event.target.value }, field),
    onBlur: () => setTouched((current) => ({ ...current, [field]: true })),
  });

  function discard() {
    setDraft(base);
    setTouched({});
    setSubmitted(false);
    setServerErrors({});
    setFormError(null);
    setSaved(false);
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    setSubmitted(true);
    const first = FIELD_ORDER.find((field) => errors[field]);
    if (first) {
      requestAnimationFrame(() => form.current?.querySelector<HTMLElement>(`[data-field="${first}"] [id$="-control"]`)?.focus());
      return;
    }
    const active = document.activeElement;
    focusAfter.current = active instanceof HTMLElement && form.current?.contains(active) ? active : null;
    setSaving(true);
    setFormError(null);
    setServerErrors({});
    const next = tidy(draft);
    try {
      const result = await onSave(next);
      if (typeof result === "string" && result) setFormError(result);
      else if (result && typeof result === "object" && Object.keys(result).length) {
        setServerErrors(result);
        const failed = FIELD_ORDER.find((field) => result[field]) ?? (Object.keys(result)[0] as BillingField | undefined);
        // The fields are still locked in this render; the effect above focuses the field once they open again.
        if (failed) focusAfter.current = `[data-field="${failed}"] [id$="-control"]`;
      } else {
        setBase(next);
        // The fields were locked while saving, so the draft is what was saved (now trimmed). Anything typed since stays, and reads as unsaved.
        setDraft((current) => (JSON.stringify(tidy(current)) === JSON.stringify(next) ? next : current));
        setTouched({});
        setSubmitted(false);
        setSaved(true);
      }
    } catch {
      setFormError("That did not save. Your changes are still here, so you can try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section data-slot="billing-details-section" aria-labelledby={`${id}-title`} className={cn("w-full", className)}>
      <Card className="gap-0 overflow-hidden py-0">
        <form ref={form} noValidate onSubmit={(event) => void save(event)}>
          <CardHeader className="px-6 pt-6 pb-6">
            <CardTitle asChild className="text-lg tracking-[-0.02em]">
              <Heading id={`${id}-title`}>{title}</Heading>
            </CardTitle>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            {/* Locked while the save runs, so nothing typed in flight can be lost when it comes back. */}
            <fieldset disabled={saving} className="contents">
              <div className="grid grid-cols-1 items-start gap-x-5 gap-y-6 sm:grid-cols-2">
                <TextFieldRow label="Company name" autoComplete="organization" wrapperClassName="sm:col-span-2" {...bind("company")} />

                <FormField data-field="line1" error={shown("line1")} className="sm:col-span-2">
                  <FormLabel className="min-h-5">Address</FormLabel>
                  <FormControl>
                    <Input name="line1" autoComplete="address-line1" placeholder="Street and number" value={draft.line1} onChange={(event) => change({ line1: event.target.value }, "line1")} onBlur={() => setTouched((current) => ({ ...current, line1: true }))} />
                  </FormControl>
                  <Input name="line2" aria-label="Address line 2, optional" autoComplete="address-line2" placeholder="Floor, suite or building (optional)" value={draft.line2 ?? ""} onChange={(event) => change({ line2: event.target.value }, "line2")} />
                </FormField>

                <div className="grid grid-cols-[7.5rem_minmax(0,1fr)] items-start gap-x-3 sm:col-span-2 sm:grid-cols-2 sm:gap-x-5">
                  <TextFieldRow label="Postal code" autoComplete="postal-code" {...bind("postalCode")} />
                  <TextFieldRow label="City" autoComplete="address-level2" {...bind("city")} />
                </div>

                <FormField data-field="country" error={shown("country")}>
                  <FormLabel className="min-h-5">Country</FormLabel>
                  <FormControl>
                    {/* The picker does not pass the invalid state on to its trigger, so the border is set here. */}
                    <CountrySelect
                      value={draft.country || null}
                      only={only}
                      suggested={NO_SUGGESTED}
                      locale={locale}
                      onValueChange={(code) => {
                        change({ country: code }, "country");
                        setTouched((current) => ({ ...current, country: true }));
                      }}
                      className={cn(shown("country") && "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/30")}
                    />
                  </FormControl>
                </FormField>

                <FormField data-field="taxId" error={shown("taxId")} described={Boolean(format.example) && !shown("taxId")}>
                  <div className="flex min-h-5 items-center justify-between gap-3">
                    <FormLabel className="min-h-5">
                      {format.label}
                      <span className="text-xs font-normal text-muted-foreground">Optional</span>
                    </FormLabel>
                    <TaxStatus state={taxState} />
                  </div>
                  <FormControl>
                    <Input
                      name="taxId"
                      autoComplete="off"
                      spellCheck={false}
                      placeholder={format.example}
                      value={draft.taxId ?? ""}
                      onChange={(event) => change({ taxId: event.target.value }, "taxId")}
                      onBlur={() => {
                        setTouched((current) => ({ ...current, taxId: true }));
                        setDraft((current) => ({ ...current, taxId: (current.taxId ?? "").trim().toUpperCase() }));
                        // A number that could not be verified is looked up again when the field is left, in case the lookup was down.
                        if (known === "unverified") setResults(({ [lookupKey]: _gone, ...rest }) => rest);
                      }}
                      className="uppercase placeholder:normal-case"
                    />
                  </FormControl>
                  {format.example && !shown("taxId") ? <FormDescription>Format: {format.example}</FormDescription> : null}
                </FormField>

                <FormField data-field="emails" error={shown("emails")} described className="sm:col-span-2">
                  <FormLabel className="min-h-5">Billing emails</FormLabel>
                  <FormControl>
                    {/* The box with the border is the first child of the tag input; the invalid state only reaches its inner field. */}
                    <TagInput
                      value={draft.emails}
                      onValueChange={(emails) => change({ emails }, "emails")}
                      validate={(tag) => (EMAIL.test(tag) ? undefined : "Enter a full email address, like name@company.com.")}
                      placeholder="name@company.com"
                      type="email"
                      autoComplete="off"
                      className={cn(shown("emails") && "[&>div:first-child]:border-destructive", saving && "opacity-50")}
                    />
                  </FormControl>
                  <FormDescription>Every address here gets each invoice. Press Enter or a comma to add one.</FormDescription>
                </FormField>

                <TextFieldRow label="PO number or reference" optional hint="Printed on every invoice, so your accountant can match it." autoComplete="off" wrapperClassName="sm:col-span-2" {...bind("reference")} />
              </div>
            </fieldset>

            <p className="mt-8 flex items-start gap-3 rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm leading-relaxed text-muted-foreground">
              <IconInfo className="mt-0.5 size-4 shrink-0 text-foreground" />
              <span>Invoices already issued keep the details they were sent with. A change applies from the next invoice on, so nothing your accountant has booked moves.</span>
            </p>
          </CardContent>

          <div data-slot="billing-details-footer" className="flex flex-col gap-3 border-t border-border bg-muted/40 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div aria-live="polite" className="min-w-0 text-sm">
              {formError ? (
                <p className="text-destructive">{formError}</p>
              ) : saving ? (
                <p className="text-muted-foreground">Saving</p>
              ) : (submitted && Object.keys(errors).length) || Object.keys(serverErrors).length ? (
                <p className="text-destructive">Check the highlighted fields.</p>
              ) : dirty ? (
                <p className="flex items-center gap-2 font-medium">
                  <span aria-hidden="true" className="size-1.5 rounded-full bg-foreground" />
                  Unsaved changes
                </p>
              ) : saved ? (
                <p className="flex items-center gap-2">
                  <IconCheck className="size-4 shrink-0" />
                  Saved. New invoices will use these details.
                </p>
              ) : (
                <p className="text-muted-foreground">No unsaved changes</p>
              )}
            </div>
            <div className="flex items-center justify-end gap-2">
              <Button type="button" variant="ghost" onClick={discard} disabled={!dirty || saving}>
                Discard
              </Button>
              <Button type="submit" loading={saving} disabled={!dirty}>
                Save changes
              </Button>
            </div>
          </div>
        </form>
      </Card>
    </section>
  );
}
