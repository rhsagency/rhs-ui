"use client";

import { useId, useState, type FormEvent, type ReactNode } from "react";

import { Button } from "@rhs-ui/primitives/button";
import { Input } from "@rhs-ui/primitives/input";
import { Label } from "@rhs-ui/primitives/label";
import { Textarea } from "@rhs-ui/primitives/textarea";
import { cn } from "@/lib/utils";

export interface ContactChannel {
  icon: ReactNode;
  label: string;
  value: string;
  href?: string;
}

export interface ContactMessage {
  name: string;
  email: string;
  message: string;
}

export interface ContactSectionProps {
  title: string;
  description?: string;
  channels: readonly ContactChannel[];
  onSubmit: (message: ContactMessage) => Promise<void> | void;
  /** Shown under the button: when you answer, what you do with the data. */
  note?: string;
  className?: string;
}

/**
 * Every way to reach you next to a short form. Labels stay visible, the
 * button shows progress, and the confirmation replaces the form.
 */
export function ContactSection({ title, description, channels, onSubmit, note, className }: ContactSectionProps) {
  const id = useId();
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setState("busy");
    try {
      await onSubmit({ name: String(data.get("name") ?? ""), email: String(data.get("email") ?? ""), message: String(data.get("message") ?? "") });
      setState("done");
    } catch {
      setState("error");
    }
  }
  return (
    <section data-slot="contact-section" className={cn("grid gap-12 py-16 sm:py-24 lg:grid-cols-[1fr_1.2fr] lg:gap-20", className)}>
      <div>
        <h2 className="text-4xl font-medium tracking-[-.045em] text-balance sm:text-5xl">{title}</h2>
        {description ? <p className="mt-5 max-w-md text-base leading-relaxed text-muted-foreground">{description}</p> : null}
        <ul className="mt-10 flex flex-col divide-y divide-border border-y border-border">
          {channels.map((channel) => (
            <li key={channel.label} className="flex items-center gap-4 py-4">
              <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-border [&_svg]:size-4">{channel.icon}</span>
              <span className="min-w-0">
                <span className="block text-xs text-muted-foreground">{channel.label}</span>
                {channel.href ? (
                  <a href={channel.href} className="block truncate text-sm font-medium underline-offset-4 hover:underline">{channel.value}</a>
                ) : (
                  <span className="block truncate text-sm font-medium">{channel.value}</span>
                )}
              </span>
            </li>
          ))}
        </ul>
      </div>
      <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
        {state === "done" ? (
          <p role="status" className="py-10 text-center text-sm">Thanks, your message is in. We will get back to you soon.</p>
        ) : (
          <form onSubmit={submit} className="grid gap-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor={`${id}-name`}>Name</Label>
                <Input id={`${id}-name`} name="name" required autoComplete="name" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor={`${id}-email`}>Email</Label>
                <Input id={`${id}-email`} name="email" type="email" required autoComplete="email" />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor={`${id}-message`}>Message</Label>
              <Textarea id={`${id}-message`} name="message" required rows={5} />
            </div>
            <Button type="submit" loading={state === "busy"} className="justify-self-start">Send message</Button>
            {state === "error" ? <p role="alert" className="text-sm text-destructive">That did not send. Please try again.</p> : null}
            {note ? <p className="text-xs text-muted-foreground">{note}</p> : null}
          </form>
        )}
      </div>
    </section>
  );
}
