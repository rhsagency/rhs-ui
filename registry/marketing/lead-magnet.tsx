"use client";

import { useId, useState, type FormEvent, type ReactNode } from "react";

import { IconCheck, IconDownload } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { Input } from "@rhs-ui/primitives/input";
import { cn } from "@/lib/utils";

export interface LeadMagnetProps {
  /** "Free guide", "Template", "Report 2026". */
  kind: string;
  title: string;
  description?: string;
  /** What is inside, a line each. */
  contents?: readonly string[];
  /** The cover: an image or a drawn cover. */
  cover: ReactNode;
  /** Resolve to confirm and show the download, reject to show the error. */
  onSubmit: (email: string) => Promise<void> | void;
  /** Where the file lives once they signed up. */
  downloadHref: string;
  className?: string;
}

/**
 * Trade an email for something worth it: a guide, a template, a report. The
 * cover tilted on the left, what is inside on the right, one field, and after
 * sign-up the download right there instead of "check your inbox" only.
 */
export function LeadMagnet({ kind, title, description, contents = [], cover, onSubmit, downloadHref, className }: LeadMagnetProps) {
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
    <section data-slot="lead-magnet" className={cn("grid items-center gap-12 rounded-3xl bg-muted/50 px-6 py-12 sm:px-12 lg:grid-cols-[auto_1fr] lg:gap-16", className)}>
      <div className="mx-auto w-48 -rotate-3 overflow-hidden rounded-lg shadow-2xl ring-1 ring-border sm:w-56 [&_img]:size-full [&_img]:object-cover">
        <div className="aspect-[3/4]">{cover}</div>
      </div>
      <div>
        <p className="text-xs font-medium tracking-[.14em] text-muted-foreground uppercase">{kind}</p>
        <h2 className="mt-3 text-3xl font-medium tracking-[-.04em] text-balance sm:text-4xl">{title}</h2>
        {description ? <p className="mt-4 max-w-lg text-base leading-relaxed text-muted-foreground">{description}</p> : null}
        {contents.length ? (
          <ul className="mt-6 grid gap-2 text-sm sm:grid-cols-2">
            {contents.map((item) => (
              <li key={item} className="flex items-start gap-2"><IconCheck className="mt-0.5 size-4 shrink-0" />{item}</li>
            ))}
          </ul>
        ) : null}
        {state === "done" ? (
          <div role="status" className="mt-8 flex flex-wrap items-center gap-4">
            <Button asChild size="lg"><a href={downloadHref} download><IconDownload /> Download now</a></Button>
            <span className="text-sm text-muted-foreground">A copy is on its way to your inbox too.</span>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-8 flex max-w-md flex-col gap-2 sm:flex-row">
            <label htmlFor={id} className="sr-only">Email address</label>
            <Input id={id} name="email" type="email" required autoComplete="email" placeholder="you@company.com" className="h-11 flex-1 bg-background" />
            <Button type="submit" size="lg" loading={state === "busy"}>Get the {kind.toLowerCase()}</Button>
          </form>
        )}
        {state === "error" ? <p role="alert" className="mt-3 text-sm text-destructive">That did not work. Please try again.</p> : null}
      </div>
    </section>
  );
}
