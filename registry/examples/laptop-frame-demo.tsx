"use client";

import { useState, type ReactNode } from "react";

import { LaptopFrame } from "@rhs-ui/primitives/laptop-frame";
import { Label } from "@rhs-ui/primitives/label";
import { Slider } from "@rhs-ui/primitives/slider";

/* The screenshots are drawn as SVG at the 16 to 10 shape of the screen, so the demo needs no files. */
function dashboard(dark: boolean): string {
  const c = dark
    ? { bg: "#131416", side: "#18191c", card: "#1b1d20", line: "#2a2c30", ink: "#eceef0", mute: "#7f858c", soft: "#3a3d42", accent: "#eceef0", onAccent: "#131416" }
    : { bg: "#f6f6f4", side: "#efefec", card: "#ffffff", line: "#e3e3df", ink: "#17181a", mute: "#8a8a84", soft: "#d6d6d0", accent: "#17181a", onAccent: "#ffffff" };
  const font = "font-family='Helvetica, Arial, sans-serif'";
  const t = (x: number, y: number, size: number, text: string, fill: string, weight = 500, anchor = "start") => `<text x='${x}' y='${y}' ${font} font-size='${size}' font-weight='${weight}' fill='${fill}' text-anchor='${anchor}'>${text}</text>`;
  const nav = ["Overview", "Orders", "Customers", "Products", "Reports", "Settings"]
    .map((label, i) => `${i === 0 ? `<rect x='20' y='${128 + i * 52}' width='180' height='40' rx='10' fill='${c.card}' stroke='${c.line}'/>` : ""}<rect x='36' y='${140 + i * 52}' width='16' height='16' rx='5' fill='${i === 0 ? c.ink : c.soft}'/>${t(66, 154 + i * 52, 18, label, i === 0 ? c.ink : c.mute, i === 0 ? 600 : 500)}`)
    .join("");
  const kpis = [
    ["Revenue", "€48,290", "+12.4%"],
    ["Orders", "1,284", "+3.1%"],
    ["Customers", "862", "+8.0%"],
    ["Conversion", "3.8%", "-0.2%"],
  ]
    .map(([label, value, delta], i) => {
      const x = 252 + i * 288;
      return `<rect x='${x}' y='126' width='268' height='124' rx='16' fill='${c.card}' stroke='${c.line}'/>${t(x + 24, 164, 17, label ?? "", c.mute)}${t(x + 24, 214, 38, value ?? "", c.ink, 700)}${t(x + 244, 164, 16, delta ?? "", c.mute, 500, "end")}`;
    })
    .join("");
  const pts = [0.16, 0.26, 0.22, 0.4, 0.36, 0.5, 0.46, 0.62, 0.58, 0.76, 0.7, 0.9];
  const line = pts.map((v, i) => `${i === 0 ? "M" : "L"}${300 + i * 65},${Math.round(800 - v * 380)}`).join("");
  const grid = [0, 1, 2, 3, 4].map((i) => `<path d='M284 ${420 + i * 95}H1020' stroke='${c.line}' stroke-dasharray='4 6'/>`).join("");
  const rows = ["Halcyon lamp", "Kestrel chair", "Larch shelf", "Quay rug"]
    .map((name, i) => `${t(1096, 416 + i * 104, 17, name, c.ink, 600)}${t(1360, 416 + i * 104, 16, ['€9.4k', '€7.1k', '€5.2k', '€3.8k'][i] ?? '', c.mute, 500, 'end')}<rect x='1096' y='${434 + i * 104}' width='${[264, 216, 166, 114][i] ?? 60}' height='8' rx='4' fill='${i === 0 ? c.accent : c.soft}'/>`)
    .join("");
  return (
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
      `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1440 900'><rect width='1440' height='900' fill='${c.bg}'/><rect width='220' height='900' fill='${c.side}'/><path d='M220 0V900' stroke='${c.line}'/>` +
        `<rect x='24' y='36' width='28' height='28' rx='8' fill='${c.accent}'/>${t(66, 57, 21, "Northwind", c.ink, 700)}${nav}` +
        `${t(252, 78, 30, "Revenue overview", c.ink, 700)}${t(252, 104, 17, "The last 30 days", c.mute)}<rect x='1128' y='46' width='196' height='40' rx='20' fill='${c.card}' stroke='${c.line}'/>${t(1226, 72, 16, "30 days", c.ink, 600, "middle")}<circle cx='1362' cy='66' r='22' fill='${c.soft}'/>` +
        `${kpis}<rect x='252' y='282' width='800' height='580' rx='20' fill='${c.card}' stroke='${c.line}'/>${t(284, 332, 22, "Revenue", c.ink, 700)}${grid}` +
        `<path d='${line}L1015,800L300,800Z' fill='${c.accent}' opacity='.07'/><path d='${line}' fill='none' stroke='${c.accent}' stroke-width='4' stroke-linejoin='round' stroke-linecap='round'/><circle cx='1015' cy='458' r='8' fill='${c.card}' stroke='${c.accent}' stroke-width='4'/>` +
        `<rect x='1072' y='282' width='312' height='580' rx='20' fill='${c.card}' stroke='${c.line}'/>${t(1096, 332, 22, "Top products", c.ink, 700)}${rows}${t(1096, 826, 17, "View all products", c.mute, 500)}</svg>`,
    )
  );
}

