"use client";

import { useState } from "react";

import { EmptyState } from "@rhs-ui/application/empty-state";
import { MobileTabShell } from "@rhs-ui/application/mobile-tab-shell";
import { IconBell, IconBookmark, IconChevronRight, IconCompass, IconInbox, IconPlus, IconSearch, IconSuitcase, IconUser } from "@rhs-ui/icons";
import { Avatar, AvatarFallback } from "@rhs-ui/primitives/avatar";
import { Button } from "@rhs-ui/primitives/button";
import { NotificationBadge } from "@rhs-ui/primitives/notification-badge";

type Scene = "mountains" | "dunes" | "city" | "gate" | "coast";
const SCENES: Record<Scene, string> = {
  mountains:
    "<circle cx='312' cy='88' r='30' fill='SH' opacity='.35'/><path d='M0 232L96 116 156 176 236 70 336 204 400 150V300H0Z' fill='FG'/><path d='M236 70L270 118 246 112 232 134 214 108Z' fill='BG' opacity='.7'/><path d='M0 252Q100 232 200 252T400 246V300H0Z' fill='SH'/>",
  dunes: "<circle cx='296' cy='92' r='34' fill='SH' opacity='.35'/><path d='M0 214Q100 150 200 208T400 192V300H0Z' fill='FG'/><path d='M0 256Q120 210 240 258T400 244V300H0Z' fill='SH'/>",
  city: "<path d='M0 190Q120 140 240 175T400 150V300H0Z' fill='FG' opacity='.55'/><g fill='FG'><rect x='34' y='170' width='62' height='130'/><rect x='104' y='134' width='56' height='166'/><rect x='168' y='186' width='70' height='114'/><rect x='246' y='150' width='60' height='150'/><rect x='314' y='194' width='60' height='106'/></g><g fill='BG' opacity='.75'><rect x='48' y='190' width='10' height='14'/><rect x='72' y='190' width='10' height='14'/><rect x='118' y='154' width='10' height='14'/><rect x='138' y='154' width='10' height='14'/><rect x='260' y='170' width='10' height='14'/><rect x='282' y='170' width='10' height='14'/></g><rect x='0' y='262' width='400' height='38' fill='SH'/>",
  gate: "<path d='M0 226L110 130 190 196 270 112 400 226V300H0Z' fill='FG' opacity='.6'/><rect x='106' y='120' width='14' height='150' fill='SH'/><rect x='280' y='120' width='14' height='150' fill='SH'/><path d='M76 108Q200 146 324 108V132Q200 170 76 132Z' fill='SH'/><rect x='96' y='162' width='208' height='12' fill='SH'/><rect x='0' y='262' width='400' height='38' fill='FG'/>",
  coast: "<circle cx='96' cy='84' r='26' fill='SH' opacity='.3'/><path d='M0 210H400V300H0Z' fill='SH' opacity='.45'/><path d='M40 214Q130 120 230 214Z' fill='FG'/><path d='M200 220Q290 150 380 220Z' fill='SH'/><path d='M0 250Q100 238 200 250T400 246V300H0Z' fill='FG' opacity='.7'/>",
};
const TINTS = [
  { bg: "#e7e4dd", fg: "#a39d8f", sh: "#6f6a5f" },
  { bg: "#dfe3e6", fg: "#97a1ab", sh: "#586470" },
  { bg: "#e9e7e3", fg: "#b2aba1", sh: "#7a746a" },
  { bg: "#dcdfe2", fg: "#7d868e", sh: "#454b52" },
] as const;
const scene = (kind: Scene, tint: number) => {
  const t = TINTS[tint % TINTS.length]!;
  const body = SCENES[kind].replaceAll("FG", t.fg).replaceAll("SH", t.sh).replaceAll("BG", t.bg);
  return "data:image/svg+xml;utf8," + encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'><rect width='400' height='300' fill='${t.bg}'/>${body}</svg>`);
};

const PLACES = [
  { name: "Lofoten", country: "Norway", nights: 6, price: 940, scene: "mountains", tint: 1 },
  { name: "Marrakech", country: "Morocco", nights: 4, price: 520, scene: "dunes", tint: 0 },
  { name: "Lisbon", country: "Portugal", nights: 5, price: 610, scene: "city", tint: 2 },
  { name: "Kyoto", country: "Japan", nights: 9, price: 1480, scene: "gate", tint: 3 },
  { name: "Faroe Islands", country: "Denmark", nights: 5, price: 880, scene: "coast", tint: 1 },
  { name: "Dolomites", country: "Italy", nights: 6, price: 760, scene: "mountains", tint: 3 },
] as const;

const TRIPS = [
  { id: "lisbon", name: "Lisbon", dates: "14 to 19 Nov", note: "In 19 days", scene: "city", tint: 2, days: [["Fri 14", "Arrive, tram 28 to Alfama, dinner at Taberna da Rua"], ["Sat 15", "Belem, pastries, the maritime museum"], ["Sun 16", "Day trip to Sintra by train"], ["Mon 17", "LX Factory, a long lunch"]] },
  { id: "faroe", name: "Faroe Islands", dates: "6 to 11 Mar", note: "In 4 months", scene: "coast", tint: 1, days: [["Fri 6", "Fly to Vagar, collect the car"], ["Sat 7", "Gasadalur and the waterfall"], ["Sun 8", "Ferry to Mykines"]] },
] as const;

const MESSAGES = [
  { from: "Casa do Largo", text: "Your check-in details for 14 November are ready.", time: "9:12", unread: true },
  { from: "Northwind Trips", text: "Two seats left on the Sintra train on Sunday morning.", time: "Yesterday", unread: true },
  { from: "Atlantic Rail", text: "Your booking confirmation and tickets.", time: "Mon", unread: true },
  { from: "Ana Reyes", text: "Sent you my list of places to eat in Alfama.", time: "Sun", unread: false },
];

