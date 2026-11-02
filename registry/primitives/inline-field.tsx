"use client";

import { isValidElement, useId, type ComponentProps, type ReactElement, type ReactNode } from "react";
import { Slot } from "radix-ui";

import { IconAlertCircle } from "@rhs-ui/icons";
import { cn } from "@/lib/utils";

export interface InlineFieldProps extends Omit<ComponentProps<"div">, "children"> {
  /** What the control is for. It may hold links, to the terms or the privacy policy: following one never toggles the control. */
  label: ReactNode;
  /** A line under the label that says more. It is read after the label. */
  description?: ReactNode;
  /** The error to show under the field; the control is marked invalid while it is set. It is read after the description. */
  error?: ReactNode;
  /** Mark the control required: a star after the label, `required` on the control. */
  required?: boolean;
  /** Turn the control off and dim it and its label. The description keeps its full strength, because that is where the reason a row is off belongs. Do not set `disabled` on the control as well. */
  disabled?: boolean;
  /** "start" puts the control before the text, the way a checkbox or a radio reads. "end" pushes it to the far edge, the way a switch in a settings row sits. Default "start". */
  placement?: "start" | "end";
  /** The one control: a Checkbox, a Switch or a RadioGroupItem. It gets the id, `aria-describedby`, `aria-invalid`, `required` and `disabled`. */
  children: ReactElement;
}

/**
 * The sibling of Form Field for a control whose label sits beside it: a checkbox, a switch or a radio with
 * its text, a line that says more and a line for the error. The label, the description and the error are
 * joined to the control with generated ids and read in that order. The whole row is the click target, at
 * least 44px high on a touch screen, the focus ring stays on the control and not on the row, and a link in
 * the label (to the terms, to the privacy policy) opens as a link without toggling anything. An invalid
 * control gets the same destructive outline whichever of the three it is, and a disabled one dims the same way
 * (the control and its label; the description stays readable, for the reason a row is off).
 */
export function InlineField({ label, description, error, required, disabled, placement = "start", className, children, ...props }: InlineFieldProps) {
  const base = useId();
  const own = isValidElement<{ id?: string; "aria-describedby"?: string }>(children) ? children.props : undefined;
  const controlId = own?.id ?? `${base}-control`;
  const descriptionId = `${base}-description`;
  const messageId = `${base}-message`;
  const invalid = Boolean(error);
  const describedBy = [own?.["aria-describedby"], description ? descriptionId : null, invalid ? messageId : null].filter(Boolean).join(" ") || undefined;
  const end = placement === "end";
  // What the control is given. `required` and `disabled` belong to the controls (Checkbox, Switch, RadioGroupItem) and not to every HTML element, so the set is typed as what Slot takes.
  const control = {
    id: controlId,
    "aria-describedby": describedBy,
    "aria-invalid": invalid || undefined,
    required: required || undefined,
    disabled: disabled || undefined,
    className: cn("group-hover/inline:enabled:border-foreground", invalid && "aria-invalid:border-destructive! aria-invalid:ring-[3px] aria-invalid:ring-destructive/25"),
  } as ComponentProps<typeof Slot.Root>;

  return (
    <div
      data-slot="inline-field"
      data-placement={placement}
      data-invalid={invalid || undefined}
      data-disabled={disabled || undefined}
      aria-disabled={disabled || undefined}
      className={cn("group/inline relative flex min-h-9 items-start gap-3 py-1.5 pointer-coarse:min-h-11", className)}
      {...props}
    >
      <div className={cn("relative z-10 flex h-6 shrink-0 items-center", end && "order-2")}>
        <Slot.Root {...control}>{children}</Slot.Root>
      </div>
      <div className={cn("grid min-w-0 flex-1 gap-0.5", end && "order-1")}>
        {/* The label's ::after covers the whole row, so any part of it toggles the control. The control and any link inside the text lift themselves above that cover, so a pointer meets them directly. */}
        <label
          htmlFor={controlId}
          className={cn(
            "w-fit max-w-full cursor-pointer text-sm leading-6 font-medium select-none after:absolute after:inset-0 after:content-['']",
            "group-data-[disabled]/inline:cursor-not-allowed group-data-[disabled]/inline:opacity-50",
            "[&_a]:relative [&_a]:z-10 [&_a]:underline [&_a]:decoration-muted-foreground/50 [&_a]:underline-offset-4 [&_a]:transition-colors hover:[&_a]:decoration-foreground",
          )}
        >
          {label}
          {required ? (
            <span aria-hidden="true" className="ml-1 font-normal text-muted-foreground">
              *
            </span>
          ) : null}
        </label>
        {description ? (
          <p
            id={descriptionId}
            className="text-sm leading-5 text-muted-foreground [&_a]:relative [&_a]:z-10 [&_a]:underline [&_a]:decoration-muted-foreground/50 [&_a]:underline-offset-4 hover:[&_a]:decoration-foreground"
          >
            {description}
          </p>
        ) : null}
        <p id={messageId} role="status" className="text-sm leading-5 font-medium text-destructive empty:hidden">
          {invalid ? (
            <span className="flex items-start gap-1.5">
              <IconAlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
              <span>{error}</span>
            </span>
          ) : null}
        </p>
      </div>
    </div>
  );
}
