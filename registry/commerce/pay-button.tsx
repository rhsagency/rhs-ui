"use client";

import { useRef, useState, useId, type ComponentProps, type ReactNode } from "react";

import { Glyph, IconAlertCircle, IconCheck, IconInfo, IconLock, IconRefresh, IconShieldCheck } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { Spinner } from "@rhs-ui/primitives/spinner";
import { formatMoney } from "@rhs-ui/commerce/money";
import { cn } from "@/lib/utils";

export type PayStatus = "ready" | "processing" | "authenticating" | "paid" | "failed";

export interface PayButtonLabels {
  /** On the button while the payment runs. */
  processing?: string;
  /** On the button while the bank asks the shopper to confirm. */
  authenticating?: string;
  /** On the button once paid. {amount} is the amount that was paid. */
  paid?: string;
  /** On the button after a failure. */
  retry?: string;
  /** The line under the button while the payment runs. */
  processingNote?: string;
  /** The line under the button while the bank asks the shopper to confirm. */
  authenticatingNote?: string;
  /** The line under the button once the payment went through. */
  paidNote?: string;
  /** The heading of the error box. */
  failedTitle?: string;
  /** The error text when you give none. */
  failedFallback?: string;
}

export interface PayButtonProps extends Omit<ComponentProps<"div">, "children" | "onError"> {
  /** What is charged, in minor units: 4900 is 49.00. */
  amount: number;
  /** ISO 4217 code: "EUR", "USD", "GBP". */
  currency?: string;
  /** Always pass your application locale, so the server and the browser print the same amount. */
  locale?: string;
  /** Drive the state yourself, from your payment provider. Leave it out and the button runs the whole cycle from the promise `onPay` returns. */
  status?: PayStatus;
  /**
   * Called when the button is pressed while ready (or failed). It gets a fresh attempt id for every press: send it
   * to your server as the idempotency key, so a retried request can never charge twice. Return the promise and the
   * button stays locked until it settles; call `step.authenticating()` when the bank asks for a confirmation.
   */
  onPay?: (attemptId: string, step: { authenticating: () => void }) => void | Promise<void>;
  /** Why the button cannot be pressed yet: "Enter your card number". It shows under the button, which stays focusable but aria-disabled. Leave it out once the form is valid. */
  disabledReason?: string;
  /** The verb before the amount. Put {amount} in it to place the figure elsewhere: "Pay {amount} now". */
  label?: string;
  /** What went wrong, in words, while the status is failed. Without it the thrown Error's message is used, then a general line. */
  error?: ReactNode;
  /** Called by "Try again". In a controlled button it replaces `onPay` for the retry; otherwise it is called and the payment runs again. */
  onRetry?: () => void;
  /** An optional quiet line under the button: "Payments are encrypted". */
  note?: ReactNode;
  /** "lg", the default, is the tall checkout button. */
  size?: "default" | "lg";
  /** Use "submit" inside a checkout form: pressing Enter in a field then pays through `onPay`, and the form never submits natively. */
  type?: "button" | "submit";
  /** The id of the form this button belongs to, when it sits outside it. */
  form?: string;
  /** The words, for another language. */
  labels?: PayButtonLabels;
  /** Extra classes for the button itself; `className` styles the wrapper around it. */
  buttonClassName?: string;
}

const WORDS = {
  processing: "Processing payment…",
  authenticating: "Waiting for your bank",
  paid: "Paid {amount}",
  retry: "Try again",
  processingNote: "Processing payment, do not close this page",
  authenticatingNote: "Confirm the payment with your bank. Do not close this page.",
  paidNote: "Payment received. Thank you.",
  failedTitle: "Payment failed",
  failedFallback: "The payment did not go through. Try again, or use another payment method.",
} satisfies Required<PayButtonLabels>;

const FACES = ["ready", "processing", "authenticating", "paid", "failed"] as const;

/** An id for one press. crypto.randomUUID needs a secure context, so a plain random string stands in on http. */
function newAttemptId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

/** A tick that draws itself in when the paid face becomes the active one. */
function Tick({ active }: { active: boolean }) {
  return (
    <Glyph size={16} className="shrink-0">
      <path d="M5 12.5l4.5 4.5L19 7" pathLength={1} strokeDasharray={1} className={cn("transition-[stroke-dashoffset] delay-100 duration-300 ease-out motion-reduce:transition-none", active ? "[stroke-dashoffset:0]" : "[stroke-dashoffset:1]")} />
    </Glyph>
  );
}

/**
 * The one button a checkout cannot get wrong. It reads "Pay 49.00" in tabular
 * numbers and stays aria-disabled, with the reason under it, until the form is
 * valid. Once pressed it locks and says "Processing payment, do not close this
 * page"; the bank step has its own wording, paid shows a check and the amount,
 * and a failure names the reason in words and offers "Try again" without
 * resetting the form. A double submit is impossible by construction: the first
 * press locks the button before anything renders, and every press carries its
 * own attempt id so your server can make the charge idempotent.
 */
