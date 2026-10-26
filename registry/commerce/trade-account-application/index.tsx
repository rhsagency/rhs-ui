"use client";

import { useEffect, useId, useMemo, useRef, useState, type ComponentProps, type KeyboardEvent, type ReactNode } from "react";

import { IconAlertCircle } from "@rhs-ui/icons";
import { TradeApplicationConfirmation } from "@rhs-ui/commerce/trade-account-application/confirmation";
import { DEFAULT_BUSINESS_TYPES, DEFAULT_COUNTRIES, DEFAULT_SPEND_BANDS, type BusinessTypeOption, type SpendBand } from "@rhs-ui/commerce/trade-account-application/options";
import { EMPTY, FIELD_ORDER, checkField, tidy, validate, type FieldErrors, type FieldKey, type TradeApplicationValues } from "@rhs-ui/commerce/trade-account-application/validate";
import { fill, wordsOf, type TradeApplicationLabels } from "@rhs-ui/commerce/trade-account-application/words";
import { Alert, AlertDescription, AlertTitle } from "@rhs-ui/primitives/alert";
import { Button } from "@rhs-ui/primitives/button";
import { Checkbox } from "@rhs-ui/primitives/checkbox";
import { Combobox, type ComboboxOption } from "@rhs-ui/primitives/combobox";
import { FileTrigger } from "@rhs-ui/primitives/file-trigger";
import { FormControl, FormDescription, FormField, FormLabel } from "@rhs-ui/primitives/form-field";
import { Input } from "@rhs-ui/primitives/input";
import { RadioCards } from "@rhs-ui/primitives/radio-cards";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@rhs-ui/primitives/select";
import { cn } from "@/lib/utils";

export type { BusinessTypeOption, SpendBand } from "@rhs-ui/commerce/trade-account-application/options";
export type { TradeApplicationValues } from "@rhs-ui/commerce/trade-account-application/validate";
export type { TradeApplicationLabels } from "@rhs-ui/commerce/trade-account-application/words";

export interface TradeAccountApplicationProps extends Omit<ComponentProps<"section">, "children" | "title" | "onSubmit"> {
  /** Called with the answers once every check has passed. Return a message to say the shop could not take it (the form stays, with everything in it); return nothing, or resolve, and the form is replaced by the confirmation. */
  onSubmit?: (values: TradeApplicationValues) => string | void | Promise<string | void>;
  /** The kinds of business to choose from, as cards. Defaults to retailer, installer, restaurant and other. */
  businessTypes?: readonly BusinessTypeOption[];
  /** The answers to "how much do you expect to order each month?", from least to most. */
  spendBands?: readonly SpendBand[];
  /** The countries the picker offers, as ISO 3166-1 alpha-2 codes. Their names are written in `locale`. */
  countries?: readonly string[];
  /** Where the trade terms are. The words "trade terms" become a link that opens in a new tab. */
  termsHref?: string;
  /** How many working days the answer takes. It is the promise next to the button and on the confirmation. Defaults to 2. */
  reviewDays?: number;
  /** Answers to start with, such as a name and an email the shop already has. */
  defaultValues?: Partial<TradeApplicationValues>;
  /** Show the confirmation for these answers instead of the form, for a page that has already taken the application. */
  submitted?: TradeApplicationValues;
  /** Where "Back to the shop" goes. Without it the confirmation has no link. */
  shopHref?: string;
  /** The heading. Defaults to "Apply for a trade account". */
  title?: string;
  /** The line under it. */
  description?: string;
  /** Always pass your application locale, so the country names and the numbers are written the same on the server and in the browser. */
  locale?: string;
  /** The heading's element: "h2" by default, "h3" inside a section that has its own h2. */
  headingAs?: "h2" | "h3";
  /** The words, for another language. */
  labels?: TradeApplicationLabels;
}

/** The red of an alert's words, darkened toward the text colour so a title or a message on the pale red fill reaches 4.5:1. The icon, the border and the fill keep the plain red. */
const ALERT_TEXT = "text-[color:color-mix(in_oklch,var(--destructive),var(--foreground)_30%)]";

