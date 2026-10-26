"use client";

import { useCallback, useEffect, useId, useRef, useState, type ChangeEvent, type ComponentProps, type FocusEvent } from "react";

import { IconAlertCircle, IconCheck, IconCircle, IconLock, IconWarning, IconXCircle } from "@rhs-ui/icons";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@rhs-ui/primitives/input-group";
import { Spinner } from "@rhs-ui/primitives/spinner";
import { cleanUsername, usernameProblem, usernameRules } from "@rhs-ui/primitives/username-field/usernames";
import { cn } from "@/lib/utils";

/** Where a name stands. Exactly one of these is true at any time. */
export type UsernameStatus = "idle" | "checking" | "available" | "taken" | "invalid" | "error";

/** What `onCheck` may answer: free or not, or not free with a few names that are. */
export type UsernameCheckResult = boolean | { available: boolean; suggestions?: readonly string[] };

export interface UsernameFieldProps extends Omit<ComponentProps<"input">, "value" | "defaultValue" | "onChange" | "type" | "minLength" | "maxLength"> {
  /** The username without the @, when you control it. */
  value?: string;
  /** The username to start with, when you do not control it. */
  defaultValue?: string;
  /** Called with the cleaned name on every change, and whether it follows the rules (which says nothing about whether it is free). */
  onValueChange?: (username: string, state: { valid: boolean }) => void;
  /** Asks your server whether a name is free. Gets the name and an AbortSignal that is aborted when the name changes, so pass it to fetch. Without it the field only checks the format and calls nothing. */
  onCheck?: (username: string, options: { signal: AbortSignal }) => Promise<UsernameCheckResult> | UsernameCheckResult;
  /** Called when the status changes, for example to enable your submit button once the name is "available". */
  onStatusChange?: (status: UsernameStatus, username: string) => void;
  /** The shortest name that is allowed. Default 3. */
  minLength?: number;
  /** The longest name that is allowed; anything past it is not typed. Default 20. */
  maxLength?: number;
  /** How long to wait after the last keystroke before asking `onCheck`, in ms. Default 400. */
  debounce?: number;
  /** Names that can never be taken, in lower case. They are refused without asking. RESERVED_USERNAMES in `username-field/usernames` is a starting list. */
  reserved?: readonly string[];
}

interface Answer {
  username: string;
  status: "available" | "taken" | "error";
  suggestions: readonly string[];
}

// An invalid name says which rule it breaks in one or two words, because "Invalid" next to a name that is merely reserved is not true.
const BADGES = {
  checking: { words: "Checking", tone: "text-muted-foreground" },
  available: { words: "Available", tone: "text-foreground" },
  taken: { words: "Taken", tone: "text-destructive" },
  invalid: { words: "Invalid", tone: "text-destructive" },
  reserved: { words: "Reserved", tone: "text-destructive" },
  short: { words: "Too short", tone: "text-destructive" },
  error: { words: "Check failed", tone: "text-muted-foreground" },
} as const;

function BadgeIcon({ shown }: { shown: keyof typeof BADGES }) {
  switch (shown) {
    case "checking":
      return <Spinner size={16} label="" />;
    case "available":
      return <IconCheck strokeWidth={2.5} />;
    case "taken":
      return <IconXCircle />;
    case "reserved":
      return <IconLock />;
    case "invalid":
    case "short":
      return <IconAlertCircle />;
    case "error":
      return <IconWarning />;
  }
}

// InputGroup keeps its neutral focus ring even on an invalid field; the error keeps its colour while someone is fixing it.
const STAYS_RED = "has-[input[aria-invalid=true]:focus-visible]:border-destructive has-[input[aria-invalid=true]:focus-visible]:ring-destructive/30";

