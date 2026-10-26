"use client";

import { useId, useState, type ReactNode } from "react";

import { IconSearch } from "@rhs-ui/icons";
import { Input } from "@rhs-ui/primitives/input";
import { Kbd } from "@rhs-ui/primitives/kbd";
import { Label } from "@rhs-ui/primitives/label";
import { MatchHighlight } from "@rhs-ui/primitives/match-highlight";
import { Switch } from "@rhs-ui/primitives/switch";

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

const MENU = [
  { name: "Café crème", note: "A double ristretto under a soft head of cream. Our classic café order.", price: "€3.40" },
  { name: "Cafetière Ethiopia Guji", note: "Floral and tea-like, brewed for four minutes in a cafetière.", price: "€4.20" },
  { name: "Decaf cortado", note: "Swiss-water decaf with warm milk, half and half. No café buzz, all of the flavour.", price: "€3.60" },
  { name: "Crème brûlée latte", note: "Espresso, steamed milk and caramelised vanilla, finished with a crisp sugar top.", price: "€4.80" },
  { name: "Señor Churro hot chocolate", note: "Cinnamon churros with dark chocolate for dipping. Best after a long café morning.", price: "€5.50" },
  { name: "Cold brew tonic", note: "Twelve-hour cold brew over ice with Indian tonic and a slice of grapefruit.", price: "€4.40" },
] as const;

const ARTICLES = [
  { title: "Refund an invoice that was paid twice", section: "Billing" },
  { title: "Download every invoice as a single PDF", section: "Billing" },
  { title: "Why a refund can take five business days", section: "Payments" },
  { title: "Change the email address on your invoices", section: "Account" },
] as const;

const COMMANDS = [
  { name: "Export report as PDF", keys: ["⌘", "E"] },
  { name: "Open example project", keys: ["⌘", "O"] },
  { name: "Share link to this example", keys: ["⌘", "L"] },
] as const;

/** What the search treats as the same letter, so the demo can filter the way the highlight marks. */
const fold = (text: string, exact: boolean) => {
  const plain = text.normalize("NFD").replace(/\p{M}+/gu, "");
  return exact ? plain : plain.toLowerCase();
};

export default function Demo(): React.JSX.Element {
  const [query, setQuery] = useState("cafe");
  const [exact, setExact] = useState(false);
  const field = useId();
  const match = useId();
  const found = MENU.filter((item) => fold(`${item.name} ${item.note}`, exact).includes(fold(query.trim(), exact)));

  return (
    <div className="grid w-full max-w-2xl gap-10">
      <Example caption="Type: case and accents are ignored, so “cafe” marks Café, café and cafetière. Brackets and dots are plain text">
        <div className="max-w-xl overflow-hidden rounded-xl border border-border bg-card shadow-xs">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-3 border-b border-border p-3">
            <div className="relative min-w-0 flex-1 basis-56">
              <IconSearch aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Label htmlFor={field} className="sr-only">
                Search the menu
              </Label>
              <Input id={field} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search the menu" autoComplete="off" spellCheck={false} className="pl-9" />
            </div>
            <div className="flex items-center gap-2.5">
              <Switch id={match} checked={exact} onCheckedChange={setExact} />
              <Label htmlFor={match} className="font-normal text-muted-foreground">
                Match case
              </Label>
            </div>
          </div>
          <p role="status" className="px-4 pt-3 text-xs text-muted-foreground tabular-nums">
            {found.length} {found.length === 1 ? "result" : "results"}
          </p>
          <ul className="divide-y divide-border">
            {found.map((item) => (
              <li key={item.name} className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-6 gap-y-1 px-4 py-3.5">
                <p className="text-sm font-medium">
                  <MatchHighlight text={item.name} query={query} caseSensitive={exact} />
                </p>
                <span className="row-span-2 text-sm text-muted-foreground tabular-nums">{item.price}</span>
                <p className="text-[0.8125rem] leading-5 text-muted-foreground">
                  <MatchHighlight text={item.note} query={query} caseSensitive={exact} />
                </p>
              </li>
            ))}
            {found.length === 0 ? <li className="px-4 py-8 text-center text-sm text-muted-foreground">Nothing on the menu matches “{query}”.</li> : null}
          </ul>
        </div>
      </Example>

      <Example caption="Several terms, each marked wherever it occurs, in a table cell or a help list">
        <ul className="max-w-xl divide-y divide-border rounded-xl border border-border bg-card px-4 shadow-xs">
          {ARTICLES.map((article) => (
            <li key={article.title} className="flex items-baseline justify-between gap-6 py-3 text-sm">
              <span className="min-w-0">
                <MatchHighlight text={article.title} query={["refund", "invoice"]} />
              </span>
              <span className="shrink-0 text-xs text-muted-foreground">{article.section}</span>
            </li>
          ))}
        </ul>
      </Example>

      <Example caption="In a command list, where only the letters you typed are marked">
        <ul className="grid w-full max-w-sm gap-0.5 rounded-xl border border-border bg-popover p-1.5 shadow-sm">
          {COMMANDS.map((command, index) => (
            <li key={command.name} className={index === 0 ? "flex items-center justify-between gap-4 rounded-md bg-muted px-2.5 py-2 text-sm" : "flex items-center justify-between gap-4 rounded-md px-2.5 py-2 text-sm"}>
              <span className="min-w-0 truncate">
                <MatchHighlight text={command.name} query="exa" />
              </span>
              <span className="flex shrink-0 gap-1">
                {command.keys.map((key) => (
                  <Kbd key={key}>{key}</Kbd>
                ))}
              </span>
            </li>
          ))}
        </ul>
      </Example>
    </div>
  );
}
