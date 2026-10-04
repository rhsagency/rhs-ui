"use client";

import { useId, useState, type FormEvent, type ReactNode } from "react";

import { Button } from "@rhs-ui/primitives/button";
import { Input } from "@rhs-ui/primitives/input";
import { cn } from "@/lib/utils";

export interface FooterColumn {
  title: string;
  links: readonly { label: string; href: string }[];
}

export interface FooterNewsletterProps {
  brand: ReactNode;
  /** One line under the brand. */
  tagline?: string;
  columns: readonly FooterColumn[];
  newsletterTitle?: string;
  onSubscribe: (email: string) => Promise<void> | void;
  /** "© 2026 Ledger B.V." and legal links. */
  legal: ReactNode;
  className?: string;
}

/**
 * A full footer with the newsletter built in: brand and sign-up across the
 * top, link columns in the middle, legal at the bottom. The columns are nav
 * landmarks with their own names, so a screen reader can jump to "Product".
 */
export function FooterNewsletter({ brand, tagline, columns, newsletterTitle = "Get the monthly update", onSubscribe, legal, className }: FooterNewsletterProps) {
  const id = useId();
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const email = String(new FormData(event.currentTarget).get("email") ?? "").trim();
    if (!email) return;
    setState("busy");
    try {
      await onSubscribe(email);
      setState("done");
    } catch {
      setState("error");
    }
  }
  return (
    <footer data-slot="footer-newsletter" className={cn("border-t border-border pt-14 pb-8", className)}>
      <div className="flex flex-col gap-8 border-b border-border pb-12 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="text-lg font-medium">{brand}</div>
          {tagline ? <p className="mt-2 max-w-xs text-sm text-muted-foreground">{tagline}</p> : null}
        </div>
        <div className="w-full lg:w-[24rem]">
          <p id={`${id}-title`} className="text-sm font-medium">{newsletterTitle}</p>
          {state === "done" ? (
            <p role="status" className="mt-3 text-sm text-muted-foreground">Thanks. Check your inbox to confirm.</p>
          ) : (
            <form onSubmit={submit} aria-labelledby={`${id}-title`} className="mt-3 flex gap-2">
              <label htmlFor={id} className="sr-only">Email address</label>
              <Input id={id} name="email" type="email" required autoComplete="email" placeholder="you@company.com" className="flex-1" />
              <Button type="submit" loading={state === "busy"}>Subscribe</Button>
            </form>
          )}
          {state === "error" ? <p role="alert" className="mt-2 text-xs text-destructive">That did not work. Please try again.</p> : null}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-8 py-12 sm:grid-cols-4">
        {columns.map((column) => (
          <nav key={column.title} aria-label={column.title}>
            <p className="text-sm font-medium">{column.title}</p>
            <ul className="mt-4 space-y-2.5">
              {column.links.map((link) => (
                <li key={`${link.href}-${link.label}`}><a href={link.href} className="text-sm text-muted-foreground hover:text-foreground">{link.label}</a></li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="flex flex-col gap-3 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between [&_a]:hover:text-foreground">{legal}</div>
    </footer>
  );
}
