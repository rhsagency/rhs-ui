"use client";

import { useId, useState, type FormEvent } from "react";

import { IconPhoneCall } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { Input } from "@rhs-ui/primitives/input";
import { Label } from "@rhs-ui/primitives/label";
import { RadioCards } from "@rhs-ui/primitives/radio-cards";
import { cn } from "@/lib/utils";

export interface CallbackSlot {
  value: string;
  title: string;
  description?: string;
}

export interface CallbackRequest {
  name: string;
  phone: string;
  slot: string;
}

export interface CallbackRequestProps {
  title: string;
  description?: string;
  /** When you can call back: "Morning, 9 to 12". */
  slots: readonly CallbackSlot[];
  onSubmit: (request: CallbackRequest) => Promise<void> | void;
  /** Under the button: when you call, what you do with the number. */
  note?: string;
  className?: string;
}

/**
 * "We call you": a name, a phone number and a time that suits, for people
 * who would rather talk than type. Three fields, the button shows progress,
 * and the confirmation names the slot they picked.
 */
export function CallbackRequest({ title, description, slots, onSubmit, note, className }: CallbackRequestProps) {
  const id = useId();
  const [slot, setSlot] = useState(slots[0]?.value ?? "");
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setState("busy");
    try {
      await onSubmit({ name: String(data.get("name") ?? ""), phone: String(data.get("phone") ?? ""), slot });
      setState("done");
    } catch {
      setState("error");
    }
  }
  const chosen = slots.find((option) => option.value === slot);
  return (
    <section data-slot="callback-request" className={cn("mx-auto max-w-xl py-16 sm:py-20", className)}>
      <div className="text-center">
        <span aria-hidden="true" className="inline-flex size-12 items-center justify-center rounded-2xl bg-muted [&_svg]:size-5"><IconPhoneCall /></span>
        <h2 className="mt-5 text-3xl font-medium tracking-[-.04em] text-balance sm:text-4xl">{title}</h2>
        {description ? <p className="mt-3 text-base text-muted-foreground">{description}</p> : null}
      </div>
      <div className="mt-10 rounded-3xl border border-border bg-card p-6 sm:p-8">
        {state === "done" ? (
          <p role="status" className="py-8 text-center text-sm">Thanks. We will call you{chosen ? ` in the ${chosen.title.toLowerCase()}` : ""}.</p>
        ) : (
          <form onSubmit={submit} className="grid gap-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor={`${id}-name`}>Name</Label>
                <Input id={`${id}-name`} name="name" required autoComplete="name" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor={`${id}-phone`}>Phone number</Label>
                <Input id={`${id}-phone`} name="phone" type="tel" required autoComplete="tel" inputMode="tel" />
              </div>
            </div>
            <div className="grid gap-2">
              <p className="text-sm font-medium" aria-hidden="true">Best time to call</p>
              <RadioCards label="Best time to call" options={slots} value={slot} onValueChange={setSlot} columns={slots.length >= 3 ? 3 : 2} />
            </div>
            <Button type="submit" loading={state === "busy"} className="w-full sm:w-auto sm:justify-self-start">Call me back</Button>
            {state === "error" ? <p role="alert" className="text-sm text-destructive">That did not go through. Please try again.</p> : null}
            {note ? <p className="text-xs text-muted-foreground">{note}</p> : null}
          </form>
        )}
      </div>
    </section>
  );
}