interface FieldProps {
  /** The key the summary links to. */
  name: FieldKey | "jobTitle";
  label: string;
  hint?: string;
  optional?: string;
  error?: string;
  className?: string;
  children: ReactNode;
  base: string;
}

/** One label, one control, a hint and an error, wired together. The wrapper carries the id the summary links to. */
function Field({ name, label, hint, optional, error, className, children, base }: FieldProps) {
  return (
    <FormField id={`${base}-${name}`} data-field={name} error={error} described={Boolean(hint)} className={className}>
      <FormLabel>
        {label}
        {optional ? <span className="font-normal text-muted-foreground">({optional})</span> : null}
      </FormLabel>
      {children}
      {hint ? <FormDescription>{hint}</FormDescription> : null}
    </FormField>
  );
}

interface GroupProps {
  title: string;
  hint: string;
  id: string;
  children: ReactNode;
}

/** A group of fields: its title and a line on the left on a wide form, above on a narrow one. */
function Group({ title, hint, id, children }: GroupProps) {
  return (
    <div role="group" aria-labelledby={id} className="grid gap-x-10 gap-y-6 border-t border-border pt-8 @3xl:grid-cols-[13rem_minmax(0,1fr)]">
      <div>
        <h3 id={id} className="text-base font-semibold tracking-[-0.02em]">
          {title}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">{hint}</p>
      </div>
      <div className="grid items-start gap-5 @xl:grid-cols-2">{children}</div>
    </div>
  );
}

/**
 * The request for a trade or dealer account, for shops that approve buyers before they see trade prices: the company
 * (name, registration and VAT numbers, country), the person to write to and what the business buys (its type as
 * cards, the expected monthly spend, an optional trade reference and the terms). Problems are listed at the top and
 * each links to its field, and a field that is wrong says so under itself until it is fixed. A send that fails keeps
 * every answer and says why; a send that works replaces the form with the promise of an answer, what was given and
 * what happens next.
 */
