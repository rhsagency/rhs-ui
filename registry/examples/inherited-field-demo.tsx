"use client";

import { useState, type ReactNode } from "react";

import { InheritedField } from "@rhs-ui/application/inherited-field";
import { NumberInput } from "@rhs-ui/primitives/number-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@rhs-ui/primitives/select";

/** A caption and the example under it. */
function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

const SESSIONS = [
  { days: 7, label: "7 days" },
  { days: 14, label: "14 days" },
  { days: 30, label: "30 days" },
  { days: 90, label: "90 days" },
];

const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

const daysText = (days: number): string => SESSIONS.find((option) => option.days === days)?.label ?? `${days} days`;
const minutesText = (minutes: number): string => `${minutes} min`;

interface SessionControlProps {
  id: string;
  value: number;
  onValueChange: (days: number) => void;
  disabled: boolean;
  "aria-labelledby": string;
  "aria-describedby": string;
  "aria-invalid"?: true;
}

/** The control for a session length: a select of the lengths a workspace allows. */
function SessionSelect({ value, onValueChange, disabled, ...aria }: SessionControlProps): React.JSX.Element {
  return (
    <Select value={String(value)} onValueChange={(next) => onValueChange(Number(next))} disabled={disabled}>
      <SelectTrigger {...aria}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {SESSIONS.map((option) => (
          <SelectItem key={option.days} value={String(option.days)}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/** NumberInput draws its frame on the wrapper, not on the input that is marked invalid, so the wrapper is told to follow it, focused or not. An Input or a Select needs nothing. */
const INVALID_FRAME =
  "has-[input[aria-invalid=true]]:border-destructive has-[input[aria-invalid=true]:focus-visible]:border-destructive has-[input[aria-invalid=true]:focus-visible]:ring-destructive/30";

const card = "grid gap-5 rounded-xl border border-border bg-card p-5 text-card-foreground shadow-xs sm:p-6";

/** The settings of one person, one under the other with a rule between them. */
const list = "grid divide-y divide-border *:py-5 *:first:pt-0 *:last:pb-0";

export default function Demo(): React.JSX.Element {
  const [session, setSession] = useState<number | null>(null);
  const [digest, setDigest] = useState<string | null>("Friday");
  const [meeting, setMeeting] = useState<number | null>(null);
  const [short, setShort] = useState<number | null>(3);

  return (
    <div className="grid w-full max-w-4xl gap-x-10 gap-y-9 md:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] md:items-start">
      <Example caption="Try it: turn Override on, change the value, then Reset. The value you typed comes back when you override again.">
        <div className={card}>
          <div className="grid gap-0.5">
            <h2 className="text-base font-semibold tracking-[-0.02em]">Settings for Mara Keller</h2>
            <p className="text-xs text-muted-foreground">Platform team, Northwind Studio</p>
          </div>

          <div className={list}>
            <InheritedField
              label="Session length"
              description="How long someone stays signed in on a device."
              inherited={{ value: 30, source: "Workspace" }}
              format={daysText}
              value={session}
              onValueChange={setSession}
              control={(field) => <SessionSelect {...field} />}
            />

            <InheritedField
              label="Weekly digest"
              inherited={{ value: "Monday", source: "Platform team" }}
              value={digest}
              onValueChange={setDigest}
              control={({ value, onValueChange, disabled, ...aria }) => (
                <Select value={value} onValueChange={onValueChange} disabled={disabled}>
                  <SelectTrigger {...aria}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {WEEKDAYS.map((day) => (
                      <SelectItem key={day} value={day}>
                        {day}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />

            <InheritedField
              label="Default meeting length"
              inherited={{ value: 25, source: "Platform team" }}
              format={minutesText}
              value={meeting}
              onValueChange={setMeeting}
              control={({ value, onValueChange, disabled, ...aria }) => (
                <NumberInput value={value} onValueChange={onValueChange} disabled={disabled} min={5} max={120} step={5} locale="en-US" format={{ style: "unit", unit: "minute", unitDisplay: "short" }} className="w-full" {...aria} />
              )}
            />
          </div>

          <p className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-t border-border pt-4 text-xs text-muted-foreground">
            <span>Reported</span>
            <code className="font-mono text-[0.6875rem] text-foreground">{JSON.stringify({ session, digest, meeting }).replace(/,/g, ", ")}</code>
          </p>
        </div>
      </Example>

      <div className="grid min-w-0 content-start gap-9">
        <Example caption="With an error: the control is marked invalid and the message is part of what the switch is described by.">
          <div className={card}>
            <InheritedField
              label="Default meeting length"
              inherited={{ value: 25, source: "Platform team" }}
              format={minutesText}
              value={short}
              onValueChange={setShort}
              error={short !== null && short < 5 ? "Pick at least 5 minutes." : undefined}
              control={({ value, onValueChange, disabled, ...aria }) => (
                <NumberInput value={value} onValueChange={onValueChange} disabled={disabled} min={1} max={120} locale="en-US" className={`w-full ${INVALID_FRAME}`} {...aria} />
              )}
            />
          </div>
        </Example>

        <Example caption="Disabled, for a person who may not change it.">
          <div className={card}>
            <InheritedField label="Session length" inherited={{ value: 90, source: "Workspace" }} format={daysText} disabled defaultValue={null} control={(field) => <SessionSelect {...field} />} />
          </div>
        </Example>
      </div>
    </div>
  );
}
