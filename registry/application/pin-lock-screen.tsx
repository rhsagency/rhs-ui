"use client";

import { useCallback, useEffect, useId, useRef, useState, type ComponentProps } from "react";

import { Glyph, IconAlertCircle, IconLock, IconLogOut, type IconProps } from "@rhs-ui/icons";
import { Avatar, AvatarFallback, AvatarImage, initialsOf } from "@rhs-ui/primitives/avatar";
import { Button } from "@rhs-ui/primitives/button";
import { cn } from "@/lib/utils";

/** The person whose session is locked. */
export interface PinLockUser {
  /** Their name: "Maya Okafor". */
  name: string;
  /** Their picture, as an image address. Without one the avatar shows their initials. */
  image?: string;
  /** A line under the name: where they are, or what they do. "Till 3, Northwind Kitchen". */
  detail?: string;
}

/** The words the screen uses, for translation. `{name}`, `{time}`, `{count}` and `{length}` are filled in. */
export interface PinLockScreenLabels {
  /** Read out before the name, as the heading's name. Default "Session locked for". */
  lockedFor?: string;
  /** Beside the name, when `lockedAt` is given. Default "Locked at {time}". */
  lockedAt?: string;
  /** The line above the dots. Default "Enter your PIN to unlock". */
  prompt?: string;
  /** The name of the group of dots. Default "PIN". */
  pin?: string;
  /** Said politely as digits are entered. Default "{count} of {length} digits entered". */
  entered?: string;
  /** The name of the keypad. Default "Keypad". */
  keypad?: string;
  /** The name of the delete key. Default "Delete the last digit". */
  erase?: string;
  /** The clear key. Default "Clear". */
  clear?: string;
  /** Under the dots after a wrong PIN, when the tries are not counted. Default "Wrong PIN". */
  wrong?: string;
  /** The same with the tries left. Default "Wrong PIN, {count} tries left". */
  wrongTries?: string;
  /** The same with one try left. Default "Wrong PIN, 1 try left". */
  wrongOneTry?: string;
  /** Under the dots when `onUnlock` threw. Default "We could not check the PIN. Try again.". */
  failed?: string;
  /** Under the dots when no tries are left. Default "Too many wrong PINs. Sign out to continue.". */
  lockedOut?: string;
  /** Under the dots while the PIN is checked. Default "Checking your PIN". */
  checking?: string;
  /** The link to reset the PIN. Default "Forgot PIN?". */
  forgot?: string;
  /** The button that ends the session. Default "Sign out". */
  signOut?: string;
}

export interface PinLockScreenProps extends Omit<ComponentProps<"section">, "children" | "title"> {
  /** Who is locked in. */
  user: PinLockUser;
  /**
   * Checks the PIN, when the last digit has landed. Resolve true when it was right (this is where you unlock) and false when it was not: the dots
   * shake once (not under reduced motion), the PIN is cleared and "Wrong PIN, 2 tries left" is announced. A throw shows a general message.
   * The PIN reaches your code as digits and is never written into the page.
   */
  onUnlock: (pin: string) => boolean | Promise<boolean>;
  /** How many digits the PIN has, and so how many dots. Default 4. */
  length?: number;
  /** When the session locked: a Date, an ISO string or a timestamp. It is written as a clock time. */
  lockedAt?: Date | string | number;
  /** The "Forgot PIN?" link. Leave it out for none. */
  onForgot?: () => void;
  /** The "Sign out" button, the way out of a locked screen. Leave it out for none. */
  onSignOut?: () => void;
  /** How many wrong PINs are left, counted by you. A wrong PIN says it ("Wrong PIN, 2 tries left"); at 0 the keypad stops and signing out is the only way on. Leave it out when tries are not counted. */
  attemptsLeft?: number;
  /** The PIN is being checked by something outside the screen, for example a server round trip you started yourself: the keys wait. The screen already waits while your `onUnlock` promise runs. */
  busy?: boolean;
  /** Listen to the keyboard of the machine: the number row types, Backspace deletes, Escape clears, and a held key does not repeat. Default true. Turn it off for a preview that sits on a page with other things in it. */
  keyboard?: boolean;
  /** The language of the time. Default "en-US". */
  locale?: string;
  /** The time zone the time is written in, so the server and the browser agree. Default "UTC". */
  timeZone?: string;
  /** Start with the wrong-PIN message showing: for a preview. The next digit clears it. */
  defaultWrong?: boolean;
  /** The heading's element: "h1" (the default) when the screen is the page, "h2" inside a page that has its own h1. */
  titleAs?: "h1" | "h2" | "h3";
  /** The words the screen uses, for translation. */
  labels?: PinLockScreenLabels;
}

