"use client";

import { useId, useState, type FormEvent } from "react";

import { IconMail } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { Input } from "@rhs-ui/primitives/input";
import { cn } from "@/lib/utils";

export interface NewsletterSectionProps {
  title: string;
  description?: string;
  /** Resolve to thank the reader, reject to show the error. */
  onSubmit: (email: string) => Promise<void> | void;
  /** How often and what: "One email a month. No tracking pixels." */
  promise?: string;
  cta?: string;
  className?: string;
}

/**
 * A newsletter sign-up as its own section: what you will get, how often, and
 * one field. The confirmation replaces the form in place and is announced.
 */
export function NewsletterSection({ title, description, onSubmit, promise, cta = "Subscribe", className }: NewsletterSectionProps) {
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
    <section data-slot="newsletter-section" className={cn("grid gap-8 border-y border-border py-12 sm:py-16 lg:grid-cols-[1fr_auto] lg:items-center lg:gap-16", className)}>
      <div className="flex gap-5">
        <span className="hidden size-12 shrink-0 items-center justify-center rounded-xl border border-border sm:inline-flex [&_svg]:size-5">
          <IconMail />
        </span>
        <div>
          <h2 className="text-2xl font-medium tracking-[-.03em] sm:text-3xl">{title}</h2>
          {description ? <p className="mt-2 max-w-lg text-sm leading-relaxed text-muted-foreground">{description}</p> : null}
        </div>
      </div>
      <div className="w-full lg:w-[26rem]">
        {state === "done" ? (
          <p role="status" className="rounded-xl bg-muted px-4 py-3 text-sm">Thanks. Check your inbox to confirm your address.</p>
        ) : (
          <form onSubmit={submit} className="flex flex-col gap-2 sm:flex-row">
            <label htmlFor={id} className="sr-only">Email address</label>
            <Input id={id} name="email" type="email" required autoComplete="email" placeholder="you@company.com" className="h-10 flex-1" />
            <Button type="submit" loading={state === "busy"} className="h-10">{cta}</Button>
          </form>
        )}
        {state === "error" ? <p role="alert" className="mt-2 text-sm text-destructive">That did not work. Please try again.</p> : null}
        {promise && state !== "done" ? <p className="mt-2 text-xs text-muted-foreground">{promise}</p> : null}
      </div>
    </section>
  );
}
