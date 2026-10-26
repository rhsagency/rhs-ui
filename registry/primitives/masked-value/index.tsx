"use client";

import { Fragment, useEffect, useRef, useState, type ComponentProps, type CSSProperties, type ReactNode } from "react";

import { IconEye, IconEyeOff } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { MASK_LABELS, maskValue, type MaskFunction, type MaskPreset } from "@rhs-ui/primitives/masked-value/masks";
import { cn } from "@/lib/utils";

export interface MaskedValueProps extends Omit<ComponentProps<"span">, "children"> {
  /** The real value: "jane.doe@example.com". While it is hidden only the masked text is in the markup. */
  value: string;
  /** What is shown while it is hidden: `card` ("•••• 4242"), `email` ("j•••@example.com"), `phone`, `iban`, `full` (eight dots), or a function that takes the value and returns the text (a function can only be passed from a client component). Default "full". */
  mask?: MaskPreset | MaskFunction;
  /** What the value is, in a word or two: "email". The reveal button is named "Show email". Defaults to the name of the mask. */
  label?: string;
  /** Show the reveal button. Turn it off for someone who may see the masked value only. Default true. */
  revealable?: boolean;
  /** Hide the value again this many seconds after it was shown. A thin ring on the button counts the time down, and a polite status says it is hidden again. Default: never. */
  autoHideAfter?: number;
  /** Whether the value is shown, when you control it. Pair it with `onRevealedChange`. */
  revealed?: boolean;
  /** Whether the value starts shown, when you do not control it. Default false. */
  defaultRevealed?: boolean;
  /** Called with the new state whenever it changes: a press, or the time running out. */
  onRevealedChange?: (revealed: boolean) => void;
  /** Called when the person asks to see the value, for an audit log. */
  onReveal?: () => void;
  /** The words, for another language. `{label}` and `{seconds}` are replaced. */
  labels?: { show?: string; hidden?: string; shown?: string; shownFor?: string; hiddenAgain?: string };
}

const WORDS = {
  show: "Show {label}",
  hidden: "{label} hidden",
  shown: "{label} shown",
  shownFor: "{label} shown. It hides again in {seconds} seconds.",
  hiddenAgain: "{label} hidden again",
};

const fill = (text: string, label: string, seconds?: number) => text.replace("{label}", label).replace("{seconds}", String(seconds ?? ""));
const sentence = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

/** Where a value may break when it wraps: after a slash, a dot or an @, so an email splits at a sensible place. `<wbr>` adds no character, so a copy is unchanged. */
function breakable(text: string): ReactNode {
  return text.split(/(?<=[/.@])/).map((part, index) => (
    <Fragment key={`${index}-${part}`}>
      {index > 0 ? <wbr /> : null}
      {part}
    </Fragment>
  ));
}

/**
 * The runs of dots in a mask, drawn a little larger, so they read as hidden characters and not as punctuation. They are set in the mono face, whose bullet is
 * round: the bullet of a text face is often a small square, which reads as a redaction bar. The mono advance is wide, so the run is drawn a little closer
 * together, and it never breaks across two lines.
 */
function dotted(masked: string): ReactNode {
  return masked.split(/(•+)/).map((part, index) =>
    part.startsWith("•") ? (
      <span key={index} className="font-mono text-[1.2em] leading-none tracking-[-0.06em] whitespace-nowrap">
        {part}
      </span>
    ) : (
      <Fragment key={index}>{breakable(part)}</Fragment>
    ),
  );
}

/**
 * A sensitive value that stays hidden until someone asks: "•••• 4242",
 * "j•••@example.com". While it is hidden the markup holds only the masked text,
 * never the secret, so selecting, copying and view-source give the mask; after
 * a reveal the real value is plain text and copies as itself. The reveal button
 * is named "Show email" and toggles `aria-pressed`, so a screen reader hears
 * what it does and what state it is in. With `autoHideAfter` the value hides
 * again by itself, a thin ring counts the time down, and a polite status says
 * so. It displays stored personal data; it is not an input. One thing the
 * markup cannot promise: the value is a prop, so it is in your component tree
 * and, from a Server Component, in the page payload. If that matters, fetch it
 * on demand in `onReveal` and pass it in once it is known.
 */
