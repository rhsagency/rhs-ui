"use client";

import { useEffect, useId, useRef, useState, type ComponentProps, type ReactNode } from "react";

import { Checkbox } from "@rhs-ui/primitives/checkbox";
import { Label } from "@rhs-ui/primitives/label";
import { RadioGroupItem } from "@rhs-ui/primitives/radio-group";
import { Switch } from "@rhs-ui/primitives/switch";
import { cn } from "@/lib/utils";

/** The control that turns the fields on. */
export type ConditionalTrigger = "checkbox" | "switch" | "radio";

/** The two sentences a screen reader hears when the fields appear or go, for translation. */
export interface ConditionalFieldsLabels {
  /** Default "Additional fields shown." */
  shown?: string;
  /** Default "Additional fields hidden." */
  hidden?: string;
}

export interface ConditionalFieldsProps extends Omit<ComponentProps<"div">, "children" | "defaultValue" | "onChange"> {
  /** What turns the fields on. A checkbox (the default) and a radio sit before their text, a switch sits at the far edge, the way a settings row does. */
  trigger?: ConditionalTrigger;
  /** Whether the fields are shown, when you control it. For a radio, pass `value === "this option"`: the group owns the choice, so this is the only way the fields can follow it. */
  checked?: boolean;
  /** Whether the fields are shown to begin with. Not used by a radio. */
  defaultChecked?: boolean;
  /** Called when the person turns the fields on or off. A radio does not call it: listen to the group's `onValueChange`. */
  onCheckedChange?: (checked: boolean) => void;
  /** What the control says: "Billing address is different", "Something else". It also names the group of fields below it. */
  label: ReactNode;
  /** One line that says more. It is read after the label. */
  description?: ReactNode;
  /** The fields. They sit in a fieldset of their own, one gap apart. A ConditionalFields inside them is a nested level. */
  children: ReactNode;
  /** Whether what was typed survives the fields closing and opening again. Default true. With `false` the fields are removed once the panel has closed, so uncontrolled inputs start over. */
  keepValues?: boolean;
  /** The name the control submits under, for a checkbox or a switch. A radio submits under its group's name. */
  name?: string;
  /** What the control submits when it is on (default "on"). For a radio, the option's value in its group. */
  value?: string;
  /** Switches the control and, with it, the fields off. Whatever is shown stays visible. */
  disabled?: boolean;
  /** The words a screen reader hears, for translation. */
  labels?: ConditionalFieldsLabels;
}

const DEFAULT_LABELS = { shown: "Additional fields shown.", hidden: "Additional fields hidden." } satisfies Required<ConditionalFieldsLabels>;

/** How long the panel takes to fold, so `keepValues={false}` removes the fields after they are out of sight and not before. */
const FOLD_MS = 220;

/**
 * A checkbox, a switch or a radio option that reveals its own fields when it
 * is on: "Billing address is different", "Something else, please say". The
 * control says it controls the panel (`aria-controls`, and `aria-expanded` on a
 * checkbox or a switch; a radio may not carry it, so a polite status says that
 * more fields appeared), and the panel opens by animating its height, instantly
 * under reduced motion. Closed, the fields are inert and disabled: Tab skips
 * them, a screen reader does not find them and the form does not send them, so a
 * stale address never goes out with the order. Focus never jumps into the panel
 * by itself, so a keyboard user decides when to enter. Each panel is a fieldset
 * named by the control's label, which is what lets one conditional sit inside
 * another. `keepValues` decides whether typed text survives a close.
 */
