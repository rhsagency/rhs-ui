"use client";

import { useId, useState, type ComponentProps } from "react";

import { Textarea } from "@rhs-ui/primitives/textarea";
import { cn } from "@/lib/utils";

export interface TextareaCounterProps extends Omit<ComponentProps<"textarea">, "maxLength"> {
  /** The limit the counter counts down to. */
  limit: number;
  /** Let people type past the limit and show it as an error, instead of stopping them. */
  soft?: boolean;
}

/**
 * A textarea that says how much room is left, quietly until the last tenth,
 * then in words. Screen readers hear the count only when it matters, not on
 * every keystroke.
 */
export function TextareaCounter({ limit, soft = false, className, onChange, defaultValue, value, ...props }: TextareaCounterProps) {
  const id = useId();
  const [length, setLength] = useState(String(value ?? defaultValue ?? "").length);
  const left = limit - length;
  const near = left <= Math.max(10, Math.round(limit * 0.1));
  return (
    <div data-slot="textarea-counter" className="grid gap-1.5">
      <Textarea
        {...props}
        value={value}
        defaultValue={defaultValue}
        maxLength={soft ? undefined : limit}
        aria-invalid={left < 0 || undefined}
        aria-describedby={`${id}-count`}
        onChange={(event) => { setLength(event.target.value.length); onChange?.(event); }}
        className={className}
      />
      <p id={`${id}-count`} aria-live={near ? "polite" : "off"} className={cn("text-right text-xs tabular-nums", left < 0 ? "text-destructive" : near ? "text-foreground" : "text-muted-foreground")}>
        {left < 0 ? `${-left} characters over the limit` : `${left} characters left`}
      </p>
    </div>
  );
}