export default function Demo(): React.JSX.Element {
  const [tab, setTab] = useState("explore");
  const [tripId, setTripId] = useState<string | null>(null);
  const trip = TRIPS.find((entry) => entry.id === tripId);

  const open = (id: string) => {
    setTab(id);
    setTripId(null);
  };

  const title = trip ? trip.name : { explore: "Explore", trips: "Trips", saved: "Saved", inbox: "Inbox", profile: "Profile" }[tab] ?? "Explore";

  return (
    <MobileTabShell
      mainId="tabs-main"
      className="md:h-[calc(100dvh-6rem)]"
      title={title}
      titleAs="h2"
      screenKey={trip ? `trip-${trip.id}` : tab}
      onBack={trip ? () => setTripId(null) : undefined}
      actions={
        trip ? undefined : (
          <>
            <Button variant="ghost" size="icon" aria-label="Search">
              <IconSearch className="size-5" />
            </Button>
            {/* An aria-label replaces everything inside the button, the badge's spoken count included, so the count goes into the name. */}
            <Button variant="ghost" size="icon" aria-label="Notifications, 3 unread">
              <NotificationBadge label="unread notifications" count={3}>
                <IconBell className="size-5" />
              </NotificationBadge>
            </Button>
          </>
        )
      }
      tabs={[
        { id: "explore", label: "Explore", icon: <IconCompass /> },
        { id: "trips", label: "Trips", icon: <IconSuitcase /> },
        { id: "saved", label: "Saved", icon: <IconBookmark /> },
        { id: "inbox", label: "Inbox", icon: <IconInbox />, badge: 3 },
        { id: "profile", label: "Profile", icon: <IconUser /> },
      ]}
      activeTab={tab}
      onTabChange={open}
      fab={
        tab === "explore" ? (
          <Button size="icon" aria-label="Plan a trip" className="size-14 rounded-full shadow-sm [&_svg]:size-6">
            <IconPlus />
          </Button>
        ) : undefined
      }
    >
      {tab === "explore" ? (
        <div className="grid gap-4">
          <p className="-mt-2 text-sm text-muted-foreground">Places our travellers are booking for the coming weeks.</p>
          {PLACES.map((place) => (
            <article key={place.name} className="overflow-hidden rounded-2xl border border-border bg-card">
              <img src={scene(place.scene, place.tint)} alt="" width={400} height={300} loading="lazy" className="aspect-[16/10] w-full object-cover" />
              <div className="flex items-start justify-between gap-3 p-3.5">
                <div className="min-w-0">
                  <h3 className="truncate text-[0.9375rem] font-semibold">{place.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {place.country} · {place.nights} nights
                  </p>
                </div>
                <p className="shrink-0 text-sm font-medium tabular-nums">from €{place.price}</p>
              </div>
            </article>
          ))}
        </div>
      ) : null}

      {tab === "trips" && !trip ? (
        <ul className="-mt-2 grid gap-3">
          {TRIPS.map((entry) => (
            <li key={entry.id}>
              <button type="button" onClick={() => setTripId(entry.id)} className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-2.5 text-left outline-none transition-colors duration-150 hover:bg-muted/50 focus-visible:ring-[3px] focus-visible:ring-ring/40">
                <img src={scene(entry.scene, entry.tint)} alt="" width={400} height={300} className="size-16 shrink-0 rounded-xl object-cover" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[0.9375rem] font-semibold">{entry.name}</span>
                  <span className="block text-sm text-muted-foreground">{entry.dates}</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">{entry.note}</span>
                </span>
                <IconChevronRight className="size-4 shrink-0 text-muted-foreground" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {trip ? (
        <ol className="-mt-2 grid gap-0">
          {trip.days.map(([day, plan]) => (
            <li key={day} className="flex gap-4 border-t border-border py-3.5 first:border-t-0">
              <span className="w-14 shrink-0 text-sm font-semibold whitespace-nowrap tabular-nums">{day}</span>
              <span className="text-sm leading-relaxed text-muted-foreground">{plan}</span>
            </li>
          ))}
        </ol>
      ) : null}

      {tab === "saved" ? (
        <EmptyState icon={<IconBookmark />} title="Nothing saved yet" description="Tap the bookmark on any place to keep it here for later.">
          <Button onClick={() => open("explore")}>Explore places</Button>
        </EmptyState>
      ) : null}

      {tab === "inbox" ? (
        <ul className="-mt-2 grid gap-0">
          {MESSAGES.map((message) => (
            <li key={message.from} className="flex items-start gap-3 border-t border-border py-3.5 first:border-t-0">
              <Avatar size="sm">
                <AvatarFallback>{message.from.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="flex items-baseline justify-between gap-3 text-sm">
                  <span className={message.unread ? "font-semibold" : "font-medium"}>{message.from}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">{message.time}</span>
                </p>
                <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">{message.text}</p>
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      {tab === "profile" ? (
        <div className="-mt-2 grid gap-5">
          <div className="flex items-center gap-3">
            <Avatar size="lg">
              <AvatarFallback>MO</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold">Mara Okafor</p>
              <p className="text-sm text-muted-foreground">mara@halcyon.studio</p>
            </div>
          </div>
          <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card text-sm">
            {["Passport and documents", "Payment methods", "Travel preferences", "Help and support"].map((row) => (
              <li key={row} className="flex items-center justify-between px-4 py-3.5">
                {row}
                <IconChevronRight className="size-4 text-muted-foreground" />
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </MobileTabShell>
  );
}
