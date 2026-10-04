"use client";
import { useState, type FormEvent } from "react";

import { FilmGrain } from "@rhs-ui/backgrounds/film-grain";
import { IconBookOpen, IconClock, IconPhone, IconPin } from "@rhs-ui/icons";
import { Reveal } from "@rhs-ui/motion/reveal";
import { TextReveal } from "@rhs-ui/motion/text-reveal";
import { Button } from "@rhs-ui/primitives/button";
import { DatePicker } from "@rhs-ui/primitives/date-picker";
import { DescriptionList } from "@rhs-ui/primitives/description-list";
import { Label } from "@rhs-ui/primitives/label";
import { NumberInput } from "@rhs-ui/primitives/number-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@rhs-ui/primitives/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@rhs-ui/primitives/tabs";

export interface Dish {
  name: string;
  description: string;
  price: string;
  tag?: string;
}

export interface RestaurantProps {
  name?: string;
  city?: string;
  menu?: Readonly<Record<string, readonly Dish[]>>;
  hours?: readonly { term: string; value: string }[];
  times?: readonly string[];
  /** Called with the booking; resolve to confirm it on the page. */
  onReserve?: (booking: { date: string; time: string; guests: number }) => Promise<void> | void;
}

const MENU: Record<string, Dish[]> = {
  Starters: [
    { name: "Charred leeks", description: "Hazelnut, brown butter, aged sheep's cheese", price: "€14" },
    { name: "Beetroot tartare", description: "Smoked yoghurt, rye crumb, dill oil", price: "€13", tag: "Vegetarian" },
    { name: "Scallop crudo", description: "Blood orange, fennel, green chilli", price: "€18" },
  ],
  Mains: [
    { name: "Wood-fired hake", description: "Mussels, saffron, sea herbs", price: "€32" },
    { name: "Aged beef rib", description: "Bone marrow, charred shallot, jus", price: "€38" },
    { name: "Celeriac steak", description: "Truffle, pickled walnut, parsley root", price: "€26", tag: "Vegan" },
  ],
  Desserts: [
    { name: "Burnt honey tart", description: "Crème fraîche, thyme", price: "€11" },
    { name: "Dark chocolate", description: "Olive oil, sea salt, sourdough", price: "€12" },
  ],
};

const HOURS = [
  { term: "Tuesday to Thursday", value: "17:30 to 22:00" },
  { term: "Friday and Saturday", value: "17:30 to 23:00" },
  { term: "Sunday", value: "12:00 to 21:00" },
  { term: "Monday", value: "Closed" },
];

/**
 * A restaurant's home: a warm grainy hero, the story in a line, the menu in
 * tabs, a real reservation form (date, time, guests) that confirms in place,
 * and hours and address to finish.
 */
