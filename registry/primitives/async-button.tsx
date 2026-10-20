"use client";

import { useEffect, useRef, useState, type ComponentProps, type MouseEvent, type ReactNode } from "react";

import { Glyph } from "@rhs-ui/icons";
import { Button, type ButtonProps } from "@rhs-ui/primitives/button";
import { Spinner } from "@rhs-ui/primitives/spinner";
import { cn } from "@/lib/utils";

export type AsyncButtonStatus = "idle" | "pending" | "success" | "error";

export interface AsyncButtonLabels {
  /** At rest. Default "Save". */
  idle?: string;
  /** While the action runs. Default "Saving…". */
  pending?: string;
  /** Once it worked. Default "Saved". */
  success?: string;
  /** Once it failed. Default "Could not save". */
  error?: string;
}

export interface AsyncButtonProps extends Omit<ComponentProps<"button">, "onClick" | "onError" | "children"> {
  /** The words for each state. The button is as wide as the longest, so nothing moves when they change. */
  labels?: AsyncButtonLabels;
  /** The action. Return a promise: the button waits while it is pending and shows the error if it rejects. */
  onClick?: (event: MouseEvent<HTMLButtonElement>) => unknown;
  /** Called with whatever the action resolved to. */
  onSuccess?: (result: unknown) => void;
  /** Called with whatever the action rejected with. */
  onError?: (error: unknown) => void;
  /** How long success or error stays before the button returns to rest, in milliseconds. */
  resetAfter?: number;
  /** Drive the state yourself, for example from a mutation: `status={mutation.status}`. The button then only displays it. */
  status?: AsyncButtonStatus;
  /** An icon before the idle label. */
  icon?: ReactNode;
  /** Any Button variant. An error turns it destructive. */
  variant?: ButtonProps["variant"];
  /** Any Button size. */
  size?: ButtonProps["size"];
}

const STATES: readonly AsyncButtonStatus[] = ["idle", "pending", "success", "error"];
const DEFAULT_LABELS = { idle: "Save", pending: "Saving…", success: "Saved", error: "Could not save" };

// Colour is never the only signal (the check and the cross carry the state), but an error is allowed to look like one.
const errorSolid = "data-[status=error]:bg-destructive data-[status=error]:text-destructive-foreground data-[status=error]:hover:bg-destructive/90";
const errorQuiet = "data-[status=error]:border-destructive data-[status=error]:text-destructive data-[status=error]:hover:text-destructive";

const draw = "transition-[stroke-dashoffset] duration-300 ease-out motion-reduce:transition-none";

function StateIcon({ state, icon, active }: { state: AsyncButtonStatus; icon?: ReactNode; active: boolean }) {
  if (state === "idle") return icon ? <span className="inline-flex shrink-0">{icon}</span> : null;
  if (state === "pending") return <Spinner size={16} label="" role="presentation" aria-hidden="true" />;
  // The tick and the cross draw themselves in; a stroke that is not due yet is hidden by its dash offset.
  const offset = active ? "[stroke-dashoffset:0]" : "[stroke-dashoffset:1]";
  return (
    <Glyph size={16} className="shrink-0">
      {state === "success" ? (
        <path d="M5 12.5l4.5 4.5L19 7" pathLength={1} strokeDasharray={1} className={cn(draw, offset, "delay-100")} />
      ) : (
        <>
          <path d="M6 6l12 12" pathLength={1} strokeDasharray={1} className={cn(draw, offset, "delay-100")} />
          <path d="M18 6L6 18" pathLength={1} strokeDasharray={1} className={cn(draw, offset, "delay-200")} />
        </>
      )}
    </Glyph>
  );
}

/**
 * A button for an action that takes a moment. Give it an `onClick` that
 * returns a promise and it runs the cycle: pending (a spinner, further presses
 * ignored), then success (a drawn check) or error (a cross, still pressable so
 * the person can retry at once), then back to rest. Every label and icon sits
 * in the same spot, so the width holds and nothing jumps; a polite live region
 * reads each change. It uses aria-disabled, not disabled, so focus stays put.
 */
export function AsyncButton({ labels, onClick, onSuccess, onError, resetAfter = 2000, status: controlled, icon, variant = "default", size, className, type = "button", ...props }: AsyncButtonProps) {
  const text = { ...DEFAULT_LABELS, ...labels };
  const [own, setOwn] = useState<AsyncButtonStatus>("idle");
  const timer = useRef<number>(undefined);
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      window.clearTimeout(timer.current);
    };
  }, []);

  const status = controlled ?? own;
  // A press while pending would run it twice; one during success is only feedback.
  const blocked = status === "pending" || status === "success";
  const current = STATES.indexOf(status);

  async function run(event: MouseEvent<HTMLButtonElement>) {
    if (blocked) {
      event.preventDefault();
      return;
    }
    window.clearTimeout(timer.current);
    setOwn("pending");
    let next: AsyncButtonStatus = "success";
    let outcome: unknown;
    try {
      outcome = await onClick?.(event);
    } catch (error) {
      next = "error";
      outcome = error;
    }
    if (!alive.current) return;
    setOwn(next);
    if (next === "success") onSuccess?.(outcome);
    else onError?.(outcome);
    timer.current = window.setTimeout(() => setOwn("idle"), resetAfter);
  }

  // The live region comes first and is sr-only, so the button is the last child: a Button Group can then join it.
  return (
    <>
      <span role="status" className="sr-only">
        {status === "idle" ? "" : text[status]}
      </span>
      <Button
        data-slot="async-button"
        data-status={status}
        type={type}
        variant={variant}
        size={size}
        aria-busy={status === "pending" || undefined}
        aria-disabled={blocked || undefined}
        onClick={(event) => void run(event)}
        className={cn(variant === "default" ? errorSolid : variant === "destructive" ? undefined : errorQuiet, "data-[status=success]:cursor-default", className)}
        {...props}
      >
        <span className="inline-grid">
          {STATES.map((state, index) => {
            const active = state === status;
            return (
              <span
                key={state}
                aria-hidden={active ? undefined : true}
                className={cn(
                  "col-start-1 row-start-1 inline-flex items-center justify-center gap-2 whitespace-nowrap transition-[opacity,translate] motion-reduce:transition-none",
                  // The old words leave quickly and the new ones arrive just after, so the two are hardly ever on screen together.
                  active ? "opacity-100 delay-75 duration-200" : cn("pointer-events-none opacity-0 duration-100 [&_svg]:animate-none", index < current ? "-translate-y-1.5" : "translate-y-1.5"),
                )}
              >
                <StateIcon state={state} icon={icon} active={active} />
                {text[state]}
              </span>
            );
          })}
        </span>
      </Button>
    </>
  );
}
