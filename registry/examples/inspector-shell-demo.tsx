"use client";

import { useEffect, useState } from "react";

import { InspectorShell } from "@rhs-ui/application/inspector-shell";
import { SegmentedControl } from "@rhs-ui/application/segmented-control";
import { IconCheck, IconCircle, IconCircleDot, IconClose, IconFileText, IconPlus, IconScale } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { DescriptionList } from "@rhs-ui/primitives/description-list";
import { SearchInput } from "@rhs-ui/primitives/search-input";
import { StatusBadge, type StatusDefinition } from "@rhs-ui/primitives/status-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@rhs-ui/primitives/table";

const EURO = new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });

const STAGES = ["lead", "qualified", "proposal", "negotiation", "won"] as const;
type Stage = (typeof STAGES)[number] | "lost";

const STATUSES: Record<string, StatusDefinition> = {
  lead: { label: "Lead", glyph: <IconCircle />, emphasis: "quiet" },
  qualified: { label: "Qualified", glyph: <IconCircleDot />, emphasis: "outline" },
  proposal: { label: "Proposal", glyph: <IconFileText />, emphasis: "outline" },
  negotiation: { label: "Negotiation", glyph: <IconScale />, emphasis: "soft" },
  won: { label: "Won", glyph: <IconCheck />, emphasis: "strong" },
  lost: { label: "Lost", glyph: <IconClose />, emphasis: "quiet" },
};

interface Deal {
  id: string;
  company: string;
  contact: string;
  email: string;
  stage: Stage;
  value: number;
  close: string;
  owner: string;
  source: string;
  activity: readonly (readonly [what: string, when: string])[];
}

const DEALS: readonly Deal[] = [
  {
    id: "d1",
    company: "Northwind Outfitters",
    contact: "Rafael Ortiz",
    email: "rafael.ortiz@northwind.example",
    stage: "proposal",
    value: 126500,
    close: "28 Nov",
    owner: "Leo Martins",
    source: "Conference",
    activity: [
      ["Sent the revised proposal with three rollout phases", "2 hours ago"],
      ["Call with Rafael and the head of operations", "Tuesday"],
      ["Requested a security questionnaire", "Last week"],
    ],
  },
  {
    id: "d2",
    company: "Larkspur Foods",
    contact: "Imogen Hale",
    email: "imogen.hale@larkspur.example",
    stage: "negotiation",
    value: 48000,
    close: "14 Nov",
    owner: "Mara Okafor",
    source: "Referral",
    activity: [
      ["Legal asked for a data processing addendum", "Yesterday"],
      ["Agreed on a 24 month term", "Monday"],
      ["Demo for the finance team", "Last week"],
    ],
  },
  {
    id: "d3",
    company: "Kestrel Labs",
    contact: "Dana Whitfield",
    email: "dana@kestrellabs.example",
    stage: "negotiation",
    value: 84000,
    close: "7 Nov",
    owner: "Leo Martins",
    source: "Partner",
    activity: [
      ["Pricing for 120 seats sent", "Yesterday"],
      ["Technical review with their platform team", "Monday"],
    ],
  },
  {
    id: "d4",
    company: "Brightwater Clinic",
    contact: "Dr Anika Rao",
    email: "anika.rao@brightwater.example",
    stage: "qualified",
    value: 32400,
    close: "5 Dec",
    owner: "Sofia Rossi",
    source: "Inbound",
    activity: [
      ["Discovery call: 14 clinicians, two sites", "Thursday"],
      ["Filled in the contact form", "Last week"],
    ],
  },
  {
    id: "d5",
    company: "Tidewater Logistics",
    contact: "Marcus Boyd",
    email: "marcus.boyd@tidewater.example",
    stage: "proposal",
    value: 61300,
    close: "30 Nov",
    owner: "Dan Cho",
    source: "Outbound",
    activity: [
      ["Proposal opened three times", "Today"],
      ["Sent the proposal", "Yesterday"],
    ],
  },
  {
    id: "d6",
    company: "Marlow & Finch",
    contact: "Theo Marlow",
    email: "theo@marlowfinch.example",
    stage: "lead",
    value: 18900,
    close: "19 Dec",
    owner: "Dan Cho",
    source: "Outbound",
    activity: [["Replied to the first email", "Today"]],
  },
  {
    id: "d7",
    company: "Redwood Dental",
    contact: "Priya Menon",
    email: "priya@redwooddental.example",
    stage: "qualified",
    value: 15200,
    close: "12 Dec",
    owner: "Sofia Rossi",
    source: "Inbound",
    activity: [
      ["Booked a demo for Thursday", "Yesterday"],
      ["Downloaded the pricing guide", "Monday"],
    ],
  },
  {
    id: "d8",
    company: "Orchard & Pine",
    contact: "Wen Zhao",
    email: "wen.zhao@orchardpine.example",
    stage: "won",
    value: 22750,
    close: "20 Oct",
    owner: "Mara Okafor",
    source: "Referral",
    activity: [
      ["Signed the order form", "20 Oct"],
      ["Final pricing agreed", "17 Oct"],
    ],
  },
  {
    id: "d9",
    company: "Foxglove Books",
    contact: "Hannah Lowe",
    email: "hannah@foxglovebooks.example",
    stage: "lead",
    value: 9800,
    close: "9 Jan",
    owner: "Mara Okafor",
    source: "Newsletter",
    activity: [["Subscribed to the product newsletter", "Last week"]],
  },
  {
    id: "d10",
    company: "Ironbridge Fitness",
    contact: "Callum Reid",
    email: "callum@ironbridge.example",
    stage: "lost",
    value: 27000,
    close: "3 Oct",
    owner: "Leo Martins",
    source: "Conference",
    activity: [
      ["Chose a competitor with an on-site contract", "3 Oct"],
      ["Sent the final offer", "28 Sep"],
    ],
  },
];