export function Restaurant({ name = "Olive & Ash", city = "Utrecht", menu = MENU, hours = HOURS, times = ["17:30", "18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00"], onReserve }: RestaurantProps): React.JSX.Element {
  const [date, setDate] = useState<Date | null>(null);
  const [time, setTime] = useState("");
  const [guests, setGuests] = useState(2);
  const [state, setState] = useState<"idle" | "sending" | "done" | "missing">("idle");
  const reserve = async (event: FormEvent) => {
    event.preventDefault();
    if (!date || !time) return setState("missing");
    setState("sending");
    const day = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    await onReserve?.({ date: day, time, guests });
    setState("done");
  };
  const sections = Object.keys(menu);
  return (
    <div data-slot="restaurant" className="bg-background text-foreground">
      <FilmGrain className="dark bg-background text-foreground [&>canvas]:opacity-60">
        <nav aria-label="Restaurant" className="mx-auto flex max-w-6xl items-center justify-between px-6 py-7 text-sm sm:px-10">
          <a href="#restaurant-top" className="font-serif text-xl italic tracking-tight">{name}</a>
          <div className="hidden gap-8 opacity-75 sm:flex">
            <a href="#restaurant-menu">Menu</a>
            <a href="#restaurant-visit">Visit</a>
          </div>
          <a href="#restaurant-book" className="rounded-full border border-foreground/40 px-5 py-2">Book a table</a>
        </nav>
        <header id="restaurant-top" className="mx-auto max-w-6xl px-6 pt-24 pb-32 sm:px-10">
          <p className="font-mono text-[11px] tracking-[0.3em] uppercase opacity-60">Wood fire kitchen · {city}</p>
          <h1 className="mt-8 max-w-4xl font-serif text-6xl leading-[0.95] tracking-tight sm:text-8xl">
            Cooked over fire,
            <br />
            <em className="opacity-60">served slowly.</em>
          </h1>
          <div className="mt-12 flex flex-wrap items-center gap-6 text-sm">
            <a href="#restaurant-book" className="rounded-full bg-foreground px-7 py-3.5 text-background">Reserve a table</a>
            <span className="flex items-center gap-2 opacity-70">
              <IconClock size={16} /> Tonight from 17:30
            </span>
          </div>
        </header>
      </FilmGrain>

      <section className="mx-auto max-w-4xl px-6 py-24 sm:px-10">
        <TextReveal as="p" className="text-center font-serif text-3xl leading-snug sm:text-4xl" text="Twelve tables, one fire and a menu that changes with what the farmers bring on Tuesday. Nothing is rushed, and everything is cooked in front of you." />
      </section>

      <section id="restaurant-menu" className="scroll-mt-6 border-y border-border bg-muted/40">
        <div className="mx-auto max-w-4xl px-6 py-20 sm:px-10">
          <Reveal className="text-center">
            <IconBookOpen size={28} className="mx-auto text-muted-foreground" />
            <h2 className="mt-4 font-serif text-5xl tracking-tight">The menu</h2>
            <p className="mt-3 text-sm text-muted-foreground">Autumn, from 24 September. Tell us about allergies when you book.</p>
          </Reveal>
          <Tabs defaultValue={sections[0]} className="mt-12">
            <TabsList className="mx-auto">
              {sections.map((section) => (
                <TabsTrigger key={section} value={section}>{section}</TabsTrigger>
              ))}
            </TabsList>
            {sections.map((section) => (
              <TabsContent key={section} value={section} className="mt-10">
                <ul className="grid gap-8">
                  {menu[section]!.map((dish) => (
                    <li key={dish.name} className="grid gap-1">
                      <div className="flex items-baseline gap-3">
                        <span className="font-serif text-2xl">{dish.name}</span>
                        {dish.tag ? <span className="rounded-full border border-border px-2 py-0.5 text-[10px] tracking-wide uppercase text-muted-foreground">{dish.tag}</span> : null}
                        <span aria-hidden="true" className="mx-1 flex-1 translate-y-[-4px] border-b border-dotted border-muted-foreground/40" />
                        <span className="font-mono text-sm tabular-nums">{dish.price}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{dish.description}</p>
                    </li>
                  ))}
                </ul>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </section>

      <section id="restaurant-book" className="mx-auto grid max-w-6xl scroll-mt-6 gap-12 overflow-x-clip px-6 py-24 sm:px-10 lg:grid-cols-[1fr_1.1fr]">
        <Reveal effect="slide-right">
          <p className="font-mono text-[11px] tracking-[0.3em] text-muted-foreground uppercase">Reservations</p>
          <h2 className="mt-5 font-serif text-5xl leading-tight tracking-tight">A table by the fire.</h2>
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-muted-foreground">
            We hold two seats at the counter for walk-ins every night. For groups of more than eight, call us and we will cook something together.
          </p>
          <p className="mt-8 flex items-center gap-2 text-sm">
            <IconPhone size={16} /> 030 123 45 67
          </p>
        </Reveal>
        <Reveal effect="slide-left">
          {state === "done" ? (
            <div role="status" className="grid h-full place-content-center gap-3 rounded-2xl border border-border p-10 text-center">
              <p className="font-serif text-3xl">See you soon.</p>
              <p className="text-sm text-muted-foreground">
                Table for {guests} at {time}. A confirmation is on its way.
              </p>
            </div>
          ) : (
            <form onSubmit={reserve} className="grid gap-5 rounded-2xl border border-border p-7 sm:p-9">
              <div className="grid gap-2">
                <Label htmlFor="restaurant-date">Date</Label>
                <DatePicker id="restaurant-date" value={date} onValueChange={setDate} placeholder="Choose a day" />
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="restaurant-time">Time</Label>
                  <Select value={time} onValueChange={setTime}>
                    <SelectTrigger id="restaurant-time" className="w-full">
                      <SelectValue placeholder="Choose a time" />
                    </SelectTrigger>
                    <SelectContent>
                      {times.map((slot) => (
                        <SelectItem key={slot} value={slot}>{slot}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="restaurant-guests">Guests</Label>
                  <NumberInput id="restaurant-guests" value={guests} onValueChange={setGuests} min={1} max={8} className="w-full" />
                </div>
              </div>
              <p aria-live="polite" className="min-h-4 text-xs text-destructive">{state === "missing" ? "Choose a day and a time first." : ""}</p>
              <Button type="submit" size="lg" loading={state === "sending"} className="rounded-full">Reserve</Button>
            </form>
          )}
        </Reveal>
      </section>

      <section id="restaurant-visit" className="scroll-mt-6 border-t border-border">
        <div className="mx-auto grid max-w-6xl gap-12 px-6 py-20 sm:px-10 md:grid-cols-2">
          <Reveal>
            <h2 className="flex items-center gap-3 font-serif text-3xl">
              <IconClock size={22} /> Opening hours
            </h2>
            <DescriptionList className="mt-6" items={hours} />
          </Reveal>
          <Reveal order={1}>
            <h2 className="flex items-center gap-3 font-serif text-3xl">
              <IconPin size={22} /> Find us
            </h2>
            <address className="mt-6 grid gap-1 text-sm not-italic leading-relaxed">
              <span>Oudegracht 118</span>
              <span>3511 AZ {city}</span>
              <span className="mt-3 text-muted-foreground">Five minutes from the central station, on the wharf level by the canal.</span>
            </address>
          </Reveal>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-wrap justify-between gap-4 px-6 py-8 text-xs text-muted-foreground sm:px-10">
          <span className="font-serif text-base italic text-foreground">{name}</span>
          <span>© 2026 · Instagram · Gift cards</span>
        </div>
      </footer>
    </div>
  );
}
