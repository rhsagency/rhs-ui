"use client";

import { useId, useRef, useState, type ComponentProps, type KeyboardEvent, type ReactNode } from "react";

import { IconCheck, IconChevronDown, IconEye } from "@rhs-ui/icons";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@rhs-ui/primitives/collapsible";
import { cn } from "@/lib/utils";

/** One choice: what it is called, what it is, and optionally what it looks like. */
export interface PreviewOption {
  /** What the picker reports when this option is chosen. */
  value: string;
  /** The name of the option. */
  label: string;
  /** A line under the name that says more. */
  description?: string;
  /** What the preview pane shows for this option, when you do not draw it with `renderPreview`. It can be sent from a server component. */
  preview?: ReactNode;
  /** The option cannot be chosen, and is skipped by the arrow keys. */
  disabled?: boolean;
}

/** The words the picker says, for another language or your own voice. */
export interface PreviewLabels {
  /** The line under the preview. Given the name of what is previewed and the name of what is chosen, or null when nothing is chosen yet. */
  status: (previewed: string, chosen: string | null) => string;
  /** The button that opens the preview on a narrow screen. */
  show: string;
  /** The same button while the preview is open. */
  hide: string;
}

const DEFAULT_LABELS: PreviewLabels = {
  status: (previewed, chosen) =>
    chosen === null ? `Previewing ${previewed}. Nothing is chosen yet` : previewed === chosen ? `Previewing ${previewed}, your current choice` : `Previewing ${previewed}, current choice: ${chosen}`,
  show: "Show preview",
  hide: "Hide preview",
};

export interface PreviewPickerProps extends Omit<ComponentProps<"div">, "defaultValue" | "onChange" | "children"> {
  /** What is being chosen: "Email layout". It heads the list and names the group for a screen reader. */
  label: string;
  /** Keep the label for screen readers only, when the page already says it. */
  hideLabel?: boolean;
  /** The choices, in order. Each has a `value`, a `label` and optionally a `description`. */
  options: readonly PreviewOption[];
  /** Draws the preview of an option. It runs for the one that is previewed, which is the one pointed at or focused, else the chosen one. */
  renderPreview?: (option: PreviewOption) => ReactNode;
  /** The `value` of the chosen option, or null for none. Use it to control the picker. */
  value?: string | null;
  /** The option to start on, when you do not control the picker. */
  defaultValue?: string | null;
  /** Called with the `value` of the option that was chosen. Pointing at an option or moving to it with the arrow keys only previews it. */
  onValueChange?: (value: string) => void;
  /** The name of the preview pane, for the eye and for a screen reader. Default "Preview". */
  previewLabel?: string;
  /** Classes for the box the preview is drawn in. It keeps one shape for every option, so the layout never jumps; the default is 4 by 3. */
  previewClassName?: string;
  /** The field's name for a plain form submit: the `value` of the chosen option. */
  name?: string;
  /** Turn the whole picker off. */
  disabled?: boolean;
  /** The words of the picker, for another language or your own voice. */
  labels?: Partial<PreviewLabels>;
}

const OPTION =
  "group/option relative flex w-full cursor-pointer items-start gap-3 rounded-xl border border-border p-3.5 text-left outline-none transition-[background-color,border-color] duration-150 " +
  "hover:bg-muted/50 focus-visible:ring-[3px] focus-visible:ring-ring/40 data-[state=checked]:border-foreground data-[state=checked]:bg-muted/40 " +
  "data-[previewed]:border-foreground/40 data-[previewed]:bg-muted/50 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent motion-reduce:transition-none";

/**
 * A two-pane chooser for things people want to see before they commit:
 * templates, email layouts, themes, export formats. The options are a radio
 * group on the left. Pointing at one or moving to it with the arrow keys
 * previews it in the pane on the right without choosing it; a click, Space or
 * Enter chooses. The pane is a labelled region that says which option is
 * previewed and which is chosen ("Previewing Minimal, current choice:
 * Classic"), updates politely, never takes the focus, and keeps one shape for
 * every option so the layout does not jump. In a container narrower than
 * 720px the preview moves under the list, behind a Show preview button.
 */
