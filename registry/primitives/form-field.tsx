"use client";

import { createContext, useContext, useId, type ComponentProps } from "react";
import { Slot } from "radix-ui";

import { Label } from "@rhs-ui/primitives/label";
import { cn } from "@/lib/utils";

interface FieldIds {
  control: string;
  description: string;
  message: string;
  invalid: boolean;
  hasDescription: boolean;
}

const FieldContext = createContext<FieldIds | null>(null);

function useField(part: string): FieldIds {
  const field = useContext(FieldContext);
  if (!field) throw new Error(`${part} must be inside <FormField>`);
  return field;
}

export interface FormFieldProps extends ComponentProps<"div"> {
  /** The error to show; the control is marked invalid while it is set. */
  error?: string | null;
  /** Whether a FormDescription is present, so the control points at it. */
  described?: boolean;
}

/**
 * A label, a control, a hint and an error, wired together the way assistive
 * technology expects: the label names the control, the hint and the error
 * describe it, and an error marks it invalid. Works with any form library:
 * pass the library's error message as `error`.
 */
export function FormField({ error, described = false, className, children, ...props }: FormFieldProps) {
  const id = useId();
  const ids: FieldIds = { control: `${id}-control`, description: `${id}-description`, message: `${id}-message`, invalid: Boolean(error), hasDescription: described };
  return (
    <FieldContext.Provider value={ids}>
      <div data-slot="form-field" data-invalid={ids.invalid || undefined} className={cn("grid gap-2", className)} {...props}>
        {children}
        <p id={ids.message} role="status" className="text-xs font-medium text-destructive empty:hidden">
          {error}
        </p>
      </div>
    </FieldContext.Provider>
  );
}

export function FormLabel({ className, ...props }: ComponentProps<typeof Label>) {
  const field = useField("FormLabel");
  return <Label data-slot="form-label" htmlFor={field.control} className={cn(field.invalid && "text-destructive", className)} {...props} />;
}

/** Wraps the one control (an Input, a SelectTrigger, a Textarea) and gives it the id and the ARIA links. */
export function FormControl(props: ComponentProps<typeof Slot.Root>) {
  const field = useField("FormControl");
  const describedBy = [field.hasDescription ? field.description : null, field.invalid ? field.message : null].filter(Boolean).join(" ") || undefined;
  return <Slot.Root data-slot="form-control" id={field.control} aria-invalid={field.invalid || undefined} aria-describedby={describedBy} {...props} />;
}

export function FormDescription({ className, ...props }: ComponentProps<"p">) {
  const field = useField("FormDescription");
  return <p data-slot="form-description" id={field.description} className={cn("text-xs text-muted-foreground", className)} {...props} />;
}
