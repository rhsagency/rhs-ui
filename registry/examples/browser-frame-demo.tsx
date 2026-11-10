import type { ReactNode } from "react";

import { BrowserFrame } from "@rhs-ui/primitives/browser-frame";
import { cn } from "@/lib/utils";

/* The screenshots are drawn as SVG, so the demo needs no files. */
const svg = (body: string): string => "data:image/svg+xml;utf8," + encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 480'>${body}</svg>`);

const DARK_SHOT = svg(
  "<rect width='800' height='480' fill='#15171a'/><rect x='40' y='30' width='84' height='12' rx='6' fill='#e8eaec'/><rect x='560' y='32' width='44' height='8' rx='4' fill='#5b626a'/><rect x='624' y='32' width='44' height='8' rx='4' fill='#5b626a'/><rect x='688' y='28' width='72' height='16' rx='8' fill='#e8eaec'/>" +
    "<rect x='40' y='104' width='400' height='24' rx='8' fill='#f1f3f4'/><rect x='40' y='140' width='320' height='24' rx='8' fill='#f1f3f4'/><rect x='40' y='190' width='360' height='10' rx='5' fill='#6a727a'/><rect x='40' y='210' width='290' height='10' rx='5' fill='#6a727a'/><rect x='40' y='252' width='124' height='38' rx='19' fill='#f1f3f4'/><rect x='178' y='252' width='124' height='38' rx='19' fill='none' stroke='#454c53' stroke-width='2'/>" +
    "<rect x='490' y='92' width='270' height='214' rx='18' fill='#202327'/><path d='M516 270C556 190 618 262 658 196S728 150 742 122' fill='none' stroke='#9aa3ab' stroke-width='3' stroke-dasharray='7 7' stroke-linecap='round'/><circle cx='516' cy='270' r='7' fill='#f1f3f4'/><circle cx='742' cy='122' r='7' fill='#f1f3f4'/>" +
    "<rect x='40' y='340' width='226' height='110' rx='14' fill='#202327'/><rect x='287' y='340' width='226' height='110' rx='14' fill='#202327'/><rect x='534' y='340' width='226' height='110' rx='14' fill='#202327'/><rect x='60' y='362' width='90' height='10' rx='5' fill='#e8eaec'/><rect x='60' y='384' width='150' height='8' rx='4' fill='#5b626a'/><rect x='307' y='362' width='90' height='10' rx='5' fill='#e8eaec'/><rect x='307' y='384' width='150' height='8' rx='4' fill='#5b626a'/><rect x='554' y='362' width='90' height='10' rx='5' fill='#e8eaec'/><rect x='554' y='384' width='150' height='8' rx='4' fill='#5b626a'/>",
);

const LIGHT_SHOT = svg(
  "<rect width='800' height='480' fill='#fbfbfa'/><rect width='190' height='480' fill='#f2f2f0'/><rect x='24' y='28' width='80' height='12' rx='6' fill='#1b1d1f'/>" +
    "<rect x='16' y='80' width='158' height='30' rx='8' fill='#ffffff' stroke='#e3e3df'/><rect x='30' y='91' width='70' height='8' rx='4' fill='#1b1d1f'/><rect x='30' y='134' width='80' height='8' rx='4' fill='#9a9a94'/><rect x='30' y='168' width='96' height='8' rx='4' fill='#9a9a94'/><rect x='30' y='202' width='64' height='8' rx='4' fill='#9a9a94'/>" +
    "<rect x='230' y='34' width='160' height='16' rx='8' fill='#1b1d1f'/><rect x='230' y='62' width='260' height='9' rx='4.5' fill='#9a9a94'/>" +
    "<rect x='230' y='108' width='530' height='84' rx='14' fill='#ffffff' stroke='#e3e3df'/><rect x='252' y='130' width='120' height='11' rx='5' fill='#1b1d1f'/><rect x='252' y='152' width='300' height='8' rx='4' fill='#9a9a94'/><rect x='252' y='168' width='220' height='8' rx='4' fill='#9a9a94'/><rect x='664' y='136' width='72' height='28' rx='14' fill='#1b1d1f'/>" +
    "<rect x='230' y='212' width='530' height='84' rx='14' fill='#ffffff' stroke='#e3e3df'/><rect x='252' y='234' width='140' height='11' rx='5' fill='#1b1d1f'/><rect x='252' y='256' width='320' height='8' rx='4' fill='#9a9a94'/><rect x='252' y='272' width='180' height='8' rx='4' fill='#9a9a94'/><rect x='664' y='240' width='72' height='28' rx='14' fill='none' stroke='#cfcfc9' stroke-width='1.5'/>" +
    "<rect x='230' y='316' width='530' height='84' rx='14' fill='#ffffff' stroke='#e3e3df'/><rect x='252' y='338' width='110' height='11' rx='5' fill='#1b1d1f'/><rect x='252' y='360' width='280' height='8' rx='4' fill='#9a9a94'/><rect x='252' y='376' width='240' height='8' rx='4' fill='#9a9a94'/><rect x='664' y='344' width='72' height='28' rx='14' fill='none' stroke='#cfcfc9' stroke-width='1.5'/>",
);

