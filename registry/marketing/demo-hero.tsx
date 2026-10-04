"use client";

import { useId, useState, type FormEvent, type ReactNode } from "react";

import { IconCheck } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { Input } from "@rhs-ui/primitives/input";
import { cn } from "@/lib/utils";

export interface DemoRequest {
  name: string;
  email: string;
  company: string;
}

export interface DemoHeroProps {
  /** The title's element: "h2" inside a page that has its own h1 (the default), "h1" when the hero opens the page. */
  titleAs?: "h1" | "h2";
  title: string;
  description?: string;
  /** What the demo covers, a line each. */
  agenda?: readonly string[];
  /** Resolve to confirm, reject to show the error. */
  onSubmit: (request: DemoRequest) => Promise<void> | void;
  /** Logos or a quote under the copy. */
  proof?: ReactNode;
  className?: string;
}

/**
 * The opening of a sales page: the promise and what the call covers on the
 * left, a short form on a card on the right. Three fields, real labels and
 * autocomplete, and the confirmation replaces the form in place.
 */
export function DemoHero({ titleAs: Title = "h2", title, description, agenda = [], onSubmit, proof, className }: DemoHeroProps) {
  const id = useId();
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setState("busy");
    try {
      await onSubmit({ name: String(data.get("name") ?? ""), email: String(data.get("email") ?? ""), company: String(data.get("company") ?? "") });
      setState("done");
    } catch {
      setState("error");
    }
  }
  const fields = [
    { name: "name", label: "Your name", type: "text", autoComplete: "name" },
    { name: "email", label: "Work email", type: "email", autoComplete: "email" },
    { name: "company", label: "Company", type: "text", autoComplete: "organization" },
  ];
  return (
    <section data-slot="demo-hero" className={cn("grid gap-12 py-16 sm:py-20 lg:grid-cols-[1.1fr_1fr] lg:gap-16", className)}>
      <div>
        <Title className="text-4xl font-medium leading-[1.05] tracking-[-.05em] text-balance sm:text-5xl">{title}</Title>
        {description ? <p className="mt-5 max-w-lg text-base leading-relaxed text-muted-foreground">{description}</p> : null}
        {agenda.length ? (
          <ul className="mt-8 space-y-3">
            {agenda.map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm"><IconCheck className="mt-0.5 size-4 shrink-0" />{item}</li>
            ))}
          </ul>
        ) : null}
        {proof ? <div className="mt-10 border-t border-border pt-6">{proof}</div> : null}
      </div>
      <div className="rounded-3xl border border-border bg-background p-6 shadow-sm sm:p-8">
        {state === "done" ? (
          <div role="status" className="flex h-full flex-col items-center justify-center py-10 text-center">
            <span className="inline-flex size-12 items-center justify-center rounded-full bg-foreground text-background"><IconCheck className="size-5" /></span>
            <p className="mt-5 text-lg font-medium">Thanks, we will be in touch today.</p>
            <p className="mt-1 text-sm text-muted-foreground">Expect an email with a few times to choose from.</p>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            {fields.map((field) => (
              <div key={field.name} className="space-y-1.5">
                <label htmlFor={`${id}-${field.name}`} className="text-sm font-medium">{field.label}</label>
                <Input id={`${id}-${field.name}`} name={field.name} type={field.type} autoComplete={field.autoComplete} required />
              </div>
            ))}
            <Button type="submit" size="lg" className="w-full" loading={state === "busy"}>Book a demo</Button>
            {state === "error" ? <p role="alert" className="text-sm text-destructive">That did not go through. Please try again.</p> : <p className="text-xs text-muted-foreground">30 minutes, with someone who builds the product.</p>}
          </form>
        )}
      </div>
    </section>
  );
}
