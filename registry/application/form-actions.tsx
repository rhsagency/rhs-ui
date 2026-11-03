"use client";

import { useEffect, useId, useLayoutEffect, useRef, useSyncExternalStore, type ComponentProps, type FocusEvent, type ReactNode } from "react";

import { Button } from "@rhs-ui/primitives/button";
import { Kbd, KbdGroup } from "@rhs-ui/primitives/kbd";
import { cn } from "@/lib/utils";

/** The main button of the row: what it says and what it does. */
export interface FormActionsPrimary {
  /** What the button says: "Save changes", "Create project". Keep it a verb. */
  label: string;
  /** Called when the button is pressed. With `type="button"` it is also what Command or Control plus Enter runs. */
  onClick?: () => void;
  /** `submit` (the default) submits the form around the row, so native validation and `onSubmit` run as usual. `button` only calls `onClick`. */
  type?: "submit" | "button";
  /** Switches the button off, for example while the form has nothing to save. */
  disabled?: boolean;
}

/** The quiet button next to it, usually Cancel. It never submits. */
export interface FormActionsSecondary {
  /** What the button says. */
  label: string;
  /** Called when the button is pressed. */
  onClick?: () => void;
  /** Switches the button off. */
  disabled?: boolean;
}

/** The words the row says, for translation. `{key}` is filled in. */
export interface FormActionsLabels {
  /** Said to screen readers while `pending`. Default "Saving changes". */
  pending?: string;
  /** What a screen reader hears about the shortcut. Default "Press {key} and Enter to submit." */
  shortcut?: string;
  /** The name of the first key on a Mac, for a screen reader. Default "Command". */
  command?: string;
  /** The name of the first key elsewhere, for a screen reader. Default "Control". */
  control?: string;
}

export interface FormActionsProps extends Omit<ComponentProps<"div">, "ref" | "children"> {
  /** The main action. It is last in the DOM, so Tab finishes the form on it. */
  primary: FormActionsPrimary;
  /** The quiet action beside it, usually Cancel. */
  secondary?: FormActionsSecondary;
  /** A slot at the far start for an action that does something else: Delete project, Discard draft. It is switched off while `pending`, like the buttons. */
  start?: ReactNode;
  /** A quiet line such as "Unsaved changes". It is a polite live region, so a change is said once. */
  hint?: ReactNode;
  /** The form is being sent: every button is switched off together, the primary shows a spinner and keeps its label, and the row is busy until it ends. */
  pending?: boolean;
  /** Where the buttons sit once there is room for a row: at the `end` (the default) or at the `start`. */
  align?: "start" | "end";
  /** Pin the row to the bottom of its scroll container, with a hairline above it and room for the phone's home bar. */
  sticky?: boolean;
  /** Command or Control plus Enter presses the primary from anywhere in the form: `on` (the default), `hint` to also show the keys on the button, or `off`. */
  shortcut?: "on" | "hint" | "off";
  /** The words the row says, for translation. */
  labels?: FormActionsLabels;
}

const DEFAULT_LABELS = {
  pending: "Saving changes",
  shortcut: "Press {key} and Enter to submit.",
  command: "Command",
  control: "Control",
} satisfies Required<FormActionsLabels>;

const fill = (template: string, values: Record<string, string>) => template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? "");

const subscribeNever = () => () => undefined;

/**
 * The row of buttons that ends a form, in the order people expect: an action
 * of another kind at the start (Delete), then Cancel, then the primary last,
 * in the DOM too, so Tab finishes on it. While `pending` every button is
 * switched off together (a double submit cannot happen), the primary shows a
 * spinner and keeps its label, the row is `aria-busy`, and a screen reader is
 * told once. Disabling a focused button takes the focus away, so the row
 * hands it back to the primary when the wait ends. Command or Control plus
 * Enter presses the primary from anywhere inside the form (even in a
 * textarea), `shortcut="hint"` shows the keys on the button. `sticky` pins the
 * row to the bottom of its scroll container. Under 480px (measured on the row,
 * so it also works in a dialog or a sheet) the buttons stack at full width with
 * the primary on top: that is a visual order, the Tab order stays Cancel and
 * then the primary. From 480px up the parts wrap rather than squeeze: the hint
 * keeps the width of its words, and what does not fit goes to a line of its own.
 */