const ORDERS = [
  { id: "#4821", name: "Maya Okafor", amount: "€129.00", status: "Paid" },
  { id: "#4820", name: "Tomás Ferreira", amount: "€64.50", status: "Paid" },
  { id: "#4819", name: "Lena Voss", amount: "€212.00", status: "Pending" },
];

/** Live UI for the first window: real markup in the page's own theme. */
function Overview(): React.JSX.Element {
  return (
    <div className="flex min-h-72 text-sm">
      <aside className="hidden w-44 shrink-0 border-r border-border bg-muted/50 p-4 sm:block">
        <p className="text-sm font-semibold tracking-[-0.02em]">Northwind</p>
        <nav aria-label="Sections" className="mt-5 grid gap-1">
          {["Overview", "Orders", "Customers", "Products", "Reports"].map((label, index) => (
            <span key={label} className={cn("rounded-md px-2.5 py-1.5 text-xs", index === 0 ? "bg-background font-medium shadow-xs" : "text-muted-foreground")}>
              {label}
            </span>
          ))}
        </nav>
      </aside>
      <div className="min-w-0 flex-1 p-4 sm:p-6">
        <h3 className="text-base font-semibold tracking-[-0.02em]">Overview</h3>
        <p className="text-xs text-muted-foreground">The last 30 days</p>
        <div className="mt-4 grid grid-cols-1 gap-3 min-[480px]:grid-cols-3">
          {[
            ["Revenue", "€48,290", "+12.4%"],
            ["Orders", "1,284", "+3.1%"],
            ["Conversion", "3.8%", "-0.2%"],
          ].map(([label, value, change]) => (
            <div key={label} className="rounded-lg border border-border p-3">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="mt-1 text-lg font-semibold tracking-[-0.03em] tabular-nums">{value}</p>
              <p className="text-xs text-muted-foreground tabular-nums">{change} on the month before</p>
            </div>
          ))}
        </div>
        <ul className="mt-4 divide-y divide-border rounded-lg border border-border">
          {ORDERS.map((order) => (
            <li key={order.id} className="flex items-center justify-between gap-3 px-3 py-2.5 text-xs">
              <span className="flex min-w-0 items-center gap-3">
                <span className="text-muted-foreground tabular-nums">{order.id}</span>
                <span className="truncate font-medium">{order.name}</span>
              </span>
              <span className="flex shrink-0 items-center gap-3">
                <span className="tabular-nums">{order.amount}</span>
                <span className="w-14 text-right text-muted-foreground">{order.status}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-1 content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto grid w-full max-w-5xl grid-cols-1 gap-14 px-4 py-12 sm:px-6 sm:py-16">
      <Example caption="Follows the theme, with a tab. The page inside is live markup, not a picture.">
        <BrowserFrame url="app.northwind.example/overview" title="Overview · Northwind" caption="Northwind's overview page, built from the same components as your product.">
          <Overview />
        </BrowserFrame>
      </Example>

      <div className="grid grid-cols-1 gap-x-8 gap-y-14 lg:grid-cols-2">
        <Example caption="Fixed as dark, around a screenshot, with the address as a real link">
          <BrowserFrame tone="dark" url="kestrel.example/trails" href="https://kestrel.example/trails" caption="The Kestrel Trails landing page.">
            <img src={DARK_SHOT} alt="The Kestrel Trails landing page: a headline, two buttons, a map with a dashed route and three trail cards." />
          </BrowserFrame>
        </Example>
        <Example caption="Fixed as light, no tab: the dots and the address share one row">
          <BrowserFrame tone="light" url="halcyon.example/settings/billing" caption="Billing settings in Halcyon.">
            <img src={LIGHT_SHOT} alt="Billing settings in Halcyon: a sidebar and three plan cards, each with a button." />
          </BrowserFrame>
        </Example>
      </div>
    </div>
  );
}
