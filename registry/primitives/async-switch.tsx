"use client";

import { useEffect, useId, useRef, useState, type ComponentProps, type ReactNode } from "react";
import { Switch as SwitchPrimitive } from "radix-ui";

import { IconAlertCircle, IconCheck, IconRefresh } from "@rhs-ui/icons";
import { Spinner } from "@rhs-ui/primitives/spinner";
import { cn } from "@/lib/utils";

export type AsyncSwitchStatus = "idle" | "pending" | "success" | "error";

export interface AsyncSwitchProps extends Omit<ComponentProps<typeof SwitchPrimitive.Root>, "checked" | "defaultChecked" | "onCheckedChange" | "children" | "asChild" | "onChange"> {
  /** What the switch turns on or off. Pressing the words presses the switch. */
  label: ReactNode;
  /** A line under the label. It is read with the switch. */
  description?: ReactNode;
  /** The saved position, when you control it. While a request is pending the switch shows the position it is moving to, and goes back to this one if the request fails. */
  checked?: boolean;
  /** The position to start in, when you do not control the switch. */
  defaultChecked?: boolean;
  /** The request: called with the position the switch is moving to. Return a promise and the switch waits for it (a spinner in the thumb, further presses ignored), rolls back when it rejects, and shows the result. Return nothing and it simply changes. */
  onCheckedChange?: (next: boolean) => void | Promise<unknown>;
  /** What is shown, and said out loud, for two seconds once the request worked. In a column narrower than 16rem only its check is shown, so a long label does not wrap; the words are still read out. Default "Saved". */
  successMessage?: string;
  /** What is shown, and said out loud, when the request failed. Default "Could not save, try again". */
  errorMessage?: string;
  /** The name of the button that tries the same change again. Default "Retry". */
  retryLabel?: string;
  /** How long the success message stays, in milliseconds. Default 2000. */
  successFor?: number;
  /** Drive the state yourself, for example from a mutation: `status={mutation.status}`. The switch then only displays it, and Retry calls `onCheckedChange` with the position that failed. */
  status?: AsyncSwitchStatus;
}

const isThenable = (value: unknown): value is PromiseLike<unknown> => typeof (value as { then?: unknown } | null)?.then === "function";

/**
 * A switch for settings that save the moment you flip them. It moves to the new
 * position at once, shows a small spinner in the thumb and ignores further
 * presses while the request is out. If the request fails, the thumb slides back
 * and a message appears under the label with a Retry button; if it works, a
 * quiet Saved check shows for two seconds. Both are read out politely. Under
 * reduced motion the thumb jumps and the spinner is a still ellipsis. The switch
 * stays focusable and operable from the keyboard throughout, and says
 * aria-busy while it waits.
 */
