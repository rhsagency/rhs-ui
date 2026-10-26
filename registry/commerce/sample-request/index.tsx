"use client";

import { useEffect, useId, useRef, useState, type ComponentProps, type KeyboardEvent, type ReactNode } from "react";

import { IconAlertCircle, IconClose, IconTruck } from "@rhs-ui/icons";
import { SampleConfirmation } from "@rhs-ui/commerce/sample-request/confirmation";
import {
  EMPTY_ADDRESS,
  FIELD_ORDER,
  checkField,
  fill,
  tidy,
  validate,
  wordsOf,
  type FieldErrors,
  type FieldKey,
  type SampleAddress,
  type SampleReceipt,
  type SampleRequestValues,
  type SampleRequestLabels,
  type Swatch,
} from "@rhs-ui/commerce/sample-request/samples";
import { SwatchFace, SwatchTile } from "@rhs-ui/commerce/sample-request/swatch";
import { Alert, AlertDescription, AlertTitle } from "@rhs-ui/primitives/alert";
import { Button } from "@rhs-ui/primitives/button";
import { FormControl, FormDescription, FormField, FormLabel } from "@rhs-ui/primitives/form-field";
import { Input } from "@rhs-ui/primitives/input";
import { cn } from "@/lib/utils";

export type { SampleAddress, SampleReceipt, SampleRequestLabels, SampleRequestValues, Swatch } from "@rhs-ui/commerce/sample-request/samples";

export interface SampleRequestProps extends Omit<ComponentProps<"section">, "children" | "title" | "onChange" | "onSubmit" | "defaultValue"> {
  /** The samples to choose from: a colour, a picture of the material, or both, with a name under each. */
  swatches: readonly Swatch[];
  /** The most samples one request can hold. Once it is reached the others are switched off, and the text beside the counter says why. Defaults to 5. */
  limit?: number;
  /** The ids of the samples that are chosen, in the order they were chosen. Pass it with `onChange` to control the choice. */
  value?: readonly string[];
  /** The samples that start chosen when you do not control the choice. */
  defaultValue?: readonly string[];
  /** Called with the ids that are chosen after every change. */
  onChange?: (swatchIds: string[]) => void;
  /** An address to start with, such as the one a signed-in customer already has. */
  address?: Partial<SampleAddress>;
  /** Called with the samples and the address once every check has passed. Return a message to say the shop could not take it (the form stays, with the samples and the address in it); return nothing, or resolve, and the form is replaced by the confirmation. Return `{ reference }` to print the order reference on it. */
  onSubmit?: (request: SampleRequestValues) => string | SampleReceipt | void | Promise<string | SampleReceipt | void>;
  /** The delivery promise, next to the address and again on the confirmation: "Free, arrives in 3 to 5 days". */
  deliveryNote?: string;
  /** Show the confirmation for this request instead of the form, for a page that has already taken it. */
  submitted?: SampleRequestValues & SampleReceipt;
  /** Where "Back to the shop" goes on the confirmation. Without it there is no link. */
  shopHref?: string;
  /** The heading. Defaults to "Order free samples". */
  title?: string;
  /** The line under it. */
  description?: string;
  /** Always pass your application locale, so the counter and the numbers are written the same on the server and in the browser. */
  locale?: string;
  /** The heading's element: "h2" by default, "h3" inside a section that has its own h2. */
  headingAs?: "h2" | "h3";
  /** The words, for another language. */
  labels?: SampleRequestLabels;
}

interface FieldProps {
  name: FieldKey;
  label: string;
  hint?: string;
  error?: string;
  className?: string;
  children: ReactNode;
  base: string;
}

/** One label, one control, a hint and an error, wired together. The wrapper carries the name the form focuses by. */
function Field({ name, label, hint, error, className, children, base }: FieldProps) {
  return (
    <FormField id={`${base}-${name}`} data-field={name} error={error} described={Boolean(hint)} className={className}>
      <FormLabel>{label}</FormLabel>
      {children}
      {hint ? <FormDescription>{hint}</FormDescription> : null}
    </FormField>
  );
}

