"use client";

import { useId, useRef, useState, type ComponentProps, type ReactNode } from "react";

import { IconLink, IconRotateCcw } from "@rhs-ui/icons";
import { DEFAULT_LABELS, around, type InheritedFieldLabels } from "@rhs-ui/application/inherited-field/labels";
import { Button } from "@rhs-ui/primitives/button";
import { Label } from "@rhs-ui/primitives/label";
import { Switch } from "@rhs-ui/primitives/switch";
import { cn } from "@/lib/utils";

export type { InheritedFieldLabels } from "@rhs-ui/application/inherited-field/labels";

/** What a setting inherits: the parent's value, and the name of the parent it comes from. */
export interface InheritedSource<T> {
  value: T;
  /** The parent, as people know it: "Workspace", "Platform team". */
  source: string;
}

/** What the field hands to your control while it is overridden: spread it onto the input. */
export interface InheritedControlProps<T> {
  /** Put this on the control, so the label points at it. */
  id: string;
  /** The value being overridden. It starts as the inherited value, or the one the person had before. */
  value: T;
  onValueChange: (value: T) => void;
  disabled: boolean;
  /** The field's label names the control. */
  "aria-labelledby": string;
  /** The line that says which parent the value overrides, and the error when there is one. */
  "aria-describedby": string;
  "aria-invalid"?: true;
}

export interface InheritedFieldProps<T> extends Omit<ComponentProps<"div">, "defaultValue" | "onChange" | "children"> {
  /** The name of the setting: "Session length". It names the whole field for a screen reader. */
  label: ReactNode;
  /** What the parent says, and who the parent is. */
  inherited: InheritedSource<T>;
  /** The person's own value when you control the field, or `null` while it follows the parent. */
  value?: T | null;
  /** The value to begin with when the field keeps it itself. `null`, the default, is inherited. */
  defaultValue?: T | null;
  /** Called with the new value, or `null` when the field goes back to the parent: a form can send that as no value. */
  onValueChange?: (value: T | null) => void;
  /** The field to show while the setting is overridden. It is given the value and the ids it needs; nothing is rendered for it while the value is inherited, so a form does not send it. */
  control: (props: InheritedControlProps<T>) => ReactNode;
  /** Writes a value in words, for the inherited value and the parent's value next to an override: `(days) => `${days} days``. Default `String`. */
  format?: (value: T) => ReactNode;
  /** Whether two values are the same, for values that are not compared by identity (an object, an array). It decides whether a value is worth keeping when the field goes back to inherited. Default `Object.is`. */
  equals?: (a: T, b: T) => boolean;
  /** A line under the label that says what the setting does. */
  description?: ReactNode;
  /** An error for the setting; the control is marked invalid while it is set. */
  error?: string;
  /** Turn the whole field off. */
  disabled?: boolean;
  /** The words the field says, for translation. */
  labels?: InheritedFieldLabels;
}

/**
 * A setting that follows its parent until a person overrides it: a team
 * inherits from the workspace, a person from the team. While it is inherited
 * the parent's value is shown in muted text and named ("Inherited from
 * Workspace"); the Override switch brings in your control with the inherited
 * value as its starting point, and Reset (or the switch) goes back. The value
 * a person typed is remembered until the form is saved, so turning Override
 * back on does not lose it. The field reports `null` for inherited, which a
 * form can send as no value, and the switch, the control and the line that
 * names the parent are tied together, so a screen reader hears "Session length,
 * inherited from Workspace, 30 days".
 */