const GROUPS = [
  { value: "all", label: "All" },
  { value: "open", label: "Open" },
  { value: "closed", label: "Closed" },
];

function StageBar({ stage }: { stage: Stage }): React.JSX.Element {
  const reached = stage === "lost" ? 0 : STAGES.indexOf(stage) + 1;
  return (
    <div>
      <ol className="flex gap-1" aria-label="Stages">
        {STAGES.map((entry, index) => (
          <li key={entry} className={index < reached ? "h-1.5 flex-1 rounded-full bg-foreground" : "h-1.5 flex-1 rounded-full bg-muted"}>
            <span className="sr-only">
              {STATUSES[entry]?.label}
              {index < reached ? ", reached" : ""}
            </span>
          </li>
        ))}
      </ol>
      <div className="mt-2 flex justify-between text-[0.6875rem] text-muted-foreground">
        <span>Lead</span>
        <span>Won</span>
      </div>
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState("all");
  const [selectedId, setSelectedId] = useState("d2");
  const [open, setOpen] = useState(false);

  // A preview opens on a desktop and waits on a phone, where the details cover the list.
  useEffect(() => {
    if (window.matchMedia("(min-width: 64rem)").matches) setOpen(true);
  }, []);

  const rows = DEALS.filter((deal) => {
    const closed = deal.stage === "won" || deal.stage === "lost";
    if (group === "open" && closed) return false;
    if (group === "closed" && !closed) return false;
    return `${deal.company} ${deal.contact}`.toLowerCase().includes(query.trim().toLowerCase());
  });
  const selected = DEALS.find((deal) => deal.id === selectedId) ?? DEALS[0]!;
  const index = rows.findIndex((deal) => deal.id === selected.id);
  const move = (offset: number) => {
    const next = rows[index + offset];
    if (next) setSelectedId(next.id);
  };
  const pick = (deal: Deal) => {
    setSelectedId(deal.id);
    setOpen(true);
  };

  return (
    // Below lg the details are a sheet fixed to the screen, so on a phone the frame is the screen: full-bleed, with no corner for the sheet to cover.
    <div className="h-[calc(100dvh-3rem)] min-h-[34rem] overflow-hidden rounded-xl border border-border max-lg:h-dvh max-lg:rounded-none max-lg:border-0">
      <InspectorShell
        className="h-full"
        open={open}
        onOpenChange={setOpen}
        panelTitle={selected.company}
        onPrevious={index > 0 ? () => move(-1) : undefined}
        onNext={index < rows.length - 1 ? () => move(1) : undefined}
        labels={{ previous: "Previous deal", next: "Next deal", close: "Close deal details" }}
        toolbar={
          <>
            <SearchInput aria-label="Search deals" placeholder="Search deals" value={query} onValueChange={setQuery} className="w-full min-w-0 sm:w-60" />
            <SegmentedControl label="Show deals" options={GROUPS} value={group} onValueChange={setGroup} className="p-0.5 [&_button]:py-[5px]" />
            <Button className="ml-auto">
              <IconPlus />
              New deal
            </Button>
          </>
        }
        panel={
          <div className="grid gap-6">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-xs text-muted-foreground">Deal value</p>
                <p className="mt-1 text-3xl font-semibold tracking-[-0.03em] tabular-nums">{EURO.format(selected.value)}</p>
              </div>
              <StatusBadge status={selected.stage} statuses={STATUSES} size="lg" />
            </div>
            <StageBar stage={selected.stage} />
            <DescriptionList
              className="[&>div]:sm:grid-cols-[6.5rem_minmax(0,1fr)] [&_dd]:min-w-0 [&_dd]:break-words"
              items={[
                { term: "Owner", value: selected.owner },
                { term: "Contact", value: selected.contact },
                { term: "Email", value: selected.email },
                { term: selected.stage === "won" || selected.stage === "lost" ? "Closed" : "Expected close", value: selected.close },
                { term: "Source", value: selected.source },
              ]}
            />
            <section aria-labelledby="deal-activity">
              <h3 id="deal-activity" className="text-sm font-semibold">
                Recent activity
              </h3>
              <ol className="mt-3 grid gap-3.5">
                {selected.activity.map(([what, when]) => (
                  <li key={what} className="flex gap-3 text-sm">
                    <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-border" />
                    <p className="min-w-0">
                      {what}
                      <span className="block text-xs text-muted-foreground">{when}</span>
                    </p>
                  </li>
                ))}
              </ol>
            </section>
            <div className="flex gap-2">
              <Button className="flex-1">Log activity</Button>
              <Button variant="outline" className="flex-1">
                Open deal
              </Button>
            </div>
          </div>
        }
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-4 sm:pl-6">Company</TableHead>
              <TableHead className="max-md:hidden">Stage</TableHead>
              <TableHead className="max-xl:hidden">Owner</TableHead>
              <TableHead className="max-sm:hidden">Closes</TableHead>
              <TableHead className="pr-4 text-right sm:pr-6">Value</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((deal) => {
              const current = open && deal.id === selected.id;
              return (
                // The company button is stretched over its whole row (after:inset-0), so a press anywhere on the row lands on a real button:
                // it takes the click, keeps the keyboard path, and is what gets focus back when the details close.
                <TableRow key={deal.id} data-state={current ? "selected" : undefined} className="relative cursor-pointer">
                  <TableCell className="py-3 pl-4 sm:pl-6">
                    <button
                      type="button"
                      onClick={() => pick(deal)}
                      aria-current={current ? "true" : undefined}
                      className="-mx-1.5 block max-w-full cursor-pointer rounded-md px-1.5 text-left outline-none after:absolute after:inset-0 focus-visible:ring-[3px] focus-visible:ring-ring/40"
                    >
                      <span className="block truncate text-sm font-medium">{deal.company}</span>
                      <span className="block truncate text-xs text-muted-foreground">{deal.contact}</span>
                    </button>
                  </TableCell>
                  <TableCell className="max-md:hidden">
                    <StatusBadge status={deal.stage} statuses={STATUSES} size="sm" className={current && deal.stage !== "won" ? "bg-background" : undefined} />
                  </TableCell>
                  <TableCell className="text-muted-foreground max-xl:hidden">{deal.owner}</TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground max-sm:hidden">{deal.close}</TableCell>
                  <TableCell className="pr-4 text-right whitespace-nowrap tabular-nums sm:pr-6">{EURO.format(deal.value)}</TableCell>
                </TableRow>
              );
            })}
            {rows.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={5} className="py-16 text-center text-sm text-muted-foreground">
                  No deals match &ldquo;{query}&rdquo;.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </InspectorShell>
    </div>
  );
}
