"use client";
import { useState, type FormEvent } from "react";

import { HalftoneWave } from "@rhs-ui/backgrounds/halftone-wave";
import { IconArrowRight, IconCheck, IconMail } from "@rhs-ui/icons";
import { TestimonialGrid, type Testimonial } from "@rhs-ui/marketing/testimonial-grid";
import { Reveal } from "@rhs-ui/motion/reveal";
import { Avatar, AvatarFallback, AvatarGroup } from "@rhs-ui/primitives/avatar";
import { Button } from "@rhs-ui/primitives/button";
import { Input } from "@rhs-ui/primitives/input";

export interface Issue { number: number; title: string; excerpt: string; date: string; minutes: number; href: string }

export interface NewsletterProps {
  name?: string;
  author?: string;
  subscribers?: string;
  issues?: readonly Issue[];
  testimonials?: readonly Testimonial[];
  /** Store the address with your mail provider; throw to show an error. */
  onSubscribe?: (email: string) => Promise<void> | void;
}

const ISSUES: Issue[] = [
  { number: 142, title: "The case for boring software", excerpt: "Every team I admire picked the dull option at least once and won. Here is how to tell when dull is right.", date: "24 Sep 2026", minutes: 6, href: "#" },
  { number: 141, title: "Pricing pages people trust", excerpt: "Three pricing pages, one hundred interviews, and the single sentence that raised conversion by a fifth.", date: "17 Sep 2026", minutes: 8, href: "#" },
  { number: 140, title: "Write the changelog first", excerpt: "What happens when you describe the release before you build it. Spoiler: smaller releases.", date: "10 Sep 2026", minutes: 5, href: "#" },
  { number: 139, title: "Onboarding in one screen", excerpt: "We cut a seven-step tour to a single page with a checklist. Activation went up. Here is the teardown.", date: "3 Sep 2026", minutes: 7, href: "#" },
];

const TESTIMONIALS: Testimonial[] = [
  { id: "a", quote: "The only newsletter I read the day it arrives. Practical, short and never selling me something.", name: "Lucas Moreau", role: "Head of Product, Parallel" },
  { id: "b", quote: "I have forwarded more of these to my team than any book I own.", name: "Hana Ito", role: "Engineering manager" },
];

/**
 * A creator's home for a newsletter: a halftone hero with the sign-up that
 * really confirms, who reads it, the latest issues, what readers say, and
 * one more sign-up at the end.
 */
