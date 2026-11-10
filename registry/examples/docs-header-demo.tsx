"use client";

import { useEffect, useRef, useState } from "react";

import { IconBook, IconCode, IconGitBranch, IconMessages, IconRocket } from "@rhs-ui/icons";
import { DocsHeader } from "@rhs-ui/marketing/docs-header";
import { CodeBlock } from "@rhs-ui/primitives/code-block";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@rhs-ui/primitives/command";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@rhs-ui/primitives/select";
import { SidebarNav } from "@rhs-ui/primitives/sidebar-nav";
import { TableOfContents } from "@rhs-ui/primitives/table-of-contents";

const SECTIONS = [
  { label: "Guides", href: "#guides" },
  { label: "API reference", href: "#api" },
  { label: "Examples", href: "#examples" },
  { label: "Changelog", href: "#changelog" },
];

const PAGES = [
  { label: "Introduction", icon: <IconBook /> },
  { label: "Quickstart", icon: <IconRocket /> },
  { label: "Webhooks", icon: <IconCode /> },
  { label: "Rate limits", icon: <IconCode /> },
  { label: "POST /v1/events", icon: <IconCode /> },
];

const PAYLOAD = [
  "{",
  '  "id": "evt_9c41f2",',
  '  "type": "order.paid",',
  '  "created": "2026-03-03T09:41:12Z",',
  '  "data": { "order": "ord_2210", "amount": 18400, "currency": "eur" }',
  "}",
].join("\n");

export default function Demo(): React.JSX.Element {
  const [open, setOpen] = useState(false);
  const [version, setVersion] = useState("v3.2");
  const [last, setLast] = useState("");
  const opener = useRef<HTMLElement | null>(null);

  // The palette opens from code, and the dialog gives focus back to a DialogTrigger only: remember what had focus and return it when the palette closes.
  useEffect(() => {
    if (!open) opener.current?.focus();
  }, [open]);

  const openPalette = () => {
    opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setOpen(true);
  };

  return (
    <div className="mx-auto grid max-w-6xl gap-3 px-3 py-6 sm:px-6">
      <p className="text-xs leading-relaxed text-muted-foreground">
        Scroll inside the frame: both rows stay. The field opens the palette (click it, or press Ctrl K or the Command key and K). Below 768px the icon links fold into one menu and the sections scroll sideways.
      </p>
      <div className="relative h-[40rem] overflow-y-auto rounded-xl border border-border bg-background">
        <DocsHeader
          brand={
            <a href="#top" className="rounded-sm text-base font-semibold tracking-tight outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40">
              Kestrel<span className="text-muted-foreground"> Docs</span>
            </a>
          }
          sections={SECTIONS}
          currentHref="#guides"
          onSearchOpen={openPalette}
          links={[
            { label: "GitHub", href: "https://example.com/kestrel", icon: <IconGitBranch size={18} /> },
            { label: "Community forum", href: "https://example.com/community", icon: <IconMessages size={18} /> },
          ]}
        >
          <Select value={version} onValueChange={setVersion}>
            <SelectTrigger size="sm" aria-label="Version" className="w-[5.75rem]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end">
              <SelectItem value="v3.2">v3.2</SelectItem>
              <SelectItem value="v3.1">v3.1</SelectItem>
              <SelectItem value="v2.9">v2.9</SelectItem>
            </SelectContent>
          </Select>
        </DocsHeader>

        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[13rem_minmax(0,1fr)_11rem]">
          <aside aria-label="Documentation sidebar" className="hidden lg:block">
            <SidebarNav
              label="Guides"
              currentHref="#webhooks"
              groups={[
                {
                  label: "Getting started",
                  links: [
                    { label: "Introduction", href: "#introduction" },
                    { label: "Quickstart", href: "#quickstart" },
                    { label: "Authentication", href: "#authentication" },
                  ],
                },
                {
                  label: "Events",
                  links: [
                    { label: "Webhooks", href: "#webhooks" },
                    { label: "Signatures", href: "#signatures" },
                    { label: "Retries", href: "#retries" },
                  ],
                },
              ]}
            />
          </aside>

          <article className="grid min-w-0 content-start gap-5">
            <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">Guides · Events</p>
            <h2 className="text-4xl leading-[1.05] font-medium tracking-[-0.045em] text-balance sm:text-5xl">Webhooks</h2>
            <p className="max-w-xl text-base leading-relaxed text-pretty text-muted-foreground">Kestrel sends a signed POST to your endpoint when something happens: an order is paid, a refund settles, a customer changes plan. Answer with a 2xx within ten seconds and we stop.</p>
            <h3 id="payload" className="mt-4 scroll-mt-32 text-xl font-medium tracking-[-0.02em]">
              The payload
            </h3>
            <CodeBlock filename="POST https://shop.example/hooks/kestrel" code={PAYLOAD} />
            <h3 id="verify" className="mt-4 scroll-mt-32 text-xl font-medium tracking-[-0.02em]">
              Verify the signature
            </h3>
            <p className="max-w-xl text-base leading-relaxed text-pretty text-muted-foreground">Every request carries a Kestrel-Signature header. Compute the HMAC of the raw body with your signing secret and compare it in constant time before you trust a field.</p>
            <h3 id="retries" className="mt-4 scroll-mt-32 text-xl font-medium tracking-[-0.02em]">
              Retries
            </h3>
            <p className="max-w-xl text-base leading-relaxed text-pretty text-muted-foreground">A failed delivery is retried eleven times over three days, with a longer wait each time. After that the event stays in the dashboard for thirty days, ready to replay.</p>
            <p className="min-h-5 text-sm text-muted-foreground" role="status">
              {last ? `You chose “${last}” in the palette.` : ""}
            </p>
          </article>

          <aside aria-label="Page rail" className="hidden lg:block">
            <div className="sticky top-32">
              <TableOfContents
                items={[
                  { id: "payload", title: "The payload", level: 2 },
                  { id: "verify", title: "Verify the signature", level: 2 },
                  { id: "retries", title: "Retries", level: 2 },
                ]}
              />
            </div>
          </aside>
        </div>
      </div>

      <CommandDialog open={open} onOpenChange={setOpen} title="Search the docs" description="Type to find a page">
        <CommandInput placeholder="Search the docs…" />
        <CommandList>
          <CommandEmpty>Nothing matches that.</CommandEmpty>
          <CommandGroup heading="Pages">
            {PAGES.map((page) => (
              <CommandItem
                key={page.label}
                value={page.label}
                onSelect={() => {
                  setLast(page.label);
                  setOpen(false);
                }}
              >
                {page.icon}
                {page.label}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </div>
  );
}