const LIGHT_SHOT = dashboard(false);
const DARK_SHOT = dashboard(true);

const ORDERS = [
  ["#4821", "Maya Okafor", "€129.00", "Paid"],
  ["#4820", "Tomás Ferreira", "€64.50", "Paid"],
  ["#4819", "Lena Voss", "€212.00", "Pending"],
  ["#4818", "Sam Whitaker", "€38.00", "Paid"],
  ["#4817", "Ines Duarte", "€96.20", "Refunded"],
] as const;

/** Live UI for the screen, sized in the laptop's own container units so it scales with the device like a screenshot would. */
function Orders(): React.JSX.Element {
  return (
    <div className="flex h-full text-[1.7cqw]">
      <aside className="w-[16cqw] shrink-0 border-r border-border bg-muted/50 p-[1.8cqw]">
        <p className="text-[2.1cqw] font-semibold tracking-[-0.02em]">Northwind</p>
        <nav aria-label="Sections" className="mt-[3cqw] grid gap-[0.7cqw]">
          {["Overview", "Orders", "Customers", "Products", "Reports"].map((label, index) => (
            <span key={label} className={index === 1 ? "rounded-[0.8cqw] bg-background px-[1.1cqw] py-[0.9cqw] font-medium shadow-xs" : "px-[1.1cqw] py-[0.9cqw] text-muted-foreground"}>
              {label}
            </span>
          ))}
        </nav>
      </aside>
      <div className="min-w-0 flex-1 p-[2.6cqw]">
        <div className="flex items-baseline justify-between">
          <h3 className="text-[2.7cqw] font-semibold tracking-[-0.03em]">Orders</h3>
          <span className="text-muted-foreground tabular-nums">1,284 this month</span>
        </div>
        <div className="mt-[2.2cqw] grid grid-cols-3 gap-[1.4cqw]">
          {[
            ["Revenue", "€48,290"],
            ["Open", "37"],
            ["Refunds", "2.1%"],
          ].map(([label, value]) => (
            <div key={label} className="rounded-[1.1cqw] border border-border p-[1.6cqw]">
              <p className="text-muted-foreground">{label}</p>
              <p className="mt-[0.4cqw] text-[2.9cqw] font-semibold tracking-[-0.03em] tabular-nums">{value}</p>
            </div>
          ))}
        </div>
        <ul className="mt-[2.2cqw] divide-y divide-border rounded-[1.1cqw] border border-border">
          {ORDERS.map(([id, name, amount, status]) => (
            <li key={id} className="flex items-center justify-between gap-[1cqw] px-[1.6cqw] py-[1.25cqw]">
              <span className="flex min-w-0 items-center gap-[1.4cqw]">
                <span className="text-muted-foreground tabular-nums">{id}</span>
                <span className="truncate font-medium">{name}</span>
              </span>
              <span className="flex shrink-0 items-center gap-[1.8cqw]">
                <span className="tabular-nums">{amount}</span>
                <span className="w-[7cqw] text-right text-muted-foreground">{status}</span>
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
    <div className="grid min-w-0 grid-cols-1 content-start gap-6">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  const [lid, setLid] = useState(68);
  return (
    <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-16 px-4 py-12 sm:px-6 sm:py-16">
      <Example caption="A screenshot in a graphite body: pass src and alt. The device is decoration, so the alt text is what is read.">
        <LaptopFrame width={820} src={LIGHT_SHOT} alt="The Northwind revenue overview: four figures across the top, a revenue chart for the last 30 days and a list of top products." />
      </Example>

      <div className="grid grid-cols-1 gap-x-10 gap-y-16 lg:grid-cols-2">
        <Example caption="Live UI in a silver body. It is sized in the laptop's own units, so it scales with the device.">
          <LaptopFrame tone="light" label="Northwind orders page">
            <Orders />
          </LaptopFrame>
        </Example>

        <Example caption="The lid follows the open value, 0 to 1. Drive it from a scroll position, here with a slider.">
          <div className="grid min-w-0 grid-cols-1 gap-6">
            <LaptopFrame src={DARK_SHOT} alt="The Northwind revenue overview in its dark theme." open={lid / 100} />
            <div className="mx-auto grid w-full max-w-xs gap-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="lid-angle">Lid</Label>
                <span className="text-sm text-muted-foreground tabular-nums">{lid}% open</span>
              </div>
              <Slider id="lid-angle" min={0} max={100} step={1} value={[lid]} onValueChange={(value) => setLid(value[0] ?? 0)} thumbLabels={["Lid opening"]} />
            </div>
          </div>
        </Example>
      </div>
    </div>
  );
}
