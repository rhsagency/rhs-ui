"use client";

import { useState, type CSSProperties, type ReactNode } from "react";

import { AdaptiveNav, useAdaptiveNavForm, type AdaptiveNavItem, type NavForm } from "@rhs-ui/application/adaptive-nav";
import { IconChart, IconChevronsUpDown, IconHelp, IconHome, IconPackage, IconReceipt, IconSettings, IconUsers } from "@rhs-ui/icons";
import { Avatar, AvatarFallback } from "@rhs-ui/primitives/avatar";
import { cn } from "@/lib/utils";

export default function Demo(): React.JSX.Element {
  return (
    <div className="w-full px-4 py-10 sm:px-6">
      <div className="mx-auto grid max-w-4xl grid-cols-1 gap-12">
        <Case caption="One list of destinations, three shapes. This frame is as wide as the room: a sidebar with groups. Drag its bottom-right corner to make it narrower, and the navigation changes shape at 600 and 840 pixels of its own width, with focus staying on the same item.">
          <Frame name="Main, resizable" className="h-[34rem] min-w-[min(20rem,100%)] resize-x" style={{ width: "100%" }} />
        </Case>
        <Case caption="Medium, from 600 to 839 pixels: a rail of icons with tooltips and the same current item marked. The workspace and the account shrink to their marks. In a window narrower than that this frame is a bar, because it measures itself.">
          <Frame name="Main, medium" className="h-[31rem] w-[40rem]" initial="orders" />
        </Case>
        <Case caption="Compact: a bar along the bottom with the first four destinations and More, a sheet with the rest, the workspace and the account. Orders has a count, and when the current page waits in the sheet, More says so.">
          <Frame name="Main, compact" className="h-[32rem] w-[22.5rem]" initial="orders" />
        </Case>
      </div>
    </div>
  );
}

