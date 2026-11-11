"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { RadioGroup as RadioGroupPrimitive } from "radix-ui";

import { IconAlertCircle } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { Checkbox } from "@rhs-ui/primitives/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@rhs-ui/primitives/dialog";
import { Label } from "@rhs-ui/primitives/label";
import { AS_CHILD } from "@rhs-ui/primitives/render-prop";
import { cn } from "@/lib/utils";

export interface ChoiceOption {
  /** What `defaultValue` and `onConfirm` speak. Unique among the options. */
  id: string;
  /** The outcome, named: "This event". It is the name of the option. */
  label: string;
  /** What it does, in a line: "Only this one is removed. The rest of the series stays." It is the option's description. */
  description?: string;
  /** The outcome destroys something. It takes the destructive style only while it is selected, and so does the confirm button. */
  destructive?: boolean;
}

/** The words the dialog says on its own, for another language or your own wording. */
export interface ChoiceDialogLabels {
  /** The heading of the message shown when `onConfirm` fails. Default "That did not work". */
  failed: string;
  /** The text of the failure when `onConfirm` threw something without a message. Default "Nothing was changed. Try again." */
  failedDetail: string;
}

export interface ChoiceDialogProps {
  /** The question: "Delete recurring event". It is the heading and the name of the dialog. */
  title: string;
  /** One line of context under the title. */
  description?: string;
  /** The outcomes to choose between, in order: two to four. */
  options: readonly ChoiceOption[];
  /** The option selected when it opens. Default the first one that is not destructive, so the safe answer is the one already chosen. */
  defaultValue?: string;
  /** Called with the `id` of the chosen option, and whether the box was ticked. Return a promise to show it is working: the dialog is locked until it settles, closes when it resolves, and stays open with the error when it rejects. */
  onConfirm: (id: string, details: { remember: boolean }) => void | Promise<void>;
  /** The text of the confirm button: a string, or a function of the chosen option so it reads "Delete all events". Default the option's label. */
  confirmLabel?: string | ((option: ChoiceOption) => string);
  /** The text of the button that closes without doing anything. Default "Cancel". */
  cancelLabel?: string;
  /** Adds a checkbox ("Do this for all conflicts") and passes its state to `onConfirm`. */
  rememberLabel?: string;
  /** The element that opens it, usually a Button: focus goes back to it on close. */
  trigger?: ReactNode;
  /** Whether it is open, when you control it. */
  open?: boolean;
  /** Whether it starts open, when you do not control it. */
  defaultOpen?: boolean;
  /** Called with the state it asks for. It does not ask to close while `onConfirm` is pending. */
  onOpenChange?: (open: boolean) => void;
  /** The words of the failure message. */
  labels?: Partial<ChoiceDialogLabels>;
  /** Classes for the panel. */
  className?: string;
}

const WORDS: ChoiceDialogLabels = { failed: "That did not work", failedDetail: "Nothing was changed. Try again." };

/**
 * A dialog for questions that have more than two answers: "Delete this event, this and following events, or
 * all events?", "A file with this name exists: replace, keep both or skip?". The options are a radio group,
 * each with a line saying what it does, so the consequence is read before the choice is made; the safest one
 * is already selected, and the arrow keys move between them. An option that destroys something is drawn in
 * the destructive style only while it is selected, and the confirm button repeats the chosen outcome in its
 * own words ("Delete all events"), in the same style. An optional checkbox remembers the answer. While
 * `onConfirm` is pending the whole dialog is locked, Escape and outside clicks included; if it fails, the
 * message appears inside the dialog, which stays open for another try, and focus returns to the control
 * that was pressed. The panel never outgrows the screen: the title and the buttons stay in view and the
 * options scroll between them, so Confirm is reachable on a phone held sideways.
 */
