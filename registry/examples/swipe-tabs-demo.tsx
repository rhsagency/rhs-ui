"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";

import { IconBed, IconChevronLeft, IconCloudSun, IconMoreHorizontal, IconPackage, IconPlane, IconShare, IconTruck } from "@rhs-ui/icons";
import { Badge } from "@rhs-ui/primitives/badge";
import { SwipeTabs, type SwipeTab } from "@rhs-ui/primitives/swipe-tabs";

/** A phone: a black bezel, the status bar and a screen. The app inside is laid out in the screen below the bar. */
function Phone({ children, caption, label }: { children: ReactNode; caption: string; label: string }): React.JSX.Element {
  return (
    <figure className="m-0 grid min-w-0 content-start justify-items-center gap-4">
      {/* The frame may be narrower than what is inside it (the tab bar scrolls), so a 320px page does not grow sideways. The 17rem floor keeps it from ever collapsing to nothing, which would reset the panels. */}
      <div className="w-full max-w-[19.5rem] min-w-[17rem] rounded-[2.75rem] bg-black p-1.5 ring-1 ring-border">
        <div className="relative overflow-hidden rounded-[2.25rem] bg-background">
          <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 z-30 flex h-11 items-center justify-between px-7 text-xs font-semibold text-foreground tabular-nums">
            <span>9:41</span>
            <span className="absolute top-2.5 left-1/2 h-6 w-24 -translate-x-1/2 rounded-full bg-black" />
            <span className="h-2.5 w-5 rounded-[3px] border border-foreground/70" />
          </div>
          <section aria-label={label} className="flex h-[34rem] flex-col pt-11">
            {children}
          </section>
        </div>
      </div>
      <figcaption className="max-w-[19.5rem] text-center text-xs leading-relaxed text-muted-foreground">{caption}</figcaption>
    </figure>
  );
}

/** The top of an app screen: a back button, a title and two actions. */
function AppBar({ title, subtitle, aside }: { title: string; subtitle: string; aside?: ReactNode }): React.JSX.Element {
  return (
    <header className="flex shrink-0 items-center gap-2 px-3 pt-1 pb-3">
      <span aria-hidden="true" className="grid size-8 shrink-0 place-items-center rounded-full text-foreground">
        <IconChevronLeft size={18} />
      </span>
      <div className="grid min-w-0 flex-1 gap-0.5">
        <h2 className="truncate text-[0.9375rem] leading-none font-semibold tracking-[-0.02em]">{title}</h2>
        <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
      </div>
      {aside ?? (
        <>
          <span aria-hidden="true" className="grid size-8 shrink-0 place-items-center rounded-full text-muted-foreground">
            <IconShare size={16} />
          </span>
          <span aria-hidden="true" className="grid size-8 shrink-0 place-items-center rounded-full text-muted-foreground">
            <IconMoreHorizontal size={16} />
          </span>
        </>
      )}
    </header>
  );
}

/** A picture drawn with shapes, so it follows the theme: a sun and two hills. */
function Scene({ tilt = 0, className }: { tilt?: number; className?: string }): React.JSX.Element {
  return (
    <div aria-hidden="true" className={`relative overflow-hidden bg-muted ${className ?? ""}`}>
      <span className="absolute top-[14%] right-[16%] aspect-square w-[14%] rounded-full bg-foreground/15" style={{ transform: `translateX(${tilt * -40}%)` }} />
      <span className="absolute -bottom-[34%] -left-[12%] h-[70%] w-[78%] rounded-[50%] bg-foreground/10" />
      <span className="absolute -right-[18%] -bottom-[40%] h-[74%] w-[84%] rounded-[50%] bg-foreground/[0.07]" style={{ transform: `translateY(${tilt * 10}%)` }} />
    </div>
  );
}

function Fact({ icon, title, line }: { icon: ReactNode; title: string; line: string }): React.JSX.Element {
  return (
    <li className="flex items-center gap-3 rounded-xl border border-border bg-card px-3.5 py-3">
      <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted text-foreground [&_svg]:size-[1.125rem]">
        {icon}
      </span>
      <div className="grid min-w-0 gap-0.5">
        <p className="truncate text-sm font-medium">{title}</p>
        <p className="truncate text-xs text-muted-foreground">{line}</p>
      </div>
    </li>
  );
}

