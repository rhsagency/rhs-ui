"use client";

import { useEffect, useId, useMemo, useRef, useState, useSyncExternalStore, type ComponentProps, type KeyboardEvent, type ReactNode } from "react";

import { IconAlertCircle, IconBarcode, IconCalendar, IconPackage, IconReceipt, IconShieldCheck } from "@rhs-ui/icons";
import { WarrantyConfirmation } from "@rhs-ui/commerce/warranty-registration/confirmation";
import {
  FIELD_ORDER,
  checkField,
  compilePattern,
  dateOfIso,
  dayText,
  durationText,
  addMonths,
  isoOfDate,
  knownZone,
  tidySerial,
  todayIn,
  validate,
  type FieldErrors,
  type FieldKey,
  type WarrantyAnswers,
  type WarrantyMoment,
  type WarrantyProduct,
  type WarrantyReceipt,
  type WarrantyRules,
  type WarrantyValues,
} from "@rhs-ui/commerce/warranty-registration/warranty";
import { fill, wordsOf, type WarrantyRegistrationLabels, type WarrantyWords } from "@rhs-ui/commerce/warranty-registration/words";
import { Alert, AlertDescription, AlertTitle } from "@rhs-ui/primitives/alert";
import { Badge } from "@rhs-ui/primitives/badge";
import { Button } from "@rhs-ui/primitives/button";
import { Checkbox } from "@rhs-ui/primitives/checkbox";
import { DatePicker } from "@rhs-ui/primitives/date-picker";
import { FileTrigger } from "@rhs-ui/primitives/file-trigger";
import { FormControl, FormDescription, FormField, FormLabel } from "@rhs-ui/primitives/form-field";
import { Input } from "@rhs-ui/primitives/input";
import { cn } from "@/lib/utils";

export type { WarrantyMoment, WarrantyProduct, WarrantyReceipt, WarrantyValues } from "@rhs-ui/commerce/warranty-registration/warranty";
export type { WarrantyRegistrationLabels } from "@rhs-ui/commerce/warranty-registration/words";

export interface WarrantyRegistrationProps extends Omit<ComponentProps<"section">, "children" | "title" | "onSubmit"> {
  /** The product that is being registered, when you know it. It is shown beside the form and the form does not ask for it. Without it the form has a field for the product. */
  product?: WarrantyProduct;
  /** Called with the answers once every check has passed. Return a message to say the shop could not take it (the form stays, with every answer in it, the receipt too); return nothing, or resolve, and the form is replaced by the confirmation. Return `{ reference }` to print the registration's reference on the confirmation. */
  onSubmit?: (values: WarrantyValues) => string | WarrantyReceipt | void | Promise<string | WarrantyReceipt | void>;
  /** How many months the warranty runs from the day of purchase. It is worked out and shown before the form is sent. Defaults to 24. */
  warrantyMonths?: number;
  /** What a serial number looks like. A string is a regular expression's source (`"^HX-\\d{4}-[A-Z0-9]{4}$"`, matched without regard to case) and can cross from a Server Component; a RegExp keeps its own flags. A serial number that does not fit is explained in words. Without it any serial number is accepted. */
  serialPattern?: RegExp | string;
  /** Where the serial number is printed, under the field: "On the label under the base, after S/N." */
  serialHelp?: ReactNode;
  /** An example that fits the pattern. It is the field's placeholder, written as an example ("For example HX-4821-K9Q2") so an empty field never looks filled in, and it is quoted in the message when a serial number does not fit. */
  serialExample?: string;
  /** The largest receipt in bytes. A bigger file is refused with the reason in words. Defaults to 5 MB. */
  maxFileSize?: number;
  /** Whether a receipt must be attached. Defaults to true; with false the field says it is optional. */
  proofRequired?: boolean;
  /** What the warranty covers, one line each, for the confirmation. Left out when empty. */
  covers?: readonly string[];
  /** What it does not cover, one line each, for the confirmation. */
  excludes?: readonly string[];
  /** Where the privacy notice is. The consent line then ends in a link that opens in a new tab. */
  privacyHref?: string;
  /** Where "Back to the shop" goes on the confirmation. Without it there is no link. */
  shopHref?: string;
  /** Answers to start with, such as the shop and the day when the customer comes from an order. The day is yyyy-mm-dd. */
  defaultValues?: Partial<Omit<WarrantyValues, "proof" | "coveredUntil">>;
  /** Show the confirmation for these answers instead of the form, for a page that has already registered the product. */
  submitted?: WarrantyValues & WarrantyReceipt;
  /** The moment "today" is measured from, for the check that the day is not in the future and the cover has not ended. Pass it from the server so the first render matches the browser's; without it the browser's clock is used once the page has loaded. */
  now?: WarrantyMoment;
  /** The shop's time zone: it decides which calendar day "today" is. Defaults to "UTC". */
  timeZone?: string;
  /** Always pass your application locale, so the server and the browser write the same dates. */
  locale?: string;
  /** The heading. Defaults to "Register your {product}". */
  title?: string;
  /** The line under it. */
  description?: string;
  /** The heading's element: "h2" by default, "h3" inside a section that has its own h2. */
  headingAs?: "h2" | "h3";
  /** The words, for another language. */
  labels?: WarrantyRegistrationLabels;
}

