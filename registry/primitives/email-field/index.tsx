"use client";

import { useCallback, useEffect, useId, useRef, useState, type ChangeEvent, type ComponentProps, type FocusEvent } from "react";

import { IconAlertCircle } from "@rhs-ui/icons";
import { trackPress, whenReleased } from "@rhs-ui/primitives/email-field/blur-guard";
import { DEFAULT_EMAIL_DOMAINS, describeEmail, isValidEmail, normalizeEmail, suggestEmail } from "@rhs-ui/primitives/email-field/emails";
import { Input } from "@rhs-ui/primitives/input";
import { cn } from "@/lib/utils";

export interface EmailFieldProps extends Omit<ComponentProps<"input">, "value" | "defaultValue" | "onChange" | "type" | "name"> {
  /** The address, when you control it. It is the clean form (trimmed, domain in lower case) that `onValueChange` reports. */
  value?: string;
  /** The address to start with, when you do not control it. */
  defaultValue?: string;
  /** Called on every change with the address as it will be used and whether it is complete and well formed. */
  onValueChange?: (email: string, state: { valid: boolean }) => void;
  /** The providers a mistyped domain is compared with, in lower case. Default: the common ones (Gmail, Outlook, iCloud, Yahoo and some regional ones). */
  domains?: readonly string[];
  /** Offer the likely fix when the domain looks like a typo of one in `domains`. Default true. */
  suggest?: boolean;
  /** The field's name for a plain form submit. The clean address goes out in a hidden input, so pressing Enter sends what `onValueChange` reported. */
  name?: string;
}

interface Feedback {
  error: string | null;
  suggestion: string | null;
  invalid: boolean;
}

const NONE: Feedback = { error: null, suggestion: null, invalid: false };

/**
 * An email field that catches the typo before it costs a signup. It trims what
 * is typed and lowercases the domain, and `onValueChange` reports that clean
 * address. When the domain is one or two edits from a common provider
 * ("gmial.com"), a quiet line under the field offers the fix as a button,
 * "Use rick@gmail.com instead". Nothing shows while typing: the line appears
 * when the field is left, never blocks a submit, and sits in a polite live
 * region, with the button in the tab order, so a keyboard or screen reader user
 * gets the same help. A malformed address is explained in words ("An address
 * needs an @"), also on leaving the field and then live until it is right.
 */
export function EmailField({ value, defaultValue = "", onValueChange, domains = DEFAULT_EMAIL_DOMAINS, suggest = true, name, form, className, onBlur, "aria-describedby": describedBy, ref, ...props }: EmailFieldProps) {
  const messageId = useId();
  const input = useRef<HTMLInputElement | null>(null);
  // The field keeps the ref you pass and uses its own to put the focus back after a suggestion is taken.
  const attach = useCallback(
    (node: HTMLInputElement | null) => {
      input.current = node;
      if (typeof ref === "function") ref(node);
      else if (ref) ref.current = node;
    },
    [ref],
  );
  const [draft, setDraft] = useState(value ?? defaultValue);
  const [synced, setSynced] = useState(value);
  const [feedback, setFeedback] = useState<Feedback>(NONE);
  const [said, setSaid] = useState("");

  // A value that arrives from outside replaces what is typed, unless it is only the clean form of it.
  if (value !== undefined && value !== synced) {
    setSynced(value);
    if (value !== normalizeEmail(draft)) setDraft(value);
  }

  useEffect(trackPress, []);

  // What a screen reader was told stays only while it is news; left in the live region it would be read again together with the next message.
  useEffect(() => {
    if (!said) return;
    const timer = window.setTimeout(() => setSaid(""), 4000);
    return () => window.clearTimeout(timer);
  }, [said]);

  function report(text: string) {
    const email = normalizeEmail(text);
    onValueChange?.(email, { valid: isValidEmail(email) });
  }

  function change(event: ChangeEvent<HTMLInputElement>) {
    const text = event.target.value;
    const email = normalizeEmail(text);
    setDraft(text);
    setSaid("");
    // A message that is already showing follows the typing and goes as soon as the address is right. A new one waits for the field to be left.
    setFeedback((now) => (now.error ? { error: describeEmail(email), suggestion: null, invalid: describeEmail(email) !== null } : NONE));
    report(text);
  }

  function leave(event: FocusEvent<HTMLInputElement>) {
    onBlur?.(event);
    const email = normalizeEmail(draft);
    if (email !== draft) setDraft(email);
    whenReleased(() => {
      const problem = describeEmail(email);
      const suggestion = suggest ? suggestEmail(email, domains) : null;
      setFeedback(suggestion ? { error: null, suggestion, invalid: problem !== null } : { error: problem, suggestion: null, invalid: problem !== null });
    });
  }

  function accept() {
    const next = feedback.suggestion;
    if (!next) return;
    setDraft(next);
    setFeedback(NONE);
    setSaid(`Email changed to ${next}.`);
    report(next);
    input.current?.focus();
  }

  return (
    <div data-slot="email-field" className={cn("grid w-full", className)}>
      <Input
        ref={attach}
        type="email"
        inputMode="email"
        autoComplete="email"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        form={form}
        {...props}
        value={draft}
        onChange={change}
        onBlur={leave}
        aria-invalid={feedback.invalid || undefined}
        aria-describedby={[describedBy, messageId].filter(Boolean).join(" ")}
      />
      <div id={messageId} aria-live="polite">
        {feedback.suggestion ? (
          <p className="mt-1.5 flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5 text-xs text-muted-foreground">
            <span>Looks like a typo.</span>
            <button
              type="button"
              onClick={accept}
              className="-mx-0.5 rounded-sm px-0.5 text-left font-medium text-foreground underline decoration-foreground/30 underline-offset-4 transition-colors duration-150 outline-none [overflow-wrap:anywhere] hover:decoration-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40"
            >
              Use {feedback.suggestion} instead
            </button>
          </p>
        ) : feedback.error ? (
          <p className="mt-1.5 flex items-start gap-1.5 text-xs text-destructive">
            <IconAlertCircle aria-hidden="true" className="mt-px size-3.5 shrink-0" />
            {feedback.error}
          </p>
        ) : null}
        {said ? <span className="sr-only">{said}</span> : null}
      </div>
      {name ? <input type="hidden" name={name} form={form} value={normalizeEmail(draft)} disabled={props.disabled} /> : null}
    </div>
  );
}
