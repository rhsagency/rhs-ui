"use client";

import { useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent, type ReactNode } from "react";

import { IconAlertCircle, IconSpinner } from "@rhs-ui/icons";
import {
  DEFAULT_LABELS,
  DEFAULT_TYPES,
  fill,
  isEmail,
  limitStep,
  messageOf,
  nearLimit,
  type FeedbackDraft,
  type FeedbackLabels,
  type FeedbackType,
  type FeedbackValues,
} from "@rhs-ui/application/feedback-dialog/feedback";
import { SegmentedControl } from "@rhs-ui/application/segmented-control";
import { Alert, AlertDescription, AlertTitle } from "@rhs-ui/primitives/alert";
import { Button } from "@rhs-ui/primitives/button";
import { DialogClose, DialogDescription, DialogTitle } from "@rhs-ui/primitives/dialog";
import { FormControl, FormDescription, FormField, FormLabel } from "@rhs-ui/primitives/form-field";
import { Input } from "@rhs-ui/primitives/input";
import { ResultState } from "@rhs-ui/primitives/result-state";
import { Textarea } from "@rhs-ui/primitives/textarea";
import { cn } from "@/lib/utils";

export interface FeedbackPanelProps {
  /** Sends the feedback with `{ type, message, email, metadata }`. Return a promise: the fields lock and the button shows progress while it runs, a rejection keeps the text and offers a retry, and success shows the thank-you. */
  onSubmit: (values: FeedbackValues) => void | Promise<void>;
  /** The kinds of feedback, each with the prompt that becomes the hint in the message field. Default: idea, problem, praise and other. */
  types?: readonly FeedbackType[];
  /** The most characters a message can have. The counter only shows once there are few left. Default 1000. */
  maxLength?: number;
  /** Whether to ask for an email address: "optional", "required", or false to leave the field out. Default "optional". */
  askEmail?: "optional" | "required" | false;
  /** The email the field starts with, such as the signed-in person's. */
  defaultEmail?: string;
  /** A line under the email field about what the address is used for. A string, or an element with a link to your privacy policy. */
  privacyNote?: ReactNode;
  /** Facts that go along with the message, such as the page address or the app version. They are listed in plain words above the button, so what is read is what is sent. */
  metadata?: Record<string, string>;
  /** What was typed before, to start from: the dialog keeps it when it is closed by accident. */
  defaultDraft?: FeedbackDraft;
  /** Called as the sender types, and with null once the feedback is sent. */
  onDraftChange?: (draft: FeedbackDraft | null) => void;
  /** How long the thank-you stays, in milliseconds, before `onClose` is called. A bar runs down while it waits, and it holds still while keyboard focus is on one of its buttons. 0 keeps it until it is closed. Default 5000. */
  closeAfterMs?: number;
  /** Draw the panel on its own (a page, a sheet, a preview) instead of inside a Dialog. The title is then a plain heading. */
  standalone?: boolean;
  /** Called when the thank-you closes itself, and when "Cancel" or "Close" is pressed in a standalone panel. Inside a Dialog those close it. */
  onClose?: () => void;
  /** Called with true while the message is on its way and false after, so a dialog around the panel can refuse to close in the meantime. */
  onBusyChange?: (busy: boolean) => void;
  /** The words the panel says, for translation. */
  labels?: FeedbackLabels;
  /** Classes for the panel. */
  className?: string;
}

function Heading({ standalone, className, children }: { standalone: boolean; className: string; children: ReactNode }) {
  return standalone ? <h2 className={className}>{children}</h2> : <DialogTitle className={className}>{children}</DialogTitle>;
}

function Lede({ standalone, className, children }: { standalone: boolean; className: string; children: ReactNode }) {
  return standalone ? <p className={className}>{children}</p> : <DialogDescription className={className}>{children}</DialogDescription>;
}

/** A line that runs down while the thank-you waits to close. It is the clock itself: the animation finishing is what calls `onDone`. */
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
 * The inside of the feedback dialog, on its own. The kind of feedback is a segmented control whose choice changes the hint in
 * the message field, the counter only appears when the limit is near, and Send stays off until there is a message
 * (Ctrl or Cmd with Enter sends from the field). Facts such as the page address are listed in words before anything is sent. A
 * failure keeps the text and relabels the button "Try again"; success is a thank-you that says where replies go and closes by
 * itself, holding still while keyboard focus is on a button. Use it inside a Dialog, or with `standalone` anywhere else.
 */