interface State {
  product: string;
  serial: string;
  purchaseDate: Date | null;
  store: string;
  proof: File | null;
  consent: boolean;
}

const noSubscription = (): (() => void) => () => undefined;

/** The shop's calendar day: from `now` when you pass it, otherwise the browser's clock once the page has loaded (never on the server, so nothing mismatches). */
function useToday(now: WarrantyMoment | undefined, zone: string): string | null {
  const given = now === undefined ? null : todayIn(now, zone);
  const clock = useSyncExternalStore(
    noSubscription,
    () => todayIn(Date.now(), zone),
    () => null,
  );
  return given ?? clock;
}

interface FieldProps {
  name: FieldKey;
  label: string;
  hint?: ReactNode;
  optional?: string;
  error?: string;
  className?: string;
  children: ReactNode;
  base: string;
}

/** One label, one control, a hint and an error, wired together. The wrapper carries the name the form focuses by. */
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

interface AsideProps {
  product?: WarrantyProduct;
  duration: string;
  words: WarrantyWords;
  id: string;
}

/** The product the form is for, and what to have ready. A narrow form gets the product as one row and no list. It comes first in the markup so it sits first on a wide form, which is why "Have ready" is the name of a group and not a heading: the form's own heading is the first one a screen reader meets. */
function Aside({ product, duration, words, id }: AsideProps) {
  const ready = [IconBarcode, IconCalendar, IconReceipt] as const;
  return (
    <div className="grid content-start gap-7">
      {product ? (
        <div
          data-slot="warranty-registration-product"
          className="grid grid-cols-[4rem_minmax(0,1fr)] items-center gap-4 rounded-xl border border-border bg-card p-3 shadow-xs @3xl:grid-cols-1 @3xl:gap-0 @3xl:overflow-hidden @3xl:p-0"
        >
          <span aria-hidden="true" className="grid aspect-square place-items-center overflow-hidden rounded-lg bg-muted @3xl:aspect-[4/3] @3xl:rounded-none">
            {product.image ? (
              // eslint-disable-next-line @next/next/no-img-element -- framework-neutral; the picture is decorative, the name is beside it
              <img src={product.image} alt="" loading="lazy" decoding="async" className="size-full object-cover" />
            ) : (
              <IconPackage className="size-6 text-muted-foreground @3xl:size-9" />
            )}
          </span>
          <div className="min-w-0 @3xl:p-4">
            <p className="text-sm leading-snug font-medium [overflow-wrap:anywhere]">{product.name}</p>
            {product.model ? <p className="mt-0.5 text-xs text-muted-foreground tabular-nums [overflow-wrap:anywhere]">{fill(words.modelLine, { model: product.model })}</p> : null}
            <Badge variant="muted" className="mt-2 @3xl:mt-3">
              <IconShieldCheck aria-hidden="true" />
              {fill(words.warrantyBadge, { duration })}
            </Badge>
          </div>
        </div>
      ) : null}

      <div role="group" aria-labelledby={`${id}-ready`} className="hidden gap-3 @3xl:grid">
        <p id={`${id}-ready`} className="text-sm font-medium">
          {words.readyTitle}
        </p>
        <ul role="list" className="grid gap-3">
          {words.ready.map((line, index) => {
            const Icon = ready[index] ?? IconReceipt;
            return (
              <li key={line} className="flex items-center gap-3 text-sm leading-snug">
                <span aria-hidden="true" className="grid size-8 shrink-0 place-items-center rounded-lg border border-border bg-card text-muted-foreground">
                  <Icon className="size-4" />
                </span>
                <span className="min-w-0">{line}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

/**
 * Registering a purchase for its warranty: the product (shown when you know it), the serial number with a hint of
 * where to find it and a check against the pattern you give, the day it was bought, the shop or order number, the
 * receipt and a consent line. As soon as a day is chosen the form says when the cover ends ("Covered until 14 March
 * 2028"), so the customer sees what registering gets them before sending. A serial number that does not fit is
 * explained in words, a send that fails keeps every answer and the receipt's name, and a send that works replaces the
 * form with the confirmation: the end date, what was registered, what is covered and a reference. It gives durable
 * goods a reason to be registered and the customer proof that they are.
 */
export function WarrantyRegistration({
  product,
  onSubmit,
  warrantyMonths = 24,
  serialPattern,
  serialHelp,
  serialExample,
  maxFileSize = 5_000_000,
  proofRequired = true,
  covers,
  excludes,
  privacyHref,
  shopHref,
  defaultValues,
  submitted,
  now,
  timeZone = "UTC",
  locale = "en-US",
  title,
  description,
  headingAs: Heading = "h2",
  labels,
  className,
  ...props
}: WarrantyRegistrationProps) {
  const words = wordsOf(labels);
  const base = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const root = useRef<HTMLElement>(null);
  const banner = useRef<HTMLDivElement>(null);
  const proofGroup = useRef<HTMLDivElement>(null);
  const zone = knownZone(timeZone);
  const pattern = useMemo(() => compilePattern(serialPattern), [serialPattern]);
  const today = useToday(now, zone);
  const [state, setState] = useState<State>(() => ({
    product: defaultValues?.product ?? "",
    serial: defaultValues?.serial ?? "",
    purchaseDate: defaultValues?.purchaseDate ? dateOfIso(defaultValues.purchaseDate) : null,
    store: defaultValues?.store ?? "",
    proof: null,
    consent: defaultValues?.consent ?? false,
  }));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [pending, setPending] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const [sent, setSent] = useState<(WarrantyValues & WarrantyReceipt) | null>(null);
  const [focusTarget, setFocusTarget] = useState<FieldKey | "banner" | "sent" | null>(null);

  const duration = durationText(warrantyMonths, locale);
  const done = submitted ?? sent;

  const rulesAt = (day: string | null): WarrantyRules => ({
    asksProduct: !product,
    pattern,
    example: serialExample ?? "",
    months: warrantyMonths,
    proofRequired,
    today: day,
    locale,
    errors: words.errors,
  });
  const answersOf = (from: State): WarrantyAnswers => ({
    product: product?.name ?? from.product,
    serial: from.serial,
    purchaseDate: from.purchaseDate ? isoOfDate(from.purchaseDate) : null,
    store: from.store,
    proof: from.proof,
    consent: from.consent,
  });

  const purchaseIso = state.purchaseDate ? isoOfDate(state.purchaseDate) : null;
  const endIso = purchaseIso ? addMonths(purchaseIso, warrantyMonths) : null;
  // The preview shows only for a day that can be registered: not in the future and with the cover still running.
  const dayProblem = checkField("purchaseDate", answersOf(state), rulesAt(today));
  const preview = endIso && !dayProblem ? endIso : null;
  const latest = today ? dateOfIso(today) : null;

  // Focus goes where the news is: the first field that needs a look, the notice that the send failed, or the confirmation.
  useEffect(() => {
    if (focusTarget === null) return;
    const node =
      focusTarget === "banner"
        ? banner.current
        : focusTarget === "sent"
          ? root.current?.querySelector<HTMLElement>("[data-focus-target]")
          : root.current?.querySelector<HTMLElement>(`[data-field="${focusTarget}"] :is(input:not([type="hidden"]), button, textarea)`);
    node?.focus();
    setFocusTarget(null);
  }, [focusTarget]);

  // Once a file is chosen the file field swaps its button for the file's row and leaves the real input behind, hidden and still in the tab order, with no label. While a file is attached that input is taken out of both; the row's own remove button is the control.
  useEffect(() => {
    const input = proofGroup.current?.querySelector<HTMLInputElement>('input[type="file"]');
    if (!input) return;
    if (state.proof) {
      input.setAttribute("aria-hidden", "true");
      input.tabIndex = -1;
    } else {
      input.removeAttribute("aria-hidden");
      input.removeAttribute("tabindex");
    }
  }, [state.proof]);

  // A day that came with the form, from the order, is checked as soon as today is known.
  useEffect(() => {
    if (today && state.purchaseDate) recheck("purchaseDate", state);
    // Only when the clock becomes known: later changes go through set().
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [today]);

  function recheck(key: FieldKey, next: State) {
    const message = checkField(key, answersOf(next), rulesAt(today));
    setErrors((current) => {
      const copy = { ...current };
      if (message) copy[key] = message;
      else delete copy[key];
      return copy;
    });
  }

  function set<K extends keyof State>(key: K, value: State[K]) {
    const next = { ...state, [key]: value };
    setState(next);
    // A field that already shows a problem is checked again as it changes, so the problem goes the moment it is fixed.
    // A day is chosen on purpose rather than typed, so it is checked at once: a day that is too old says so before anything is sent.
    if (key in errors || (key === "purchaseDate" && value !== null)) recheck(key as FieldKey, next);
  }

  async function submit() {
    if (pending) return;
    setFailure(null);
    const answers = answersOf(state);
    const found = validate(answers, rulesAt(todayIn(now ?? Date.now(), zone)));
    setErrors(found);
    const first = FIELD_ORDER.find((key) => found[key]);
    if (first) {
      setFocusTarget(first);
      return;
    }
    const day = answers.purchaseDate ?? "";
    const values: WarrantyValues = {
      product: answers.product.trim(),
      serial: tidySerial(answers.serial),
      purchaseDate: day,
      store: answers.store.trim(),
      proof: answers.proof,
      consent: answers.consent,
      coveredUntil: addMonths(day, warrantyMonths) ?? day,
    };
    setPending(true);
    try {
      const result = await onSubmit?.(values);
      if (typeof result === "string" && result.length > 0) {
        setFailure(result);
        setFocusTarget("banner");
      } else {
        setSent({ ...values, reference: result && typeof result === "object" ? result.reference : undefined });
        setFocusTarget("sent");
      }
    } catch {
      setFailure(words.failedMessage);
      setFocusTarget("banner");
    } finally {
      setPending(false);
    }
  }

  /** Enter in a text field sends the form, as it would in a form element. Keys from the open calendar are not inside this element, so they never get here. */
  function sendOnEnter(event: KeyboardEvent<HTMLDivElement>) {
    const target = event.target;
    if (event.key !== "Enter" || event.defaultPrevented || !(target instanceof HTMLInputElement) || !event.currentTarget.contains(target)) return;
    if (["checkbox", "radio", "file", "button", "submit"].includes(target.type)) return;
    event.preventDefault();
    void submit();
  }

  const titleId = `${base}-title`;
  const heading = title ?? (product ? fill(words.titleNamed, { product: product.name }) : words.title);

  if (done) {
    return (
      <section ref={root} data-slot="warranty-registration" aria-labelledby={titleId} className={cn("@container min-w-0", className)} {...props}>
        <WarrantyConfirmation
          titleId={titleId}
          headingAs={Heading}
          values={done}
          model={product?.model}
          months={warrantyMonths}
          covers={covers}
          excludes={excludes}
          reference={done.reference}
          shopHref={shopHref}
          words={words}
          locale={locale}
        />
        <p role="status" className="sr-only">
          {fill(words.sentStatus, { date: dayText(done.coveredUntil, locale) })}
        </p>
      </section>
    );
  }

  const size = new Intl.NumberFormat(locale, { style: "unit", unit: "megabyte", maximumFractionDigits: 1 }).format(maxFileSize / 1e6);

  return (
    <section ref={root} data-slot="warranty-registration" aria-labelledby={titleId} className={cn("@container min-w-0", className)} {...props}>
      {/* Not a <form> element: Radix draws a hidden native input beside every checkbox inside one and clicks it from an effect, which React reports in development. Enter in a text field still sends it. */}
      <div onKeyDown={sendOnEnter} className="grid gap-8 @3xl:grid-cols-[16rem_minmax(0,1fr)] @3xl:gap-14">
        <Aside product={product} duration={duration} words={words} id={base} />

        <div className="grid min-w-0 content-start gap-7">
          <header className="grid gap-2">
            <Heading id={titleId} className="text-2xl leading-tight font-medium tracking-[-0.035em] text-balance @3xl:text-3xl">
              {heading}
            </Heading>
            <p className="max-w-prose text-base leading-relaxed text-pretty text-muted-foreground">{description ?? words.description}</p>
            {!proofRequired ? <p className="text-xs text-muted-foreground">{words.requiredNote}</p> : null}
          </header>

          {failure ? (
            <Alert ref={banner} tabIndex={-1} tone="destructive" role="group" aria-labelledby={`${base}-failed`} className="outline-none focus-visible:ring-[3px] focus-visible:ring-destructive/30">
              <IconAlertCircle aria-hidden="true" />
              <AlertTitle id={`${base}-failed`} className="text-foreground">
                {words.failedTitle}
              </AlertTitle>
              <AlertDescription className="text-foreground">
                <p>{failure}</p>
                <p className="text-muted-foreground">{words.failedHint}</p>
              </AlertDescription>
            </Alert>
          ) : null}

          <div className="grid items-start gap-x-5 gap-y-6 @xl:grid-cols-2">
            {!product ? (
              <Field base={base} name="product" label={words.fields.product} hint={words.hints.product} error={errors.product} className="@xl:col-span-2">
                <FormControl>
                  <Input name="product" autoComplete="off" placeholder={words.productPlaceholder} value={state.product} onChange={(event) => set("product", event.target.value)} />
                </FormControl>
              </Field>
            ) : null}

            <Field base={base} name="serial" label={words.fields.serial} hint={serialHelp} error={errors.serial} className="@xl:col-span-2">
              <FormControl>
                <Input
                  name="serial"
                  autoComplete="off"
                  autoCapitalize="characters"
                  spellCheck={false}
                  placeholder={serialExample ? fill(words.serialPlaceholderExample, { example: serialExample }) : words.serialPlaceholder}
                  value={state.serial}
                  onChange={(event) => set("serial", event.target.value)}
                  onBlur={() => {
                    if (state.serial.trim()) recheck("serial", state);
                  }}
                  className="font-mono tracking-tight uppercase placeholder:normal-case"
                />
              </FormControl>
            </Field>

            <Field base={base} name="purchaseDate" label={words.fields.purchaseDate} error={errors.purchaseDate}>
              <FormControl>
                <DatePicker
                  name="purchase-date"
                  value={state.purchaseDate}
                  onValueChange={(day) => set("purchaseDate", day)}
                  max={latest ?? undefined}
                  locale={locale}
                  placeholder={words.datePlaceholder}
                  className={cn("w-full", errors.purchaseDate && "border-destructive ring-destructive/25")}
                />
              </FormControl>
            </Field>

            <Field base={base} name="store" label={words.fields.store} hint={words.hints.store} error={errors.store}>
              <FormControl>
                <Input name="store" autoComplete="off" value={state.store} onChange={(event) => set("store", event.target.value)} />
              </FormControl>
            </Field>

            {/* A status region that is always there, so the end of the cover is read out when a day is chosen. */}
            <div role="status" className="@xl:col-span-2 empty:hidden">
              {preview ? (
                <div data-slot="warranty-registration-cover" className="flex items-center gap-3.5 rounded-xl border border-border bg-muted/50 px-4 py-3.5">
                  <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-full bg-foreground text-background">
                    <IconShieldCheck className="size-[1.125rem]" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium tabular-nums">{fill(words.coveredUntil, { date: dayText(preview, locale) })}</p>
                    <p className="text-xs text-muted-foreground">{fill(words.coveredFor, { duration })}</p>
                  </div>
                </div>
              ) : null}
            </div>

            <div ref={proofGroup} data-field="proof" role="group" aria-labelledby={`${base}-proof-label`} className="grid content-start gap-2 @xl:col-span-2">
              <p id={`${base}-proof-label`} className={cn("flex items-center gap-2 text-sm leading-none font-medium", errors.proof && "text-destructive")}>
                {words.fields.proof}
                {!proofRequired ? <span className="font-normal text-muted-foreground">({words.optional})</span> : null}
              </p>
              <FileTrigger onFileChange={(file) => set("proof", file)} accept=".pdf,.png,.jpg,.jpeg,image/*" maxSize={maxFileSize} label={words.proofButton} locale={locale} />
              <p className="text-xs text-muted-foreground">{fill(words.hints.proof, { size })}</p>
              <p role="status" className="text-xs font-medium text-destructive empty:hidden">
                {errors.proof}
              </p>
            </div>

            <FormField id={`${base}-consent`} data-field="consent" error={errors.consent} className="@xl:col-span-2">
              <div className="flex items-start gap-3">
                <FormControl>
                  <Checkbox checked={state.consent} onCheckedChange={(checked) => set("consent", checked === true)} className="mt-0.5" />
                </FormControl>
                <FormLabel className="block text-sm leading-snug font-normal text-foreground">
                  {words.consent}
                  {privacyHref ? (
                    <>
                      {" "}
                      <a href={privacyHref} target="_blank" rel="noreferrer" className="rounded-sm font-medium underline underline-offset-4 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40">
                        {words.privacyLink}
                      </a>
                    </>
                  ) : null}
                </FormLabel>
              </div>
            </FormField>
          </div>

          <div className="border-t border-border pt-6">
            <Button type="button" size="lg" loading={pending} onClick={() => void submit()} className="w-full @md:w-auto">
              {pending ? words.submitting : words.submit}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