/**
 * Free samples before a big purchase: a grid of swatches (a colour, a texture or a photograph), each a real checkbox
 * with its name under it, and a counter ("Samples chosen: 3 of 5") that is also the status region. At the limit the
 * rest are switched off and the text beside the counter says why. Beside the grid sits what was chosen, each sample
 * with a button to take it out, the delivery promise and a short address form. A request that cannot be sent keeps
 * everything that was chosen and typed; a request that is sent replaces the form with what is coming, where it is
 * going and the order reference. It lets people touch the material before they commit to a roll of it.
 */
export function SampleRequest({
  swatches,
  limit = 5,
  value,
  defaultValue,
  onChange,
  address: initialAddress,
  onSubmit,
  deliveryNote,
  submitted,
  shopHref,
  title,
  description,
  locale = "en-US",
  headingAs: Heading = "h2",
  labels,
  className,
  ...props
}: SampleRequestProps) {
  const words = wordsOf(labels);
  const base = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const root = useRef<HTMLElement>(null);
  const banner = useRef<HTMLDivElement>(null);
  const [own, setOwn] = useState<readonly string[]>(defaultValue ?? []);
  const [address, setAddress] = useState<SampleAddress>({ ...EMPTY_ADDRESS, ...initialAddress });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [pending, setPending] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const [sent, setSent] = useState<(SampleRequestValues & SampleReceipt) | null>(null);
  const [focusTarget, setFocusTarget] = useState<FieldKey | "banner" | "sent" | "grid" | { remove: string } | null>(null);

  const max = Math.max(1, Math.floor(limit));
  const numbers = new Intl.NumberFormat(locale);
  const known = new Map(swatches.map((swatch) => [swatch.id, swatch]));
  const ids = (value ?? own).filter((id, index, all) => known.has(id) && all.indexOf(id) === index).slice(0, max);
  const picked = ids.map((id) => known.get(id)).filter((swatch): swatch is Swatch => swatch !== undefined);
  const full = ids.length >= max;
  const done = submitted ?? sent;

  // Focus goes where the news is: the first thing that needs a look, the notice that the send failed, the confirmation, or the place a removed sample leaves.
  useEffect(() => {
    if (focusTarget === null) return;
    let node: HTMLElement | null | undefined;
    if (focusTarget === "banner") node = banner.current;
    else if (focusTarget === "sent") node = root.current?.querySelector<HTMLElement>("[data-focus-target]");
    else if (focusTarget === "grid" || focusTarget === "samples") node = root.current?.querySelector<HTMLElement>('[data-field="samples"] input:not(:disabled)');
    else if (typeof focusTarget === "object") node = root.current?.querySelector<HTMLElement>(`[data-remove-id="${CSS.escape(focusTarget.remove)}"]`) ?? root.current?.querySelector<HTMLElement>('[data-field="samples"] input:not(:disabled)');
    else node = root.current?.querySelector<HTMLElement>(`[data-field="${focusTarget}"] input`);
    node?.focus();
    setFocusTarget(null);
  }, [focusTarget]);

  function recheck(key: FieldKey, nextIds: readonly string[], nextAddress: SampleAddress) {
    const message = checkField(key, nextIds, nextAddress, words.errors);
    setErrors((current) => {
      const copy = { ...current };
      if (message) copy[key] = message;
      else delete copy[key];
      return copy;
    });
  }

  function choose(next: string[]) {
    if (value === undefined) setOwn(next);
    onChange?.(next);
    if ("samples" in errors) recheck("samples", next, address);
  }

  function toggle(id: string) {
    if (ids.includes(id)) choose(ids.filter((entry) => entry !== id));
    else if (!full) choose([...ids, id]);
  }

  function removeFromSummary(id: string) {
    const index = ids.indexOf(id);
    const neighbour = ids[index + 1] ?? ids[index - 1];
    choose(ids.filter((entry) => entry !== id));
    setFocusTarget(neighbour ? { remove: neighbour } : "grid");
  }

  function set<K extends keyof SampleAddress>(key: K, text: string) {
    const next = { ...address, [key]: text };
    setAddress(next);
    // A field that already shows a problem is checked again as it changes, so the problem goes the moment it is fixed.
    if (key in errors) recheck(key as FieldKey, ids, next);
  }

  async function submit() {
    if (pending) return;
    setFailure(null);
    const found = validate(ids, address, words.errors);
    setErrors(found);
    const first = FIELD_ORDER.find((key) => found[key]);
    if (first) {
      setFocusTarget(first);
      return;
    }
    const request: SampleRequestValues = { swatchIds: [...ids], address: tidy(address) };
    setPending(true);
    try {
      const result = await onSubmit?.(request);
      if (typeof result === "string" && result.length > 0) {
        setFailure(result);
        setFocusTarget("banner");
      } else {
        setSent({ ...request, reference: result && typeof result === "object" ? result.reference : undefined });
        setFocusTarget("sent");
      }
    } catch {
      setFailure(words.failedMessage);
      setFocusTarget("banner");
    } finally {
      setPending(false);
    }
  }

  /** Enter in a text field sends the request, as it would in a form element. */
  function sendOnEnter(event: KeyboardEvent<HTMLDivElement>) {
    const target = event.target;
    if (event.key !== "Enter" || event.defaultPrevented || !(target instanceof HTMLInputElement) || !event.currentTarget.contains(target)) return;
    if (["checkbox", "radio", "file", "button", "submit"].includes(target.type)) return;
    event.preventDefault();
    void submit();
  }

  const titleId = `${base}-title`;
  const statusId = `${base}-status`;
  const Sub = Heading === "h2" ? "h3" : "h4";

  if (done) {
    const coming = done.swatchIds.map((id) => known.get(id)).filter((swatch): swatch is Swatch => swatch !== undefined);
    return (
      <section ref={root} data-slot="sample-request" aria-labelledby={titleId} className={cn("@container min-w-0", className)} {...props}>
        <SampleConfirmation titleId={titleId} headingAs={Heading} swatches={coming} address={done.address} deliveryNote={deliveryNote} reference={done.reference} shopHref={shopHref} words={words} />
        <p role="status" className="sr-only">
          {words.sentStatus}
        </p>
      </section>
    );
  }

  return (
    <section ref={root} data-slot="sample-request" aria-labelledby={titleId} className={cn("@container min-w-0", className)} {...props}>
      {/* Not a <form> element, like the other forms of this kit: Enter in a text field still sends it. */}
      <div onKeyDown={sendOnEnter} className="grid gap-x-12 gap-y-9 @3xl:grid-cols-[minmax(0,1fr)_20rem] @3xl:items-start">
        <div className="grid min-w-0 content-start gap-7">
          <header className="grid gap-2">
            <Heading id={titleId} className="text-2xl leading-tight font-medium tracking-[-0.035em] text-balance @3xl:text-3xl">
              {title ?? words.title}
            </Heading>
            <p className="max-w-prose text-base leading-relaxed text-pretty text-muted-foreground">{description ?? fill(max === 1 ? words.descriptionOne : words.description, { limit: numbers.format(max) })}</p>
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

          <div className="grid gap-3">
            <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
              <Sub id={`${base}-legend`} className="text-sm font-medium">
                {words.legend}
              </Sub>
              {/* The counter is the status region: it says how many are chosen, and why the rest are off once the limit is reached. */}
              <div id={statusId} role="status" className="flex items-center gap-3 text-sm">
                <span aria-hidden="true" className="flex items-center gap-1">
                  {Array.from({ length: max }, (_, index) => (
                    <span key={index} className={cn("size-2 rounded-full border border-foreground/40 transition-colors duration-150 motion-reduce:transition-none", index < ids.length && "border-foreground bg-foreground")} />
                  ))}
                </span>
                <p>
                  <span className="text-muted-foreground">{words.counterName}: </span>
                  <span className="font-medium tabular-nums">{fill(words.counter, { count: numbers.format(ids.length), limit: numbers.format(max) })}</span>
                  {full ? <span className="sr-only">. {words.full}</span> : null}
                </p>
              </div>
            </div>
            {full ? <p className="text-sm text-muted-foreground">{words.full}</p> : null}
            <p role="alert" className="text-sm font-medium text-destructive empty:hidden">
              {errors.samples}
            </p>
            <fieldset data-field="samples" aria-labelledby={`${base}-legend`} className="min-w-0">
              <div className="grid grid-cols-[repeat(auto-fill,minmax(8rem,1fr))] gap-x-4 gap-y-6 p-1">
                {swatches.map((swatch) => {
                  const checked = ids.includes(swatch.id);
                  return <SwatchTile key={swatch.id} swatch={swatch} checked={checked} disabled={full && !checked} describedBy={full && !checked ? statusId : undefined} onToggle={() => toggle(swatch.id)} />;
                })}
              </div>
            </fieldset>
          </div>
        </div>

        <div data-slot="sample-request-summary" className="grid gap-6 rounded-xl border border-border bg-card p-5 shadow-xs @3xl:sticky @3xl:top-6">
          <div role="group" aria-labelledby={`${base}-summary`} className="grid gap-3">
            <Sub id={`${base}-summary`} className="flex items-baseline justify-between gap-3 text-sm font-medium">
              {words.summaryTitle}
              <span className="text-xs font-normal text-muted-foreground tabular-nums">{numbers.format(ids.length)}</span>
            </Sub>
            {picked.length > 0 ? (
              <ul role="list" className="grid gap-2">
                {picked.map((swatch) => (
                  <li key={swatch.id} className="flex items-center gap-3 rounded-lg border border-border bg-background p-1.5">
                    <SwatchFace swatch={swatch} className="size-9 shrink-0 rounded-md" />
                    <span className="min-w-0 flex-1 text-sm leading-snug font-medium [overflow-wrap:anywhere]">{swatch.name}</span>
                    <button
                      type="button"
                      data-remove-id={swatch.id}
                      aria-label={fill(words.remove, { name: swatch.name })}
                      onClick={() => removeFromSummary(swatch.id)}
                      className="grid size-8 shrink-0 place-items-center rounded-md text-muted-foreground outline-none transition-colors duration-150 hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40 motion-reduce:transition-none"
                    >
                      <IconClose className="size-4" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="rounded-lg border border-dashed border-border px-3.5 py-4 text-sm text-pretty text-muted-foreground">{fill(max === 1 ? words.summaryEmptyOne : words.summaryEmpty, { limit: numbers.format(max) })}</p>
            )}
          </div>

          {deliveryNote ? (
            <p className="flex items-center gap-3 rounded-lg bg-muted/60 px-3.5 py-3 text-sm font-medium">
              <IconTruck aria-hidden="true" className="size-5 shrink-0" />
              {deliveryNote}
            </p>
          ) : null}

          <div className="border-t border-border pt-5">
            <fieldset className="grid min-w-0 gap-4">
              <legend className="mb-4 text-sm font-medium">{words.addressTitle}</legend>
              <Field base={base} name="name" label={words.fields.name} error={errors.name}>
                <FormControl>
                  <Input name="name" autoComplete="name" value={address.name} onChange={(event) => set("name", event.target.value)} />
                </FormControl>
              </Field>
              <Field base={base} name="email" label={words.fields.email} hint={words.emailHint} error={errors.email}>
                <FormControl>
                  <Input name="email" type="email" autoComplete="email" inputMode="email" spellCheck={false} value={address.email} onChange={(event) => set("email", event.target.value)} />
                </FormControl>
              </Field>
              <Field base={base} name="line1" label={words.fields.line1} error={errors.line1}>
                <FormControl>
                  <Input name="address" autoComplete="address-line1" value={address.line1} onChange={(event) => set("line1", event.target.value)} />
                </FormControl>
              </Field>
              <div className="grid grid-cols-[minmax(0,6.5rem)_minmax(0,1fr)] items-start gap-3">
                <Field base={base} name="postalCode" label={words.fields.postalCode} error={errors.postalCode}>
                  <FormControl>
                    <Input name="postal-code" autoComplete="postal-code" value={address.postalCode} onChange={(event) => set("postalCode", event.target.value)} />
                  </FormControl>
                </Field>
                <Field base={base} name="city" label={words.fields.city} error={errors.city}>
                  <FormControl>
                    <Input name="city" autoComplete="address-level2" value={address.city} onChange={(event) => set("city", event.target.value)} />
                  </FormControl>
                </Field>
              </div>
            </fieldset>
          </div>

          <Button type="button" size="lg" loading={pending} onClick={() => void submit()} className="w-full">
            {pending ? words.submitting : words.submit}
          </Button>
        </div>
      </div>
    </section>
  );
}
