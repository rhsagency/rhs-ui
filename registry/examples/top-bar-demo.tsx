"use client";

import { useEffect, useRef, type ReactNode } from "react";

import { IconDownload, IconEdit, IconFilter, IconHeart, IconPlus, IconSearch, IconShare, IconTrash } from "@rhs-ui/icons";
import { TopBar, type TopBarAction } from "@rhs-ui/primitives/top-bar";

const ORDERS = [
  { id: 48194, who: "Mara Okafor", total: "66.90", status: "Paid", when: "Today, 09:41" },
  { id: 48193, who: "Jonas Lindqvist", total: "119.90", status: "Shipped", when: "Today, 08:15" },
  { id: 48192, who: "Priya Raman", total: "172.90", status: "Paid", when: "Yesterday" },
  { id: 48191, who: "Tomasz Wrona", total: "225.90", status: "Refunded", when: "Yesterday" },
  { id: 48190, who: "Lena Hartmann", total: "38.00", status: "Shipped", when: "Mon" },
  { id: 48189, who: "Daan Verhoeven", total: "94.50", status: "Paid", when: "Mon" },
  { id: 48188, who: "Amara Nwosu", total: "310.00", status: "Pending", when: "Sun" },
  { id: 48187, who: "Soren Aalto", total: "57.40", status: "Shipped", when: "Sun" },
  { id: 48186, who: "Ines Carvalho", total: "129.00", status: "Paid", when: "Sat" },
  { id: 48185, who: "Hugo Brandt", total: "88.20", status: "Shipped", when: "Fri" },
  { id: 48184, who: "Mei Tanaka", total: "46.80", status: "Paid", when: "Fri" },
  { id: 48183, who: "Oskar Lund", total: "204.00", status: "Refunded", when: "Thu" },
];

const initials = (name: string): string =>
  name
    .split(" ")
    .map((part) => part[0])
    .join("");

function Orders(): React.JSX.Element {
  return (
    <ul className="divide-y divide-border">
      {ORDERS.map((order) => (
        <li key={order.id} className="flex items-center gap-3 px-4 py-3">
          <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-full border border-border bg-muted text-[0.6875rem] font-medium text-muted-foreground">
            {initials(order.who)}
          </span>
          <span className="grid min-w-0 flex-1 gap-0.5">
            <span className="truncate text-sm font-medium">{order.who}</span>
            <span className="truncate text-xs text-muted-foreground tabular-nums">
              #{order.id} · {order.when}
            </span>
          </span>
          <span className="grid shrink-0 justify-items-end gap-0.5">
            <span className="text-sm tabular-nums">{order.total}</span>
            <span className="text-xs text-muted-foreground">{order.status}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

/** A listing: a picture, three facts and some text, drawn with blocks. */
function Listing(): React.JSX.Element {
  return (
    <div className="grid gap-5 px-4 pt-3 pb-8">
      <div className="aspect-[4/3] rounded-xl bg-muted" />
      <dl className="grid grid-cols-3 gap-2 text-center">
        {[
          ["74 m²", "Living area"],
          ["2", "Bedrooms"],
          ["1 Mar", "Available"],
        ].map(([value, term]) => (
          <div key={term} className="rounded-lg border border-border px-2 py-3">
            <dd className="m-0 text-base font-semibold tracking-[-0.02em] tabular-nums">{value}</dd>
            <dt className="mt-0.5 text-xs text-muted-foreground">{term}</dt>
          </div>
        ))}
      </dl>
      <p className="m-0 text-sm leading-relaxed text-muted-foreground">Light on three sides, a kitchen with an island, and a balcony that faces the quay. Underfloor heating throughout and a storage room in the basement.</p>
      <div className="grid gap-2">
        <div className="h-3 w-full rounded-full bg-muted" />
        <div className="h-3 w-5/6 rounded-full bg-muted" />
        <div className="h-3 w-2/3 rounded-full bg-muted" />
      </div>
    </div>
  );
}

/** A phone: a black bezel, the status bar and a screen that scrolls. It sets `--top-bar-inset`, the room a notch takes, which the bar keeps clear of. */
function Phone({ children, caption, label, scrolled = 0 }: { children: ReactNode; caption: string; label: string; scrolled?: number }): React.JSX.Element {
  const screen = useRef<HTMLElement>(null);
  useEffect(() => {
    if (scrolled && screen.current) screen.current.scrollTop = scrolled;
  }, [scrolled]);
  return (
    <figure className="m-0 grid min-w-0 content-start justify-items-center gap-4">
      <div className="w-full max-w-[19.5rem] rounded-[2.75rem] bg-black p-1.5 ring-1 ring-border">
        <div className="relative overflow-hidden rounded-[2.25rem] bg-background" style={{ "--top-bar-inset": "2.75rem" } as React.CSSProperties}>
          <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 z-30 flex h-11 items-center justify-between px-7 text-xs font-semibold text-foreground tabular-nums">
            <span>9:41</span>
            <span className="absolute top-2.5 left-1/2 h-6 w-24 -translate-x-1/2 rounded-full bg-black" />
            <span className="h-2.5 w-5 rounded-[3px] border border-foreground/70" />
          </div>
          {/* A named section, so the bar's header is not mistaken for the banner of the whole page. */}
          <section ref={screen} aria-label={label} className="relative h-[34rem] overflow-x-hidden overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {children}
          </section>
        </div>
      </div>
      <figcaption className="max-w-[19.5rem] text-center text-xs leading-relaxed text-muted-foreground">{caption}</figcaption>
    </figure>
  );
}

const LIST_ACTIONS: readonly TopBarAction[] = [
  { id: "search", label: "Search orders", icon: <IconSearch />, priority: 2 },
  { id: "filter", label: "Filter orders", icon: <IconFilter />, priority: 1 },
  { id: "new", label: "New order", icon: <IconPlus />, pinned: true },
];

const LISTING_ACTIONS: readonly TopBarAction[] = [
  { id: "share", label: "Share", icon: <IconShare />, priority: 3 },
  { id: "save", label: "Save to favourites", icon: <IconHeart />, priority: 2 },
  { id: "download", label: "Download the brochure", icon: <IconDownload />, priority: 1 },
  { id: "edit", label: "Edit listing", icon: <IconEdit />, priority: 1 },
  { id: "delete", label: "Delete listing", icon: <IconTrash />, destructive: true, priority: 0 },
];

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto grid w-full max-w-5xl gap-x-6 gap-y-12 px-4 py-10 sm:px-6 md:grid-cols-3">
      <Phone label="Orders screen" caption="large: the big title is the heading of the page. Scroll, and it settles into the bar.">
        <TopBar as="h2" large title="Orders" subtitle="Northwind Store, 1,237 in total" actions={LIST_ACTIONS} />
        <Orders />
      </Phone>
      <Phone label="Orders screen, scrolled" scrolled={110} caption="Scrolled 110px: the bar's own title has faded in and the border appears, because content now goes under it.">
        <TopBar as="h2" large title="Orders" subtitle="Northwind Store, 1,237 in total" actions={LIST_ACTIONS} />
        <Orders />
      </Phone>
      <Phone label="Listing screen" caption="Back button, subtitle, five actions. There is no room for them all, so the least needed fold into the menu before the title is cut.">
        <TopBar as="h2" title="Halcyon Quay, 4B" subtitle="Amsterdam, 74 m²" onBack={() => undefined} backLabel="Back to listings" actions={LISTING_ACTIONS} />
        <Listing />
      </Phone>
    </div>
  );
}
