"use client";

import { useId, useState, type ReactNode } from "react";

import { IconCheck } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { Input } from "@rhs-ui/primitives/input";
import { Label } from "@rhs-ui/primitives/label";
import { PasswordInput } from "@rhs-ui/primitives/password-input";
import { StrengthMeter, type StrengthScore } from "@rhs-ui/primitives/strength-meter";
import { cn } from "@/lib/utils";

const COMMON = ["password", "qwerty", "letmein", "welcome", "iloveyou", "admin", "123456", "monkey"];

/** A small estimator for the demo. Use zxcvbn or your server's rules: the meter only needs a score from 0 to 4 and a hint. */
function rate(value: string): { score: StrengthScore | null; hint: string } {
  if (!value) return { score: null, hint: "Use a few unrelated words, or a long phrase." };
  const lower = value.toLowerCase();
  if (COMMON.some((word) => lower.includes(word))) return { score: value.length > 14 ? 1 : 0, hint: "Avoid common words and patterns." };
  const pool = (/[a-z]/.test(value) ? 26 : 0) + (/[A-Z]/.test(value) ? 26 : 0) + (/\d/.test(value) ? 10 : 0) + (/[^A-Za-z0-9]/.test(value) ? 32 : 0);
  const effective = Math.min(value.length, new Set(value).size * 2);
  const bits = effective * Math.log2(Math.max(pool, 2));
  let score: StrengthScore = bits < 28 ? 0 : bits < 50 ? 1 : bits < 75 ? 2 : bits < 100 ? 3 : 4;
  if (/^[A-Za-z]+$/.test(value) && value.length < 12) score = Math.min(score, 1) as StrengthScore;
  if (value.length < 8) score = 0;
  const hint =
    value.length < 8
      ? "Make it longer: 12 characters or more."
      : score >= 4
        ? "Nothing to fix. A password manager can remember it."
        : value.length < 12
          ? "Add another word or a number."
          : !/[\d\W_]/.test(value)
            ? "Mix in a number or a symbol."
            : "One more unrelated word makes it strong.";
  return { score, hint };
}

const RULES = [
  { label: "At least 12 characters", test: (value: string) => value.length >= 12 },
  { label: "A number or a symbol", test: (value: string) => /[\d\W_]/.test(value) },
  { label: "Not a common password", test: (value: string) => value.length > 0 && !COMMON.some((word) => value.toLowerCase().includes(word)) },
] as const;

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

function Field(): React.JSX.Element {
  const id = useId();
  const [value, setValue] = useState("harbor-lantern");
  const { score, hint } = rate(value);
  return (
    <form className="grid gap-4 rounded-xl border border-border bg-card p-5 shadow-xs" onSubmit={(event) => event.preventDefault()}>
      <div className="grid gap-1">
        <h2 className="text-sm font-medium tracking-[-0.01em]">Create your Northwind account</h2>
        <p className="text-xs text-muted-foreground">You will use this to sign in on every device.</p>
      </div>
      <div className="grid gap-2">
        <Label htmlFor={`${id}-email`}>Work email</Label>
        <Input id={`${id}-email`} type="email" autoComplete="email" defaultValue="mara@northwind.example" />
      </div>
      <div className="grid gap-2">
        <Label htmlFor={`${id}-password`}>New password</Label>
        <PasswordInput id={`${id}-password`} autoComplete="new-password" value={value} onChange={(event) => setValue(event.target.value)} aria-describedby={`${id}-strength`} />
        <StrengthMeter id={`${id}-strength`} name="Password strength" score={score} hint={hint} className="pt-1" />
      </div>
      <ul aria-label="Password rules" className="grid gap-1.5 border-t border-border pt-4 text-xs">
        {RULES.map((rule) => {
          const met = rule.test(value);
          return (
            <li key={rule.label} className={cn("flex items-center gap-2", met ? "text-foreground" : "text-muted-foreground")}>
              {met ? <IconCheck size={14} strokeWidth={2.5} aria-hidden="true" /> : <span aria-hidden="true" className="mx-px size-3 rounded-full border border-current opacity-50" />}
              {rule.label}
              <span className="sr-only">{met ? ", met" : ", not met yet"}</span>
            </li>
          );
        })}
      </ul>
      <Button type="submit" disabled={(score ?? 0) < 2} className="w-full">
        Create account
      </Button>
    </form>
  );
}

const SAMPLES = ["", "pass1", "sunflower", "sunflower-77", "Sunflower-77", "tulip harbor lantern 3 oak"] as const;

function Levels(): React.JSX.Element {
  return (
    <ul className="grid gap-4 rounded-xl border border-border bg-card p-5 shadow-xs">
      {SAMPLES.map((sample) => {
        const { score, hint } = rate(sample);
        return (
          <li key={sample || "empty"} className="grid gap-2">
            <span className="font-mono text-[0.6875rem] text-muted-foreground">{sample ? `“${sample}”` : "Nothing typed yet"}</span>
            <StrengthMeter name="Password strength" score={score} hint={hint} />
          </li>
        );
      })}
    </ul>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="grid w-full max-w-4xl grid-cols-1 gap-x-8 gap-y-10 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <Example caption="Type to try it: the bar, the word and the hint follow, next to a rules list">
        <Field />
      </Example>
      <Example caption="All the levels, from an empty field to a strong phrase">
        <Levels />
      </Example>
    </div>
  );
}