export function MaskedValue({
  value,
  mask = "full",
  label,
  revealable = true,
  autoHideAfter,
  revealed,
  defaultRevealed = false,
  onRevealedChange,
  onReveal,
  labels,
  className,
  ...props
}: MaskedValueProps) {
  const [own, setOwn] = useState(defaultRevealed);
  const [status, setStatus] = useState("");
  const controlled = revealed !== undefined;
  const shown = controlled ? revealed : own;
  const timed = autoHideAfter !== undefined && autoHideAfter > 0;
  const name = label ?? (typeof mask === "string" ? MASK_LABELS[mask] : "value");

  // The timer outlives a render, so it reads the newest props through a ref instead of the ones it was started with.
  const latest = useRef({ controlled, onRevealedChange, labels, name, timed, autoHideAfter });
  useEffect(() => {
    latest.current = { controlled, onRevealedChange, labels, name, timed, autoHideAfter };
  });
  const by = useRef<"user" | "timeout">("user");
  const previous = useRef(shown);

  const change = (next: boolean, because: "user" | "timeout") => {
    by.current = because;
    if (!latest.current.controlled) setOwn(next);
    latest.current.onRevealedChange?.(next);
    if (next && because === "user") onReveal?.();
  };

  // A change of state is announced politely. The first render says nothing.
  useEffect(() => {
    if (previous.current === shown) return;
    previous.current = shown;
    const { labels: words, name: what, timed: counting, autoHideAfter: seconds } = latest.current;
    const subject = sentence(what);
    setStatus(
      shown
        ? fill(counting ? (words?.shownFor ?? WORDS.shownFor) : (words?.shown ?? WORDS.shown), subject, seconds)
        : fill(by.current === "timeout" ? (words?.hiddenAgain ?? WORDS.hiddenAgain) : (words?.hidden ?? WORDS.hidden), subject),
    );
    // The next change is a person's, unless the timer says otherwise.
    by.current = "user";
  }, [shown]);

  useEffect(() => {
    if (!shown || autoHideAfter === undefined || autoHideAfter <= 0) return;
    // `change` reads everything it needs through `latest`, so the timer is only restarted when the state or the time changes.
    const timer = window.setTimeout(() => change(false, "timeout"), autoHideAfter * 1000);
    return () => window.clearTimeout(timer);
  }, [shown, autoHideAfter]);

  return (
    <span data-slot="masked-value" data-revealed={shown} className={cn("inline-flex max-w-full items-center gap-1.5", className)} {...props}>
      {shown ? (
        <span data-slot="masked-value-text" className="min-w-0 [overflow-wrap:anywhere] tabular-nums">
          {breakable(value)}
        </span>
      ) : (
        <>
          <span data-slot="masked-value-text" aria-hidden="true" className="min-w-0 [overflow-wrap:anywhere] tabular-nums">
            {dotted(maskValue(value, mask))}
          </span>
          <span className="sr-only">{fill(labels?.hidden ?? WORDS.hidden, sentence(name))}</span>
        </>
      )}
      {revealable ? (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-pressed={shown}
          aria-label={fill(labels?.show ?? WORDS.show, name)}
          onClick={() => change(!shown, "user")}
          className="relative -my-1 size-6 shrink-0 rounded-full text-muted-foreground hover:text-foreground"
        >
          {shown ? <IconEyeOff /> : <IconEye />}
          {shown && timed ? (
            <svg aria-hidden="true" viewBox="0 0 24 24" className="pointer-events-none absolute inset-0 size-full -rotate-90 motion-reduce:hidden">
              <circle
                cx="12"
                cy="12"
                r="11"
                fill="none"
                pathLength={1}
                strokeDasharray={1}
                strokeLinecap="round"
                strokeWidth={1.5}
                stroke="currentColor"
                className="animate-rhs-countdown text-foreground/45"
                style={{ "--rhs-countdown": `${autoHideAfter}s` } as CSSProperties}
              />
            </svg>
          ) : null}
        </Button>
      ) : null}
      <span role="status" className="sr-only">
        {status}
      </span>
    </span>
  );
}
