"use client";
import { useState, type FormEvent } from "react";

import { SegmentedControl } from "@rhs-ui/application/segmented-control";
import { ContourField } from "@rhs-ui/backgrounds/contour-field";
import { IconArrowUpRight, IconCheck } from "@rhs-ui/icons";
import { ProcessSection } from "@rhs-ui/marketing/process-section";
import { Reveal } from "@rhs-ui/motion/reveal";
import { TextReveal } from "@rhs-ui/motion/text-reveal";
import { Button } from "@rhs-ui/primitives/button";
import { Carousel } from "@rhs-ui/primitives/carousel";
import { Input } from "@rhs-ui/primitives/input";
import { Label } from "@rhs-ui/primitives/label";
import { Marquee } from "@rhs-ui/primitives/marquee";
import { Textarea } from "@rhs-ui/primitives/textarea";

export interface AgencyCase { id: string; client: string; title: string; result: string; tone: string }

export interface AgencyServicesProps {
  name?: string;
  services?: readonly { title: string; text: string; items: readonly string[] }[];
  cases?: readonly AgencyCase[];
  clients?: readonly string[];
  onContact?: (message: { name: string; email: string; budget: string; text: string }) => Promise<void> | void;
}

const SERVICES = [
  { title: "Product design", text: "From the first sketch to a design system your engineers enjoy using.", items: ["Research and strategy", "Interface design", "Design systems"] },
  { title: "Engineering", text: "Fast, accessible web apps in React and Next.js, built to be handed over.", items: ["Next.js and React", "Design to code", "Performance audits"] },
  { title: "Brand", text: "Names, marks and voices that hold up on a phone screen and a billboard.", items: ["Naming", "Identity", "Motion and sound"] },
];

const CASES: AgencyCase[] = [
  { id: "meridian", client: "Meridian", title: "A banking app people open for fun", result: "+34% weekly active users", tone: "#2e3440" },
  { id: "kestrel", client: "Kestrel", title: "Checkout in one screen", result: "+19% conversion", tone: "#6d6353" },
  { id: "halcyon", client: "Halcyon", title: "A design system for 40 teams", result: "3x faster releases", tone: "#4f5b52" },
  { id: "parallel", client: "Parallel", title: "Brand and site for a Series B", result: "Launched in 9 weeks", tone: "#5b4a5e" },
];

/**
 * A studio or agency site: a big statement on a contour field, services,
 * selected work in a carousel, the way you work, clients, and a contact
 * form with a budget choice that confirms in place.
 */
