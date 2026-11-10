"use client";

import { useState, type ReactNode } from "react";

import { IconFileCode, IconFileSheet, IconFileText } from "@rhs-ui/icons";
import { FolderTabs, type FolderTab } from "@rhs-ui/primitives/folder-tabs";
import { TabsContent } from "@rhs-ui/primitives/tabs";

const SHEETS: readonly FolderTab[] = [
  { value: "summary", label: "Summary" },
  { value: "revenue", label: "Revenue by region" },
  { value: "headcount", label: "Headcount" },
  { value: "spend", label: "Marketing spend and campaign attribution (draft)" },
  { value: "scenarios", label: "Scenarios" },
];

const REGIONS: readonly (readonly [string, string, string, string])[] = [
  ["Benelux", "€1.18M", "€1.31M", "+11.0%"],
  ["DACH", "€0.94M", "€1.02M", "+8.5%"],
  ["Nordics", "€0.71M", "€0.80M", "+12.7%"],
  ["Iberia", "€0.52M", "€0.49M", "-5.8%"],
];

const DOCUMENTS: readonly FolderTab[] = [
  { value: "plan", label: "launch-plan.md", icon: <IconFileText /> },
  { value: "client", label: "api-client.ts", icon: <IconFileCode /> },
  { value: "budget", label: "budget-2026.csv", icon: <IconFileSheet /> },
  { value: "drafts", label: "Drafts", icon: <IconFileText /> },
];

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function Example({ caption, children }: { caption: ReactNode; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

function Stat({ label, value, note }: { label: string; value: string; note: string }): React.JSX.Element {
  return (
    <div className="min-w-0 rounded-lg border border-border bg-background px-3.5 py-3">
      <p className="truncate text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold tracking-[-0.03em] tabular-nums">{value}</p>
      <p className="truncate text-xs text-muted-foreground">{note}</p>
    </div>
  );
}

function Note({ title, text }: { title: string; text: string }): React.JSX.Element {
  return (
    <div className="grid gap-1">
      <h3 className="text-sm font-semibold tracking-[-0.01em]">{title}</h3>
      <p className="max-w-prose text-sm text-muted-foreground">{text}</p>
    </div>
  );
}

function Workbook(): React.JSX.Element {
  const [sheet, setSheet] = useState("summary");
  return (
    <FolderTabs label="Workbook sheets" tabs={SHEETS} value={sheet} onValueChange={setSheet}>
      <TabsContent value="summary">
        <div className="grid gap-4">
          <Note title="Q3 forecast" text="Net revenue is tracking 7% above plan, led by Benelux and the Nordics." />
          <div className="grid gap-3 sm:grid-cols-3">
            <Stat label="Net revenue" value="€4.82M" note="+7.1% on plan" />
            <Stat label="Gross margin" value="63.4%" note="+0.8 pts" />
            <Stat label="Open pipeline" value="€2.10M" note="38 deals" />
          </div>
        </div>
      </TabsContent>
      <TabsContent value="revenue">
        <div className="relative -mx-1 overflow-x-auto px-1">
          <table className="w-full min-w-[22rem] text-sm tabular-nums">
            <caption className="sr-only">Revenue by region, Q2 and Q3</caption>
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th scope="col" className="py-2 pr-4 font-medium">Region</th>
                <th scope="col" className="py-2 pr-4 text-right font-medium">Q2</th>
                <th scope="col" className="py-2 pr-4 text-right font-medium">Q3</th>
                <th scope="col" className="py-2 text-right font-medium">Change</th>
              </tr>
            </thead>
            <tbody>
              {REGIONS.map(([region, q2, q3, change]) => (
                <tr key={region} className="border-b border-border last:border-0">
                  <th scope="row" className="py-2.5 pr-4 text-left font-medium">{region}</th>
                  <td className="py-2.5 pr-4 text-right text-muted-foreground">{q2}</td>
                  <td className="py-2.5 pr-4 text-right">{q3}</td>
                  <td className="py-2.5 text-right">{change}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </TabsContent>
      <TabsContent value="headcount">
        <Note title="Headcount" text="212 people today, 14 open roles. Hiring for support and solutions engineering is ahead of plan." />
      </TabsContent>
      <TabsContent value="spend">
        <Note title="Marketing spend and campaign attribution (draft)" text="Spring campaign spend is €184,000. Attribution is still being reviewed with the finance team." />
      </TabsContent>
      <TabsContent value="scenarios">
        <Note title="Scenarios" text="Base, upside and downside cases for the second half, with the assumptions behind each." />
      </TabsContent>
    </FolderTabs>
  );
}

function OpenDocuments(): React.JSX.Element {
  return (
    <FolderTabs label="Open documents" tabs={DOCUMENTS} size="sm" defaultValue="client" panelClassName="min-h-44">
      <TabsContent value="plan">
        <Note title="launch-plan.md" text="Kestrel 2.0 ships on 14 April. Docs freeze on the 7th." />
      </TabsContent>
      <TabsContent value="client">
        <Note title="api-client.ts" text="Retries use exponential backoff with jitter, capped at five attempts." />
      </TabsContent>
      <TabsContent value="budget">
        <Note title="budget-2026.csv" text="48 rows across 9 cost centres, last saved today at 09:41." />
      </TabsContent>
      <TabsContent value="drafts">
        <div className="grid min-h-32 place-items-center text-center">
          <p className="text-sm text-muted-foreground">Nothing in Drafts yet.</p>
        </div>
      </TabsContent>
    </FolderTabs>
  );
}

function Months(): React.JSX.Element {
  const tabs: readonly FolderTab[] = MONTHS.map((month) => ({ value: month.toLowerCase(), label: month }));
  return (
    <FolderTabs label="Months" tabs={tabs} defaultValue="march" panelClassName="min-h-44">
      {MONTHS.map((month, index) => (
        <TabsContent key={month} value={month.toLowerCase()}>
          <Note title={month} text={`Invoiced €${(380 + index * 17).toLocaleString("en-US")},000 across ${42 + index * 3} customers.`} />
        </TabsContent>
      ))}
    </FolderTabs>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="grid w-full max-w-3xl gap-9">
      <Example caption="A workbook: the selected sheet shares its surface and edge with the body. Hover or tab to the long sheet name to read it whole.">
        <Workbook />
      </Example>
      <div className="grid gap-x-12 gap-y-9 [grid-template-columns:repeat(auto-fit,minmax(min(100%,19rem),1fr))]">
        <Example caption="Small, with file icons, for open documents. An empty folder keeps its shape.">
          <OpenDocuments />
        </Example>
        <Example caption="More tabs than room scroll sideways behind fade edges, with arrows for the mouse.">
          <Months />
        </Example>
      </div>
    </div>
  );
}