export function AsyncSwitch({
  label,
  description,
  checked: controlled,
  defaultChecked = false,
  onCheckedChange,
  successMessage = "Saved",
  errorMessage = "Could not save, try again",
  retryLabel = "Retry",
  successFor = 2000,
  status: driven,
  id,
  className,
  disabled,
  ...props
}: AsyncSwitchProps) {
  const base = useId();
  const switchId = id ?? `${base}-switch`;
  const descriptionId = `${base}-description`;
  const [own, setOwn] = useState(defaultChecked);
  const [attempt, setAttempt] = useState<{ next: boolean } | null>(null);
  const [outcome, setOutcome] = useState<"success" | "error" | null>(null);
  const timer = useRef<number | undefined>(undefined);
  const alive = useRef(true);
  const control = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      window.clearTimeout(timer.current);
    };
  }, []);

  const saved = controlled ?? own;
  const pending = driven ? driven === "pending" : attempt !== null;
  // While the request is out the switch shows where it is going; after it settles it shows where the setting really is.
  const shown = !driven && attempt ? attempt.next : saved;
  const status: AsyncSwitchStatus = driven ?? (attempt ? "pending" : (outcome ?? "idle"));

  async function request(next: boolean) {
    if (pending) return;
    if (driven) {
      void onCheckedChange?.(next);
      return;
    }
    window.clearTimeout(timer.current);
    setOutcome(null);
    let result: unknown;
    try {
      result = onCheckedChange?.(next);
    } catch {
      setOutcome("error");
      return;
    }
    if (!isThenable(result)) {
      if (controlled === undefined) setOwn(next);
      return;
    }
    setAttempt({ next });
    try {
      await result;
    } catch {
      if (!alive.current) return;
      setAttempt(null);
      setOutcome("error");
      return;
    }
    if (!alive.current) return;
    if (controlled === undefined) setOwn(next);
    setAttempt(null);
    setOutcome("success");
    timer.current = window.setTimeout(() => setOutcome(null), successFor);
  }

  return (
    <div
      data-slot="async-switch"
      data-status={status}
      className={cn("grid w-full min-w-0 grid-cols-[auto_minmax(0,1fr)] items-start gap-x-3", className)}
    >
      <SwitchPrimitive.Root
        ref={control}
        id={switchId}
        checked={shown}
        disabled={disabled}
        aria-busy={pending || undefined}
        aria-describedby={description ? descriptionId : undefined}
        onCheckedChange={(next) => void request(next)}
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border border-border bg-muted p-0.5 outline-none transition-colors duration-150",
          "data-[state=checked]:border-primary data-[state=checked]:bg-primary",
          "focus-visible:ring-[3px] focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-50",
          // The switch is 24px tall; the part that answers a finger is 44px.
          "before:absolute before:inset-x-0 before:-inset-y-[11px] before:content-['']",
          pending && "cursor-progress",
          "motion-reduce:transition-none",
        )}
        {...props}
      >
        <SwitchPrimitive.Thumb className="group/thumb pointer-events-none relative grid size-[18px] place-items-center rounded-full bg-foreground transition-transform duration-150 data-[state=checked]:translate-x-5 data-[state=checked]:bg-primary-foreground motion-reduce:transition-none">
          {pending ? (
            <>
              <Spinner size={12} label="" role="presentation" aria-hidden="true" className="text-background group-data-[state=checked]/thumb:text-primary motion-reduce:hidden" />
              <span aria-hidden="true" className="hidden items-center gap-[1.5px] text-background group-data-[state=checked]/thumb:text-primary motion-reduce:flex">
                <span className="size-[2.5px] rounded-full bg-current" />
                <span className="size-[2.5px] rounded-full bg-current" />
                <span className="size-[2.5px] rounded-full bg-current" />
              </span>
            </>
          ) : null}
        </SwitchPrimitive.Thumb>
      </SwitchPrimitive.Root>

      <div className="@container min-w-0">
        {/* The confirmation sits in the row of the label, so it can never narrow the description or make it wrap again. In a narrow column it is
            the check alone (the words are read out all the same), so it does not make a long label wrap either: nothing below it moves. */}
        <div className="flex items-start justify-between gap-3">
          <label htmlFor={switchId} className={cn("block min-w-0 flex-1 text-sm leading-6 font-medium select-none", disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer")}>
            {label}
          </label>
          {status === "success" ? (
            <span aria-hidden="true" className="inline-flex shrink-0 items-center gap-1 pt-1 text-xs leading-4 text-muted-foreground transition-opacity duration-300 starting:opacity-0 motion-reduce:transition-none">
              <IconCheck className="size-3.5" />
              <span className="@max-[16rem]:hidden">{successMessage}</span>
            </span>
          ) : null}
        </div>
        {description ? (
          <p id={descriptionId} className={cn("text-sm leading-5 text-muted-foreground", disabled && "opacity-50")}>
            {description}
          </p>
        ) : null}
      </div>

      {/* The words for a screen reader exist from the first render: a live region that appears together with its message is often never read. */}
      <span role="status" aria-live="polite" className="sr-only">
        {status === "success" ? successMessage : ""}
      </span>
      <div role="status" aria-live="polite" className={cn("col-start-2 text-xs leading-5", status === "error" ? "mt-1.5" : "h-0 overflow-hidden")}>
        {status === "error" ? (
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="inline-flex items-center gap-1.5 text-destructive">
              <IconAlertCircle aria-hidden="true" className="size-3.5 shrink-0" />
              {errorMessage}
            </span>
            <button
              type="button"
              onClick={() => {
                // The button is about to be replaced by the pending state: keep the keyboard where it was by moving it to the switch.
                control.current?.focus();
                void request(!saved);
              }}
              className="inline-flex items-center gap-1 rounded-sm font-medium text-foreground underline underline-offset-4 outline-none hover:no-underline focus-visible:ring-[3px] focus-visible:ring-ring/40"
            >
              <IconRefresh aria-hidden="true" className="size-3.5" />
              {retryLabel}
            </button>
          </span>
        ) : null}
      </div>
    </div>
  );
}
