"use client";

import { useId, useState, type FormEvent } from "react";

import { Button } from "@rhs-ui/primitives/button";
import { CheckboxCards, type CheckboxCardOption } from "@rhs-ui/primitives/checkbox-cards";
import { Input } from "@rhs-ui/primitives/input";
import { Label } from "@rhs-ui/primitives/label";
import { Textarea } from "@rhs-ui/primitives/textarea";
import { cn } from "@/lib/utils";

export interface QuoteRequest {
  services: string[];
  details: string;
  postcode: string;
  name: string;
  email: string;
}

export interface QuoteRequestProps {
  title: string;
  description?: string;
  /** What they can ask a price for; pick one or more. */
  services: readonly CheckboxCardOption[];
  onSubmit: (request: QuoteRequest) => Promise<void> | void;
  /** Under the button: how fast you send a quote. */
  note?: string;
  className?: string;
}

/**
 * Ask for a price in one go: which jobs, a few words about the situation,
 * where it is and how to reach them. For tradespeople and studios; the
 * service cards are real checkboxes, and at least one must be chosen.
 */
export function QuoteRequest({ title, description, services, onSubmit, note, className }: QuoteRequestProps) {
  const id = useId();
  const [chosen, setChosen] = useState<string[]>([]);
  const [state, setState] = useState<"idle" | "busy" | "done" | "error" | "empty">("idle");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (chosen.length === 0) {
      setState("empty");
      return;
    }
    const data = new FormData(event.currentTarget);
    setState("busy");
    try {
      await onSubmit({ services: chosen, details: String(data.get("details") ?? ""), postcode: String(data.get("postcode") ?? ""), name: String(data.get("name") ?? ""), email: String(data.get("email") ?? "") });
      setState("done");
    } catch {
      setState("error");
    }
  }
  return (
    <section data-slot="quote-request" className={cn("py-16 sm:py-24", className)}>
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-medium tracking-[-.04em] text-balance sm:text-4xl">{title}</h2>
        {description ? <p className="mt-4 text-base text-muted-foreground">{description}</p> : null}
      </div>
      <div className="mx-auto mt-10 max-w-3xl rounded-3xl border border-border bg-card p-6 sm:p-8">
        {state === "done" ? (
          <p role="status" className="py-10 text-center text-sm">Thanks, your request is in. You will have a quote in your inbox soon.</p>
        ) : (
          <form onSubmit={submit} className="grid gap-6">
            <CheckboxCards legend="What should we price?" options={services} value={chosen} onValueChange={(next) => { setChosen(next); if (state === "empty") setState("idle"); }} columns={2} name="services" />
            {state === "empty" ? <p role="alert" className="-mt-3 text-sm text-destructive">Pick at least one job.</p> : null}
            <div className="grid gap-2">
              <Label htmlFor={`${id}-details`}>Tell us about it</Label>
              <Textarea id={`${id}-details`} name="details" rows={4} placeholder="Size, current state, anything we should know" />
            </div>
            <div className="grid gap-5 sm:grid-cols-[10rem_1fr_1fr]">
              <div className="grid gap-2">
                <Label htmlFor={`${id}-postcode`}>Postcode</Label>
                <Input id={`${id}-postcode`} name="postcode" required autoComplete="postal-code" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor={`${id}-name`}>Name</Label>
                <Input id={`${id}-name`} name="name" required autoComplete="name" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor={`${id}-email`}>Email</Label>
                <Input id={`${id}-email`} name="email" type="email" required autoComplete="email" />
              </div>
            </div>
            <Button type="submit" loading={state === "busy"} className="w-full sm:w-auto sm:justify-self-start">Request a quote</Button>
            {state === "error" ? <p role="alert" className="text-sm text-destructive">That did not send. Please try again.</p> : null}
            {note ? <p className="text-xs text-muted-foreground">{note}</p> : null}
          </form>
        )}
      </div>
    </section>
  );
}