export function AgencyServices({ name = "Northbound", services = SERVICES, cases = CASES, clients = ["Meridian", "Kestrel", "Halcyon", "Parallel", "Northwind", "Oak Lane", "Fieldwork"], onContact }: AgencyServicesProps): React.JSX.Element {
  const [budget, setBudget] = useState("50k");
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const contact = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setState("sending");
    await onContact?.({ name: String(form.get("name") ?? ""), email: String(form.get("email") ?? ""), budget, text: String(form.get("text") ?? "") });
    setState("done");
  };
  return (
    <div data-slot="agency-services" className="bg-background text-foreground">
      <ContourField className="border-b border-border [&>canvas]:opacity-40" speed={0.25}>
        <nav aria-label="Studio" className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6 text-sm sm:px-10">
          <a href="#agency-top" className="text-lg font-semibold tracking-tight">{name}<sup className="ml-0.5 text-[10px]">®</sup></a>
          <div className="hidden gap-7 text-muted-foreground sm:flex">
            <a href="#agency-services" className="hover:text-foreground">Services</a>
            <a href="#agency-work" className="hover:text-foreground">Work</a>
            <a href="#agency-contact" className="hover:text-foreground">Contact</a>
          </div>
          <a href="#agency-contact" className="rounded-full bg-foreground px-4 py-2 text-background">Start a project</a>
        </nav>
        <header id="agency-top" className="mx-auto max-w-6xl px-6 pt-20 pb-28 sm:px-10">
          <p className="font-mono text-[11px] tracking-widest text-muted-foreground uppercase">Design and engineering studio · Amsterdam and remote</p>
          <h1 className="mt-8 max-w-5xl text-6xl font-medium leading-[0.98] tracking-[-0.055em] sm:text-8xl">We make digital products feel inevitable.</h1>
          <div className="mt-12 flex flex-wrap items-center gap-8">
            <a href="#agency-work" className="inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm text-background">See our work <IconArrowUpRight size={16} /></a>
            <p className="max-w-xs text-sm text-muted-foreground">Fourteen people, one floor, and eleven years of shipping for companies that care about the details.</p>
          </div>
        </header>
      </ContourField>

      <section id="agency-services" className="mx-auto max-w-6xl scroll-mt-6 px-6 py-24 sm:px-10">
        <div className="grid gap-px overflow-hidden rounded-3xl border border-border bg-border md:grid-cols-3">
          {services.map((service, index) => (
            <Reveal key={service.title} order={index} className="flex flex-col bg-background p-8">
              <span className="font-mono text-xs text-muted-foreground">0{index + 1}</span>
              <h2 className="mt-10 text-2xl font-medium tracking-tight">{service.title}</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{service.text}</p>
              <ul className="mt-8 grid gap-2 border-t border-border pt-6 text-sm">
                {service.items.map((item) => (
                  <li key={item} className="flex items-center gap-2"><IconCheck size={14} /> {item}</li>
                ))}
              </ul>
            </Reveal>
          ))}
        </div>
      </section>

      <section id="agency-work" className="scroll-mt-6 border-y border-border bg-muted/40">
        <div className="mx-auto max-w-6xl px-6 py-24 sm:px-10">
          <Reveal className="mb-10 flex flex-wrap items-end justify-between gap-6">
            <h2 className="text-5xl font-medium tracking-[-0.04em]">Selected work</h2>
            <p className="max-w-xs text-sm text-muted-foreground">A few projects we are allowed to talk about.</p>
          </Reveal>
          <Carousel label="Selected work" perView={2}>
            {cases.map((item) => (
              <article key={item.id} className="grid h-full gap-5">
                <div className="grid aspect-[4/3] place-items-center rounded-2xl text-5xl font-semibold tracking-tight text-white/90" style={{ background: item.tone }}>
                  {item.client}
                </div>
                <div className="flex items-start justify-between gap-6">
                  <div>
                    <p className="text-sm text-muted-foreground">{item.client}</p>
                    <h3 className="mt-1 text-xl font-medium tracking-tight">{item.title}</h3>
                  </div>
                  <p className="rounded-full border border-border bg-background px-3 py-1 text-xs whitespace-nowrap">{item.result}</p>
                </div>
              </article>
            ))}
          </Carousel>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-24 sm:px-10">
        <TextReveal as="p" className="text-center text-3xl font-medium leading-snug tracking-tight sm:text-4xl" text="We work in small senior teams, show work every week, and stay until the thing is live and measured. Then we hand it over properly." />
      </section>

      <section className="mx-auto max-w-6xl px-6 sm:px-10">
        <ProcessSection
          title="How a project runs"
          steps={[
            { id: "listen", title: "Listen", description: "Two weeks of interviews, data and sketches. You get a plan with a price." },
            { id: "make", title: "Make", description: "Weekly demos of real software, not slides. You decide every Friday." },
            { id: "land", title: "Land", description: "Launch, measure, fix, and train your team to take it from here." },
          ]}
        />
      </section>

      <section aria-label="Clients" className="border-y border-border py-12">
        <Marquee label="Clients" duration={36}>
          {clients.map((client) => (
            <span key={client} className="mx-12 text-2xl font-medium tracking-tight text-muted-foreground">{client}</span>
          ))}
        </Marquee>
      </section>

      <section id="agency-contact" className="mx-auto grid max-w-6xl scroll-mt-6 gap-12 px-6 py-24 sm:px-10 lg:grid-cols-[1fr_1.2fr]">
        <Reveal>
          <h2 className="text-5xl font-medium leading-tight tracking-[-0.04em]">Tell us what you are building.</h2>
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-muted-foreground">We answer every message within two working days, usually with questions.</p>
          <p className="mt-8 text-sm">hello@northbound.studio</p>
        </Reveal>
        <Reveal order={1}>
          {state === "done" ? (
            <div role="status" className="grid h-full place-content-center rounded-3xl border border-border p-10 text-center">
              <p className="text-2xl font-medium">Thanks, we are on it.</p>
              <p className="mt-2 text-sm text-muted-foreground">Expect an email from a real person soon.</p>
            </div>
          ) : (
            <form onSubmit={contact} className="grid gap-5 rounded-3xl border border-border p-8">
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="grid gap-2"><Label htmlFor="agency-name">Name</Label><Input id="agency-name" name="name" required autoComplete="name" /></div>
                <div className="grid gap-2"><Label htmlFor="agency-email">Email</Label><Input id="agency-email" name="email" type="email" required autoComplete="email" /></div>
              </div>
              <div className="grid gap-2">
                <span className="text-sm font-medium">Budget</span>
                <SegmentedControl label="Budget" value={budget} onValueChange={setBudget} options={[{ value: "25k", label: "< €25k" }, { value: "50k", label: "€25k to 75k" }, { value: "100k", label: "€75k +" }]} />
              </div>
              <div className="grid gap-2"><Label htmlFor="agency-text">About the project</Label><Textarea id="agency-text" name="text" rows={4} placeholder="What, for whom, and by when" /></div>
              <Button type="submit" loading={state === "sending"} className="justify-self-start rounded-full">Send</Button>
            </form>
          )}
        </Reveal>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl justify-between px-6 py-8 text-xs text-muted-foreground sm:px-10">
          <span>© 2026 {name} Studio B.V.</span>
          <span>Keizersgracht 5 · Amsterdam</span>
        </div>
      </footer>
    </div>
  );
}
