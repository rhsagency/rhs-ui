"use client";

import { useEffect, useRef, useState, type ComponentProps, type ReactNode } from "react";

import { IconAlertCircle, IconBan, IconCheck, IconClock, IconRefresh } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { Spinner } from "@rhs-ui/primitives/spinner";
import { cn } from "@/lib/utils";

export interface ResendButtonLabels {
  /** At rest, and the button's name while it waits, so the name does not change every second. Default "Resend code". */
  ready?: string;
  /** While the send is under way. Default "Sending…". */
  sending?: string;
  /** For a moment after a send worked. Default "Code sent". */
  sent?: string;
  /** While waiting; `{seconds}` is the time left. Default "Resend code in {seconds}s". */
  wait?: string;
  /** Once no resends are left. Default "No resends left". */
  limit?: string;
  /** Under the button once no resends are left: what to do next. Default "Check your spam folder, or contact support." */
  limitHint?: string;
  /** Under the button when a send failed and the error has no message of its own. Default "We could not send a new code. Try again." */
  error?: string;
  /** Said when the wait starts and at ten seconds; `{seconds}` is the time left. Default "You can resend the code in {seconds} seconds." */
  waitSpoken?: string;
  /** Said when the wait is over. Default "You can resend the code now." */
  readySpoken?: string;
}

export interface ResendButtonProps extends Omit<ComponentProps<"div">, "children" | "onChange"> {
  /** The wait between sends, in seconds. Default 30. */
  cooldown?: number;
  /** Sends the code again. Return a promise: the button waits for it, and a rejection shows its message and does not start the timer. */
  onResend: () => unknown;
  /** How many times this button may resend. Leave it out for no limit. The first send, made before the button appeared, does not count. */
  maxAttempts?: number;
  /** Called once, when the last allowed resend has gone out. */
  onLimitReached?: () => void;
  /** The words for each state, for another language or another tone. */
  labels?: ResendButtonLabels;
  /** Begin in the waiting state, for the moment right after the first code went out. Default false. */
  startCooling?: boolean;
  /** `link` reads as a line of text, the others as a button. */
  variant?: "outline" | "ghost" | "link";
  /** Button height: 32, 36 or 44px. Ignored by `link`. */
  size?: "sm" | "md" | "lg";
  /** Disables the button entirely. */
  disabled?: boolean;
}

const BUTTON_SIZE = { sm: "sm", md: "default", lg: "lg" } as const;
// A ghost button has no edge to line up with, so the messages under it start where its words start.
const GHOST_INSET = { sm: "ps-3", md: "ps-4", lg: "ps-6" } as const;

type View = "ready" | "sending" | "sent" | "waiting" | "limit";
const VIEWS: readonly View[] = ["ready", "sending", "sent", "waiting", "limit"];

/**
 * A "Resend code" button for verification codes and magic links, with the
 * cooldown that goes with it. It reads "Resend code in 24s" in tabular
 * figures and counts down on screen every second, but only says so out loud
 * when the wait starts, at ten seconds and when it ends; the button's name
 * stays "Resend code" while it waits, so a screen reader that stays on it is
 * not told the time again every second. The countdown is worked out from
 * timestamps, so a background tab or a re-render cannot make it drift. A
 * failed send shows its error and does not start the timer; after
 * `maxAttempts` the button stops and says what to do next. Put it beside the
 * OTP input; it owns no code field.
 */
