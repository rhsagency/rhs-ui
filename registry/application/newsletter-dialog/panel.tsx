"use client";

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";

import { IconAlertCircle, IconMail, IconSpinner } from "@rhs-ui/icons";
import { DEFAULT_LABELS, fill, isEmail, messageOf, type NewsletterLabels } from "@rhs-ui/application/newsletter-dialog/newsletter";
import { Alert, AlertDescription, AlertTitle } from "@rhs-ui/primitives/alert";
import { Button } from "@rhs-ui/primitives/button";
import { DialogClose, DialogDescription, DialogTitle } from "@rhs-ui/primitives/dialog";
import { FormControl, FormDescription, FormField, FormLabel } from "@rhs-ui/primitives/form-field";
import { Input } from "@rhs-ui/primitives/input";
import { ResultState } from "@rhs-ui/primitives/result-state";
import { cn } from "@/lib/utils";

export interface NewsletterPanelProps {
  /** Signs the address up. Return a promise: the field locks and the button shows progress while it runs, a rejection keeps the address and shows the message, and success replaces the form with the confirmation. */
  onSubscribe: (email: string) => void | Promise<void>;
  /** A line about what people get, in place of the default description: "One email a week: what we shipped, what we learned." */
  incentive?: string;
  /** The email the field starts with, such as the signed-in person's. */
  defaultEmail?: string;
  /** Called when "No thanks" is pressed. Inside a Dialog the button closes it and the dialog reports the dismissal. */
  onDecline?: () => void;
  /** Called once the sign-up worked, with the address. */
  onSubscribed?: (email: string) => void;
  /** How long the confirmation stays, in milliseconds, before `onClose` is called. A bar runs down while it waits, and it holds still while keyboard focus is on its button. 0 keeps it until it is closed. Default 3000. */
  closeAfterMs?: number;
  /** Draw the panel on its own (a page, a sheet, a preview) instead of inside a Dialog. The title is then a plain heading. */
  standalone?: boolean;
  /** Called when the confirmation closes itself, and when "Close" is pressed in a standalone panel. Inside a Dialog the button closes it. */
  onClose?: () => void;
  /** Called with true while the sign-up is on its way and false after, so a dialog around the panel can refuse to close in the meantime. */
  onBusyChange?: (busy: boolean) => void;
  /** The words the panel says, for translation. */
  labels?: NewsletterLabels;
  /** Classes for the panel. */
  className?: string;
}

function Heading({ standalone, className, children }: { standalone: boolean; className: string; children: ReactNode }) {
  return standalone ? <h2 className={className}>{children}</h2> : <DialogTitle className={className}>{children}</DialogTitle>;
}

function Lede({ standalone, className, children }: { standalone: boolean; className: string; children: ReactNode }) {
  return standalone ? <p className={className}>{children}</p> : <DialogDescription className={className}>{children}</DialogDescription>;
}

/** A line that runs down while the confirmation waits to close. It is the clock itself: the animation finishing is what calls `onDone`. */
function Countdown({ ms, paused, onDone }: { ms: number; paused: boolean; onDone: () => void }) {
  const bar = useRef<HTMLSpanElement>(null);
  const run = useRef<Animation | null>(null);
  const finish = useRef(onDone);
  useEffect(() => {
    finish.current = onDone;
  });
  useEffect(() => {
    const element = bar.current;
    if (!element || typeof element.animate !== "function") return;
    const animation = element.animate([{ transform: "scaleX(1)" }, { transform: "scaleX(0)" }], { duration: ms, easing: "linear", fill: "forwards" });
    animation.onfinish = () => finish.current();
    run.current = animation;
    return () => {
      animation.cancel();
      run.current = null;
    };
  }, [ms]);
  useEffect(() => {
    const animation = run.current;
    if (!animation || animation.playState === "finished") return;
    if (paused) animation.pause();
    else animation.play();
  }, [paused]);
  return (
    <span aria-hidden="true" className="block h-0.5 w-full max-w-56 overflow-hidden rounded-full bg-border motion-reduce:hidden">
      <span ref={bar} className="block h-full origin-left bg-foreground/50" />
    </span>
  );
}

/**
 * The inside of the newsletter dialog, on its own: one email field with a plain line about privacy, and two answers that are
 * equally easy to find, Subscribe and "No thanks". Subscribing locks the field and shows progress on the button, a failure keeps
 * the address and says what happened, and success replaces the form in place with a confirmation that closes by itself. Use it
 * inside a Dialog, or with `standalone` anywhere else.
 */
