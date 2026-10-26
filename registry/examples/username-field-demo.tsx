"use client";

import { useId, useState, type ReactNode } from "react";

import { Button } from "@rhs-ui/primitives/button";
import { Label } from "@rhs-ui/primitives/label";
import { UsernameField, type UsernameCheckResult, type UsernameFieldProps, type UsernameStatus } from "@rhs-ui/primitives/username-field";
import { RESERVED_USERNAMES } from "@rhs-ui/primitives/username-field/usernames";

const TAKEN = new Set(["rick", "marit", "lena", "northwind", "halcyon"]);

/** A pretend server: it answers after `latency` ms, and stops when the field aborts the question. */
function ask(name: string, latency: number, signal: AbortSignal): Promise<UsernameCheckResult> {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => resolve(TAKEN.has(name) ? { available: false, suggestions: [`${name}_nw`, `${name}.studio`, `${name}2026`] } : true), latency);
    signal.addEventListener("abort", () => {
      window.clearTimeout(timer);
      reject(new DOMException("Aborted", "AbortError"));
    });
  });
}

const HINTS: Record<UsernameStatus, string> = {
  idle: "The button wakes up once the name is available. Try rick, lena or northwind.",
  checking: "Asking the server. Keep typing and it asks again.",
  available: "Free. Press the button to claim it.",
  taken: "Taken. Pick one of the suggestions, or keep typing.",
  invalid: "That name breaks a rule. The list above says which.",
  error: "The server did not answer. Try again in a moment.",
};

const instant = (name: string, options: { signal: AbortSignal }) => ask(name, 0, options.signal);

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-1 content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

function Field(props: Omit<UsernameFieldProps, "id">): React.JSX.Element {
  const id = useId();
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>Username</Label>
      <UsernameField id={id} placeholder="yourname" {...props} />
    </div>
  );
}

function ClaimName(): React.JSX.Element {
  const [status, setStatus] = useState<UsernameStatus>("idle");
  const [claimed, setClaimed] = useState<string | null>(null);
  const [name, setName] = useState("");
  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        if (status === "available") setClaimed(name);
      }}
      className="grid gap-5 rounded-xl border border-border bg-card p-5 shadow-xs"
    >
      <div className="grid gap-1">
        <h2 className="text-sm font-medium tracking-[-0.01em]">Claim your Halcyon handle</h2>
        <p className="text-xs text-muted-foreground">It is how teammates mention you. You can change it later.</p>
      </div>
      <Field
        reserved={RESERVED_USERNAMES}
        onCheck={(username, { signal }) => ask(username, 700, signal)}
        onValueChange={(next) => {
          setName(next);
          setClaimed(null);
        }}
        onStatusChange={setStatus}
      />
      <Button type="submit" disabled={status !== "available"}>
        Claim @{name || "handle"}
      </Button>
      <p role="status" className="min-h-4 text-xs text-muted-foreground">
        {claimed ? `@${claimed} is yours.` : HINTS[status]}
      </p>
    </form>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="grid w-full max-w-4xl grid-cols-1 gap-x-10 gap-y-9 md:grid-cols-2 md:items-start">
      <div className="grid min-w-0 content-start gap-9">
        <Example caption="Try it: the check waits for a pause in the typing, and a late answer for an older name is thrown away">
          <ClaimName />
        </Example>
        <Example caption="Waiting for the server">
          <Field defaultValue="halcyon_labs" debounce={0} onCheck={(username, { signal }) => ask(username, 9000, signal)} />
        </Example>
        <Example caption="The server could not be reached: say so, and offer another try">
          <Field defaultValue="joost" debounce={0} onCheck={() => Promise.reject(new Error("offline"))} />
        </Example>
      </div>

      <div className="grid min-w-0 content-start gap-9">
        <Example caption="Taken: the field says so and offers names that are free">
          <Field defaultValue="rick" debounce={0} onCheck={instant} />
        </Example>
        <Example caption="Available: one status at the end, the same sentence for a screen reader">
          <Field defaultValue="kestrel.studio" debounce={0} onCheck={instant} />
        </Example>
        <Example caption="Reserved names are refused without asking the server">
          <Field defaultValue="admin" reserved={RESERVED_USERNAMES} debounce={0} onCheck={instant} />
        </Example>
        <Example caption="Without onCheck it only checks the format and asks nobody">
          <Field defaultValue="lena.hoffmann" />
        </Example>
      </div>
    </div>
  );
}