/**
 * A handle field that says whether the name is free before anyone submits.
 * It sits behind a fixed @, lowercases and drops what is not a letter, a digit,
 * a dot or an underscore as people type (the caret stays where it was), and
 * lists the rules under the field with the ones that are met ticked. Give it
 * `onCheck` and, a moment after typing stops, it asks: the end of the field
 * shows exactly one status as an icon and words (Checking, Available, Taken,
 * Reserved, Too short, Invalid, Check failed) and the same sentence, "@rick is
 * available", goes to a polite live region. A slow answer for an older name is thrown away, so "ric"
 * never overrides "rick", and a taken name offers up to three alternatives as
 * buttons. Without `onCheck` it only checks the format and calls nothing.
 */
export function UsernameField({ value, defaultValue = "", onValueChange, onCheck, onStatusChange, minLength = 3, maxLength = 20, debounce = 400, reserved = [], className, onBlur, "aria-describedby": describedBy, ref, ...props }: UsernameFieldProps) {
  const id = useId();
  const input = useRef<HTMLInputElement | null>(null);
  // The field keeps the ref you pass and uses its own to put the focus back after a suggestion is chosen.
  const attach = useCallback(
    (node: HTMLInputElement | null) => {
      input.current = node;
      if (typeof ref === "function") ref(node);
      else if (ref) ref.current = node;
    },
    [ref],
  );
  const [own, setOwn] = useState(() => cleanUsername(defaultValue, defaultValue.length, maxLength).value);
  const [left, setLeft] = useState(false);
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [again, setAgain] = useState(0);
  const quick = useRef(false);
  const latest = useRef({ onCheck, onStatusChange });
  useEffect(() => {
    latest.current = { onCheck, onStatusChange };
  });

  const current = value === undefined ? own : cleanUsername(value, value.length, maxLength).value;
  const problem = usernameProblem(current, minLength, reserved);
  const formatOk = current !== "" && problem === null;
  const asks = onCheck !== undefined;

  let status: UsernameStatus;
  if (!current) status = "idle";
  else if (problem === "start" || problem === "reserved" || (problem === "short" && left)) status = "invalid";
  else if (problem === "short" || !asks) status = "idle";
  else if (answer && answer.username === current) status = answer.status;
  else status = "checking";

  // Ask once typing has paused. Every keystroke aborts the question before it, and an answer is kept only while it is for the name in the field.
  useEffect(() => {
    if (!formatOk || !asks) {
      setAnswer(null);
      return;
    }
    const controller = new AbortController();
    const wait = quick.current ? 0 : debounce;
    quick.current = false;
    const timer = window.setTimeout(async () => {
      try {
        const reply = await latest.current.onCheck?.(current, { signal: controller.signal });
        if (controller.signal.aborted || reply === undefined) return;
        const available = typeof reply === "boolean" ? reply : reply.available;
        const options = typeof reply === "boolean" ? [] : (reply.suggestions ?? []).filter((name) => name && name !== current);
        setAnswer({ username: current, status: available ? "available" : "taken", suggestions: options.slice(0, 3) });
      } catch {
        if (!controller.signal.aborted) setAnswer({ username: current, status: "error", suggestions: [] });
      }
    }, wait);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [current, formatOk, asks, debounce, again]);

  const told = useRef("");
  useEffect(() => {
    const key = `${status} ${current}`;
    if (told.current === key) return;
    told.current = key;
    latest.current.onStatusChange?.(status, current);
  }, [status, current]);

  function commit(next: string) {
    if (value === undefined) setOwn(next);
    onValueChange?.(next, { valid: next !== "" && usernameProblem(next, minLength, reserved) === null });
  }

  function change(event: ChangeEvent<HTMLInputElement>) {
    const node = event.currentTarget;
    const { value: next, caret } = cleanUsername(node.value, node.selectionStart ?? node.value.length, maxLength);
    // The field is put right here, before React looks at it, so a key that is dropped does not throw the caret to the end.
    if (node.value !== next) {
      node.value = next;
      node.setSelectionRange(caret, caret);
    }
    setLeft(false);
    commit(next);
  }

  function leave(event: FocusEvent<HTMLInputElement>) {
    onBlur?.(event);
    if (current) setLeft(true);
  }

  function choose(name: string) {
    quick.current = true;
    commit(cleanUsername(name, name.length, maxLength).value);
    input.current?.focus();
  }

  function retry() {
    quick.current = true;
    setAnswer(null);
    setAgain((count) => count + 1);
  }

  const handle = `@${current}`;
  let sentence = "";
  if (status === "available") sentence = `${handle} is available.`;
  else if (status === "taken") sentence = `${handle} is taken.`;
  else if (status === "error") sentence = `Could not check ${handle} right now.`;
  else if (status === "invalid") sentence = problem === "start" ? "A username starts with a letter." : problem === "reserved" ? `${handle} is reserved. Choose another name.` : `Use at least ${minLength} characters.`;
  const shown = status === "taken" || status === "error" || (status === "invalid" && problem === "reserved");
  const failing = status === "invalid" ? (problem === "short" ? "length" : problem === "start" ? "start" : null) : null;
  const badged = status === "idle" ? null : status === "invalid" ? (problem === "reserved" ? "reserved" : problem === "short" ? "short" : "invalid") : status;

  return (
    <div data-slot="username-field" className={cn("grid w-full", className)}>
      <InputGroup className={STAYS_RED}>
        <InputGroupAddon aria-hidden="true" className="font-medium">
          @
        </InputGroupAddon>
        <InputGroupInput
          ref={attach}
          type="text"
          autoComplete="off"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          {...props}
          value={current}
          onChange={change}
          onBlur={leave}
          aria-invalid={status === "invalid" || status === "taken" ? true : undefined}
          aria-describedby={[describedBy, `${id}-rules`, `${id}-status`].filter(Boolean).join(" ")}
          className="pl-1.5"
        />
        {badged ? (
          <InputGroupAddon aria-hidden="true" className={cn("gap-1.5 pr-3 text-xs font-medium whitespace-nowrap", BADGES[badged].tone)}>
            <BadgeIcon shown={badged} />
            {BADGES[badged].words}
          </InputGroupAddon>
        ) : null}
      </InputGroup>

      <ul id={`${id}-rules`} aria-label="Username rules" className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
        {usernameRules(current, minLength, maxLength).map((rule) => (
          <li key={rule.id} className={cn("flex items-start gap-1.5", failing === rule.id ? "text-destructive" : rule.met ? "text-foreground" : "text-muted-foreground")}>
            {/* The icon stays on the first line, whole, when a rule has to wrap in a narrow column. */}
            {failing === rule.id ? <IconAlertCircle size={13} aria-hidden="true" className="mt-[1.5px] shrink-0" /> : rule.met ? <IconCheck size={13} strokeWidth={2.5} aria-hidden="true" className="mt-[1.5px] shrink-0" /> : <IconCircle size={13} aria-hidden="true" className="mt-[1.5px] shrink-0 opacity-60" />}
            {rule.label}
            <span className="sr-only">{rule.met ? ", met" : ", not met yet"}</span>
          </li>
        ))}
      </ul>

      <div className={shown ? "mt-2 flex flex-wrap items-center gap-x-2 gap-y-1.5 text-xs" : "contents"}>
        <p id={`${id}-status`} role="status" className={cn(shown ? "" : "sr-only", status === "taken" || status === "invalid" ? "text-destructive" : "text-muted-foreground")}>
          {sentence}
        </p>
        {status === "error" ? (
          <button type="button" onClick={retry} className="-mx-0.5 rounded-sm px-0.5 font-medium text-foreground underline decoration-foreground/30 underline-offset-4 outline-none hover:decoration-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40">
            Try again
          </button>
        ) : null}
        {status === "taken" && answer && answer.suggestions.length ? (
          <>
            <span className="text-muted-foreground">Try</span>
            {answer.suggestions.map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => choose(name)}
                className="inline-flex h-6 items-center rounded-full border border-border bg-background px-2.5 font-medium text-foreground transition-colors duration-150 outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/40"
              >
                @{name}
              </button>
            ))}
          </>
        ) : null}
      </div>
    </div>
  );
}