export function NewsletterPanel({
  onSubscribe,
  incentive,
  defaultEmail = "",
  onDecline,
  onSubscribed,
  closeAfterMs = 3000,
  standalone = false,
  onClose,
  onBusyChange,
  labels,
  className,
}: NewsletterPanelProps) {
  const words = { ...DEFAULT_LABELS, ...labels };
  const [email, setEmail] = useState(defaultEmail);
  const [status, setStatus] = useState<"idle" | "pending" | "done">("idle");
  const [error, setError] = useState<string | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [held, setHeld] = useState(false);
  const [sentTo, setSentTo] = useState("");
  const field = useRef<HTMLInputElement>(null);
  const submitButton = useRef<HTMLButtonElement>(null);
  const confirmation = useRef<HTMLDivElement>(null);
  const busy = useRef(false);
  const pending = status === "pending";

  useEffect(() => {
    if (status === "done") confirmation.current?.focus({ preventScroll: true });
  }, [status]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // A dialog is drawn in a portal, but React still passes its events up to whatever rendered it: do not submit a form around it as well.
    event.stopPropagation();
    if (busy.current) return;
    if (!isEmail(email)) {
      setProblem(words.invalid);
      field.current?.focus({ preventScroll: true });
      return;
    }
    busy.current = true;
    setError(null);
    setProblem(null);
    setStatus("pending");
    onBusyChange?.(true);
    // The field is about to switch off and take the focus with it. The button stays focusable, so focus rests there while it is sent.
    submitButton.current?.focus({ preventScroll: true });
    try {
      await onSubscribe(email.trim());
      setSentTo(email.trim());
      setStatus("done");
      onSubscribed?.(email.trim());
    } catch (thrown) {
      setStatus("idle");
      setError(messageOf(thrown) ?? words.failedBody);
      window.requestAnimationFrame(() => field.current?.focus({ preventScroll: true }));
    } finally {
      busy.current = false;
      onBusyChange?.(false);
    }
  }

  if (status === "done") {
    return (
      <div
        ref={confirmation}
        tabIndex={-1}
        data-slot="newsletter-panel"
        data-status="done"
        // While keyboard focus is on the button, the clock holds still; focus on the confirmation itself does not count.
        onFocusCapture={(event) => setHeld(event.target !== event.currentTarget)}
        onBlurCapture={() => setHeld(false)}
        className={cn("grid outline-none", className)}
      >
        <Heading standalone={standalone} className="sr-only">
          {words.done}
        </Heading>
        <Lede standalone={standalone} className="sr-only">
          {fill(words.doneBody, { email: sentTo })}
        </Lede>
        <p role="status" className="sr-only">
          {words.done}
        </p>
        <ResultState
          tone="success"
          title={words.done}
          description={fill(words.doneBody, { email: sentTo })}
          className="px-5 py-10 sm:px-6 sm:py-12"
          actions={
            <>
              {standalone ? (
                <Button type="button" variant="outline" onClick={onClose}>
                  {words.close}
                </Button>
              ) : (
                <DialogClose asChild>
                  <Button type="button" variant="outline">
                    {words.close}
                  </Button>
                </DialogClose>
              )}
              {closeAfterMs > 0 ? (
                <div className="mt-3 grid basis-full justify-items-center gap-2">
                  <Countdown ms={closeAfterMs} paused={held} onDone={() => onClose?.()} />
                  <p className="text-xs text-muted-foreground">{words.closing}</p>
                </div>
              ) : null}
            </>
          }
        />
      </div>
    );
  }

  return (
    <form data-slot="newsletter-panel" data-status={status} noValidate onSubmit={(event) => void submit(event)} className={cn("flex min-h-0 flex-col", className)}>
      <div className="flex shrink-0 items-start gap-3.5 px-5 pt-5 pr-14 pb-4 sm:px-6 sm:pt-6">
        <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-xl border border-border bg-muted text-foreground [&_svg]:size-[1.125rem]">
          <IconMail />
        </span>
        <div className="grid min-w-0 gap-1 pt-px">
          <Heading standalone={standalone} className="text-lg leading-tight font-semibold tracking-[-0.02em]">
            {words.title}
          </Heading>
          <Lede standalone={standalone} className="text-sm leading-relaxed text-muted-foreground">
            {incentive ?? words.description}
          </Lede>
        </div>
      </div>

      {/* The body scrolls when the dialog is shorter than its content (a phone on its side, larger text, the failure message), and the header and the buttons stay where they are. */}
      <div className="relative min-h-0 flex-1 overflow-y-auto px-5 pb-6 sm:px-6">
        {error !== null ? (
          <Alert tone="destructive" role="alert" className="mb-4 text-[color-mix(in_oklch,var(--destructive),var(--foreground)_20%)]">
            <IconAlertCircle />
            <AlertTitle>{words.failed}</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
        <fieldset disabled={pending} className="m-0 grid min-w-0 border-0 p-0">
          <FormField error={problem} described className="gap-1.5">
            <FormLabel>{words.email}</FormLabel>
            <FormControl>
              <Input
                ref={field}
                type="email"
                autoComplete="email"
                inputMode="email"
                value={email}
                placeholder={words.placeholder}
                onChange={(event) => {
                  setEmail(event.target.value);
                  if (problem) setProblem(null);
                }}
              />
            </FormControl>
            <FormDescription>{words.privacy}</FormDescription>
          </FormField>
        </fieldset>
      </div>

      <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-border bg-muted/30 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
        {standalone ? (
          <Button type="button" variant="outline" disabled={pending} onClick={onDecline}>
            {words.decline}
          </Button>
        ) : (
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={pending} onClick={onDecline}>
              {words.decline}
            </Button>
          </DialogClose>
        )}
        {/* Busy is said with aria-busy and aria-disabled, not disabled: a disabled button gives up focus, which would leave a keyboard on no control until the sign-up is done. */}
        <Button ref={submitButton} type="submit" aria-busy={pending || undefined} aria-disabled={pending || undefined} className="aria-disabled:cursor-progress">
          {pending ? <IconSpinner data-slot="button-spinner" /> : null}
          {words.subscribe}
        </Button>
      </div>
      <p role="status" className="sr-only">
        {pending ? words.subscribing : ""}
      </p>
    </form>
  );
}