const DEFAULT_LABELS = {
  lockedFor: "Session locked for",
  lockedAt: "Locked at {time}",
  prompt: "Enter your PIN to unlock",
  pin: "PIN",
  entered: "{count} of {length} digits entered",
  keypad: "Keypad",
  erase: "Delete the last digit",
  clear: "Clear",
  wrong: "Wrong PIN",
  wrongTries: "Wrong PIN, {count} tries left",
  wrongOneTry: "Wrong PIN, 1 try left",
  failed: "We could not check the PIN. Try again.",
  lockedOut: "Too many wrong PINs. Sign out to continue.",
  checking: "Checking your PIN",
  forgot: "Forgot PIN?",
  signOut: "Sign out",
} satisfies Required<PinLockScreenLabels>;

const fill = (template: string, values: Record<string, string>) => template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? "");

/** The failure text, darkened toward the foreground so the red words reach 4.5:1 on their pale fill. */
const DANGER_TEXT = "text-[color:color-mix(in_oklch,var(--destructive),var(--foreground)_30%)]";

/** How long the dots stay red and shake, in ms, before the PIN is cleared for the next try. */
const WRONG_MS = 600;

/**
 * The delete key: a tag with a cross, drawn in the hand of the icon set. @rhs-ui/icons has no backspace icon yet, so it is drawn here with the
 * set's own `Glyph` (same 24 unit grid and stroke); swap it for the icon when the set gains one.
 */
const IconBackspace = (props: IconProps) => <Glyph {...props} d="M9.5 5.5h9.5a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H9.5L3 12zM12.5 9.5l5 5M17.5 9.5l-5 5" />;

/** The clock time in the locale and zone. An unknown locale or zone falls back to US English and UTC instead of taking the page down. */
function clockTime(input: Date | string | number, locale: string, timeZone: string): { text: string; iso: string } | null {
  const at = new Date(input);
  if (Number.isNaN(at.getTime())) return null;
  const options: Intl.DateTimeFormatOptions = { hour: "numeric", minute: "2-digit", timeZone };
  let text: string;
  try {
    text = new Intl.DateTimeFormat(locale, options).format(at);
  } catch {
    text = new Intl.DateTimeFormat("en-US", { ...options, timeZone: "UTC" }).format(at);
  }
  return { text, iso: at.toISOString() };
}

const KEY =
  "grid size-16 place-items-center sm:size-[4.5rem] disabled:pointer-events-none disabled:opacity-40 rounded-full text-2xl font-medium tabular-nums transition-[background-color,transform] duration-100 outline-none select-none focus-visible:ring-[3px] focus-visible:ring-ring/40 motion-safe:active:scale-95 motion-reduce:transition-none aria-disabled:cursor-default aria-disabled:opacity-40";

/**
 * A locked-session screen with a numeric keypad, for shared tablets, tills and
 * kiosks where a password is the wrong tool. It shows who is locked in (a
 * large avatar, the name as the heading, the time it locked), a row of dots
 * that fill as digits land, and a three by four keypad of large round buttons:
 * a plain grid of real buttons, so assistive technology reads it as exactly
 * that. The number row of a keyboard works too, Backspace deletes and Escape
 * clears, and a held key does not repeat. The dots say "3 of 4 digits
 * entered" politely, and the digits themselves are never written into the page.
 * When the last digit lands `onUnlock` runs; a wrong PIN turns the dots red
 * and shakes them once (never under reduced motion), clears the PIN and says
 * "Wrong PIN, 2 tries left" from the `attemptsLeft` you keep. With no tries
 * left the keys stop and "Sign out" is the way on.
 */
