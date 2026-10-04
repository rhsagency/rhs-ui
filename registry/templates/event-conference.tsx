"use client";
import { useState } from "react";

import { ParticleNetwork } from "@rhs-ui/backgrounds/particle-network";
import { IconArrowUpRight, IconCalendar, IconCheck, IconPin, IconTicket } from "@rhs-ui/icons";
import { FaqSection } from "@rhs-ui/marketing/faq-section";
import { Reveal } from "@rhs-ui/motion/reveal";
import { Avatar, AvatarFallback, initialsOf } from "@rhs-ui/primitives/avatar";
import { Marquee } from "@rhs-ui/primitives/marquee";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@rhs-ui/primitives/tabs";

export interface Speaker { name: string; role: string; topic: string }
export interface Session { time: string; title: string; speaker?: string; room: string; kind?: "talk" | "workshop" | "break" }
export interface TicketTier { id: string; name: string; price: string; note: string; perks: readonly string[]; featured?: boolean; soldOut?: boolean }

export interface EventConferenceProps {
  name?: string;
  dates?: string;
  city?: string;
  speakers?: readonly Speaker[];
  schedule?: Readonly<Record<string, readonly Session[]>>;
  tickets?: readonly TicketTier[];
  sponsors?: readonly string[];
  onBuy?: (ticketId: string) => void;
}

const SPEAKERS: Speaker[] = [
  { name: "Lena Okafor", role: "Design lead, Meridian", topic: "Interfaces that explain themselves" },
  { name: "Daniel Brooks", role: "Staff engineer, Kestrel", topic: "Shipping on Fridays, safely" },
  { name: "Yuki Tanaka", role: "Founder, Parallel", topic: "Small teams, large products" },
  { name: "Sofia Marín", role: "Research, Oak Lane", topic: "What users mean, not what they say" },
  { name: "Arjun Mehta", role: "CTO, Halcyon", topic: "The boring stack that scales" },
  { name: "Noor Haddad", role: "Principal PM, Fieldwork", topic: "Roadmaps nobody reads" },
];

const SCHEDULE: Record<string, Session[]> = {
  "Day 1 · 14 Nov": [
    { time: "09:00", title: "Doors, coffee and badges", room: "Foyer", kind: "break" },
    { time: "10:00", title: "Interfaces that explain themselves", speaker: "Lena Okafor", room: "Main hall" },
    { time: "11:00", title: "Shipping on Fridays, safely", speaker: "Daniel Brooks", room: "Main hall" },
    { time: "13:30", title: "Workshop: prototyping with real data", speaker: "Yuki Tanaka", room: "Studio 2", kind: "workshop" },
    { time: "16:00", title: "What users mean, not what they say", speaker: "Sofia Marín", room: "Main hall" },
  ],
  "Day 2 · 15 Nov": [
    { time: "09:30", title: "The boring stack that scales", speaker: "Arjun Mehta", room: "Main hall" },
    { time: "11:00", title: "Roadmaps nobody reads", speaker: "Noor Haddad", room: "Main hall" },
    { time: "12:30", title: "Long lunch by the water", room: "Terrace", kind: "break" },
    { time: "14:00", title: "Workshop: writing for interfaces", speaker: "Lena Okafor", room: "Studio 1", kind: "workshop" },
    { time: "17:00", title: "Closing and drinks", room: "Main hall", kind: "break" },
  ],
};

const TICKETS: TicketTier[] = [
  { id: "early", name: "Early bird", price: "€349", note: "Until 1 October", perks: ["Both days", "Lunch and drinks"], soldOut: true },
  { id: "regular", name: "Regular", price: "€449", note: "Most people choose this", perks: ["Both days", "Lunch and drinks", "Recordings of every talk"], featured: true },
  { id: "workshop", name: "Workshop pass", price: "€649", note: "Limited to 40 seats", perks: ["Everything in Regular", "Two hands-on workshops", "Speaker dinner"] },
];

/**
 * A conference site: a bold hero on a warp field with date and place, the
 * speakers, the programme per day, tickets (one sold out), the sponsors and
 * the questions people ask before they buy.
 */