function Overview(): React.JSX.Element {
  return (
    <div className="grid gap-4">
      <div className="relative">
        <Scene className="aspect-[16/10] rounded-2xl" />
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-3.5">
          <div className="grid gap-0.5">
            <p className="text-xs text-muted-foreground">12 to 15 March</p>
            <p className="text-xl leading-none font-semibold tracking-[-0.03em]">Lisbon</p>
          </div>
          <Badge variant="outline" className="bg-background/80">
            3 travellers
          </Badge>
        </div>
      </div>
      <ul className="m-0 grid list-none gap-2 p-0">
        <Fact icon={<IconPlane />} title="TP 1357 to Lisbon" line="Thu 12 Mar, 07:45 from AMS" />
        <Fact icon={<IconBed />} title="Casa do Largo" line="3 nights, Alfama" />
        <Fact icon={<IconCloudSun />} title="17° and light cloud" line="Dry all weekend" />
      </ul>
    </div>
  );
}

function Itinerary(): React.JSX.Element {
  const days: readonly (readonly [string, string, readonly (readonly [string, string])[]])[] = [
    ["Thu 12", "Arrive and Alfama", [["10:30", "Check in at Casa do Largo"], ["13:00", "Lunch at Tasca do Chico"], ["17:00", "Walk up to Miradouro da Graça"]]],
    ["Fri 13", "Belém and the river", [["09:30", "Pastéis at the old bakery"], ["11:00", "Jerónimos Monastery"], ["19:30", "Dinner, table for three"]]],
  ];
  return (
    <div className="grid gap-5">
      {days.map(([day, title, stops]) => (
        <section key={day} className="grid gap-2.5">
          <div className="flex items-baseline gap-2.5">
            <p className="text-xs font-medium text-muted-foreground">{day}</p>
            <h3 className="text-sm font-semibold tracking-[-0.01em]">{title}</h3>
          </div>
          <ol className="m-0 grid list-none gap-0 border-l border-border p-0">
            {stops.map(([time, what]) => (
              <li key={time} className="relative flex gap-3 py-2 pl-4 text-sm">
                <span aria-hidden="true" className="absolute top-[1.0625rem] -left-[3px] size-[5px] rounded-full bg-foreground" />
                <span className="w-11 shrink-0 text-xs text-muted-foreground tabular-nums">{time}</span>
                <span className="min-w-0">{what}</span>
              </li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}

function Photos(): React.JSX.Element {
  return (
    <div className="grid grid-cols-2 gap-2">
      {[0.2, 0.8, 0.5, 0.1, 0.9, 0.4].map((tilt, i) => (
        <Scene key={tilt} tilt={tilt} className={`rounded-xl ${i % 3 === 0 ? "aspect-[3/4]" : "aspect-square"} ${i === 1 ? "mt-6" : ""}`} />
      ))}
    </div>
  );
}

function Notes(): React.JSX.Element {
  const lines: readonly (readonly [string, string])[] = [
    ["Tram 28", "Go before 09:00, it is full by ten."],
    ["Reservations", "Dinner Friday at 19:30, name Okafor."],
    ["Pack", "A light jacket and shoes for cobbles."],
  ];
  return (
    <dl className="m-0 grid gap-2">
      {lines.map(([term, line]) => (
        <div key={term} className="rounded-xl border border-border bg-card px-3.5 py-3">
          <dt className="text-xs text-muted-foreground">{term}</dt>
          <dd className="mt-0.5 text-sm">{line}</dd>
        </div>
      ))}
    </dl>
  );
}

const TRIP_TABS: readonly SwipeTab[] = [
  { value: "overview", label: "Overview", content: <Overview /> },
  { value: "itinerary", label: "Itinerary", content: <Itinerary /> },
  { value: "photos", label: "Photos", content: <Photos /> },
  { value: "notes", label: "Notes", content: <Notes /> },
];

const ORDERS: readonly { id: string; who: string; total: string; status: string; when: string }[] = [
  { id: "48212", who: "Mara Okafor", total: "€128.00", status: "Open", when: "Today" },
  { id: "48209", who: "Jonas Lindqvist", total: "€64.50", status: "Open", when: "Today" },
  { id: "48204", who: "Priya Raman", total: "€212.90", status: "Shipped", when: "Yesterday" },
  { id: "48199", who: "Tomasz Wrona", total: "€38.00", status: "Shipped", when: "Yesterday" },
  { id: "48191", who: "Lena Hartmann", total: "€96.40", status: "Delivered", when: "Mon" },
  { id: "48188", who: "Daan Verhoeven", total: "€54.00", status: "Delivered", when: "Mon" },
  { id: "48180", who: "Amara Nwosu", total: "€310.00", status: "Delivered", when: "Sun" },
  { id: "48176", who: "Soren Aalto", total: "€72.80", status: "Returned", when: "Sat" },
  { id: "48171", who: "Ines Carvalho", total: "€129.00", status: "Cancelled", when: "Fri" },
  { id: "48166", who: "Hugo Brandt", total: "€88.20", status: "Delivered", when: "Fri" },
];

function OrderList({ status }: { status?: string }): React.JSX.Element {
  const rows = status ? ORDERS.filter((order) => order.status === status) : ORDERS;
  return (
    <ul className="m-0 grid list-none gap-0 p-0">
      {rows.map((order) => (
        <li key={order.id} className="flex items-center gap-3 border-b border-border py-3 last:border-b-0">
          <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground">
            {order.status === "Shipped" ? <IconTruck size={16} /> : <IconPackage size={16} />}
          </span>
          <div className="grid min-w-0 flex-1 gap-0.5">
            <p className="truncate text-sm font-medium">{order.who}</p>
            <p className="truncate text-xs text-muted-foreground tabular-nums">
              #{order.id} · {order.when}
            </p>
          </div>
          <div className="grid shrink-0 justify-items-end gap-0.5">
            <p className="text-sm tabular-nums">{order.total}</p>
            <p className="text-xs text-muted-foreground">{order.status}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

/** Counts itself in while it is mounted, so the screen can show how many panels exist right now. */
function Probe({ onChange }: { onChange: (delta: 1 | -1) => void }): null {
  useEffect(() => {
    onChange(1);
    return () => onChange(-1);
  }, [onChange]);
  return null;
}

const STATUSES = ["All", "Open", "Shipped", "Delivered", "Returned", "Cancelled"] as const;

function Orders(): React.JSX.Element {
  const [mounted, setMounted] = useState(0);
  const count = useCallback((delta: 1 | -1) => setMounted((now) => now + delta), []);
  const tabs: readonly SwipeTab[] = STATUSES.map((status) => ({
    value: status.toLowerCase(),
    label: status,
    content: (
      <>
        <Probe onChange={count} />
        <OrderList status={status === "All" ? undefined : status} />
      </>
    ),
  }));
  return (
    <>
      <AppBar
        title="Orders"
        subtitle="Northwind Store"
        aside={
          <Badge variant="muted" className="tabular-nums">
            {mounted} of {STATUSES.length} mounted
          </Badge>
        }
      />
      <SwipeTabs label="Order status" tabs={tabs} lazy defaultValue="delivered" className="min-h-0 flex-1" />
    </>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto grid w-full max-w-4xl gap-x-8 gap-y-12 px-4 py-10 sm:px-6 md:grid-cols-2">
      <Phone label="Trip screen" caption="Swipe the panels (a finger, or two on a trackpad) or tap a tab: the underline follows, and each label takes the selected colour as it arrives. With a mouse, click, or press Left and Right.">
        <AppBar title="Lisbon long weekend" subtitle="12 to 15 March" />
        <SwipeTabs label="Trip" tabs={TRIP_TABS} defaultValue="itinerary" className="min-h-0 flex-1" />
      </Phone>
      <Phone label="Orders screen" caption="Many tabs scroll the bar and keep the line in view. lazy: only the open panel and its neighbours exist, as the count shows.">
        <Orders />
      </Phone>
    </div>
  );
}