export function FeedbackPanel({
  onSubmit,
  types = DEFAULT_TYPES,
  maxLength = 1000,
  askEmail = "optional",
  defaultEmail = "",
  privacyNote,
  metadata,
  defaultDraft,
  onDraftChange,
  closeAfterMs = 5000,
  standalone = false,
  onClose,
  onBusyChange,
  labels,
  className,
}: FeedbackPanelProps) {
  const words = { ...DEFAULT_LABELS, ...labels };
  const id = useId();
  const [type, setType] = useState(defaultDraft?.type ?? types[0]?.id ?? "");
  const [message, setMessage] = useState(defaultDraft?.message ?? "");
  const [email, setEmail] = useState(defaultDraft?.email ?? defaultEmail);
  const [status, setStatus] = useState<"idle" | "pending" | "done">("idle");
  const [error, setError] = useState<string | null>(null);
  const [emailProblem, setEmailProblem] = useState<string | null>(null);
  const [held, setHeld] = useState(false);
  const [said, setSaid] = useState("");
  const [sentTo, setSentTo] = useState("");
  const field = useRef<HTMLTextAreaElement>(null);
  const emailField = useRef<HTMLInputElement>(null);
  const submitButton = useRef<HTMLButtonElement>(null);
  const thanks = useRef<HTMLDivElement>(null);
  const busy = useRef(false);

  const pending = status === "pending";
  const current = types.find((entry) => entry.id === type) ?? types[0];
  const left = maxLength - message.length;
  const showCounter = left <= nearLimit(maxLength);
  const entries = metadata ? Object.entries(metadata) : [];

  useEffect(() => {
    if (status === "done") thanks.current?.focus({ preventScroll: true });
  }, [status]);

  function change(next: Partial<FeedbackDraft>) {
    const draft = { type, message, email, ...next };
    if (next.type !== undefined) setType(next.type);
    if (next.message !== undefined) setMessage(next.message);
    if (next.email !== undefined) setEmail(next.email);
    if (next.message !== undefined) {
      // The screen reader is told at a few steps, with the number at that moment, and not again until the next step.
      const now = maxLength - next.message.length;
      const stepNow = limitStep(now, maxLength);
      if (stepNow !== limitStep(left, maxLength)) setSaid(stepNow === null ? "" : stepNow === 0 ? words.limit : fill(words.left, { count: now }));
    }
    onDraftChange?.(draft);
  }

  function checkEmail(value: string): string | null {
    if (askEmail === false) return null;
    if (value.trim() === "") return askEmail === "required" ? words.emailRequired : null;
    return isEmail(value) ? null : words.emailInvalid;
  }

  async function send(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    // A dialog is drawn in a portal, but React still passes its events up to whatever rendered it: do not submit a form around it as well.
    event?.stopPropagation();
    if (busy.current || message.trim() === "") return;
    const problem = checkEmail(email);
    setEmailProblem(problem);
    if (problem) {
      emailField.current?.focus({ preventScroll: true });
      return;
    }
    busy.current = true;
    setError(null);
    setStatus("pending");
    onBusyChange?.(true);
    // The fields are about to switch off and take the focus with them. The button stays focusable, so focus rests there while it is sent.
    submitButton.current?.focus({ preventScroll: true });
    try {
      await onSubmit({ type, message: message.trim(), email: askEmail === false ? "" : email.trim(), metadata: metadata ?? {} });
      setSentTo(askEmail === false ? "" : email.trim());
      setStatus("done");
      onDraftChange?.(null);
    } catch (thrown) {
      setStatus("idle");
      setError(messageOf(thrown) ?? words.failedBody);
      window.requestAnimationFrame(() => field.current?.focus({ preventScroll: true }));
    } finally {
      busy.current = false;
      onBusyChange?.(false);
    }
  }

  function keys(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      void send();
    }
  }

  if (status === "done") {
    return (
      <div
        ref={thanks}
        tabIndex={-1}
        data-slot="feedback-panel"
        data-status="done"
        // While keyboard focus is on a button of the thank-you, the clock holds still; focus on the thank-you itself does not count.
        onFocusCapture={(event) => setHeld(event.target !== event.currentTarget)}
        onBlurCapture={() => setHeld(false)}
        className={cn("grid outline-none", className)}
      >
        <Heading standalone={standalone} className="sr-only">
          {words.thanks}
        </Heading>
        <Lede standalone={standalone} className="sr-only">
          {sentTo ? fill(words.thanksReply, { email: sentTo }) : words.thanksNoReply}
        </Lede>
        <p role="status" className="sr-only">
          {words.thanks}
        </p>
        <ResultState
          tone="success"
          title={words.thanks}
          description={sentTo ? fill(words.thanksReply, { email: sentTo }) : words.thanksNoReply}
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
    <form data-slot="feedback-panel" data-status={status} noValidate onSubmit={(event) => void send(event)} className={cn("flex min-h-0 flex-col", className)}>
      <div className="shrink-0 px-5 pt-5 pr-14 pb-4 sm:px-6 sm:pt-6">
        <Heading standalone={standalone} className="text-lg leading-tight font-semibold tracking-[-0.02em]">
          {words.title}
        </Heading>
        <Lede standalone={standalone} className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
          {words.description}
        </Lede>
      </div>

      <div className="relative min-h-0 flex-1 overflow-y-auto px-5 pb-6 sm:px-6">
        {error !== null ? (
          <Alert tone="destructive" role="alert" className="mb-5 text-[color-mix(in_oklch,var(--destructive),var(--foreground)_20%)]">
            <IconAlertCircle />
            <AlertTitle>{words.failed}</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
        <fieldset disabled={pending} className="m-0 grid min-w-0 gap-4 border-0 p-0">
          {/* The kinds share the width equally, so four of them fit a phone and the control lines up with the fields below it. */}
          {types.length > 1 ? (
            <SegmentedControl
              label={words.kind}
              options={types.map((entry) => ({ value: entry.id, label: entry.label }))}
              value={type}
              onValueChange={(next) => change({ type: next })}
              className="flex w-full [&_button]:flex-1 [&_button]:px-2"
            />
          ) : null}

          <div className="grid gap-1">
            <FormField className="gap-1.5">
              <FormLabel>{words.message}</FormLabel>
              <FormControl>
                <Textarea
                  ref={field}
                  rows={5}
                  maxLength={maxLength}
                  value={message}
                  placeholder={current?.prompt}
                  aria-keyshortcuts="Control+Enter Meta+Enter"
                  aria-describedby={`${id}-count`}
                  onChange={(event) => change({ message: event.target.value })}
                  onKeyDown={keys}
                  className="min-h-32 resize-none"
                />
              </FormControl>
            </FormField>
            <p id={`${id}-count`} aria-hidden="true" className={cn("min-h-4 text-right text-xs tabular-nums", left <= 0 ? "font-medium text-foreground" : "text-muted-foreground")}>
              {showCounter ? (left <= 0 ? words.limit : fill(words.left, { count: left })) : null}
            </p>
            <p role="status" className="sr-only">
              {said}
            </p>
          </div>

          {askEmail !== false ? (
            <div className="grid gap-2">
              <FormField error={emailProblem} described className="gap-1.5">
                <FormLabel>{askEmail === "required" ? words.email : words.emailOptional}</FormLabel>
                <FormControl>
                  <Input
                    ref={emailField}
                    type="email"
                    autoComplete="email"
                    inputMode="email"
                    value={email}
                    onChange={(event) => {
                      change({ email: event.target.value });
                      if (emailProblem) setEmailProblem(null);
                    }}
                    onBlur={() => setEmailProblem(checkEmail(email))}
                  />
                </FormControl>
                <FormDescription>{words.emailHint}</FormDescription>
              </FormField>
              {privacyNote ? <p className="text-xs leading-relaxed text-muted-foreground [&_a]:text-foreground [&_a]:underline [&_a]:underline-offset-2">{privacyNote}</p> : null}
            </div>
          ) : null}

          {entries.length ? (
            <div className="rounded-lg border border-border bg-muted/40 px-3.5 py-3">
              <p className="text-xs font-medium">{words.metadata}</p>
              <dl className="mt-2 grid gap-1 text-xs">
                {entries.map(([label, value]) => (
                  <div key={label} className="flex gap-3">
                    <dt className="w-20 shrink-0 text-muted-foreground">{label}</dt>
                    <dd className="m-0 min-w-0 [overflow-wrap:anywhere]">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ) : null}
        </fieldset>
      </div>

      <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-border bg-muted/30 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
        {standalone ? (
          <Button type="button" variant="outline" disabled={pending} onClick={onClose}>
            {words.cancel}
          </Button>
        ) : (
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={pending}>
              {words.cancel}
            </Button>
          </DialogClose>
        )}
        {/* Busy is said with aria-busy and aria-disabled, not disabled: a disabled button gives up focus, which would leave a keyboard on no control until the message is sent. */}
        <Button
          ref={submitButton}
          type="submit"
          disabled={message.trim() === "" && !pending}
          aria-busy={pending || undefined}
          aria-disabled={pending || undefined}
          className="aria-disabled:cursor-progress"
        >
          {pending ? <IconSpinner data-slot="button-spinner" /> : null}
          {error !== null && !pending ? words.retry : words.send}
        </Button>
      </div>
      <p role="status" className="sr-only">
        {pending ? words.sending : ""}
      </p>
    </form>
  );
}