export function EventConference({ name = "Frontier 2026", dates = "14 and 15 November", city = "Rotterdam", speakers = SPEAKERS, schedule = SCHEDULE, tickets = TICKETS, sponsors = ["Meridian", "Kestrel", "Parallel", "Northwind", "Halcyon", "Oak Lane", "Fieldwork"], onBuy }: EventConferenceProps): React.JSX.Element {
  const [chosen, setChosen] = useState<string | null>(null);
  const days = Object.keys(schedule);
  return (
    <div data-slot="event-conference" className="bg-background text-foreground">
      <ParticleNetwork className="dark bg-background text-foreground [&>canvas]:opacity-70" speed={0.4}>
        <nav aria-label="Event" className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6 text-sm sm:px-10">
          <a href="#event-top" className="font-mono text-sm font-medium tracking-tight">{name.toUpperCase()}</a>
          <div className="hidden gap-7 opacity-75 sm:flex">
            <a href="#event-speakers">Speakers</a>
            <a href="#event-programme">Programme</a>
            <a href="#event-tickets">Tickets</a>
          </div>
          <a href="#event-tickets" className="rounded-full bg-foreground px-5 py-2 text-background">Get tickets</a>
        </nav>
        <header id="event-top" className="mx-auto max-w-6xl px-6 pt-20 pb-28 sm:px-10">
          <p className="flex flex-wrap gap-x-6 gap-y-2 font-mono text-xs tracking-widest uppercase opacity-70">
            <span className="flex items-center gap-2"><IconCalendar size={14} /> {dates}</span>
            <span className="flex items-center gap-2"><IconPin size={14} /> {city}</span>
          </p>
          <h1 className="mt-8 max-w-5xl text-6xl font-semibold leading-[0.92] tracking-[-0.06em] sm:text-[8.5rem]">
            Build what
            <br />
            comes next.
          </h1>
          <div className="mt-12 grid max-w-3xl gap-8 sm:grid-cols-3">
            {[["2", "days"], [String(speakers.length), "keynotes"], ["900", "builders"]].map(([value, label]) => (
              <div key={label} className="border-t border-foreground/25 pt-4">
                <p className="text-4xl font-semibold tracking-tight tabular-nums">{value}</p>
                <p className="mt-1 text-sm opacity-60">{label}</p>
              </div>
            ))}
          </div>
        </header>
      </ParticleNetwork>

      <section id="event-speakers" className="mx-auto max-w-6xl scroll-mt-6 px-6 py-24 sm:px-10">
        <Reveal className="flex flex-wrap items-end justify-between gap-6">
          <h2 className="text-5xl font-semibold tracking-[-0.04em]">Speakers</h2>
          <p className="max-w-sm text-sm text-muted-foreground">People who build products for a living, talking about the part that went wrong first.</p>
        </Reveal>
        <ul className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
          {speakers.map((speaker, index) => (
            <Reveal asChild key={speaker.name} order={index % 3}>
              <li className="grid gap-5 bg-background p-7">
                <Avatar size="lg">
                  <AvatarFallback>{initialsOf(speaker.name)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-lg font-medium">{speaker.name}</p>
                  <p className="text-sm text-muted-foreground">{speaker.role}</p>
                </div>
                <p className="border-t border-border pt-4 text-sm">“{speaker.topic}”</p>
              </li>
            </Reveal>
          ))}
        </ul>
      </section>

      <section id="event-programme" className="scroll-mt-6 border-y border-border bg-muted/40">
        <div className="mx-auto max-w-4xl px-6 py-24 sm:px-10">
          <Reveal>
            <h2 className="text-5xl font-semibold tracking-[-0.04em]">Programme</h2>
          </Reveal>
          <Tabs defaultValue={days[0]} className="mt-10">
            <TabsList>
              {days.map((day) => (
                <TabsTrigger key={day} value={day}>{day}</TabsTrigger>
              ))}
            </TabsList>
            {days.map((day) => (
              <TabsContent key={day} value={day} className="mt-8">
                <ol className="divide-y divide-border rounded-2xl border border-border bg-background">
                  {schedule[day]!.map((session) => (
                    <li key={session.time + session.title} className="grid gap-2 px-6 py-5 sm:grid-cols-[5rem_1fr_auto] sm:items-baseline sm:gap-6">
                      <time className="font-mono text-sm tabular-nums text-muted-foreground">{session.time}</time>
                      <div>
                        <p className={session.kind === "break" ? "text-muted-foreground" : "font-medium"}>{session.title}</p>
                        {session.speaker ? <p className="text-sm text-muted-foreground">{session.speaker}</p> : null}
                      </div>
                      <span className="flex items-center gap-2 text-xs text-muted-foreground">
                        {session.kind === "workshop" ? <span className="rounded-full bg-foreground px-2 py-0.5 text-[10px] text-background uppercase">Workshop</span> : null}
                        {session.room}
                      </span>
                    </li>
                  ))}
                </ol>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </section>

      <section id="event-tickets" className="mx-auto max-w-6xl scroll-mt-6 px-6 py-24 sm:px-10">
        <Reveal className="text-center">
          <IconTicket size={28} className="mx-auto text-muted-foreground" />
          <h2 className="mt-4 text-5xl font-semibold tracking-[-0.04em]">Tickets</h2>
          <p className="mt-3 text-sm text-muted-foreground">Prices include VAT. Refundable until 1 November.</p>
        </Reveal>
        <div className="mt-12 grid gap-4 lg:grid-cols-3">
          {tickets.map((ticket, index) => (
            <Reveal key={ticket.id} order={index} className={`flex flex-col rounded-2xl border p-7 ${ticket.featured ? "border-foreground bg-foreground text-background" : "border-border"}`}>
              <p className="text-sm font-medium">{ticket.name}</p>
              <p className="mt-6 text-5xl font-semibold tracking-tight">{ticket.price}</p>
              <p className={`mt-2 text-xs ${ticket.featured ? "opacity-70" : "text-muted-foreground"}`}>{ticket.note}</p>
              <ul className="mt-8 grid flex-1 content-start gap-3 text-sm">
                {ticket.perks.map((perk) => (
                  <li key={perk} className="flex items-center gap-2"><IconCheck size={16} /> {perk}</li>
                ))}
              </ul>
              <button
                type="button"
                disabled={ticket.soldOut}
                onClick={() => {
                  setChosen(ticket.id);
                  onBuy?.(ticket.id);
                }}
                className={`mt-8 inline-flex h-11 items-center justify-center gap-2 rounded-full text-sm font-medium outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40 disabled:opacity-40 ${ticket.featured ? "bg-background text-foreground" : "border border-border"}`}
              >
                {ticket.soldOut ? "Sold out" : chosen === ticket.id ? "Added, see you there" : <>Buy ticket <IconArrowUpRight size={16} /></>}
              </button>
            </Reveal>
          ))}
        </div>
      </section>

      <section aria-label="Sponsors" className="border-y border-border py-12">
        <p className="mb-6 text-center font-mono text-[11px] tracking-widest text-muted-foreground uppercase">Made possible by</p>
        <Marquee label="Sponsors" duration={34}>
          {sponsors.map((sponsor) => (
            <span key={sponsor} className="mx-12 text-2xl font-semibold tracking-tight text-muted-foreground">{sponsor}</span>
          ))}
        </Marquee>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-8 sm:px-10">
        <FaqSection
          questions={[
            { id: "where", question: "Where is it?", answer: `At the Fenix warehouse on the Katendrecht pier in ${city}, ten minutes by water taxi from Rotterdam Centraal.` },
            { id: "remote", question: "Can I watch online?", answer: "Every talk is recorded and sent to ticket holders a week later. The workshops are not recorded." },
            { id: "team", question: "Do you have group prices?", answer: "Five tickets or more get 15% off. Write to us and we send an invoice." },
          ]}
        />
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-wrap justify-between gap-4 px-6 py-8 text-xs text-muted-foreground sm:px-10">
          <span className="font-mono text-foreground">{name.toUpperCase()}</span>
          <span>{dates} · {city}</span>
        </div>
      </footer>
    </div>
  );
}
