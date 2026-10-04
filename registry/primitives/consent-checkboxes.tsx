import { useId, type ReactNode } from "react";

import { Checkbox } from "@rhs-ui/primitives/checkbox";
import { cn } from "@/lib/utils";

export interface ConsentItem {
  id: string;
  /** The consent in plain words, with links to the documents. */
  label: ReactNode;
  /** Required consents block submission until ticked; optional ones never start ticked. */
  required?: boolean;
}

export interface ConsentCheckboxesProps {
  items: readonly ConsentItem[];
  value: readonly string[];
  onValueChange: (value: string[]) => void;
  /** Show the missing required ones as errors (after a submit attempt). */
  showErrors?: boolean;
  className?: string;
}

/** True when every required consent is given. */
export function consentComplete(items: readonly ConsentItem[], value: readonly string[]): boolean {
  return items.every((item) => !item.required || value.includes(item.id));
}

/**
 * The consent lines under a sign-up or checkout form, done the way the GDPR
 * expects: one checkbox per purpose, required ones marked as required, the
 * optional ones (newsletter, research) never ticked for people, and a
 * missing required consent explained on its own line after a submit.
 */
export function ConsentCheckboxes({ items, value, onValueChange, showErrors = false, className }: ConsentCheckboxesProps) {
  const id = useId();
  const toggle = (item: string, on: boolean) => onValueChange(on ? [...value, item] : value.filter((v) => v !== item));
  return (
    <fieldset data-slot="consent-checkboxes" className={cn("grid gap-3", className)}>
      <legend className="sr-only">Consents</legend>
      {items.map((item) => {
        const missing = showErrors && item.required && !value.includes(item.id);
        return (
          <div key={item.id} className="grid gap-1">
            <div className="flex items-start gap-2.5">
              <Checkbox id={`${id}-${item.id}`} checked={value.includes(item.id)} onCheckedChange={(on) => toggle(item.id, on === true)} aria-required={item.required || undefined} aria-invalid={missing || undefined} aria-describedby={missing ? `${id}-${item.id}-error` : undefined} className="mt-0.5" />
              <label htmlFor={`${id}-${item.id}`} className="text-sm leading-snug [&_a]:underline [&_a]:underline-offset-4">
                {item.label}
                {item.required ? <span className="text-muted-foreground"> (required)</span> : null}
              </label>
            </div>
            {missing ? <p id={`${id}-${item.id}-error`} className="pl-7 text-xs text-destructive">Please tick this to continue.</p> : null}
          </div>
        );
      })}
    </fieldset>
  );
}
