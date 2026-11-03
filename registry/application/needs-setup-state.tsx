"use client";

import { useId, useState, type ComponentProps, type ReactNode } from "react";

import { EmptyState } from "@rhs-ui/application/empty-state";
import { IconCheck, IconPlug, IconSpinner } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { cn } from "@/lib/utils";

/** One part of the setup. */
export interface SetupStep {
  /** What has to happen, in a few words: "Verify your business details". */
  label: string;
  /** Whether it is finished. The first step that is not is marked "Next". */
  done: boolean;
}

/** The words the panel uses, for translation. `{done}` and `{total}` are filled in. */
export interface NeedsSetupStateLabels {
  /** The heading of the list of steps. Default "Setup". */
  heading?: string;
  /** The count beside it. Default "{done} of {total} done". */
  progress?: string;
  /** Beside a finished step. Default "Done". */
  done?: string;
  /** Beside the first step that is not finished. Default "Next". */
  next?: string;
  /** Read out for the steps after that one, which show no word. Default "Not done yet". */
  todo?: string;
}

export interface NeedsSetupStateProps extends Omit<ComponentProps<"div">, "title" | "children"> {
  /** What is needed, as the action it asks for: "Connect a Stripe account to see revenue". */
  title: string;
  /** Why it is needed, in a sentence. */
  description: string;
  /** The parts of the setup, in order. Leave it out when there is one step and the title says it. */
  steps?: readonly SetupStep[];
  /** The label of the main button: "Connect Stripe". Leave it out for no button. */
  actionLabel?: string;
  /** Called when the main button is pressed. Return a promise and the button shows a spinner until it settles; a rejection is yours to show. */
  onAction?: () => void | Promise<void>;
  /** Beside the main button: a link or a quieter button, such as "Read the guide". */
  secondary?: ReactNode;
  /** An icon in the tile above the title, as an element. Default is a plug. */
  icon?: ReactNode;
  /** The height of the feature this stands in for: a number of pixels or any CSS length. The panel never gets shorter, so the page does not jump when setup finishes. */
  minHeight?: number | string;
  /** The words the panel uses, for translation. */
  labels?: NeedsSetupStateLabels;
}

const DEFAULT_LABELS = {
  heading: "Setup",
  progress: "{done} of {total} done",
  done: "Done",
  next: "Next",
  todo: "Not done yet",
} satisfies Required<NeedsSetupStateLabels>;

const fill = (template: string, values: Record<string, string>) => template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? "");

const isThenable = (value: unknown): value is PromiseLike<unknown> => typeof (value as { then?: unknown } | null)?.then === "function";

/** The round mark in front of a step: a check when done, a ring with a dot for the next one, an empty ring for the rest. */
function Mark({ state }: { state: "done" | "next" | "todo" }) {
  if (state === "done") {
    return (
      <span aria-hidden="true" className="grid size-5 shrink-0 place-items-center rounded-full bg-foreground text-background">
        <IconCheck size={12} strokeWidth={2.5} />
      </span>
    );
  }
  return (
    <span aria-hidden="true" className={cn("grid size-5 shrink-0 place-items-center rounded-full", state === "next" ? "border-2 border-foreground" : "border border-muted-foreground/50")}>
      {state === "next" ? <span className="size-1.5 rounded-full bg-foreground" /> : null}
    </span>
  );
}

/**
 * The stand-in for a feature that needs one step before it works: a dashed
 * panel in the place of the feature, with what is missing as the title, a
 * line on why, an optional list of what is done and what is left, and the
 * action that fixes it. Done steps show a check and the word "Done", the first
 * open step is marked "Next" and carries `aria-current="step"`, and the rest
 * are read out as not done. The panel keeps the height you give it, so the
 * page does not jump when setup finishes and the feature takes its place. The
 * main button runs `onAction`; if that returns a promise it shows a spinner
 * and ignores presses until it settles, without losing focus. It is not an
 * onboarding checklist: use it only where a missing prerequisite blocks one
 * specific thing.
 */
export function NeedsSetupState({ title, description, steps, actionLabel, onAction, secondary, icon, minHeight, labels, className, style, ...props }: NeedsSetupStateProps) {
  const text: Required<NeedsSetupStateLabels> = { ...DEFAULT_LABELS, ...labels };
  const headingId = useId();
  const [busy, setBusy] = useState(false);

  const list = steps ?? [];
  const finished = list.filter((step) => step.done).length;
  const next = list.findIndex((step) => !step.done);
  const progress = fill(text.progress, { done: String(finished), total: String(list.length) });

  async function run() {
    if (busy) return;
    const result = onAction?.();
    if (!isThenable(result)) return;
    setBusy(true);
    try {
      await result;
    } catch {
      // Your app shows its own message for what went wrong; the button just comes back.
    } finally {
      setBusy(false);
    }
  }

  return (
    <div data-slot="needs-setup-state" className={cn("flex", className)} style={{ minHeight, ...style }} {...props}>
      <EmptyState title={title} description={description} icon={icon ?? <IconPlug className="size-6" />} className="w-full justify-center border-foreground/25 px-5 py-10 sm:px-8">
        <div className="grid justify-items-center gap-6">
          {list.length > 0 ? (
            <div className="w-full max-w-sm rounded-xl border border-border bg-card text-left text-card-foreground shadow-xs">
              <div className="flex items-baseline justify-between gap-3 border-b border-border px-4 py-2.5">
                <p id={headingId} className="text-xs leading-4 font-medium tracking-[0.02em] text-muted-foreground uppercase">
                  {text.heading}
                </p>
                <p className="text-xs leading-4 text-muted-foreground tabular-nums" aria-hidden="true">
                  {progress}
                </p>
              </div>
              <ol aria-labelledby={headingId} className="divide-y divide-border">
                {list.map((step, index) => {
                  const state = step.done ? "done" : index === next ? "next" : "todo";
                  return (
                    <li key={`${index}-${step.label}`} aria-current={state === "next" ? "step" : undefined} className="flex items-center gap-3 px-4 py-3">
                      <Mark state={state} />
                      <span className={cn("min-w-0 flex-1 text-sm leading-5", state === "done" ? "text-muted-foreground" : "font-medium text-foreground")}>{step.label}</span>
                      {state === "done" ? (
                        <span className="shrink-0 text-xs leading-5 text-muted-foreground">{text.done}</span>
                      ) : state === "next" ? (
                        <span className="inline-flex h-5 shrink-0 items-center rounded-full border border-border bg-background px-2 text-xs font-medium">{text.next}</span>
                      ) : (
                        <span className="sr-only">{text.todo}</span>
                      )}
                    </li>
                  );
                })}
              </ol>
              {/* In the page before it has anything to say, so a step that is finished is spoken. */}
              <p role="status" className="sr-only">
                {progress}
              </p>
            </div>
          ) : null}

          {actionLabel || secondary ? (
            <div className="flex flex-wrap items-center justify-center gap-2">
              {actionLabel ? (
                // Busy is said with aria-busy and aria-disabled, not with disabled: a disabled button gives up focus, which would leave a keyboard on no control until the request ends.
                <Button type="button" aria-busy={busy || undefined} aria-disabled={busy || undefined} onClick={() => void run()} className="aria-busy:cursor-progress">
                  {busy ? <IconSpinner data-slot="button-spinner" /> : null}
                  {actionLabel}
                </Button>
              ) : null}
              {secondary}
            </div>
          ) : null}
        </div>
      </EmptyState>
    </div>
  );
}