export function ResendButton({
  cooldown = 30,
  onResend,
  maxAttempts,
  onLimitReached,
  labels,
  startCooling = false,
  variant = "outline",
  size = "md",
  disabled = false,
  className,
  ...props
}: ResendButtonProps) {
  const text = {
    ready: labels?.ready ?? "Resend code",
    sending: labels?.sending ?? "Sending…",
    sent: labels?.sent ?? "Code sent",
    wait: labels?.wait ?? "Resend code in {seconds}s",
    limit: labels?.limit ?? "No resends left",
    limitHint: labels?.limitHint ?? "Check your spam folder, or contact support.",
    error: labels?.error ?? "We could not send a new code. Try again.",
    waitSpoken: labels?.waitSpoken ?? "You can resend the code in {seconds} seconds.",
    readySpoken: labels?.readySpoken ?? "You can resend the code now.",
  };

  const [phase, setPhase] = useState<"ready" | "sending" | "waiting" | "limit">(startCooling ? "waiting" : "ready");
  const [left, setLeft] = useState(startCooling ? cooldown : 0);
  const [fraction, setFraction] = useState(startCooling ? 1 : 0);
  const [justSent, setJustSent] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const [said, setSaid] = useState({ id: 0, text: "" });

  const alive = useRef(true);
  const attempts = useRef(0);
  const endsAt = useRef(0);
  const spoken = useRef<Set<number>>(new Set());
  const sentTimer = useRef<number>(undefined);
  const resend = useRef(onResend);
  const limitCallback = useRef(onLimitReached);
  const words = useRef(text);
  useEffect(() => {
    resend.current = onResend;
    limitCallback.current = onLimitReached;
    words.current = text;
  });
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      window.clearTimeout(sentTimer.current);
    };
  }, []);

  const say = (message: string) => setSaid((previous) => ({ id: previous.id + 1, text: message }));
  const waitSpoken = (seconds: number) => text.waitSpoken.replace("{seconds}", String(seconds));

  const startWaiting = (announce: string) => {
    endsAt.current = Date.now() + cooldown * 1000;
    spoken.current = new Set([cooldown]);
    setLeft(cooldown);
    setFraction(1);
    setPhase("waiting");
    say(`${announce} ${waitSpoken(cooldown)}`.trim());
  };

  // The clock is the timestamp, not a count of ticks: a tab in the background runs the timer slowly, and the next tick still tells the truth.
  useEffect(() => {
    if (phase !== "waiting") return;
    if (!endsAt.current) endsAt.current = Date.now() + cooldown * 1000;
    const tick = () => {
      const remaining = endsAt.current - Date.now();
      const seconds = Math.max(0, Math.ceil(remaining / 1000));
      setLeft(seconds);
      setFraction(Math.min(1, Math.max(0, remaining / (cooldown * 1000))));
      if (seconds === 10 && cooldown > 10 && !spoken.current.has(10)) {
        spoken.current.add(10);
        say(words.current.waitSpoken.replace("{seconds}", "10"));
      }
      if (remaining <= 0) {
        endsAt.current = 0;
        setPhase("ready");
        say(words.current.readySpoken);
      }
    };
    tick();
    const timer = window.setInterval(tick, 250);
    document.addEventListener("visibilitychange", tick);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [phase, cooldown]);

  async function send() {
    if (phase !== "ready" || disabled) return;
    setProblem(null);
    setPhase("sending");
    say(text.sending);
    try {
      await resend.current();
    } catch (reason) {
      if (!alive.current) return;
      const message = reason instanceof Error && reason.message ? reason.message : text.error;
      setPhase("ready");
      setProblem(message);
      return;
    }
    if (!alive.current) return;
    attempts.current += 1;
    setJustSent(true);
    window.clearTimeout(sentTimer.current);
    sentTimer.current = window.setTimeout(() => setJustSent(false), 1800);
    if (maxAttempts !== undefined && attempts.current >= maxAttempts) {
      setPhase("limit");
      say(`${text.sent}. ${text.limit}. ${text.limitHint}`);
      limitCallback.current?.();
      return;
    }
    startWaiting(`${text.sent}.`);
  }

  const view: View = justSent ? "sent" : phase;
  const blocked = disabled || phase !== "ready";
  const link = variant === "link";
  const waitText = (seconds: number) => text.wait.replace("{seconds}", String(seconds));
  const contents: Record<View, ReactNode> = {
    ready: (
      <>
        <IconRefresh /> {text.ready}
      </>
    ),
    sending: (
      <>
        {/* Only the live one turns; the others hold the same space without running an animation nobody sees. */}
        {view === "sending" ? <Spinner size={16} label="" role="presentation" aria-hidden="true" /> : <span aria-hidden="true" className="size-4 shrink-0" />} {text.sending}
      </>
    ),
    sent: (
      <>
        <IconCheck /> {text.sent}
      </>
    ),
    waiting: (
      <>
        <IconClock /> {waitText(left)}
      </>
    ),
    limit: (
      <>
        <IconBan /> {text.limit}
      </>
    ),
  };

  return (
    <div data-slot="resend-button" data-phase={view} className={cn("inline-flex max-w-full flex-col items-start gap-2", className)} {...props}>
      <Button
        type="button"
        variant={link ? "link" : variant}
        size={link ? "default" : BUTTON_SIZE[size]}
        // While it waits the name stays "Resend code": the seconds are for the eye, and the status below says them at the start, at ten and at the end. A name that changed every second would be read out again each time by a screen reader that stays on the button.
        aria-label={view === "waiting" ? text.ready : undefined}
        aria-disabled={blocked || undefined}
        aria-busy={phase === "sending" || undefined}
        data-state={view}
        className={cn(
          "relative overflow-hidden tabular-nums",
          disabled && "opacity-50",
          // Waiting and finished are not errors, so they are quieter rather than faded out.
          "aria-disabled:cursor-default aria-disabled:hover:bg-transparent",
          variant === "outline" && "aria-disabled:hover:bg-background data-[state=waiting]:bg-muted/50 data-[state=waiting]:text-muted-foreground data-[state=limit]:text-muted-foreground",
          variant === "ghost" && "data-[state=waiting]:text-muted-foreground data-[state=limit]:text-muted-foreground",
          link && "h-auto gap-1.5 p-0 font-medium [font-size:inherit] aria-disabled:no-underline aria-disabled:hover:no-underline data-[state=waiting]:text-muted-foreground data-[state=limit]:text-muted-foreground",
        )}
        onClick={() => {
          if (!blocked) void send();
        }}
      >
        {/* Every state sits in the same cell, so the button is as wide as the longest and nothing moves when the words change. */}
        <span className="inline-grid">
          {VIEWS.map((item) => (
            <span
              key={item}
              aria-hidden={item === view && item !== "waiting" ? undefined : true}
              className={cn(
                "col-start-1 row-start-1 inline-flex items-center gap-2 whitespace-nowrap transition-opacity duration-150 motion-reduce:transition-none [&_svg:not([class*='size-'])]:size-4",
                // A bordered button centres its words in the width it holds; text and ghost buttons start where the button starts, so they line up with what is around them.
                variant === "outline" ? "justify-center" : "justify-start",
                link && "gap-1.5",
                item === view ? "opacity-100" : "opacity-0",
              )}
            >
              {contents[item]}
            </span>
          ))}
          {/* The widest the waiting text will ever be, kept invisible, so the countdown never narrows the button. */}
          <span aria-hidden="true" className="invisible col-start-1 row-start-1 inline-flex items-center gap-2 whitespace-nowrap">
            <IconClock className="size-4" /> {waitText(cooldown)}
          </span>
        </span>
        {link ? null : (
          <span
            aria-hidden="true"
            className={cn("absolute inset-x-3 bottom-[3px] h-0.5 origin-left rounded-full bg-foreground/30 transition-[transform,opacity] duration-300 ease-linear motion-reduce:transition-none", phase === "waiting" && !justSent ? "opacity-100" : "opacity-0")}
            style={{ transform: `scaleX(${fraction})` }}
          />
        )}
      </Button>

      {problem ? (
        <p role="alert" className={cn("flex items-start gap-1.5 text-[0.8125rem] leading-snug text-destructive", variant === "ghost" && GHOST_INSET[size])}>
          <IconAlertCircle className="mt-px size-4 shrink-0" />
          {problem}
        </p>
      ) : null}
      {phase === "limit" && !justSent ? <p className={cn("text-[0.8125rem] leading-snug text-muted-foreground", variant === "ghost" && GHOST_INSET[size])}>{text.limitHint}</p> : null}

      <span role="status" className="sr-only">
        <span key={said.id}>{said.text}</span>
      </span>
    </div>
  );
}