export function Newsletter({ name = "Small Bets", author = "Ruben Alders", subscribers = "38,000", issues = ISSUES, testimonials = TESTIMONIALS, onSubscribe }: NewsletterProps): React.JSX.Element {
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const subscribe = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const email = String(new FormData(event.currentTarget).get("email") ?? "");
    setState("sending");
    try {
      await onSubscribe?.(email);
      setState("done");
    } catch {
      setState("error");
    }
  };
  const form = (id: string, invert = false) =>
    state === "done" ? (
      <p role="status" className="flex items-center gap-2 text-sm"><IconCheck size={16} /> Check your inbox to confirm. Issue {issues[0]?.number ?? ""} is waiting.</p>
    ) : (
      <form onSubmit={subscribe} className="flex w-full max-w-md flex-col gap-2 sm:flex-row">
        <label htmlFor={id} className="sr-only">Email address</label>
        <Input id={id} name="email" type="email" required autoComplete="email" placeholder="you@company.com" className="h-11 flex-1 rounded-full bg-background px-5" />
        <Button type="submit" size="lg" variant={invert ? "secondary" : "default"} loading={state === "sending"} className="rounded-full">Subscribe</Button>
        {state === "error" ? <p role="alert" className="text-sm text-destructive sm:basis-full">That did not work. Try again in a moment.</p> : null}
      </form>
    );
  return (
    <div data-slot="newsletter" className="bg-background text-foreground">
      <HalftoneWave className="border-b border-border [&>canvas]:opacity-15" speed={0.3}>
        <nav aria-label="Newsletter" className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6 text-sm sm:px-10">
          <a href="#newsletter-top" className="font-serif text-xl italic">{name}</a>
          <a href="#newsletter-archive" className="text-muted-foreground hover:text-foreground">Archive</a>
        </nav>
        <header id="newsletter-top" className="mx-auto grid max-w-5xl gap-10 px-6 pt-16 pb-24 sm:px-10">
          <p className="flex items-center gap-2 font-mono text-[11px] tracking-widest text-muted-foreground uppercase"><IconMail size={14} /> Every Tuesday, five minutes</p>
          <h1 className="max-w-3xl font-serif text-5xl leading-[1.02] tracking-tight sm:text-7xl">Notes on building products people keep using.</h1>
          <p className="max-w-xl text-lg leading-relaxed text-muted-foreground">One idea a week from {author}: what worked, what did not, and the numbers behind it. No hype, no threads.</p>
          {form("newsletter-email-top")}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <AvatarGroup>
              {["LM", "HI", "AB", "SK"].map((initials) => (
                <Avatar key={initials} size="sm"><AvatarFallback>{initials}</AvatarFallback></Avatar>
              ))}
            </AvatarGroup>
            Read by {subscribers} founders, designers and engineers
          </div>
        </header>
      </HalftoneWave>

      <section id="newsletter-archive" className="mx-auto max-w-5xl scroll-mt-6 px-6 py-20 sm:px-10">
        <Reveal className="flex items-end justify-between gap-6">
          <h2 className="font-serif text-4xl tracking-tight">Latest issues</h2>
          <a href="#newsletter-archive" className="text-sm text-muted-foreground underline underline-offset-4">All {issues[0]?.number ?? ""} issues</a>
        </Reveal>
        <ol className="mt-10 divide-y divide-border border-y border-border">
          {issues.map((issue, index) => (
            <Reveal asChild key={issue.number} order={index}>
              <li>
                <a href={issue.href} className="group grid gap-3 py-8 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40 sm:grid-cols-[5rem_1fr_auto] sm:gap-8">
                  <span className="font-mono text-sm text-muted-foreground">#{issue.number}</span>
                  <span>
                    <span className="block font-serif text-2xl tracking-tight group-hover:underline">{issue.title}</span>
                    <span className="mt-2 block max-w-2xl text-sm leading-relaxed text-muted-foreground">{issue.excerpt}</span>
                  </span>
                  <span className="text-xs text-muted-foreground sm:text-right">{issue.date}<br />{issue.minutes} min read</span>
                </a>
              </li>
            </Reveal>
          ))}
        </ol>
      </section>

      <section className="border-y border-border bg-muted/40">
        <div className="mx-auto max-w-5xl px-6 py-12 sm:px-10">
          <TestimonialGrid eyebrow="Readers" title="Why people stay subscribed." testimonials={testimonials} featured={testimonials[0]?.id} />
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-10 px-6 py-20 sm:px-10 md:grid-cols-[auto_1fr] md:items-center">
        <span aria-hidden="true" className="grid size-28 place-items-center rounded-full bg-muted text-2xl font-semibold">{author.split(" ").map((part) => part[0]).join("")}</span>
        <div>
          <h2 className="font-serif text-3xl tracking-tight">Hi, I am {author.split(" ")[0]}.</h2>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">I have spent fifteen years building software products, two of which you have probably used and five you have not. I write about the decisions in between.</p>
        </div>
      </section>

      <section className="border-t border-border bg-foreground text-background">
        <div className="mx-auto grid max-w-5xl gap-8 px-6 py-20 sm:px-10 md:grid-cols-2 md:items-center">
          <h2 className="font-serif text-4xl leading-tight tracking-tight">Join {subscribers} readers. <span className="opacity-60">Unsubscribe any time.</span></h2>
          <div className="[&_input]:text-foreground">{form("newsletter-email-bottom", true)}</div>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-5xl justify-between px-6 py-8 text-xs text-muted-foreground sm:px-10">
          <span>© 2026 {name}</span>
          <a href="#newsletter-top" className="flex items-center gap-1">Back to top <IconArrowRight size={12} className="-rotate-90" /></a>
        </div>
      </footer>
    </div>
  );
}