export function PreviewPicker({
  label,
  hideLabel,
  options,
  renderPreview,
  value,
  defaultValue = null,
  onValueChange,
  previewLabel = "Preview",
  previewClassName,
  name,
  disabled,
  labels: labelOverrides,
  className,
  ...props
}: PreviewPickerProps) {
  const text: PreviewLabels = { ...DEFAULT_LABELS, ...labelOverrides };
  const base = useId();
  const legendId = `${base}-legend`;
  const paneId = `${base}-pane`;
  const list = useRef<HTMLDivElement>(null);
  const [own, setOwn] = useState<string | null>(defaultValue);
  const [pointed, setPointed] = useState<string | null>(null);
  const [focused, setFocused] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const chosen = value === undefined ? own : value;
  const chosenOption = options.find((option) => option.value === chosen) ?? null;
  const enabled = options.filter((option) => !option.disabled && !disabled);
  // The one option in the tab order: the one with the focus, else the chosen one, else the first.
  const stop = enabled.find((option) => option.value === (focused ?? chosenOption?.value))?.value ?? enabled[0]?.value;
  const previewed = options.find((option) => option.value === (pointed ?? focused ?? chosenOption?.value)) ?? options[0] ?? null;

  function choose(option: PreviewOption) {
    if (disabled || option.disabled) return;
    if (value === undefined) setOwn(option.value);
    if (option.value !== chosen) onValueChange?.(option.value);
  }

  /** The arrow keys, Home and End move the focus along the options that can be chosen, and so preview them. Space and Enter choose, as on any button. */
  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const keys = ["ArrowDown", "ArrowRight", "ArrowUp", "ArrowLeft", "Home", "End"];
    if (!keys.includes(event.key)) return;
    const buttons = Array.from(list.current?.querySelectorAll<HTMLButtonElement>("button[role=radio]:not(:disabled)") ?? []);
    if (!buttons.length) return;
    const at = buttons.findIndex((button) => button === document.activeElement);
    const forward = event.key === "ArrowDown" || event.key === "ArrowRight";
    const next = event.key === "Home" ? 0 : event.key === "End" ? buttons.length - 1 : (at + (forward ? 1 : -1) + buttons.length) % buttons.length;
    event.preventDefault();
    buttons[next]?.focus();
  }

  const content = previewed ? (renderPreview ? renderPreview(previewed) : previewed.preview) : null;

  return (
    // The root is the container the layout asks about; the grid inside it is what changes shape.
    <div data-slot="preview-picker" data-disabled={disabled || undefined} className={cn("@container w-full min-w-0", className)} {...props}>
      <div className="grid min-w-0 gap-4 @[45rem]:grid-cols-[minmax(15rem,20rem)_minmax(0,1fr)] @[45rem]:items-start @[45rem]:gap-8">
        <div className="grid min-w-0 content-start gap-3">
          <span id={legendId} className={cn("text-sm font-medium", hideLabel && "sr-only")}>
            {label}
          </span>
          <div
            ref={list}
            role="radiogroup"
            aria-labelledby={legendId}
            aria-disabled={disabled || undefined}
            onKeyDown={onKeyDown}
            onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget)) setFocused(null);
            }}
            className="grid gap-2"
          >
            {options.map((option) => {
              const isChosen = option.value === chosen;
              const isPreviewed = previewed?.value === option.value && !isChosen;
              return (
                <button
                  key={option.value}
                  type="button"
                  role="radio"
                  aria-checked={isChosen}
                  tabIndex={option.value === stop ? 0 : -1}
                  disabled={disabled || option.disabled}
                  data-slot="preview-picker-option"
                  data-state={isChosen ? "checked" : "unchecked"}
                  data-previewed={isPreviewed ? "" : undefined}
                  onClick={() => choose(option)}
                  onFocus={() => setFocused(option.value)}
                  onPointerEnter={(event) => {
                    if (event.pointerType !== "touch") setPointed(option.value);
                  }}
                  onPointerLeave={() => setPointed(null)}
                  className={OPTION}
                >
                  <span
                    aria-hidden="true"
                    className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border border-border text-background transition-[background-color,border-color] duration-150 group-data-[state=checked]/option:border-foreground group-data-[state=checked]/option:bg-foreground motion-reduce:transition-none"
                  >
                    {isChosen ? <IconCheck className="size-3" /> : null}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm leading-5 font-medium">{option.label}</span>
                    {option.description ? <span className="mt-0.5 block text-[0.8125rem] leading-snug text-muted-foreground">{option.description}</span> : null}
                  </span>
                  {isPreviewed ? <IconEye aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-muted-foreground" /> : null}
                </button>
              );
            })}
          </div>
        </div>

        <Collapsible open={open} onOpenChange={setOpen} className="grid min-w-0 gap-3">
          <CollapsibleTrigger
            className={cn(
              "group/preview flex h-10 w-full items-center justify-between gap-2 rounded-lg border border-border bg-background px-3 text-sm font-medium outline-none transition-colors duration-150 @[45rem]:hidden",
              "hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/40 motion-reduce:transition-none",
            )}
          >
            <span className="flex items-center gap-2">
              <IconEye aria-hidden="true" className="size-4 text-muted-foreground" />
              {open ? text.hide : text.show}
            </span>
            <IconChevronDown aria-hidden="true" className="size-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]/preview:rotate-180 motion-reduce:transition-none" />
          </CollapsibleTrigger>
          {/* Always in the page: on a wide screen the pane is simply there, and on a narrow one the button above opens it. */}
          <CollapsibleContent forceMount className="data-[state=closed]:hidden @[45rem]:data-[state=closed]:block motion-safe:data-[state=closed]:animate-none">
            <section role="region" aria-labelledby={`${legendId} ${paneId}`} className="grid min-w-0 gap-3 rounded-xl border border-border bg-card p-3 shadow-xs sm:p-4">
              <span id={paneId} className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <IconEye aria-hidden="true" className="size-3.5" />
                {previewLabel}
              </span>
              <div key={previewed?.value} data-slot="preview-picker-stage" className={cn("relative aspect-[4/3] overflow-hidden rounded-lg border border-border bg-muted/50", previewClassName)}>
                {content}
              </div>
              <p role="status" aria-live="polite" className="min-h-8 text-xs leading-4 text-muted-foreground @[45rem]:min-h-4">
                {previewed ? text.status(previewed.label, chosenOption?.label ?? null) : ""}
              </p>
            </section>
          </CollapsibleContent>
        </Collapsible>
      </div>
      {name ? <input type="hidden" name={name} value={chosen ?? ""} disabled={disabled} /> : null}
    </div>
  );
}