export function PinLockScreen({
  user,
  onUnlock,
  length = 4,
  lockedAt,
  onForgot,
  onSignOut,
  attemptsLeft,
  busy = false,
  keyboard = true,
  locale = "en-US",
  timeZone = "UTC",
  defaultWrong = false,
  titleAs: Title = "h1",
  labels,
  className,
  ...props
}: PinLockScreenProps) {
  const text: Required<PinLockScreenLabels> = { ...DEFAULT_LABELS, ...labels };
  const titleId = useId();
  const working = useRef(false);
  const [pin, setPin] = useState("");
  const [phase, setPhase] = useState<"idle" | "checking" | "wrong">("idle");
  const [message, setMessage] = useState<"wrong" | "failed" | null>(defaultWrong ? "wrong" : null);
  // Counts the wrong PINs, so the shake restarts on each one.
  const [shakes, setShakes] = useState(0);

  const lockedOut = attemptsLeft !== undefined && attemptsLeft <= 0;
  const waiting = busy || phase !== "idle";
  const stopped = lockedOut || waiting;
  const time = lockedAt === undefined ? null : clockTime(lockedAt, locale, timeZone);

  // The three things a key can do. Each reads the PIN through the state setter, so none of them ever holds a stale one.
  const type = useCallback(
    (value: string) => {
      if (stopped) return;
      setMessage(null);
      setPin((current) => (current.length < length ? current + value : current));
    },
    [stopped, length],
  );
  const erase = useCallback(() => {
    if (stopped) return;
    setMessage(null);
    setPin((current) => current.slice(0, -1));
  }, [stopped]);
  const clear = useCallback(() => {
    if (stopped) return;
    setMessage(null);
    setPin("");
  }, [stopped]);

  // The timer that ends the red flash must not outlive the screen.
  const flash = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(flash.current), []);

  useEffect(() => {
    if (!keyboard) return;
    const onKeyDown = (event: KeyboardEvent) => {
      // A held key repeats its keydown: a PIN is typed with deliberate presses, so only the first counts.
      if (event.repeat || event.ctrlKey || event.metaKey || event.altKey || event.defaultPrevented) return;
      // Anything the person is typing into elsewhere on the page keeps its keys.
      if (event.target instanceof Element && event.target.closest("input, textarea, select, [contenteditable]")) return;
      if (/^[0-9]$/.test(event.key)) {
        event.preventDefault();
        type(event.key);
      } else if (event.key === "Backspace") {
        event.preventDefault();
        erase();
      } else if (event.key === "Escape") {
        event.preventDefault();
        clear();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [keyboard, type, erase, clear]);

  // The last digit has landed: ask. The dots stay full, and pulse, while the answer is on its way.
  useEffect(() => {
    if (pin.length !== length || phase !== "idle" || working.current) return;
    working.current = true;
    setPhase("checking");
    void (async () => {
      let right = false;
      let failed = false;
      try {
        right = await onUnlock(pin);
      } catch {
        failed = true;
      }
      working.current = false;
      if (right) {
        setPhase("idle");
        setPin("");
        return;
      }
      // Wrong: the dots turn red and shake while they are still full, then the PIN is cleared for the next try.
      setMessage(failed ? "failed" : "wrong");
      setShakes((count) => count + 1);
      setPhase("wrong");
      flash.current = window.setTimeout(() => {
        setPin("");
        setPhase("idle");
      }, WRONG_MS);
    })();
    // The PIN is what starts the check; a new `onUnlock` or wording mid-way must not start it again.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin]);

  const failure =
    message === "failed"
      ? text.failed
      : message === "wrong"
        ? attemptsLeft === undefined
          ? text.wrong
          : attemptsLeft === 1
            ? text.wrongOneTry
            : attemptsLeft > 1
              ? fill(text.wrongTries, { count: String(attemptsLeft) })
              : text.wrong
        : "";
  const line = lockedOut ? text.lockedOut : failure;
  const filled = pin.length;

  const digit = (value: string) => (
    <button key={value} type="button" disabled={lockedOut} aria-disabled={stopped || undefined} onClick={() => type(value)} className={cn(KEY, "bg-muted/60 hover:bg-muted active:bg-muted")}>
      {value}
    </button>
  );

  return (
    <section
      data-slot="pin-lock-screen"
      data-phase={phase}
      aria-labelledby={titleId}
      aria-busy={waiting || undefined}
      className={cn("relative flex min-h-dvh flex-col items-center justify-center gap-9 bg-background px-6 py-12 text-foreground", className)}
      {...props}
    >
      <header className="grid justify-items-center gap-3 text-center">
        <div className="relative">
          <Avatar className="ring-1 ring-border data-[size=default]:size-16">
            {user.image ? <AvatarImage src={user.image} alt="" /> : null}
            <AvatarFallback aria-hidden="true" className="text-lg tracking-[-0.02em]">
              {initialsOf(user.name) || "?"}
            </AvatarFallback>
          </Avatar>
          <span aria-hidden="true" className="absolute -right-1.5 -bottom-1.5 grid size-6 place-items-center rounded-full border border-border bg-background text-foreground">
            <IconLock className="size-3.5" />
          </span>
        </div>
        <div className="grid gap-1">
          <Title id={titleId} className="text-xl leading-tight font-semibold tracking-[-0.03em] text-balance">
            <span className="sr-only">{`${text.lockedFor} `}</span>
            {user.name}
          </Title>
          {user.detail || time ? (
            <p className="flex flex-wrap items-center justify-center gap-x-2 text-sm text-muted-foreground">
              {user.detail ? <span>{user.detail}</span> : null}
              {user.detail && time ? (
                <span aria-hidden="true" className="text-muted-foreground/60">
                  ·
                </span>
              ) : null}
              {time ? (
                <time dateTime={time.iso} className="tabular-nums">
                  {fill(text.lockedAt, { time: time.text })}
                </time>
              ) : null}
            </p>
          ) : null}
        </div>
      </header>

      <div className="grid justify-items-center gap-5">
        <p className="text-sm text-muted-foreground">{text.prompt}</p>

        {/* The dots are for the eye. The count is said by the status below, and the digits are not in the page at all. */}
        <div key={shakes} role="group" aria-label={text.pin} className={cn("flex h-4 items-center justify-center gap-5", shakes > 0 && phase === "wrong" && "motion-safe:animate-rhs-pin-shake", phase === "checking" && "motion-safe:animate-pulse")}>
          {Array.from({ length }, (_, index) => (
            <span
              key={index}
              aria-hidden="true"
              className={cn(
                "size-4 rounded-full border-2 transition-[background-color,border-color,transform] duration-150 motion-reduce:transition-none",
                index < filled ? (phase === "wrong" ? "border-destructive bg-destructive" : "border-foreground bg-foreground motion-safe:scale-110") : "border-muted-foreground/70",
              )}
            />
          ))}
        </div>
        <p role="status" className="sr-only">
          {fill(text.entered, { count: String(filled), length: String(length) })}
        </p>

        {/* The line is kept even while it is empty, so the dots and the keys never move when a message comes and goes. */}
        <div className="grid min-h-6 content-center justify-items-center">
          <div role="alert">
            {line ? (
              <p className={cn("flex items-center gap-2 text-sm leading-snug font-medium", DANGER_TEXT)}>
                <IconAlertCircle aria-hidden="true" className="size-4 shrink-0" />
                {line}
              </p>
            ) : null}
          </div>
          {phase === "checking" ? <p className="text-sm text-muted-foreground">{text.checking}</p> : null}
        </div>
      </div>

      <div role="group" aria-label={text.keypad} className="grid grid-cols-3 gap-x-5 gap-y-4">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map(digit)}
        <button type="button" disabled={lockedOut} aria-disabled={stopped || filled === 0 || undefined} onClick={clear} className={cn(KEY, "text-base font-normal text-muted-foreground hover:bg-muted/60 hover:text-foreground")}>
          {text.clear}
        </button>
        {digit("0")}
        <button type="button" aria-label={text.erase} disabled={lockedOut} aria-disabled={stopped || filled === 0 || undefined} onClick={erase} className={cn(KEY, "text-muted-foreground hover:bg-muted/60 hover:text-foreground")}>
          <IconBackspace aria-hidden="true" className="size-6" />
        </button>
      </div>

      {onForgot || onSignOut ? (
        <div className="flex flex-wrap items-center justify-center gap-2">
          {onForgot ? (
            <Button type="button" variant="ghost" onClick={onForgot} className="text-muted-foreground hover:text-foreground">
              {text.forgot}
            </Button>
          ) : null}
          {onSignOut ? (
            <Button type="button" variant={lockedOut ? "default" : "ghost"} onClick={onSignOut} className={lockedOut ? undefined : "text-muted-foreground hover:text-foreground"}>
              <IconLogOut />
              {text.signOut}
            </Button>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