export function TradeAccountApplication({
  onSubmit,
  businessTypes = DEFAULT_BUSINESS_TYPES,
  spendBands = DEFAULT_SPEND_BANDS,
  countries = DEFAULT_COUNTRIES,
  termsHref,
  reviewDays = 2,
  defaultValues,
  submitted,
  shopHref,
  title,
  description,
  locale = "en-US",
  headingAs: Heading = "h2",
  labels,
  className,
  ...props
}: TradeAccountApplicationProps) {
  const words = wordsOf(labels);
  const base = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const root = useRef<HTMLElement>(null);
  const summary = useRef<HTMLDivElement>(null);
  const banner = useRef<HTMLDivElement>(null);
  const typeGroup = useRef<HTMLDivElement>(null);
  const [values, setValues] = useState<TradeApplicationValues>({ ...EMPTY, ...defaultValues });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [pending, setPending] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const [sent, setSent] = useState<TradeApplicationValues | null>(null);
  const [focusTarget, setFocusTarget] = useState<"summary" | "banner" | "sent" | null>(null);

  const countryOptions = useMemo<ComboboxOption[]>(() => {
    let names: Intl.DisplayNames | null = null;
    try {
      names = new Intl.DisplayNames([locale], { type: "region" });
    } catch {
      // Without the names the codes themselves are listed.
    }
    const nameOf = (code: string): string => names?.of(code) ?? code;
    return countries
      .map((code) => ({ value: code, label: nameOf(code), keywords: [code] }))
      .sort((a, b) => a.label.localeCompare(b.label, locale));
  }, [countries, locale]);

  const plural = new Intl.PluralRules(locale);
  const numbers = new Intl.NumberFormat(locale);
  const problems = FIELD_ORDER.filter((key) => errors[key]);
  const done = submitted ?? sent;

  // Focus goes where the news is: the list of problems, the notice that the send failed, or the confirmation.
  useEffect(() => {
    if (focusTarget === null) return;
    const node = focusTarget === "summary" ? summary.current : focusTarget === "banner" ? banner.current : root.current?.querySelector<HTMLElement>("[data-focus-target]");
    node?.focus();
    setFocusTarget(null);
  }, [focusTarget]);

  // RadioCards does not pass ARIA attributes on to its radio group, so the type of business gets here what every other field gets from FormControl: that an answer is required, and that it is missing, pointing at the words that say so.
  const typeError = errors.businessType;
  useEffect(() => {
    const group = typeGroup.current?.querySelector<HTMLElement>('[role="radiogroup"]');
    if (!group) return;
    group.setAttribute("aria-required", "true");
    if (typeError) {
      group.setAttribute("aria-invalid", "true");
      group.setAttribute("aria-describedby", `${base}-businessType-error`);
    } else {
      group.removeAttribute("aria-invalid");
      group.removeAttribute("aria-describedby");
    }
  }, [typeError, base]);

  function set<K extends keyof TradeApplicationValues>(key: K, value: TradeApplicationValues[K]) {
    const next = { ...values, [key]: value };
    setValues(next);
    // A field that already shows a problem is checked again as it changes, so the problem goes the moment it is fixed.
    if (key in errors) {
      const message = checkField(key as FieldKey, next, words.errors);
      setErrors((current) => {
        const copy = { ...current };
        if (message) copy[key as FieldKey] = message;
        else delete copy[key as FieldKey];
        return copy;
      });
    }
  }

  function focusField(key: FieldKey) {
    const wrapper = root.current?.querySelector<HTMLElement>(`[data-field="${key}"]`);
    const target =
      wrapper?.querySelector<HTMLElement>('[role="radio"][aria-checked="true"]') ??
      wrapper?.querySelector<HTMLElement>('input:not([type="hidden"]), [role="combobox"], [role="radio"], [role="checkbox"], button, textarea');
    target?.focus();
  }

  async function submit() {
    if (pending) return;
    setFailure(null);
    const found = validate(values, words.errors);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      setFocusTarget("summary");
      return;
    }
    setPending(true);
    try {
      const answers = tidy(values);
      const message = await onSubmit?.(answers);
      if (typeof message === "string" && message.length > 0) {
        setFailure(message);
        setFocusTarget("banner");
      } else {
        setSent(answers);
        setFocusTarget("sent");
      }
    } catch {
      setFailure(words.failedMessage);
      setFocusTarget("banner");
    } finally {
      setPending(false);
    }
  }

  if (done) {
    return (
      <section ref={root} data-slot="trade-account-application" aria-labelledby={`${base}-title`} className={cn("@container min-w-0", className)} {...props}>
        <TradeApplicationConfirmation titleId={`${base}-title`} headingAs={Heading} values={done} words={words} businessTypes={businessTypes} spendBands={spendBands} reviewDays={reviewDays} shopHref={shopHref} locale={locale} />
        <p role="status" className="sr-only">
          {words.sentStatus}
        </p>
      </section>
    );
  }

  /** Enter in a text field sends the application, as it would in a form. Keys from the open country list are not inside this element, so they never get here. */
  function sendOnEnter(event: KeyboardEvent<HTMLDivElement>) {
    const target = event.target;
    if (event.key !== "Enter" || event.defaultPrevented || !(target instanceof HTMLInputElement) || !event.currentTarget.contains(target)) return;
    if (["checkbox", "radio", "file", "button", "submit"].includes(target.type)) return;
    event.preventDefault();
    void submit();
  }

  const promise = fill(plural.select(reviewDays) === "one" ? words.promiseOne : words.promiseOther, { days: numbers.format(reviewDays) });

  return (
    <section ref={root} data-slot="trade-account-application" aria-labelledby={`${base}-title`} className={cn("@container min-w-0", className)} {...props}>
      {/* Not a <form> element: Radix draws a hidden native input beside every checkbox, radio and select inside one and clicks it from an effect, which React reports in development while a list is still closing. Enter in a text field still sends it. */}
      <div onKeyDown={sendOnEnter} className="grid gap-10">
        <header className="grid gap-2">
          <Heading id={`${base}-title`} className="text-2xl leading-tight font-medium tracking-[-0.035em] text-balance @3xl:text-3xl">
            {title ?? words.title}
          </Heading>
          <p className="max-w-prose text-base leading-relaxed text-pretty text-muted-foreground">{description ?? words.description}</p>
          <p className="text-xs text-muted-foreground">{words.requiredNote}</p>
        </header>

        {failure ? (
          <Alert ref={banner} tabIndex={-1} tone="destructive" role="group" aria-labelledby={`${base}-failed`} className="outline-none focus-visible:ring-[3px] focus-visible:ring-destructive/30">
            <IconAlertCircle aria-hidden="true" />
            <AlertTitle id={`${base}-failed`} className={ALERT_TEXT}>
              {words.failedTitle}
            </AlertTitle>
            <AlertDescription>
              <p className={ALERT_TEXT}>{failure}</p>
              <p className="text-muted-foreground">{words.failedHint}</p>
            </AlertDescription>
          </Alert>
        ) : null}

        {problems.length > 0 ? (
          <Alert ref={summary} tabIndex={-1} tone="destructive" role="group" aria-labelledby={`${base}-problems`} className="outline-none focus-visible:ring-[3px] focus-visible:ring-destructive/30">
            <IconAlertCircle aria-hidden="true" />
            <AlertTitle id={`${base}-problems`} className={ALERT_TEXT}>
              {fill(plural.select(problems.length) === "one" ? words.problemsOne : words.problemsOther, { count: numbers.format(problems.length) })}
            </AlertTitle>
            <AlertDescription>
              <ul role="list" className="grid gap-1">
                {problems.map((key) => (
                  <li key={key}>
                    <a
                      href={`#${base}-${key}`}
                      onClick={(event) => {
                        event.preventDefault();
                        focusField(key);
                      }}
                      className="rounded-sm font-medium text-foreground underline underline-offset-4 outline-none hover:text-[color:color-mix(in_oklch,var(--destructive),var(--foreground)_30%)] focus-visible:ring-[3px] focus-visible:ring-ring/40"
                    >
                      {errors[key]}
                    </a>
                  </li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        ) : null}

        <Group id={`${base}-company`} title={words.companyTitle} hint={words.companyHint}>
          <Field base={base} name="companyName" label={words.fields.companyName} error={errors.companyName} className="@xl:col-span-2">
            <FormControl>
              <Input name="company" autoComplete="organization" aria-required="true" value={values.companyName} onChange={(event) => set("companyName", event.target.value)} />
            </FormControl>
          </Field>
          {/* A plain text keyboard on purpose: registration numbers carry letters, dashes and dots (SC123456, HRB 12345 B, CHE-123.456.789), which a numeric keypad cannot type. */}
          <Field base={base} name="registrationNumber" label={words.fields.registrationNumber} hint={words.hints.registrationNumber} error={errors.registrationNumber}>
            <FormControl>
              <Input name="registration" autoComplete="off" aria-required="true" value={values.registrationNumber} onChange={(event) => set("registrationNumber", event.target.value)} />
            </FormControl>
          </Field>
          <Field base={base} name="vatNumber" label={words.fields.vatNumber} hint={words.hints.vatNumber} error={errors.vatNumber}>
            <FormControl>
              <Input name="vat" autoComplete="off" autoCapitalize="characters" spellCheck={false} aria-required="true" className="uppercase" value={values.vatNumber} onChange={(event) => set("vatNumber", event.target.value)} />
            </FormControl>
          </Field>
          <Field base={base} name="country" label={words.fields.country} error={errors.country}>
            <FormControl>
              <Combobox
                options={countryOptions}
                value={values.country || null}
                onValueChange={(code) => set("country", code)}
                label={words.fields.country}
                placeholder={words.countryPlaceholder}
                searchPlaceholder={words.countrySearch}
                emptyText={words.countryNone}
                name="country"
                required
              />
            </FormControl>
          </Field>
        </Group>

        <Group id={`${base}-contact`} title={words.contactTitle} hint={words.contactHint}>
          <Field base={base} name="contactName" label={words.fields.contactName} error={errors.contactName}>
            <FormControl>
              <Input name="name" autoComplete="name" aria-required="true" value={values.contactName} onChange={(event) => set("contactName", event.target.value)} />
            </FormControl>
          </Field>
          <Field base={base} name="jobTitle" label={words.fields.jobTitle} optional={words.optional}>
            <FormControl>
              <Input name="job-title" autoComplete="organization-title" value={values.jobTitle} onChange={(event) => set("jobTitle", event.target.value)} />
            </FormControl>
          </Field>
          <Field base={base} name="email" label={words.fields.email} hint={words.hints.email} error={errors.email}>
            <FormControl>
              <Input name="email" type="email" autoComplete="email" inputMode="email" spellCheck={false} aria-required="true" value={values.email} onChange={(event) => set("email", event.target.value)} />
            </FormControl>
          </Field>
          <Field base={base} name="phone" label={words.fields.phone} hint={words.hints.phone} optional={words.optional} error={errors.phone}>
            <FormControl>
              <Input name="phone" type="tel" autoComplete="tel" inputMode="tel" value={values.phone} onChange={(event) => set("phone", event.target.value)} />
            </FormControl>
          </Field>
        </Group>

        <Group id={`${base}-buying`} title={words.buyingTitle} hint={words.buyingHint}>
          <div ref={typeGroup} data-field="businessType" id={`${base}-businessType`} className="grid gap-2 @xl:col-span-2">
            <p id={`${base}-businessType-label`} className={cn("text-sm leading-none font-medium", errors.businessType && "text-destructive")}>
              {words.fields.businessType}
            </p>
            {/* One column until the form itself is wide enough for two cards with room to read: the cards follow the form, not the screen. */}
            <RadioCards
              label={words.fields.businessType}
              options={businessTypes}
              value={values.businessType}
              onValueChange={(value) => set("businessType", value)}
              columns={1}
              className="@xl:grid-cols-2"
            />
            <p id={`${base}-businessType-error`} role="status" className="text-xs font-medium text-destructive empty:hidden">
              {errors.businessType}
            </p>
          </div>

          <Field base={base} name="monthlySpend" label={words.fields.monthlySpend} error={errors.monthlySpend}>
            <Select name="monthlySpend" value={values.monthlySpend} onValueChange={(value) => set("monthlySpend", value)}>
              <FormControl>
                <SelectTrigger aria-required="true">
                  <SelectValue placeholder={words.spendPlaceholder} />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {spendBands.map((band) => (
                  <SelectItem key={band.value} value={band.value}>
                    {band.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <div role="group" aria-labelledby={`${base}-reference-label`} className="grid content-start gap-2 @xl:col-span-2">
            <p id={`${base}-reference-label`} className="flex items-center gap-2 text-sm leading-none font-medium">
              {words.fields.reference}
              <span className="font-normal text-muted-foreground">({words.optional})</span>
            </p>
            <FileTrigger onFileChange={(file) => set("reference", file)} accept=".pdf,.png,.jpg,.jpeg,image/*" maxSize={5_000_000} label={words.referenceButton} locale={locale} />
            <p className="text-xs text-muted-foreground">{words.hints.reference}</p>
          </div>

          <FormField id={`${base}-acceptedTerms`} data-field="acceptedTerms" error={errors.acceptedTerms} className="@xl:col-span-2">
            <div className="flex items-start gap-3">
              <FormControl>
                <Checkbox name="terms" aria-required="true" checked={values.acceptedTerms} onCheckedChange={(checked) => set("acceptedTerms", checked === true)} className="mt-0.5" />
              </FormControl>
              <FormLabel className="block text-sm leading-snug font-normal">
                {words.termsBefore}
                {termsHref ? (
                  <a href={termsHref} target="_blank" rel="noreferrer" className="rounded-sm font-medium underline underline-offset-4 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40">
                    {words.termsLink}
                  </a>
                ) : (
                  words.termsLink
                )}
                {words.termsAfter}
              </FormLabel>
            </div>
          </FormField>
        </Group>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-3 border-t border-border pt-8">
          <Button type="button" size="lg" loading={pending} onClick={() => void submit()}>
            {pending ? words.submitting : words.submit}
          </Button>
          <p className="text-sm text-muted-foreground">{promise}</p>
        </div>
      </div>
    </section>
  );
}
