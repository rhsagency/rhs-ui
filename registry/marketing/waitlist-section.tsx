"use client";

import { useId, useState, type FormEvent } from "react";

import { IconCheck } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { Input } from "@rhs-ui/primitives/input";
import { cn } from "@/lib/utils";

export interface WaitlistSectionProps {
  title: string;
  description?: string;
  /** People already waiting, shown as social proof. Leave out rather than invent one. */
  waiting?: number;
  /** Resolve with the place in line, or nothing; reject to show the error. */
  onJoin: (email: string) => Promise<number | void> | number | void;
  locale?: string;
  className?: string;
}

/**
 * A pre-launch waitlist: the promise, how many are already in line, one
 * email field, and a confirmation that tells people their place when you
 * have it. The confirmation is a status message, announced once.
 */
export function WaitlistSection({ title, description, waiting, onJoin, locale = "en-GB", className }: WaitlistSectionProps) {
  const id = useId();
  const [state, setState] = useState<"idle" | "busy" | "error">("idle");
  const [place, setPlace] = useState<number | null | undefined>(undefined);
  const number = new Intl.NumberFormat(locale);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const email = String(new FormData(event.currentTarget).get("email") ?? "").trim();
    if (!email) return;
    setState("busy");
    try {
      const result = await onJoin(email);
      setPlace(typeof result === "number" ? result : null);
      setState("idle");
    } catch {
      setState("error");
    }
  }
  return (
    <section data-slot="waitlist-section" className={cn("mx-auto max-w-xl py-16 text-center sm:py-24", className)}>
      <h2 className="text-3xl font-medium tracking-[-.04em] text-balance sm:text-4xl">{title}</h2>
      {description ? <p className="mt-4 text-base leading-relaxed text-muted-foreground">{description}</p> : null}
      {place === undefined ? (
        <form onSubmit={submit} className="mt-8 flex flex-col gap-2 sm:flex-row">
          <label htmlFor={id} className="sr-only">Email address</label>
          <Input id={id} name="email" type="email" required autoComplete="email" placeholder="you@company.com" className="h-11 flex-1" />
          <Button type="submit" size="lg" loading={state === "busy"}>Join the waitlist</Button>
        </form>
      ) : (
        <p role="status" className="mt-8 inline-flex items-center gap-2 rounded-full bg-muted px-5 py-3 text-sm">
          <IconCheck className="size-4" />
          {place ? <>You are number <strong className="tabular-nums">{number.format(place)}</strong> in line. We will email you.</> : "You are on the list. We will email you."}
        </p>
      )}
      {state === "error" ? <p role="alert" className="mt-3 text-sm text-destructive">That did not work. Please try again.</p> : null}
      {waiting && place === undefined ? <p className="mt-4 text-xs text-muted-foreground"><span className="tabular-nums">{number.format(waiting)}</span> people are already waiting.</p> : null}
    </section>
  );
}