export function FormActions({ primary, secondary, start, hint, pending = false, align = "end", sticky = false, shortcut = "on", labels, className, onFocus, onBlur, ...props }: FormActionsProps) {
  const text: Required<FormActionsLabels> = { ...DEFAULT_LABELS, ...labels };
  const root = useRef<HTMLDivElement>(null);
  const primaryButton = useRef<HTMLButtonElement>(null);
  const shortcutId = useId();
  // The first key of the shortcut is known only in the browser; the server says Control.
  const platform = useSyncExternalStore(
    subscribeNever,
    () => (/Mac|iPhone|iPad|iPod/i.test(navigator.userAgent) ? "command" : "control"),
    () => "control",
  );
  const modifier = platform === "command" ? "⌘" : "Ctrl";

  // The latest props, read by the key handler without re-attaching it on every render.
  const latest = useRef({ pending, disabled: primary.disabled, shortcut });
  latest.current = { pending, disabled: primary.disabled, shortcut };

  useEffect(() => {
    const node = root.current;
    // The form around the row, or its parent when it is not in a form.
    const scope: HTMLElement | null = node?.closest("form") ?? node?.parentElement ?? null;
    if (!scope) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Enter" || !(event.metaKey || event.ctrlKey) || event.shiftKey || event.altKey || event.repeat || event.isComposing || event.defaultPrevented) return;
      const state = latest.current;
      if (state.shortcut === "off" || state.pending || state.disabled) return;
      event.preventDefault();
      // A click, not requestSubmit: the button runs its own onClick and the form validates and submits with it as the submitter.
      primaryButton.current?.click();
    }
    scope.addEventListener("keydown", onKeyDown);
    return () => scope.removeEventListener("keydown", onKeyDown);
  }, []);

  // A button that is switched off gives up the focus, and by the time anything can look it is already gone. So where the focus is is kept as it moves, and a blur that comes from a control being switched off is not a person moving away. When the wait ends the focus goes back to the primary.
  const focusInside = useRef(false);
  const hadFocus = useRef(false);
  const wasPending = useRef(false);
  useLayoutEffect(() => {
    if (pending && !wasPending.current) hadFocus.current = focusInside.current;
    if (!pending && wasPending.current && hadFocus.current) {
      hadFocus.current = false;
      const active = document.activeElement;
      if (!active || active === document.body || root.current?.contains(active)) primaryButton.current?.focus({ preventScroll: true });
    }
    wasPending.current = pending;
  }, [pending]);

  function trackFocus(event: FocusEvent<HTMLDivElement>) {
    onFocus?.(event);
    focusInside.current = true;
  }

  function trackBlur(event: FocusEvent<HTMLDivElement>) {
    onBlur?.(event);
    if ((event.target as HTMLElement).matches(":disabled")) return;
    focusInside.current = Boolean(event.relatedTarget && root.current?.contains(event.relatedTarget as Node));
  }

  return (
    <div
      ref={root}
      data-slot="form-actions"
      data-align={align}
      data-sticky={sticky || undefined}
      data-pending={pending || undefined}
      aria-busy={pending || undefined}
      className={cn("@container w-full", sticky && "sticky bottom-0 z-10 border-t border-border bg-background px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]", className)}
      {...props}
      onFocus={trackFocus}
      onBlur={trackBlur}
    >
      {/* In a row the parts wrap rather than squeeze: a hint keeps the width of its words, and what does not fit goes to a line of its own. */}
      <div className="flex flex-col gap-3 @min-[30rem]:flex-row @min-[30rem]:flex-wrap @min-[30rem]:items-center @min-[30rem]:gap-x-4 @min-[30rem]:gap-y-3">
        {start ? (
          // A fieldset switches off whatever the slot holds, natively. It has no role of its own here.
          <fieldset role="none" data-slot="form-actions-start" disabled={pending} className="order-3 m-0 min-w-0 border-0 p-0 @min-[30rem]:order-1 [&>button]:w-full @min-[30rem]:[&>button]:w-auto">
            {start}
          </fieldset>
        ) : null}

        <p data-slot="form-actions-hint" aria-live="polite" className={cn("order-1 min-w-0 text-xs leading-5 text-muted-foreground empty:sr-only @min-[30rem]:flex-auto", align === "start" ? "@min-[30rem]:order-3" : "@min-[30rem]:order-2")}>
          {hint}
        </p>

        {/* Primary last in the DOM. On a phone the column is reversed, so it is the top button. */}
        <div data-slot="form-actions-buttons" className={cn("order-2 flex flex-col-reverse gap-2 @min-[30rem]:flex-row @min-[30rem]:items-center", align === "start" ? "@min-[30rem]:order-2" : "@min-[30rem]:order-3 @min-[30rem]:ml-auto")}>
          {secondary ? (
            <Button type="button" variant="outline" onClick={secondary.onClick} disabled={pending || secondary.disabled} className="w-full @min-[30rem]:w-auto">
              {secondary.label}
            </Button>
          ) : null}
          <Button
            ref={primaryButton}
            type={primary.type ?? "submit"}
            onClick={primary.onClick}
            loading={pending}
            disabled={primary.disabled}
            aria-keyshortcuts={shortcut === "off" ? undefined : "Control+Enter Meta+Enter"}
            aria-describedby={shortcut === "off" ? undefined : shortcutId}
            className="w-full @min-[30rem]:w-auto"
          >
            {primary.label}
            {shortcut === "hint" ? (
              <KbdGroup aria-hidden="true" className="hidden gap-0.5 @min-[30rem]:inline-flex [@media(pointer:coarse)]:hidden">
                <Kbd className="border-primary-foreground/25 bg-primary-foreground/10 text-primary-foreground/85">{modifier}</Kbd>
                <Kbd className="border-primary-foreground/25 bg-primary-foreground/10 text-primary-foreground/85">↵</Kbd>
              </KbdGroup>
            ) : null}
          </Button>
        </div>
      </div>

      {shortcut !== "off" ? (
        <span id={shortcutId} className="sr-only">
          {fill(text.shortcut, { key: platform === "command" ? text.command : text.control })}
        </span>
      ) : null}
      <span role="status" className="sr-only">
        {pending ? text.pending : ""}
      </span>
    </div>
  );
}
