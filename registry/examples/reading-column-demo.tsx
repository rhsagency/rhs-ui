"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

import { Label } from "@rhs-ui/primitives/label";
import { ReadingColumn } from "@rhs-ui/primitives/reading-column";
import { Switch } from "@rhs-ui/primitives/switch";
import { cn } from "@/lib/utils";

const svg = (width: number, height: number, body: string) => `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${width} ${height}'>${body}</svg>`)}`;

interface Palette {
  ground: string;
  device: string;
  screen: string;
  line: string;
  soft: string;
  field: string;
  stroke: string;
  ink: string;
}

const LIGHT: Palette = { ground: "#e8e6e0", device: "#2b2e32", screen: "#f6f5f1", line: "#c9c5bb", soft: "#d9d6cd", field: "#ffffff", stroke: "#d9d6cd", ink: "#2b2e32" };
const DARK: Palette = { ground: "#1c1c1c", device: "#3b3d41", screen: "#111111", line: "#5a5c60", soft: "#38393c", field: "#1b1b1b", stroke: "#3a3a3a", ink: "#f0f0f0" };

/** A laptop and a phone, drawn with flat shapes: the new one-page checkout. */
const hero = (p: Palette) =>
  svg(
    1600,
    620,
    [
      `<rect width='1600' height='620' fill='${p.ground}'/>`,
      `<rect x='250' y='96' width='620' height='400' rx='24' fill='${p.device}'/>`,
      `<rect x='276' y='122' width='568' height='348' rx='12' fill='${p.screen}'/>`,
      `<rect x='308' y='158' width='190' height='16' rx='8' fill='${p.ink}'/>`,
      `<rect x='308' y='196' width='300' height='10' rx='5' fill='${p.line}'/>`,
      `<rect x='308' y='224' width='250' height='10' rx='5' fill='${p.soft}'/>`,
      `<rect x='308' y='270' width='504' height='46' rx='10' fill='${p.field}' stroke='${p.stroke}' stroke-width='2'/>`,
      `<rect x='308' y='330' width='504' height='46' rx='10' fill='${p.field}' stroke='${p.stroke}' stroke-width='2'/>`,
      `<rect x='308' y='406' width='504' height='46' rx='10' fill='${p.ink}'/>`,
      `<rect x='180' y='496' width='760' height='24' rx='12' fill='${p.line}'/>`,
      `<rect x='1020' y='70' width='250' height='480' rx='38' fill='${p.device}'/>`,
      `<rect x='1040' y='96' width='210' height='428' rx='26' fill='${p.screen}'/>`,
      `<rect x='1062' y='132' width='120' height='14' rx='7' fill='${p.ink}'/>`,
      `<rect x='1062' y='166' width='166' height='40' rx='10' fill='${p.field}' stroke='${p.stroke}' stroke-width='2'/>`,
      `<rect x='1062' y='218' width='166' height='40' rx='10' fill='${p.field}' stroke='${p.stroke}' stroke-width='2'/>`,
      `<rect x='1062' y='270' width='166' height='40' rx='10' fill='${p.field}' stroke='${p.stroke}' stroke-width='2'/>`,
      `<rect x='1062' y='466' width='166' height='40' rx='20' fill='${p.ink}'/>`,
    ].join(""),
  );

const BEFORE = 192;
const AFTER = 132;

/**
 * Four steps before, one page after: two bars. Built from the page's own tokens and real text, not from a picture, so the
 * bars use the whole width of the figure, the words stay 14px on a phone and it follows the theme.
 */
function CheckoutChart(): React.JSX.Element {
  const row = "grid gap-2 sm:grid-cols-[9.5rem_minmax(0,1fr)] sm:items-center sm:gap-5";
  const saved = ((BEFORE - AFTER) / BEFORE) * 100;
  return (
    <div className="grid gap-6 p-5 sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
        <div className="grid gap-1">
          <p className="text-sm leading-normal font-semibold tracking-[-0.01em] text-foreground">Time to complete checkout</p>
          <p className="text-sm leading-normal text-muted-foreground">Median, seconds, 11,400 orders</p>
        </div>
        <p className="rounded-md border border-border bg-muted px-2.5 py-1 text-sm leading-normal font-semibold text-foreground tabular-nums">31% faster</p>
      </div>
      <ul className="grid gap-5">
        <li className={row}>
          <span className="text-sm leading-normal text-muted-foreground">Before: four steps</span>
          <div className="relative h-10">
            <div className="flex h-full items-center justify-end rounded-md bg-foreground/15 px-3 text-sm font-semibold text-foreground tabular-nums" style={{ width: "100%" }}>
              {BEFORE} s
            </div>
          </div>
        </li>
        <li className={row}>
          <span className="text-sm leading-normal text-muted-foreground">After: one page</span>
          <div className="relative h-10">
            <div className="flex h-full items-center justify-end rounded-md bg-foreground px-3 text-sm font-semibold text-background tabular-nums" style={{ width: `${(AFTER / BEFORE) * 100}%` }}>
              {AFTER} s<span className="sr-only">, {BEFORE - AFTER} seconds less</span>
            </div>
            <div
              aria-hidden="true"
              className="absolute inset-y-0 right-0 flex items-center justify-center rounded-md border border-dashed border-border text-sm text-muted-foreground tabular-nums"
              style={{ width: `calc(${saved}% - 0.375rem)` }}
            >
              &minus;{BEFORE - AFTER} s
            </div>
          </div>
        </li>
      </ul>
    </div>
  );
}

/**
 * A box that scrolls sideways when its content is wider than the screen, and says so: it fades at an edge while there is more
 * to see past it, and a line under it (the `hint`) tells people what they would find. While it scrolls it takes the keyboard
 * (arrow keys scroll it) and has a name, like any scroll region should; while everything fits it is not a tab stop.
 */
function ScrollBox({ label, hint, children }: { label: string; hint?: string; children: ReactNode }): React.JSX.Element {
  const box = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ start: false, end: false });
  useEffect(() => {
    const node = box.current;
    if (!node) return;
    const measure = () => setEdges({ start: node.scrollLeft > 4, end: node.scrollLeft + node.clientWidth < node.scrollWidth - 4 });
    measure();
    node.addEventListener("scroll", measure, { passive: true });
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => {
      node.removeEventListener("scroll", measure);
      observer.disconnect();
    };
  }, []);
  const scrolls = edges.start || edges.end;
  return (
    <div className="relative overflow-hidden rounded-xl border border-border">
      <div
        ref={box}
        role={scrolls ? "region" : undefined}
        tabIndex={scrolls ? 0 : undefined}
        aria-label={scrolls ? label : undefined}
        className={cn(
          "relative overflow-x-auto outline-none [scrollbar-color:color-mix(in_oklab,var(--foreground)_28%,transparent)_transparent] [scrollbar-width:thin] focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:ring-inset",
          edges.start && !edges.end && "[mask-image:linear-gradient(90deg,transparent,#000_2.5rem)]",
          !edges.start && edges.end && "[mask-image:linear-gradient(90deg,#000_calc(100%-2.5rem),transparent)]",
          edges.start && edges.end && "[mask-image:linear-gradient(90deg,transparent,#000_2.5rem,#000_calc(100%-2.5rem),transparent)]",
        )}
      >
        {children}
      </div>
      {hint && scrolls ? <p className="border-t border-border bg-muted/40 px-3 py-2 text-xs leading-normal text-muted-foreground sm:px-4">{hint}</p> : null}
    </div>
  );
}

const FUNNEL = [
  { step: "Cart to address", before: "94.1%", after: "97.6%", change: "+3.5 pts" },
  { step: "Address to payment", before: "78.4%", after: "91.2%", change: "+12.8 pts" },
  { step: "Payment to confirmation", before: "62.0%", after: "71.5%", change: "+9.5 pts" },
  { step: "Whole checkout", before: "45.7%", after: "62.3%", change: "+16.6 pts" },
];

const CODE = `<Checkout
  steps="single-page"
  express={["apple-pay", "ideal"]}
  address={{ autocomplete: true, lookup: "postcode" }}
  onComplete={(order) => track("checkout_complete", order.id)}
