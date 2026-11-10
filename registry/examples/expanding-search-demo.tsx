"use client";

import { useState, type ReactNode } from "react";

import { IconBag } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { ExpandingSearch, type ExpandingSearchSuggestion } from "@rhs-ui/primitives/expanding-search";
import { Kbd } from "@rhs-ui/primitives/kbd";
import { NotificationBadge } from "@rhs-ui/primitives/notification-badge";

const CATALOG: readonly (readonly [string, string])[] = [
  ["Kestrel daypack", "Bags"],
  ["Kestrel desk lamp", "Lighting"],
  ["Kestrel tote", "Bags"],
  ["Kestrel gift card", "Gifts"],
  ["Halcyon floor lamp", "Lighting"],
  ["Halcyon pendant", "Lighting"],
  ["Northwind mug set", "Kitchen"],
  ["Northwind serving board", "Kitchen"],
  ["Linen throw", "Home"],
  ["Oak bookends", "Home"],
];

const RECENT: readonly string[] = ["Daypack", "Desk lamp", "Gift card"];

/** What the store would answer: recent searches for an empty field, matches once someone types. */
function suggest(query: string): { label: string | undefined; items: ExpandingSearchSuggestion[] } {
  const q = query.trim().toLowerCase();
  if (!q) return { label: "Recent searches", items: RECENT.map((value) => ({ value })) };
  const hits = CATALOG.filter(([name]) => name.toLowerCase().includes(q)).slice(0, 5);
  return { label: hits.length ? "Suggestions" : undefined, items: hits.map(([value, hint]) => ({ value, hint })) };
}

/** A store header. It is positioned, because on a phone the search covers the whole bar. */
function Header({ label, children }: { label: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="relative flex h-14 items-center gap-6 border-y border-border bg-background px-4 sm:rounded-xl sm:border-x">
      <span className="text-[0.9375rem] font-semibold tracking-[-0.03em]">Kestrel</span>
      <nav aria-label={label} className="hidden items-center gap-5 text-sm text-muted-foreground sm:flex">
        <a href="#shop" className="outline-none hover:text-foreground focus-visible:text-foreground">
          Shop
        </a>
        <a href="#journal" className="outline-none hover:text-foreground focus-visible:text-foreground">
          Journal
        </a>
        <a href="#about" className="outline-none hover:text-foreground focus-visible:text-foreground">
          About
        </a>
      </nav>
      <div className="ml-auto flex items-center gap-1">
        {children}
        <Button type="button" variant="ghost" size="icon">
          {/* The badge sits out on the corner, so the bag stays readable next to it. */}
          <NotificationBadge label="items in your bag" count={2} className="[&>span:last-child]:-top-2 [&>span:last-child]:-right-2.5">
            <IconBag className="size-5" />
          </NotificationBadge>
          <span className="sr-only">Open bag</span>
        </Button>
        <span aria-hidden="true" className="ml-1 grid size-8 place-items-center rounded-full border border-border bg-muted text-[0.6875rem] font-medium text-muted-foreground">
          MO
        </span>
      </div>
    </div>
  );
}

function Example({ caption, children }: { caption: ReactNode; children: ReactNode }): React.JSX.Element {
  return (
    <section className="grid min-w-0 content-start gap-3">
      <p className="text-xs leading-relaxed text-muted-foreground">{caption}</p>
      {children}
    </section>
  );
}

function Store({ pinned = false }: { pinned?: boolean }): React.JSX.Element {
  const [value, setValue] = useState(pinned ? "kes" : "");
  const [sent, setSent] = useState<string | null>(null);
  const { label, items } = suggest(value);
  return (
    <>
      <Header label={pinned ? "Shop, with the search open" : "Shop"}>
        <ExpandingSearch
          value={value}
          onValueChange={setValue}
          onSubmit={setSent}
          suggestions={items}
          suggestionsLabel={label}
          placeholder="Search the shop"
          {...(pinned ? { defaultOpen: true, listOpen: true } : { shortcut: "/" })}
        />
      </Header>
      <p aria-live="polite" className="text-xs text-muted-foreground tabular-nums">
        {sent ? `Searching for "${sent}"` : "Nothing sent yet."}
      </p>
    </>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="grid w-full max-w-3xl gap-10">
      <Example
        caption={
          <>
            At rest it is one icon, so the header keeps its room. Press it, or <Kbd className="align-middle">/</Kbd> anywhere on the page, and the field grows over the links. <Kbd className="align-middle">Esc</Kbd> folds it back to the icon, and a dot on the icon says the field still holds a query.
          </>
        }
      >
        <Store />
      </Example>
      <Example caption="Open, with suggestions: arrow keys move through them, Enter picks, and what you typed is in bold. A query is never thrown away, so leaving the field does not fold it. On a phone it covers the whole bar.">
        <div className="grid min-h-[19rem] content-start gap-3">
          <Store pinned />
        </div>
      </Example>
    </div>
  );
}
