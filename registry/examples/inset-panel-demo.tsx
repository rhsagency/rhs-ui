"use client";

import { useEffect, useRef, useState, type ComponentProps, type ReactNode } from "react";

import { Badge } from "@rhs-ui/primitives/badge";
import { Button } from "@rhs-ui/primitives/button";
import { InsetPanel } from "@rhs-ui/primitives/inset-panel";
import { cn } from "@/lib/utils";

const svg = (width: number, height: number, body: string) => `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${width} ${height}' preserveAspectRatio='xMidYMid slice'>${body}</svg>`)}`;

const BARS = [90, 130, 110, 170, 150, 200, 180, 230, 210, 250, 240];

/** A dashboard, drawn flat: a dark rail, three cards and a row of bars. */
const SHOT = svg(
  1200,
  600,
  [
    "<rect width='1200' height='600' fill='#e9e7e2'/>",
    "<rect x='0' y='0' width='210' height='600' fill='#2b2e32'/>",
    "<rect x='30' y='44' width='110' height='14' rx='7' fill='#6d7178'/>",
    "<rect x='30' y='100' width='150' height='12' rx='6' fill='#4a4d52'/>",
    "<rect x='30' y='134' width='120' height='12' rx='6' fill='#4a4d52'/>",
    "<rect x='30' y='168' width='140' height='12' rx='6' fill='#4a4d52'/>",
    "<rect x='260' y='44' width='260' height='20' rx='10' fill='#2b2e32'/>",
    "<rect x='260' y='104' width='280' height='130' rx='16' fill='#f6f5f1'/>",
    "<rect x='566' y='104' width='280' height='130' rx='16' fill='#f6f5f1'/>",
    "<rect x='872' y='104' width='280' height='130' rx='16' fill='#f6f5f1'/>",
    "<rect x='286' y='134' width='90' height='10' rx='5' fill='#bdb9ae'/>",
    "<rect x='286' y='164' width='150' height='26' rx='8' fill='#2b2e32'/>",
    "<rect x='592' y='134' width='90' height='10' rx='5' fill='#bdb9ae'/>",
    "<rect x='592' y='164' width='120' height='26' rx='8' fill='#2b2e32'/>",
    "<rect x='898' y='134' width='90' height='10' rx='5' fill='#bdb9ae'/>",
    "<rect x='898' y='164' width='170' height='26' rx='8' fill='#2b2e32'/>",
    "<rect x='260' y='270' width='892' height='290' rx='16' fill='#f6f5f1'/>",
    ...BARS.map((height, i) => `<rect x='${300 + i * 78}' y='${520 - height}' width='46' height='${height}' rx='8' fill='${i > 8 ? "#2b2e32" : "#c9c5bb"}'/>`),
  ].join(""),
);

/** A quiet cover: a warm ground, a sun and a ridge. */
const COVER = svg(
  400,
  400,
  [
    "<rect width='400' height='400' fill='#d9d6cd'/>",
    "<circle cx='270' cy='130' r='54' fill='#f6f5f1'/>",
    "<path d='M0 330 L110 190 L190 280 L260 210 L400 360 L400 400 L0 400 Z' fill='#2b2e32'/>",
    "<path d='M0 372 L130 270 L220 340 L300 290 L400 380 L400 400 L0 400 Z' fill='#4a4d52'/>",
  ].join(""),
);

const MARKETS = [
  { market: "Netherlands", orders: "4,812", revenue: "€412,380", aov: "€85.70", change: "+14.2%" },
  { market: "Germany", orders: "3,290", revenue: "€298,114", aov: "€90.61", change: "+11.8%" },
  { market: "Belgium", orders: "1,204", revenue: "€97,640", aov: "€81.10", change: "+9.1%" },
  { market: "France", orders: "962", revenue: "€88,406", aov: "€91.90", change: "+17.5%" },
];

const CODE = `const shop = createShop({
  key: process.env.HALCYON_KEY,
  region: "eu",
  currency: "EUR",
});`;

/**
 * An inset that is a keyboard stop only while it scrolls, and then has a name: someone without a mouse can reach the columns that
 * are out of sight. While everything fits there is nothing to scroll, so there is nothing to stop at.
 */
function ScrollingInset({ label, className, ...props }: ComponentProps<typeof InsetPanel.Inset> & { label: string }): React.JSX.Element {
  const ref = useRef<HTMLDivElement>(null);
  // Until it has measured, it counts as scrolling: before hydration (and in a server render) the columns out of sight
  // can still be reached, and a wide screen gives up the stop once it sees everything fits.
  const [scrolls, setScrolls] = useState(true);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const read = () => setScrolls(node.scrollWidth > node.clientWidth + 1);
    read();
    const observer = new ResizeObserver(read);
    observer.observe(node);
    if (node.firstElementChild) observer.observe(node.firstElementChild);
    return () => observer.disconnect();
  }, []);
  return (
    <InsetPanel.Inset
      ref={ref}
      role={scrolls ? "region" : undefined}
      tabIndex={scrolls ? 0 : undefined}
      aria-label={scrolls ? label : undefined}
      className={cn("outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:ring-inset", className)}
      {...props}
    />
  );
}

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="grid w-full max-w-4xl grid-cols-1 gap-x-12 gap-y-10 md:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] md:items-start">
      <Example caption="A picture at the top and a table at the bottom reach the border. On a narrow screen the table is wider than the panel, so it scrolls inside itself.">
        <InsetPanel>
          <InsetPanel.Inset side="top">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={SHOT} alt="The Halcyon dashboard: three summary cards above a bar chart" className="block aspect-[2/1] w-full object-cover" />
          </InsetPanel.Inset>
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
            <h2 className="text-base font-semibold tracking-[-0.02em]">
              Q3 revenue by market
            </h2>
            <Badge variant="muted">Draft</Badge>
          </div>
          <p className="text-sm text-muted-foreground">Revenue grew 12% on the quarter, led by repeat customers in the Netherlands and France. Belgium is the slowest market, and the cheapest to reach.</p>
          <div>
            <Button variant="outline" size="sm">
              Download CSV
            </Button>
          </div>
          <ScrollingInset label="Orders, revenue and average order value by market" side="bottom" className="border-t border-border">
            <table className="w-full min-w-[28rem] border-collapse text-left text-sm">
              <caption className="sr-only">Orders, revenue and average order value by market</caption>
              <thead>
                <tr className="bg-muted/40 text-xs text-muted-foreground">
                  <th scope="col" className="px-6 py-2.5 font-medium">Market</th>
                  <th scope="col" className="px-3 py-2.5 text-right font-medium">Orders</th>
                  <th scope="col" className="px-3 py-2.5 text-right font-medium">Revenue</th>
                  <th scope="col" className="px-3 py-2.5 text-right font-medium">AOV</th>
                  <th scope="col" className="px-6 py-2.5 text-right font-medium">Change</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {MARKETS.map((row) => (
                  <tr key={row.market}>
                    <th scope="row" className="px-6 py-3 font-medium">{row.market}</th>
                    <td className="px-3 py-3 text-right tabular-nums">{row.orders}</td>
                    <td className="px-3 py-3 text-right tabular-nums">{row.revenue}</td>
                    <td className="px-3 py-3 text-right tabular-nums">{row.aov}</td>
                    <td className="px-6 py-3 text-right tabular-nums">{row.change}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollingInset>
        </InsetPanel>
      </Example>

      <div className="grid min-w-0 content-start gap-10">
        <Example caption="Code between two paragraphs, reaching both sides. It has no corners to round.">
          <InsetPanel padding="lg">
            <h2 className="text-base font-semibold tracking-[-0.02em]">
              Upgrading to 4.2
            </h2>
            <p className="text-sm text-muted-foreground">Create the client once and share it. Your existing keys keep working.</p>
            <InsetPanel.Inset className="border-y border-border bg-muted/60">
              <pre tabIndex={0} className="relative overflow-x-auto px-8 py-4 text-[0.8125rem] leading-relaxed outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:ring-inset">
                <code className="font-mono">{CODE}</code>
              </pre>
            </InsetPanel.Inset>
            <p className="text-sm text-muted-foreground">Restart your worker, then check the dashboard for the green dot.</p>
          </InsetPanel>
        </Example>

        <Example caption="A picture down one side: it takes the full height and rounds the two corners that touch the edge.">
          <InsetPanel padding="md">
            <div className="flex gap-5">
              <InsetPanel.Inset side="start" className="w-24 shrink-0 sm:w-32">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={COVER} alt="" className="block size-full object-cover" />
              </InsetPanel.Inset>
              <div className="grid min-w-0 content-start gap-2">
                <p className="text-xs text-muted-foreground">Episode 41 · 38 min</p>
                <h2 className="text-base leading-snug font-semibold tracking-[-0.02em] text-balance">
                  Why small shops win on service
                </h2>
                <p className="text-sm text-muted-foreground">Margriet de Boer on answering every email within the hour.</p>
                <div className="pt-1">
                  <Button size="sm">Listen</Button>
                </div>
              </div>
            </div>
          </InsetPanel>
        </Example>
      </div>
    </div>
  );
}