/>`;

/** A picture that has a light and a dark version, so it sits well on either page. */
function Picture({ light, dark, alt, className }: { light: string; dark: string; alt: string; className?: string }): React.JSX.Element {
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={light} alt={alt} className={cn("block dark:hidden", className)} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={dark} alt={alt} className={cn("hidden dark:block", className)} />
    </>
  );
}

export default function Demo(): React.JSX.Element {
  const [guides, setGuides] = useState(false);
  return (
    <div className="pb-16">
      <div className="mx-auto flex max-w-5xl items-center justify-end gap-3 px-4 pt-6 sm:px-6">
        <Label htmlFor="reading-guides" className="text-xs text-muted-foreground">
          Outline the columns
        </Label>
        <Switch id="reading-guides" checked={guides} onCheckedChange={setGuides} />
      </div>

      <ReadingColumn
        as="article"
        className={cn(
          "pt-8 pb-4 text-base leading-[1.75] text-foreground/90 sm:pt-12 sm:text-[1.0625rem] [&_h2]:text-balance [&_h3]:mt-6 [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:tracking-[-0.02em] [&_h3]:text-foreground",
          guides && "[&>*]:-outline-offset-1 [&>*]:outline-1 [&>*]:outline-dashed [&>*]:outline-foreground/30 [&>[data-slot=reading-column-wide]]:outline-foreground/60 [&>[data-slot=reading-column-full]]:outline-foreground",
        )}
      >
        <header className="mb-4 grid gap-4">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Case study · 8 min read</p>
          <h2 className="text-3xl leading-[1.1] font-semibold tracking-[-0.035em] text-foreground sm:text-5xl">Kestrel cut checkout time by 31% by taking four steps down to one</h2>
          <p className="text-lg leading-relaxed text-muted-foreground">How Halcyon Studio rebuilt the checkout of a small outdoor-bag brand, and what the numbers said six weeks later.</p>
        </header>

        <ReadingColumn.Full as="figure" className="my-2 aspect-[1600/620] overflow-hidden">
          <Picture light={hero(LIGHT)} dark={hero(DARK)} alt="A laptop and a phone showing the new one-page checkout" className="size-full object-cover" />
        </ReadingColumn.Full>

        <p>Kestrel sells backpacks, totes and travel kits from a warehouse outside Utrecht. Their checkout had grown the way most do: a step for the cart, one for the address, one for payment and one to review. Each step made sense alone. Together they took a median of 192 seconds, and more than half of the people who started one never finished.</p>
        <p>We began by watching people use it. Almost nobody got stuck on a field. They got tired between the steps, waiting for a page to load only to be asked for something the last page already knew.</p>

        <h3>One page, in the order people think</h3>
        <p>The new checkout is a single page. Contact and delivery sit on top, payment below them, and the order summary stays beside both on a wide screen and folds under them on a phone. Express payment with Apple Pay and iDEAL comes first, because a third of Kestrel&rsquo;s customers use one of the two.</p>

        <ReadingColumn.Wide as="figure" className="my-2 overflow-hidden rounded-xl border border-border bg-card">
          <CheckoutChart />
          <figcaption className="border-t border-border bg-muted/40 px-4 py-2.5 text-xs leading-normal text-muted-foreground">Median time to complete checkout, before and after the change. Source: Kestrel order data, September to October 2026.</figcaption>
        </ReadingColumn.Wide>

        <h3>What moved</h3>
        <p>Every stage of the funnel improved, and the biggest jump was the one we expected: the move from address to payment, where people used to be sent to a new page and a new loading state.</p>

        <ReadingColumn.Wide className="my-2">
          <ScrollBox label="Checkout funnel, before and after" hint="Scroll sideways to see the rest of the table.">
            <table className="w-full border-collapse text-left text-sm leading-normal">
              <caption className="sr-only">Share of shoppers who got through each stage of checkout, before and after</caption>
              <thead>
                <tr className="border-b border-border bg-muted/40 text-xs text-muted-foreground">
                  <th scope="col" className="px-3 py-2.5 font-medium sm:px-4">Stage</th>
                  <th scope="col" className="px-3 py-2.5 text-right font-medium whitespace-nowrap sm:px-4">Before</th>
                  <th scope="col" className="px-3 py-2.5 text-right font-medium whitespace-nowrap sm:px-4">After</th>
                  <th scope="col" className="px-3 py-2.5 text-right font-medium whitespace-nowrap sm:px-4">Change</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {FUNNEL.map((row, index) => (
                  <tr key={row.step} className={index === FUNNEL.length - 1 ? "font-medium text-foreground" : undefined}>
                    <th scope="row" className={cn("px-3 py-3 sm:px-4", index === FUNNEL.length - 1 ? "font-medium" : "font-normal")}>{row.step}</th>
                    <td className="px-3 py-3 text-right whitespace-nowrap tabular-nums sm:px-4">{row.before}</td>
                    <td className="px-3 py-3 text-right whitespace-nowrap tabular-nums sm:px-4">{row.after}</td>
                    <td className="px-3 py-3 text-right whitespace-nowrap tabular-nums sm:px-4">{row.change}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollBox>
        </ReadingColumn.Wide>

        <h3>How it is built</h3>
        <p>The whole flow is one component. The address lookup fills street and city from the postcode, so most people type a postcode and a house number and nothing else.</p>

        <ReadingColumn.Wide className="my-2">
          <ScrollBox label="Checkout code sample">
            <pre className="w-max min-w-full bg-muted/60 p-4 text-[0.8125rem] leading-relaxed">
              <code className="font-mono">{CODE}</code>
            </pre>
          </ScrollBox>
        </ReadingColumn.Wide>

        <ReadingColumn.Full as="blockquote" className="my-4 bg-muted/60 px-4 py-12 sm:py-16">
          <p className="mx-auto max-w-[40rem] text-center text-xl leading-snug font-medium tracking-[-0.02em] text-balance text-foreground sm:text-3xl">&ldquo;We stopped getting emails that said the checkout was broken. It was never broken. It was just long.&rdquo;</p>
          <footer className="mt-5 text-center text-sm text-muted-foreground">Margriet de Boer, head of e-commerce at Kestrel</footer>
        </ReadingColumn.Full>

        <p>Six weeks in, the change has paid for itself twice over. The next step is the part nobody sees: the confirmation email, which still asks people to log in to see an order they just placed.</p>
      </ReadingColumn>
    </div>
  );
}
