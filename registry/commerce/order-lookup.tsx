"use client";

import { useEffect, useId, useRef, useState, type ComponentProps, type FormEvent, type ReactNode } from "react";

import { IconAlertCircle, IconSpinner } from "@rhs-ui/icons";
import { Alert, AlertDescription, AlertTitle } from "@rhs-ui/primitives/alert";
import { Button } from "@rhs-ui/primitives/button";
import { FormControl, FormDescription, FormField, FormLabel } from "@rhs-ui/primitives/form-field";
import { Input } from "@rhs-ui/primitives/input";
import { cn } from "@/lib/utils";

/** What the guest can be asked besides the order number. */
export type OrderLookupField = "email" | "postcode";

export interface OrderLookupValues {
  /** Cleaned: no leading "#", spaces collapsed, upper-cased. "nw-20418" arrives as "NW-20418". */
  orderNumber: string;
  /** Present when `fields` includes "email". */
  email?: string;
  /** Present when `fields` includes "postcode". */
  postcode?: string;
}

export interface OrderLookupProps extends Omit<ComponentProps<"div">, "children" | "title" | "defaultValue"> {
  /**
   * Looks the order up on your server. Resolve with whatever should appear under the form (an order card, a status line), or with
   * `null` when nothing matches. Reject for a failure on your side. Both a missing order and a wrong email give the same answer.
   */
  onLookup: (values: OrderLookupValues) => Promise<ReactNode | null | undefined | false>;
  /** What to ask besides the order number: `["email"]` (the default), `["postcode"]` or both. */
  fields?: readonly OrderLookupField[];
  /** A line under the button: where to get help, how to see every order. */
  helperText?: ReactNode;
  /** Values to start with, for example from a link in the confirmation email. */
  defaultValues?: Partial<OrderLookupValues>;
  /** The form's heading, which also names the form. */
  title?: string;
  /** One line under the heading. */
  description?: ReactNode;
  /** The button's text. */
  submitLabel?: string;
  /** The first field's label. */
  orderNumberLabel?: string;
  /** What an order number looks like, as a placeholder: "NW-20418". */
  orderNumberPlaceholder?: string;
  /** Format help under the order number: where to find it. */
  orderNumberHelp?: ReactNode;
  /** Optional shape of a valid order number, tested on the cleaned value. Without it any non-empty value goes to `onLookup`. */
  orderNumberPattern?: RegExp;
}

