"use client";

import { useState, type ReactNode } from "react";

import { SegmentedControl } from "@rhs-ui/application/segmented-control";
import { IconSearch } from "@rhs-ui/icons";
import { Badge } from "@rhs-ui/primitives/badge";
import { Button } from "@rhs-ui/primitives/button";
import { HolyGrailLayout } from "@rhs-ui/primitives/holy-grail-layout";
import { Kbd } from "@rhs-ui/primitives/kbd";
import { Label } from "@rhs-ui/primitives/label";
import { Switch } from "@rhs-ui/primitives/switch";
import { cn } from "@/lib/utils";

const NAV = [
  { title: "Get started", links: ["Introduction", "Installation", "Quick start"] },
  { title: "Guides", links: ["Products", "Orders", "Customers", "Webhooks"] },
  { title: "Reference", links: ["REST API", "Error codes"] },
];

const SECTIONS = [
  { id: "endpoint", title: "Create an endpoint", body: "Add the URL that should receive events and choose which ones it wants. Halcyon sends a POST with a JSON body within a second of the change, from a fixed set of addresses you can allow-list." },
  { id: "verify", title: "Verify the signature", body: "Every request carries a signature made with your endpoint secret. Check it before you trust the body, and reject anything older than five minutes so a captured request cannot be replayed." },
  { id: "retries", title: "Retries and ordering", body: "If your endpoint does not answer with a 2xx, Halcyon tries again after one minute, ten minutes, an hour and then every six hours for three days. Events can arrive out of order, so compare the version before you overwrite." },
  { id: "local", title: "Test it locally", body: "Forward events to your laptop with the CLI and replay any of the last thirty days from the dashboard. Nothing you send in test mode reaches a customer." },
  { id: "limits", title: "Limits", body: "An account can hold 25 endpoints. A single event is delivered to each endpoint once, and a body never exceeds 256 KB." },
];

const CODE = `const event = halcyon.webhooks.verify(body, signature, secret);

if (event.type === "order.paid") {
  await fulfil(event.data.id);
}`;