export function PayButton({
  amount,
  currency = "EUR",
  locale = "en-US",
  status: controlled,
  onPay,
  disabledReason,
  label = "Pay",
  error,
  onRetry,
  note,
  size = "lg",
  type = "button",
  form,
  labels,
  buttonClassName,
  className,
  ...props
}: PayButtonProps) {
  const words = { ...WORDS, ...labels };
  const noteId = useId();
  const errorId = useId();
  const [own, setOwn] = useState<PayStatus>("ready");
  const [failure, setFailure] = useState<string | undefined>();
  const locked = useRef(false);

  const status = controlled ?? own;
  const idle = status === "ready" || status === "failed";
  const blocked = !idle || Boolean(disabledReason);
  const active = FACES.indexOf(status);
  const total = formatMoney({ amount, currency }, locale);
  const fill = (text: string) => text.replace("{amount}", total);
  // The words around the amount may shrink with an ellipsis on a narrow button; the amount itself never does.
  const [lead = "", trail = ""] = label.includes("{amount}") ? label.split("{amount}") : [label];

  async function press() {
    // The ref locks before React re-renders, so a second press in the same tick finds the door shut.
    if (blocked || locked.current) return;
    if (status === "failed" && onRetry) {
      onRetry();
      if (controlled !== undefined) return;
    }
    locked.current = true;
    const driven = controlled === undefined;
    if (driven) {
      setFailure(undefined);
      setOwn("processing");
    }
    try {
      await onPay?.(newAttemptId(), {
        authenticating: () => {
          if (driven) setOwn("authenticating");
        },
      });
      if (driven) setOwn("paid");
    } catch (thrown) {
      if (driven) {
        setFailure(thrown instanceof Error && thrown.message ? thrown.message : undefined);
        setOwn("failed");
      }
    } finally {
      locked.current = false;
    }
  }

  const line =
    status === "processing"
      ? { text: words.processingNote }
      : status === "authenticating"
        ? { icon: <IconShieldCheck />, text: words.authenticatingNote }
        : status === "paid"
          ? { icon: <IconCheck />, text: words.paidNote }
          : disabledReason
            ? { icon: <IconInfo />, text: disabledReason }
            : status === "ready" && note
              ? { text: note }
              : null;

  const face = "col-start-1 row-start-1 flex min-w-0 items-center justify-center gap-2 whitespace-nowrap tabular-nums transition-opacity duration-150 motion-reduce:transition-none";
  const faces: ReactNode[] = [
    <>
      <IconLock />
      {/* The words and the amount sit a plain word space apart, as in "Paid 49.00"; only the icon keeps the wider gap. */}
      <span className="flex min-w-0 items-center gap-1">
        {lead.trim() ? <span className="min-w-0 truncate">{lead.trim()}</span> : null}
        <span className="shrink-0">{total}</span>
        {trail.trim() ? <span className="min-w-0 truncate">{trail.trim()}</span> : null}
      </span>
    </>,
    <>
      <Spinner size={16} label="" role="presentation" aria-hidden="true" />
      {words.processing}
    </>,
    <>
      <Spinner size={16} label="" role="presentation" aria-hidden="true" />
      {words.authenticating}
    </>,
    <>
      <Tick active={status === "paid"} />
      {fill(words.paid)}
    </>,
    <>
      <IconRefresh />
      {words.retry}
    </>,
  ];

  return (
    <div data-slot="pay-button" data-status={status} className={cn("grid w-full", className)} {...props}>
      <Button
        type={type}
        form={form}
        size={size}
        variant={status === "paid" ? "secondary" : "default"}
        aria-busy={status === "processing" || status === "authenticating" || undefined}
        aria-disabled={blocked || undefined}
        aria-describedby={[status === "failed" ? errorId : undefined, line ? noteId : undefined].filter(Boolean).join(" ") || undefined}
        // A press is always ours: it must never submit the surrounding form natively, or the charge could run twice.
        onClick={(event) => {
          event.preventDefault();
          void press();
        }}
        // A locked button dims its paint, not the element, so the focus ring keeps its full strength on the one control a keyboard user must reach to hear the reason.
        className={cn("w-full", blocked && "pointer-events-none", Boolean(disabledReason) && idle && "bg-primary/50 text-primary-foreground/70", buttonClassName)}
      >
        <span className="grid w-full grid-cols-[minmax(0,1fr)]">
          {faces.map((content, index) => (
            <span key={FACES[index]} aria-hidden={index === active ? undefined : true} className={cn(face, index === active ? "opacity-100" : "pointer-events-none opacity-0")}>
              {content}
            </span>
          ))}
        </span>
      </Button>

      {status === "failed" ? (
        <div id={errorId} role="alert" className="mt-3 flex gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm motion-safe:animate-rhs-pay-in">
          <IconAlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
          <div className="grid min-w-0 gap-0.5">
            <p className="font-medium">{words.failedTitle}</p>
            <p className="text-pretty text-muted-foreground">{error ?? failure ?? words.failedFallback}</p>
          </div>
        </div>
      ) : null}

      <p id={noteId} role="status" className={cn("mt-3 min-h-5 text-center text-xs leading-5 text-pretty text-muted-foreground [&_svg]:mr-1.5 [&_svg]:-mt-0.5 [&_svg]:inline [&_svg]:size-3.5 [&_svg]:align-middle", status === "failed" && !line && "hidden")}>
        {line?.icon}
        {line?.text}
      </p>
    </div>
  );
}