type Phase = "idle" | "busy" | "notfound" | "failed" | "found";
type Errors = Partial<Record<"orderNumber" | "email" | "postcode", string>>;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const cleanOrderNumber = (value: string) => value.trim().replace(/^#+\s*/, "").replace(/\s+/g, " ").toUpperCase();

/**
 * "Where is my order?" for guests: an order number, the email or postcode it
 * was placed with, and one button. It is built not to reveal who has orders:
 * an order that does not exist and an email that does not match give the
 * same answer, in the same words, and the message says so. The inputs carry
 * the autocomplete and keyboard hints a phone needs, the button keeps its
 * place and ignores a second press while it works, and whatever your server
 * returns appears under the form as the result, with focus moved to it. Edit
 * a field and the result goes again, so what is on screen always matches
 * the details above it.
 */
export function OrderLookup({
  onLookup,
  fields = ["email"],
  helperText,
  defaultValues,
  title = "Where is my order?",
  description = "Enter the order number from your confirmation email and the details you ordered with.",
  submitLabel = "Find my order",
  orderNumberLabel = "Order number",
  orderNumberPlaceholder = "NW-20418",
  orderNumberHelp = "It is in your confirmation email.",
  orderNumberPattern,
  className,
  ...props
}: OrderLookupProps) {
  const id = useId();
  const form = useRef<HTMLFormElement>(null);
  const resultRegion = useRef<HTMLDivElement>(null);
  const request = useRef(0);
  const [values, setValues] = useState({ orderNumber: defaultValues?.orderNumber ?? "", email: defaultValues?.email ?? "", postcode: defaultValues?.postcode ?? "" });
  const [errors, setErrors] = useState<Errors>({});
  const [phase, setPhase] = useState<Phase>("idle");
  const [result, setResult] = useState<ReactNode>(null);
  const busy = phase === "busy";
  const asks = (field: OrderLookupField) => fields.includes(field);

  // The answer is what the person came for: take them to it.
  useEffect(() => {
    if (phase === "found") resultRegion.current?.focus();
  }, [phase]);

  function change(field: keyof typeof values, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    // An answer describes the details it was asked with. Once they change, a not-found message and a found order both go, the same way.
    if (phase === "notfound" || phase === "failed" || phase === "found") {
      setPhase("idle");
      setResult(null);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const orderNumber = cleanOrderNumber(values.orderNumber);
    const problems: Errors = {};
    if (!orderNumber) problems.orderNumber = "Enter your order number.";
    else if (orderNumberPattern && !orderNumberPattern.test(orderNumber)) problems.orderNumber = "That does not look like an order number.";
    if (asks("email")) {
      const email = values.email.trim();
      if (!email) problems.email = "Enter the email address you ordered with.";
      else if (!EMAIL.test(email)) problems.email = "Enter a valid email address, like name@example.com.";
    }
    if (asks("postcode") && !values.postcode.trim()) problems.postcode = "Enter the postcode the order was sent to.";
    const first = (["orderNumber", "email", "postcode"] as const).find((field) => problems[field]);
    if (first) {
      setErrors(problems);
      setPhase("idle");
      setResult(null);
      form.current?.querySelector<HTMLInputElement>(`input[name="${first}"]`)?.focus();
      return;
    }
    setErrors({});
    setResult(null);
    setPhase("busy");
    const ticket = ++request.current;
    const query: OrderLookupValues = { orderNumber, ...(asks("email") ? { email: values.email.trim() } : {}), ...(asks("postcode") ? { postcode: values.postcode.trim() } : {}) };
    try {
      const answer = await onLookup(query);
      if (ticket !== request.current) return;
      setValues((current) => ({ ...current, orderNumber }));
      if (answer === null || answer === undefined || answer === false) {
        setPhase("notfound");
      } else {
        setResult(answer);
        setPhase("found");
      }
    } catch {
      if (ticket !== request.current) return;
      setPhase("failed");
    }
  }

  return (
    <div data-slot="order-lookup" className={cn("grid grid-cols-[minmax(0,1fr)] gap-6 [overflow-wrap:anywhere]", className)} {...props}>
      <form ref={form} noValidate aria-labelledby={`${id}-title`} onSubmit={submit} className="grid grid-cols-[minmax(0,1fr)] gap-5">
        <div className="grid gap-1">
          <h3 id={`${id}-title`} className="text-[0.9375rem] leading-snug font-semibold tracking-[-0.02em]">
            {title}
          </h3>
          {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
        </div>

        <FormField error={errors.orderNumber} described={Boolean(orderNumberHelp)}>
          <FormLabel>{orderNumberLabel}</FormLabel>
          <FormControl>
            <Input
              name="orderNumber"
              value={values.orderNumber}
              placeholder={orderNumberPlaceholder}
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              onChange={(event) => change("orderNumber", event.target.value)}
              onBlur={() => setValues((current) => ({ ...current, orderNumber: cleanOrderNumber(current.orderNumber) }))}
            />
          </FormControl>
          {orderNumberHelp ? <FormDescription>{orderNumberHelp}</FormDescription> : null}
        </FormField>

        {asks("email") ? (
          <FormField error={errors.email}>
            <FormLabel>Email address</FormLabel>
            <FormControl>
              <Input
                type="email"
                name="email"
                value={values.email}
                placeholder="name@example.com"
                autoComplete="email"
                inputMode="email"
                autoCapitalize="none"
                spellCheck={false}
                onChange={(event) => change("email", event.target.value)}
              />
            </FormControl>
          </FormField>
        ) : null}

        {asks("postcode") ? (
          <FormField error={errors.postcode}>
            <FormLabel>Postcode</FormLabel>
            <FormControl>
              <Input name="postcode" value={values.postcode} autoComplete="postal-code" autoCapitalize="characters" spellCheck={false} onChange={(event) => change("postcode", event.target.value)} />
            </FormControl>
          </FormField>
        ) : null}

        {phase === "notfound" ? (
          <Alert tone="destructive" role="alert">
            <IconAlertCircle />
            <AlertTitle className="text-foreground">We could not find an order with those details</AlertTitle>
            <AlertDescription>Check the order number and the {asks("email") ? "email address" : "postcode"} you used at checkout. For your privacy we never say which one is wrong.</AlertDescription>
          </Alert>
        ) : null}
        {phase === "failed" ? (
          <Alert tone="destructive" role="alert">
            <IconAlertCircle />
            <AlertTitle className="text-foreground">We could not look that up right now</AlertTitle>
            <AlertDescription>Something went wrong on our side. Try again in a moment.</AlertDescription>
          </Alert>
        ) : null}

        <Button type="submit" size="lg" aria-disabled={busy || undefined} onClick={(event) => busy && event.preventDefault()} className="w-full">
          {busy ? <IconSpinner /> : null}
          {busy ? "Looking" : submitLabel}
        </Button>
        {helperText ? <p className="text-sm text-muted-foreground">{helperText}</p> : null}
      </form>

      {phase === "found" ? (
        <div ref={resultRegion} tabIndex={-1} role="region" aria-label="Order found" data-slot="order-lookup-result" className="rounded-xl outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40">
          {result}
        </div>
      ) : null}
    </div>
  );
}