/** The links. Written for both layouts: a column of groups beside the page, and above it a few wrapping rows (the classes with @3xl: answer to the width of the layout). */
function NavLinks({ groups = NAV }: { groups?: typeof NAV }): React.JSX.Element {
  return (
    <div className="flex flex-wrap gap-x-8 gap-y-3 @3xl:grid @3xl:gap-5">
      {groups.map((group) => (
        <div key={group.title} className="min-w-0">
          <p className="mb-1.5 px-2 text-xs font-medium text-muted-foreground">{group.title}</p>
          <ul className="flex flex-wrap gap-0.5 @3xl:grid">
            {group.links.map((link) => (
              <li key={link}>
                <a
                  href="#holy-grail"
                  aria-current={link === "Webhooks" ? "page" : undefined}
                  className="block rounded-md px-2 py-1.5 text-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40 aria-[current=page]:bg-muted aria-[current=page]:font-medium aria-[current=page]:text-foreground"
                >
                  {link}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function Contents(): React.JSX.Element {
  return (
    <div>
      <p className="mb-2 text-xs font-medium text-muted-foreground">On this page</p>
      <ul className="grid gap-0.5 border-s border-border">
        {SECTIONS.map((section, index) => (
          <li key={section.id}>
            <a
              href="#holy-grail"
              aria-current={index === 1 ? "location" : undefined}
              className="-ms-px block border-s border-transparent py-1 ps-3 text-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40 aria-[current=location]:border-foreground aria-[current=location]:font-medium aria-[current=location]:text-foreground"
            >
              {section.title}
            </a>
          </li>
        ))}
      </ul>
      <p className="mt-6 text-xs text-muted-foreground">Last edited 28 October 2026</p>
    </div>
  );
}

function Header(): React.JSX.Element {
  return (
    <div className="flex items-center gap-3 px-5">
      <p className="text-sm font-semibold tracking-[-0.02em]">halcyon</p>
      <Badge variant="muted">v4.2</Badge>
      <div className="ms-auto flex items-center gap-2">
        <Button variant="outline" size="sm" aria-label="Search the docs" className="gap-2 text-muted-foreground">
          <IconSearch className="size-3.5" />
          {/* The classes with @xl: answer to the width of the layout, not of the window. */}
          <span className="hidden @xl:inline">Search the docs</span>
          <Kbd className="hidden @xl:inline-flex">/</Kbd>
        </Button>
        <Button size="sm">Sign in</Button>
      </div>
    </div>
  );
}

/** The article. A short page keeps the title and the intro and none of the sections. */
function Article({ short = false }: { short?: boolean }): React.JSX.Element {
  return (
    <article className="max-w-[44rem]">
      <p className="text-xs font-medium text-muted-foreground">Guides</p>
      <h2 className="mt-1 text-2xl font-semibold tracking-[-0.035em] text-balance">Webhooks</h2>
      <p className="mt-2 text-sm leading-relaxed text-pretty text-muted-foreground">Get a signed request the moment something changes in your shop, instead of asking for it every minute.</p>
      {(short ? [] : SECTIONS).map((section) => (
        <section key={section.id} className="mt-7">
          <h3 className="text-base font-semibold tracking-[-0.02em]">{section.title}</h3>
          <p className="mt-1.5 text-sm leading-relaxed text-pretty text-muted-foreground">{section.body}</p>
          {section.id === "verify" ? (
            // A code block that scrolls sideways on a phone takes focus itself, so the keyboard can reach the rest of a line.
            <pre tabIndex={0} className="relative mt-3 overflow-x-auto rounded-lg border border-border bg-muted/60 px-4 py-3 text-[0.8125rem] leading-relaxed outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40">
              <code className="font-mono [font-variant-ligatures:none]">{CODE}</code>
            </pre>
          ) : null}
        </section>
      ))}
    </article>
  );
}

function Footer(): React.JSX.Element {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 text-xs text-muted-foreground">
      <p>© 2026 Halcyon Commerce B.V.</p>
      <p className="flex flex-wrap gap-x-4 gap-y-1">
        <a href="#status" className="rounded-sm underline-offset-4 outline-none hover:text-foreground hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/40">Status</a>
        <a href="#privacy" className="rounded-sm underline-offset-4 outline-none hover:text-foreground hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/40">Privacy</a>
        <a href="#terms" className="rounded-sm underline-offset-4 outline-none hover:text-foreground hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/40">Terms</a>
      </p>
    </div>
  );
}

/**
 * A box that stands in for the browser window: a fixed height that scrolls inside, so the layout fills it and not the page. The border
 * takes 1px on each side, so give the layout a height that is 2px less than the window (or 100%, which is the room inside the border).
 */
function Window({ height, width, children, className }: { height?: string; width?: string; children: ReactNode; className?: string }): React.JSX.Element {
  return (
    <div className={cn("relative overflow-y-auto rounded-xl border border-border bg-background shadow-xs", className)} style={{ height, width, maxWidth: "100%" }}>
      {children}
    </div>
  );
}

const WIDTHS = {
  wide: { label: "Wide", width: "100%" },
  medium: { label: "Medium", width: "54rem" },
  narrow: { label: "Narrow", width: "22rem" },
} as const;

type Width = keyof typeof WIDTHS;

export default function Demo(): React.JSX.Element {
  const [width, setWidth] = useState<Width>("wide");
  const [stickyHeader, setStickyHeader] = useState(true);
  const [stickyColumns, setStickyColumns] = useState(true);
  return (
    <div className="mx-auto grid w-full max-w-6xl gap-12 px-4 py-8 sm:px-6">
      <section aria-labelledby="hg-page">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
          <div>
            <h2 id="hg-page" className="text-lg font-semibold tracking-[-0.02em]">
              A docs page
            </h2>
            <p className="mt-0.5 max-w-xl text-sm text-muted-foreground">Scroll inside the window: the header and both columns stay under it. Narrow the window and the aside drops under the article, then the navigation moves above it.</p>
          </div>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
            {/* On a phone every width is the width of the screen, so the choice has nothing to change there. */}
            <SegmentedControl
              label="Width of the window"
              className="hidden sm:inline-flex"
              value={width}
              onValueChange={(value) => setWidth(value === "narrow" ? "narrow" : value === "medium" ? "medium" : "wide")}
              options={(Object.keys(WIDTHS) as Width[]).map((key) => ({ value: key, label: WIDTHS[key].label }))}
            />
            <div className="flex items-center gap-2.5">
              <Label htmlFor="hg-sticky-header" className="text-sm">
                Pin the header
              </Label>
              <Switch id="hg-sticky-header" checked={stickyHeader} onCheckedChange={setStickyHeader} />
            </div>
            <div className="flex items-center gap-2.5">
              <Label htmlFor="hg-sticky-columns" className="text-sm">
                Pin the columns
              </Label>
              <Switch id="hg-sticky-columns" checked={stickyColumns} onCheckedChange={setStickyColumns} />
            </div>
          </div>
        </div>
        <Window height="34rem" width={WIDTHS[width].width}>
          {/* A page has one main landmark and the page that frames a demo has it already, so both layouts here make theirs a div. */}
          <HolyGrailLayout mainId="docs-main" mainAs="div" navLabel="Documentation" asideLabel="On this page" height="calc(34rem - 2px)" stickyHeader={stickyHeader} stickyColumns={stickyColumns} header={<Header />} nav={<NavLinks />} aside={<Contents />} footer={<Footer />}>
            <Article />
          </HolyGrailLayout>
        </Window>
      </section>

      <section aria-labelledby="hg-short">
        <h2 id="hg-short" className="text-lg font-semibold tracking-[-0.02em]">
          A short page
        </h2>
        <p className="mt-0.5 mb-4 max-w-xl text-sm text-muted-foreground">There is little to read, and the footer still sits at the bottom of the screen instead of floating up under the text.</p>
        {/* On a phone the navigation, the text and the footer take more lines, so the window is taller there to keep the page short: it still has room to spare above the footer. */}
        <div className="@container">
          <Window className="h-[32rem] @[44rem]:h-[26rem]">
            {/* 100% is the room inside the window's border. */}
            <HolyGrailLayout mainId="short-main" mainAs="div" navLabel="Documentation, short page" height="100%" header={<Header />} nav={<NavLinks groups={NAV.slice(0, 1)} />} footer={<Footer />} skipLabel={false}>
              <Article short />
            </HolyGrailLayout>
          </Window>
        </div>
      </section>
    </div>
  );
}