function Case({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-1 content-start gap-3">
      <p className="max-w-3xl text-xs leading-relaxed text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

function Frame({ name, className, style, initial = "overview" }: { name: string; className?: string; style?: CSSProperties; initial?: string }): React.JSX.Element {
  const [current, setCurrent] = useState(initial);
  return (
    <div className={cn("max-w-full overflow-hidden rounded-xl border border-border shadow-xs", className)} style={style}>
      <AdaptiveNav
        className="h-full"
        labels={{ nav: name }}
        items={ITEMS}
        current={current}
        onNavigate={(item, event) => {
          event.preventDefault();
          setCurrent(item.id);
        }}
        header={<Workspace />}
        footer={<Account />}
      >
        <Page id={current} />
      </AdaptiveNav>
    </div>
  );
}

const ITEMS: readonly AdaptiveNavItem[] = [
  { id: "overview", label: "Overview", href: "#overview", icon: <IconHome />, group: "Store" },
  { id: "orders", label: "Orders", href: "#orders", icon: <IconReceipt />, badge: 12, badgeLabel: "open orders", group: "Store" },
  { id: "customers", label: "Customers", href: "#customers", icon: <IconUsers />, group: "Store" },
  { id: "products", label: "Products", href: "#products", icon: <IconPackage />, group: "Store" },
  { id: "analytics", label: "Analytics", href: "#analytics", icon: <IconChart />, group: "Insights" },
  { id: "settings", label: "Settings", href: "#settings", icon: <IconSettings />, group: "Account" },
  { id: "help", label: "Help", href: "#help", icon: <IconHelp />, group: "Account" },
];

/** The brand slot: a mark and a name, and only the mark in a rail. */
function Workspace(): React.JSX.Element {
  const form = useAdaptiveNavForm();
  return (
    <button
      type="button"
      className={cn(
        "flex items-center gap-2.5 rounded-lg text-left outline-none transition-colors duration-150 hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/40",
        form === "rail" ? "size-10 justify-center" : "w-full p-1.5",
      )}
    >
      <span aria-hidden="true" className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground">
        H
      </span>
      {form === "rail" ? (
        <span className="sr-only">Halcyon Store, switch workspace</span>
      ) : (
        <>
          <span className="grid min-w-0 flex-1">
            <span className="truncate text-sm leading-tight font-semibold tracking-[-0.01em]">Halcyon Store</span>
            <span className="truncate text-xs text-muted-foreground">Studio plan</span>
          </span>
          <IconChevronsUpDown aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
          <span className="sr-only">, switch workspace</span>
        </>
      )}
    </button>
  );
}

/** The account slot: who is signed in, and only their initials in a rail. */
function Account(): React.JSX.Element {
  const form = useAdaptiveNavForm();
  return (
    <div className={cn("flex items-center gap-2.5", form === "rail" && "justify-center")}>
      <Avatar size="sm" aria-hidden="true">
        <AvatarFallback>MV</AvatarFallback>
      </Avatar>
      {form === "rail" ? (
        <span className="sr-only">Mara Veld, signed in</span>
      ) : (
        <span className="grid min-w-0 flex-1">
          <span className="truncate text-sm leading-tight font-medium">Mara Veld</span>
          <span className="truncate text-xs text-muted-foreground">mara@halcyon.store</span>
        </span>
      )}
    </div>
  );
}

const FORMS: Record<NavForm, string> = { sidebar: "Sidebar", rail: "Rail", bar: "Bottom bar" };

interface PageData {
  title: string;
  blurb: string;
  rows: readonly [string, string, string][];
}

const PAGES: Record<string, PageData> = {
  overview: {
    title: "Overview",
    blurb: "How Halcyon Store is doing today.",
    rows: [
      ["Revenue", "8% up on last Monday", "€4,820"],
      ["Orders", "12 waiting to ship", "46"],
      ["Returns", "2 need a decision", "3"],
    ],
  },
  orders: {
    title: "Orders",
    blurb: "Newest first. Twelve are still open.",
    rows: [
      ["#1042 · Noor Bakker", "Paid, ready to ship", "€128.00"],
      ["#1041 · Daan Visser", "Being packed", "€64.50"],
      ["#1040 · Eva Smit", "Shipped this morning", "€212.00"],
    ],
  },
  customers: {
    title: "Customers",
    blurb: "People who ordered in the last 90 days.",
    rows: [
      ["Noor Bakker", "3 orders, since March", "€512.40"],
      ["Daan Visser", "1 order", "€64.50"],
      ["Eva Smit", "7 orders, since 2023", "€1,340.00"],
    ],
  },
  products: {
    title: "Products",
    blurb: "Everything on sale, with what is left in stock.",
    rows: [
      ["Kestrel desk lamp", "18 in stock", "€59.00"],
      ["Northwind linen throw", "6 in stock, low", "€89.00"],
      ["Halcyon ceramic mug", "142 in stock", "€14.50"],
    ],
  },
  analytics: {
    title: "Analytics",
    blurb: "Traffic and sales for the past 30 days.",
    rows: [
      ["Visitors", "11% up", "18,204"],
      ["Conversion", "Same as last month", "2.9%"],
      ["Average order", "€4 up", "€71.20"],
    ],
  },
  settings: {
    title: "Settings",
    blurb: "Your store, your team and your plan.",
    rows: [
      ["Store details", "Name, address and currency", "Edit"],
      ["Team", "4 people with access", "Manage"],
      ["Billing", "Studio plan, renews 3 Dec", "View"],
    ],
  },
  help: {
    title: "Help",
    blurb: "Guides, and a person when you need one.",
    rows: [
      ["Shipping setup", "A ten minute guide", "Read"],
      ["Importing products", "From a spreadsheet", "Read"],
      ["Talk to support", "Replies within the hour", "Chat"],
    ],
  },
};

function Page({ id }: { id: string }): React.JSX.Element {
  const form = useAdaptiveNavForm();
  const page = PAGES[id] ?? PAGES.overview;
  if (!page) return <div />;
  return (
    <div className="grid content-start gap-5 p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="grid min-w-0 gap-1">
          <h2 className="text-lg leading-tight font-semibold tracking-[-0.02em]">{page.title}</h2>
          <p className="text-sm text-muted-foreground">{page.blurb}</p>
        </div>
        <span className="shrink-0 rounded-full border border-border px-2 py-0.5 font-mono text-[0.6875rem] text-muted-foreground">{FORMS[form]}</span>
      </div>
      <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
        {page.rows.map(([name, detail, value]) => (
          <li key={name} className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
            <span className="grid min-w-0">
              <span className="truncate font-medium">{name}</span>
              <span className="truncate text-xs text-muted-foreground">{detail}</span>
            </span>
            <span className="shrink-0 font-medium tabular-nums">{value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