export function ConditionalFields({
  trigger = "checkbox",
  checked,
  defaultChecked = false,
  onCheckedChange,
  label,
  description,
  children,
  keepValues = true,
  name,
  value,
  disabled,
  labels,
  className,
  ...props
}: ConditionalFieldsProps) {
  const text = { ...DEFAULT_LABELS, ...labels };
  const base = useId();
  const triggerId = `${base}-trigger`;
  const labelId = `${base}-label`;
  const descriptionId = `${base}-description`;
  const panelId = `${base}-panel`;

  const [own, setOwn] = useState(defaultChecked);
  const open = trigger === "radio" ? Boolean(checked) : (checked ?? own);

  function change(next: boolean) {
    if (checked === undefined) setOwn(next);
    onCheckedChange?.(next);
  }

  // With keepValues={false} the fields stay for the length of the fold and then go, so the exit is never a jump.
  const [lingering, setLingering] = useState(open);
  useEffect(() => {
    if (open) {
      setLingering(true);
      return;
    }
    if (keepValues) return;
    const instant = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = window.setTimeout(() => setLingering(false), instant ? 0 : FOLD_MS);
    return () => window.clearTimeout(timer);
  }, [open, keepValues]);
  const mounted = keepValues || open || lingering;

  // A radio cannot say it is expanded, and a checkbox only says "expanded": both are helped by being told fields appeared.
  const [note, setNote] = useState("");
  const previous = useRef(open);
  useEffect(() => {
    if (previous.current === open) return;
    previous.current = open;
    setNote(open ? text.shown : text.hidden);
  }, [open, text.shown, text.hidden]);

  const shared = {
    id: triggerId,
    disabled,
    "aria-controls": panelId,
    "aria-describedby": description ? descriptionId : undefined,
  };
  const control =
    trigger === "switch" ? (
      <Switch {...shared} name={name} value={value} checked={open} onCheckedChange={change} aria-expanded={open} />
    ) : trigger === "radio" ? (
      <RadioGroupItem {...shared} value={value ?? triggerId} />
    ) : (
      <Checkbox {...shared} name={name} value={value} checked={open} onCheckedChange={(next) => change(next === true)} aria-expanded={open} />
    );

  const end = trigger === "switch";
  const labelClass = cn("w-fit max-w-full cursor-pointer text-sm leading-6 font-medium", disabled && "cursor-not-allowed opacity-50");
  const descriptionClass = "text-sm leading-5 text-pretty text-muted-foreground";

  // A row folds from 0fr to 1fr, which animates the height without measuring anything. The clip is padded and pulled back out, so a focus ring on the outermost field is not cut off.
  const panel = (
    <div className={cn("grid transition-[grid-template-rows,visibility] duration-200 ease-out motion-reduce:transition-none", open ? "visible grid-rows-[1fr]" : "invisible grid-rows-[0fr]")}>
      <div className="-mx-1 -mb-1 min-h-0 overflow-hidden px-1 pb-1">
        <fieldset
          id={panelId}
          data-slot="conditional-fields-panel"
          aria-labelledby={labelId}
          disabled={!open || disabled}
          inert={!open}
          className={cn("m-0 grid min-w-0 grid-cols-1 gap-4 border-0 p-0 pt-3", end && "ml-px border-l border-border pl-4")}
        >
          {mounted ? children : null}
        </fieldset>
      </div>
    </div>
  );

  const status = (
    <span role="status" className="sr-only">
      {note}
    </span>
  );

  if (end) {
    return (
      <div
        data-slot="conditional-fields"
        data-trigger={trigger}
        data-state={open ? "open" : "closed"}
        className={cn("grid grid-cols-[minmax(0,1fr)_auto] gap-x-4", className)}
        {...props}
      >
        <Label id={labelId} htmlFor={triggerId} className={cn(labelClass, "col-start-1 row-start-1")}>
          {label}
        </Label>
        <div className="col-start-2 row-span-2 row-start-1 flex h-6 items-center">{control}</div>
        {description ? (
          <p id={descriptionId} className={cn(descriptionClass, "col-start-1 row-start-2")}>
            {description}
          </p>
        ) : null}
        <div className="col-span-2 row-start-3 min-w-0">{panel}</div>
        {status}
      </div>
    );
  }

  return (
    <div
      data-slot="conditional-fields"
      data-trigger={trigger}
      data-state={open ? "open" : "closed"}
      className={cn("grid grid-cols-[1.125rem_minmax(0,1fr)] gap-x-3", className)}
      {...props}
    >
      <div className="col-start-1 row-start-1 flex h-6 items-center">{control}</div>
      <Label id={labelId} htmlFor={triggerId} className={cn(labelClass, "col-start-2 row-start-1")}>
        {label}
      </Label>
      {/* The rail hangs from the control and runs down the length of what it reveals. It fades with the panel, so a folded row leaves no line beside its description. */}
      <span
        aria-hidden="true"
        className={cn("col-start-1 row-start-2 mt-0.5 w-px justify-self-center bg-border transition-opacity duration-200 motion-reduce:transition-none", open ? "opacity-100" : "opacity-0")}
      />
      <div className="col-start-2 row-start-2 min-w-0">
        {description ? (
          <p id={descriptionId} className={descriptionClass}>
            {description}
          </p>
        ) : null}
        {panel}
      </div>
      {status}
    </div>
  );
}
