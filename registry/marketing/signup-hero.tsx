"use client";

import { useId, useState, type FormEvent, type ReactNode } from "react";

import { Button } from "@rhs-ui/primitives/button";
import { Input } from "@rhs-ui/primitives/input";
import { cn } from "@/lib/utils";

export interface SignupHeroProps {
  /** The title's element: "h2" inside a page that has its own h1 (the default), "h1" when the hero opens the page. */
  titleAs?: "h1" | "h2";
  eyebrow?: string;
  title: string;
  description?: string;
  /** Called with the address; resolve to show the thank-you, reject to show the error. */
  onSubmit: (email: string) => Promise<void> | void;
  cta?: string;
  /** Under the field: what happens with the address. */
  privacyNote?: string;
  /** Faces, logos or a count that makes the list feel alive. */
  proof?: ReactNode;
  successMessage?: string;
  className?: string;
}

/**
 * A hero whose action is the form itself: an address and one button, for a
 * waitlist, a beta or a newsletter. The field keeps its label for screen
 * readers, the button shows progress, and the result is announced.
 */
export function SignupHero({ eyebrow, title, description, onSubmit, cta = "Join the list", privacyNote, proof, successMessage = "You are on the list. Check your inbox to confirm.", titleAs: Title = "h2", className }: SignupHeroProps) {
  const id = useId();
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const email = String(new FormData(event.currentTarget).get("email") ?? "").trim();
    if (!email) return;
    setState("busy");
    try {
      await onSubmit(email);
      setState("done");
    } catch {
      setState("error");
    }
  }
  return (
    <section data-slot="signup-hero" className={cn("mx-auto max-w-2xl py-16 text-center sm:py-24", className)}>
      {eyebrow ? <p className="mb-6 text-xs font-medium uppercase tracking-[.18em] text-muted-foreground">{eyebrow}</p> : null}
      <Title className="text-5xl font-medium leading-[1.05] tracking-[-.055em] text-balance sm:text-6xl">{title}</Title>
      {description ? <p className="mx-auto mt-6 max-w-lg text-base leading-relaxed text-pretty text-muted-foreground">{description}</p> : null}
      {state === "done" ? (
        <p role="status" className="mx-auto mt-9 max-w-md rounded-xl border border-border bg-muted px-5 py-4 text-sm">{successMessage}</p>
      ) : (
        <form onSubmit={submit} className="mx-auto mt-9 flex max-w-md flex-col gap-2 sm:flex-row">
          <label htmlFor={id} className="sr-only">Email address</label>
          <Input id={id} name="email" type="email" required autoComplete="email" placeholder="you@company.com" className="h-11 flex-1" aria-describedby={privacyNote ? `${id}-note` : undefined} />
          <Button type="submit" size="lg" loading={state === "busy"}>{cta}</Button>
        </form>
      )}
      {state === "error" ? <p role="alert" className="mt-3 text-sm text-destructive">That did not work. Please try again.</p> : null}
      {privacyNote && state !== "done" ? <p id={`${id}-note`} className="mt-3 text-xs text-muted-foreground">{privacyNote}</p> : null}
      {proof ? <div className="mt-10 flex items-center justify-center gap-3 text-sm text-muted-foreground">{proof}</div> : null}
    </section>
  );
}
