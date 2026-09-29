"use client";

import { useId, useState, type ComponentProps } from "react";

import { IconCheck, IconEye, IconEyeOff } from "@rhs-ui/icons";
import { cn } from "@/lib/utils";

export interface PasswordRule {
  label: string;
  test: (value: string) => boolean;
}

/** The rules shown under a new password when none are passed: length first, because length matters most. */
export const DEFAULT_PASSWORD_RULES: readonly PasswordRule[] = [
  { label: "At least 12 characters", test: (value) => value.length >= 12 },
  { label: "Upper and lower case", test: (value) => /[a-z]/.test(value) && /[A-Z]/.test(value) },
  { label: "A number or a symbol", test: (value) => /[\d\W_]/.test(value) },
];

export interface PasswordInputProps extends Omit<ComponentProps<"input">, "type"> {
  /** Show the rules and a strength bar under the field, for choosing a new password. */
  rules?: readonly PasswordRule[] | boolean;
}

/**
 * A password field with a show and hide toggle, and for a new password the
 * rules it has to meet, ticked off as they are met. Set autoComplete to
 * "current-password" or "new-password" so password managers help.
 */
export function PasswordInput({ rules = false, className, onChange, value, defaultValue, ...props }: PasswordInputProps) {
  const id = useId();
  const [visible, setVisible] = useState(false);
  const [own, setOwn] = useState(String(defaultValue ?? ""));
  const current = value === undefined ? own : String(value);
  const list = rules === true ? DEFAULT_PASSWORD_RULES : rules || [];
  const met = list.filter((rule) => rule.test(current)).length;
  return (
    <div data-slot="password-input" className={cn("grid w-full gap-2", className)}>
      <div className="relative">
        <input
          type={visible ? "text" : "password"}
          value={value}
          defaultValue={value === undefined ? defaultValue : undefined}
          onChange={(event) => {
            setOwn(event.target.value);
            onChange?.(event);
          }}
          aria-describedby={list.length ? `${id}-rules` : undefined}
          className="flex h-9 w-full min-w-0 rounded-md border border-input bg-background py-1 pr-10 pl-3 text-sm shadow-xs transition-[border-color,box-shadow] duration-150 outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40 aria-invalid:border-destructive"
          {...props}
        />
        <button
          type="button"
          aria-label="Show password"
          aria-pressed={visible}
          onClick={() => setVisible((shown) => !shown)}
          className="absolute inset-y-0 right-0 flex w-10 items-center justify-center rounded-r-md text-muted-foreground outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40"
        >
          {visible ? <IconEyeOff size={16} /> : <IconEye size={16} />}
        </button>
      </div>
      {list.length ? (
        <div id={`${id}-rules`} className="grid gap-2">
          <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${list.length}, minmax(0, 1fr))` }} aria-hidden="true">
            {list.map((rule, index) => (
              <span key={rule.label} className={cn("h-1 rounded-full transition-colors duration-200", index < met ? "bg-foreground" : "bg-muted")} />
            ))}
          </div>
          <ul className="grid gap-1 text-xs">
            {list.map((rule) => {
              const ok = rule.test(current);
              return (
                <li key={rule.label} className={cn("flex items-center gap-2", ok ? "text-foreground" : "text-muted-foreground")}>
                  <IconCheck size={12} className={ok ? "opacity-100" : "opacity-25"} />
                  {rule.label}
                  <span className="sr-only">{ok ? ", met" : ", not met yet"}</span>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