export function InheritedField<T>({ label, inherited, value, defaultValue = null, onValueChange, control, format, equals, description, error, disabled = false, labels, className, ...props }: InheritedFieldProps<T>) {
  const text = { ...DEFAULT_LABELS, ...labels };
  const base = useId();
  const ids = {
    label: `${base}-label`,
    override: `${base}-override`,
    toggle: `${base}-toggle`,
    control: `${base}-control`,
    status: `${base}-status`,
    parent: `${base}-parent`,
    hint: `${base}-hint`,
    error: `${base}-error`,
  };
  const [own, setOwn] = useState<T | null>(defaultValue);
  // The value a person had before they went back to inherited: it comes back when they override again.
  const [kept, setKept] = useState<{ value: T } | null>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  const current = value === undefined ? own : value;
  const overriding = current !== null;
  const show = format ?? ((item: T): ReactNode => String(item));
  const [before, after] = around(text.inheritedFrom, "source");
  const [parentBefore, parentAfter] = around(text.parentValue, "source");

  function write(next: T | null) {
    if (value === undefined) setOwn(next);
    onValueChange?.(next);
  }

  function override() {
    write(kept ? kept.value : inherited.value);
  }

  function reset() {
    // A value is only worth keeping when it is the person's own: the inherited one comes back by itself, so a switch turned on and straight off again keeps nothing and promises nothing.
    if (current !== null && !(equals ? equals(current, inherited.value) : Object.is(current, inherited.value))) setKept({ value: current });
    else setKept(null);
    write(null);
  }

  // The parent's value is part of what the switch and the control are described by; while overridden it is in the line that names the parent.
  const describedBy = [description ? ids.hint : null, ids.status, overriding ? null : ids.parent, error ? ids.error : null].filter(Boolean).join(" ");

  return (
    <div
      data-slot="inherited-field"
      data-state={overriding ? "overridden" : "inherited"}
      data-disabled={disabled || undefined}
      role="group"
      aria-labelledby={ids.label}
      className={cn("grid min-w-0 gap-2", className)}
      {...props}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="grid min-w-0 gap-1">
          <Label id={ids.label} htmlFor={overriding ? ids.control : undefined} className="leading-5">
            {label}
          </Label>
          {description ? (
            <p id={ids.hint} className="text-xs leading-5 text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-2.5">
          <Label id={ids.override} htmlFor={ids.toggle} className={cn("text-xs font-normal text-muted-foreground", disabled && "opacity-70")}>
            {text.override}
          </Label>
          <Switch
            ref={toggle}
            id={ids.toggle}
            checked={overriding}
            disabled={disabled}
            onCheckedChange={(on) => (on ? override() : reset())}
            aria-labelledby={`${ids.override} ${ids.label}`}
            aria-describedby={describedBy}
          />
        </div>
      </div>

      {overriding ? (
        control({
          id: ids.control,
          value: current,
          onValueChange: (next) => write(next),
          disabled,
          "aria-labelledby": ids.label,
          "aria-describedby": describedBy,
          "aria-invalid": error ? true : undefined,
        })
      ) : (
        <div
          id={ids.parent}
          data-slot="inherited-field-value"
          className="flex h-9 min-w-0 items-center rounded-md border border-dashed border-input bg-muted/40 px-3 text-sm text-muted-foreground"
        >
          <span className="min-w-0 truncate">{show(inherited.value)}</span>
        </div>
      )}

      {overriding ? (
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
          <p id={ids.status} className="min-w-0 text-xs leading-5 text-muted-foreground">
            {parentBefore}
            <span className="font-medium text-foreground">{inherited.source}</span>
            {parentAfter} <span className="font-medium text-foreground tabular-nums">{show(inherited.value)}</span>
          </p>
          <Button
            type="button"
            variant="link"
            size="sm"
            disabled={disabled}
            onClick={() => {
              reset();
              // The button goes away with the override: the switch, which says "off" and what is inherited, takes the focus.
              toggle.current?.focus();
            }}
            className="h-7 gap-1.5 px-0 text-xs text-muted-foreground hover:text-foreground"
          >
            <IconRotateCcw aria-hidden="true" />
            {text.reset}
          </Button>
        </div>
      ) : (
        <div className="grid gap-1">
          <p id={ids.status} className="flex items-center gap-1.5 text-xs leading-5 text-muted-foreground">
            <IconLink aria-hidden="true" className="size-3.5 shrink-0" />
            <span>
              {before}
              <span className="font-medium text-foreground">{inherited.source}</span>
              {after}
              <span className="sr-only">,</span>
            </span>
          </p>
          {kept && !disabled ? <p className="text-xs leading-5 text-muted-foreground">{text.kept}</p> : null}
        </div>
      )}

      {error ? (
        <p id={ids.error} role="status" className="text-xs font-medium text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
