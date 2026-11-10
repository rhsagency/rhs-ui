"use client";

import { useState } from "react";

import { IconBook, IconCode, IconRocket } from "@rhs-ui/icons";
import { NavbarWithSearch } from "@rhs-ui/marketing/navbar-with-search";
import { Button } from "@rhs-ui/primitives/button";
import { CodeBlock } from "@rhs-ui/primitives/code-block";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@rhs-ui/primitives/command";
import { DescriptionList } from "@rhs-ui/primitives/description-list";

const GUIDES = [
  { label: "Quickstart", icon: <IconRocket /> },
  { label: "Authentication", icon: <IconBook /> },
  { label: "Webhooks", icon: <IconBook /> },
  { label: "Rate limits", icon: <IconBook /> },
];

const REFERENCE = [
  { label: "POST /v1/orders", icon: <IconCode /> },
  { label: "GET /v1/orders/{id}", icon: <IconCode /> },
  { label: "POST /v1/refunds", icon: <IconCode /> },
];

const CURL = [
  "curl https://api.halcyon.example/v1/orders \\",
  '  -H "Authorization: Bearer $HALCYON_KEY" \\',
  "  -d customer=cus_8f2k \\",
  '  -d "lines[0][sku]=tote-01" \\',
  '  -d "lines[0][quantity]=2"',
].join("\n");

export default function Demo(): React.JSX.Element {
  const [open, setOpen] = useState(false);
  const [last, setLast] = useState("");

  return (
    <div className="mx-auto max-w-6xl px-6 py-6">
      <p className="mb-3 text-xs text-muted-foreground">Click the field, or press Ctrl K or the Command key and K, to open the palette. Below 1024px the field becomes an icon button and the shortcut still works; below 768px the links go into a sheet.</p>
      <div className="overflow-hidden rounded-xl border border-border bg-background">
        <NavbarWithSearch
          sticky={false}
          brand={
            <a href="#top" className="rounded-sm text-base font-semibold tracking-tight outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40">
              Halcyon<span className="text-muted-foreground"> Docs</span>
            </a>
          }
          items={[
            { label: "Guides", href: "#guides" },
            { label: "API reference", href: "#api" },
            { label: "Changelog", href: "#changelog" },
          ]}
          currentHref="#api"
          searchPlaceholder="Search the docs…"
          onSearchOpen={() => setOpen(true)}
          actions={
            <>
              <Button variant="ghost" size="sm">
                Sign in
              </Button>
              <Button variant="outline" size="sm">
                Dashboard
              </Button>
            </>
          }
        />
        <div className="mx-auto grid max-w-3xl gap-8 px-6 py-14">
          <div className="grid gap-4">
            <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">API reference</p>
            <h2 className="text-4xl leading-[1.05] font-medium tracking-[-0.045em] text-balance sm:text-5xl">Create an order</h2>
            <p className="max-w-xl text-base leading-relaxed text-pretty text-muted-foreground">Send a POST to /v1/orders with the customer, the lines and the currency. Halcyon returns the order with its status, and a webhook follows when it is paid.</p>
          </div>
          <DescriptionList
            items={[
              { term: "customer", value: "The id of the customer, such as cus_8f2k. Required." },
              { term: "lines", value: "One to fifty lines, each with a sku and a quantity. Required." },
              { term: "currency", value: "A three-letter code. Defaults to the account currency." },
            ]}
          />
          <CodeBlock filename="POST /v1/orders" code={CURL} />
          <p className="min-h-5 text-sm text-muted-foreground" role="status">
            {last ? `You chose “${last}” in the palette.` : ""}
          </p>
        </div>
      </div>

      <CommandDialog open={open} onOpenChange={setOpen} title="Search the docs" description="Type to find a guide or an endpoint">
        <CommandInput placeholder="Search guides and endpoints…" />
        <CommandList>
          <CommandEmpty>Nothing matches that.</CommandEmpty>
          <CommandGroup heading="Guides">
            {GUIDES.map((item) => (
              <CommandItem
                key={item.label}
                value={item.label}
                onSelect={() => {
                  setLast(item.label);
                  setOpen(false);
                }}
              >
                {item.icon}
                {item.label}
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="API reference">
            {REFERENCE.map((item) => (
              <CommandItem
                key={item.label}
                value={item.label}
                onSelect={() => {
                  setLast(item.label);
                  setOpen(false);
                }}
              >
                {item.icon}
                {item.label}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </div>
  );
}