export function ChoiceDialog({ title, description, options, defaultValue, onConfirm, confirmLabel, cancelLabel = "Cancel", rememberLabel, trigger, open, defaultOpen = false, onOpenChange, labels, className }: ChoiceDialogProps) {
  const uid = useId();
  const words = { ...WORDS, ...labels };
  const safest = defaultValue ?? options.find((option) => !option.destructive)?.id ?? options[0]?.id ?? "";
  const [ownOpen, setOwnOpen] = useState(defaultOpen);
  const isOpen = open ?? ownOpen;
  const [selected, setSelected] = useState(safest);
  const [remember, setRemember] = useState(false);
  const [pending, setPending] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  /** The options scroll under the title: the title gets a line then. */
  const [scrolled, setScrolled] = useState(false);
  const alertRef = useRef<HTMLDivElement>(null);
  /** The control that asked for the answer: it is disabled while the request runs, which drops focus to the panel. */
  const origin = useRef<HTMLElement | null>(null);
  const chosen = options.find((option) => option.id === selected);
  const confirmText = chosen ? (typeof confirmLabel === "function" ? confirmLabel(chosen) : (confirmLabel ?? chosen.label)) : "";

  const change = (next: boolean) => {
    if (!next && pending) return;
    if (open === undefined) setOwnOpen(next);
    onOpenChange?.(next);
  };

  // A failed answer: the control that was pressed gets focus back, so another try is one key away, and the message is brought into view when the options scroll.
  useEffect(() => {
    if (!failure) return;
    origin.current?.focus({ preventScroll: true });
    origin.current = null;
    alertRef.current?.scrollIntoView({ block: "nearest" });
  }, [failure]);

  async function confirm(from: HTMLElement | null) {
    if (!chosen || pending) return;
    origin.current = from;
    setPending(true);
    setFailure(null);
    try {
      await onConfirm(chosen.id, { remember });
      origin.current = null;
      setPending(false);
      change(false);
    } catch (reason) {
      setPending(false);
      setFailure(reason instanceof Error && reason.message ? reason.message : words.failedDetail);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={change}>
      {trigger ? <DialogTrigger {...AS_CHILD}>{trigger}</DialogTrigger> : null}
      <DialogContent
        data-slot="choice-dialog"
        showCloseButton={false}
        // Without a description there is nothing for the dialog to be described by; saying so keeps Radix from warning.
        {...(description ? {} : { "aria-describedby": undefined })}
        onEscapeKeyDown={(event) => {
          if (pending) event.preventDefault();
        }}
        onInteractOutside={(event) => {
          if (pending) event.preventDefault();
        }}
        // Whatever was chosen last time is not carried into the next one.
        onCloseAutoFocus={() => {
          setSelected(safest);
          setRemember(false);
          setFailure(null);
          setScrolled(false);
        }}
        // Bounded by the screen, with the title and the buttons as fixed rows: on a phone held sideways only the options scroll, and Confirm stays in reach.
        className={cn("flex max-h-[calc(100dvh-2rem)] flex-col gap-0 p-0 sm:max-w-md", className)}
      >
        <DialogHeader className={cn("shrink-0 border-b border-transparent px-6 pt-6 pb-3 transition-colors duration-150 motion-reduce:transition-none", scrolled && "border-border")}>
          <DialogTitle className="text-lg tracking-[-0.02em]">{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>
        <div
          onScroll={(event) => setScrolled(event.currentTarget.scrollTop > 1)}
          // The first option's focus ring sits above it, so the body keeps a little room at the top. Tab visits the options themselves, so the body needs no tab stop of its own.
          className="relative grid min-h-0 flex-1 content-start gap-4 overflow-y-auto overscroll-contain px-6 pt-1 pb-6"
        >
          <RadioGroupPrimitive.Root
            aria-label={title}
            value={selected}
            disabled={pending}
            onValueChange={setSelected}
            // Radix leaves Enter alone on a radio; in a dialog it is how the answer is given.
            onKeyDown={(event) => {
              if (event.key !== "Enter") return;
              event.preventDefault();
              void confirm(event.target instanceof HTMLElement ? event.target : null);
            }}
            className="grid gap-2"
          >
            {options.map((option, i) => (
              <RadioGroupPrimitive.Item
                key={option.id}
                value={option.id}
                aria-labelledby={`${uid}-label-${i}`}
                aria-describedby={option.description ? `${uid}-line-${i}` : undefined}
                className={cn(
                  "group/choice-option relative flex w-full items-start gap-3 rounded-lg border border-border p-3.5 text-left outline-none",
                  "transition-[border-color,background-color,box-shadow] duration-150 hover:bg-muted/50 motion-reduce:transition-none",
                  "focus-visible:ring-[3px] focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-60",
                  option.destructive
                    ? "data-[state=checked]:border-destructive data-[state=checked]:bg-destructive/5 data-[state=checked]:shadow-[inset_0_0_0_1px_var(--destructive)]"
                    : "data-[state=checked]:border-foreground data-[state=checked]:bg-muted/50 data-[state=checked]:shadow-[inset_0_0_0_1px_var(--foreground)]",
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "mt-0.5 grid size-[18px] shrink-0 place-items-center rounded-full border border-muted-foreground bg-background transition-colors duration-150 motion-reduce:transition-none",
                    option.destructive ? "group-data-[state=checked]/choice-option:border-destructive" : "group-data-[state=checked]/choice-option:border-foreground",
                  )}
                >
                  <RadioGroupPrimitive.Indicator className={cn("size-2 rounded-full", option.destructive ? "bg-destructive" : "bg-foreground")} />
                </span>
                <span className="grid min-w-0 flex-1 gap-0.5">
                  {/* The label stays in the foreground colour: the border, the dot and the tint already say "destructive", and red text on that tint is under AA contrast. */}
                  <span id={`${uid}-label-${i}`} className="text-sm font-medium">
                    {option.label}
                  </span>
                  {option.description ? (
                    <span id={`${uid}-line-${i}`} className="text-sm leading-relaxed text-muted-foreground">
                      {option.description}
                    </span>
                  ) : null}
                </span>
              </RadioGroupPrimitive.Item>
            ))}
          </RadioGroupPrimitive.Root>
          {rememberLabel ? (
            <div className="flex items-center gap-2.5">
              <Checkbox id={`${uid}-remember`} checked={remember} disabled={pending} onCheckedChange={(next) => setRemember(next === true)} />
              <Label htmlFor={`${uid}-remember`} className="font-normal">
                {rememberLabel}
              </Label>
            </div>
          ) : null}
          {failure ? (
            <div ref={alertRef} role="alert" className="flex items-start gap-2.5 rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2.5 text-sm">
              <IconAlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-destructive" />
              <div className="grid min-w-0 gap-0.5">
                <p className="font-medium">{words.failed}</p>
                <p className="text-muted-foreground [overflow-wrap:anywhere]">{failure}</p>
              </div>
            </div>
          ) : null}
        </div>
        <DialogFooter className="shrink-0 border-t border-border px-6 py-4">
          <Button type="button" variant="outline" disabled={pending} onClick={() => change(false)}>
            {cancelLabel}
          </Button>
          <Button type="button" variant={chosen?.destructive ? "destructive" : "default"} loading={pending} disabled={!chosen} onClick={(event) => void confirm(event.currentTarget)}>
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
