"use client";

import { useState, type ReactNode } from "react";

import { FacetFilter, type FacetOption } from "@rhs-ui/dashboard/facet-filter";
import { IconAlertCircle, IconArchive, IconArrowDown, IconArrowUp, IconCheckCircle, IconCircleDot, IconClock, IconMinus } from "@rhs-ui/icons";
import { Badge } from "@rhs-ui/primitives/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@rhs-ui/primitives/table";

interface Ticket {
  id: string;
  subject: string;
  status: string;
  priority: string;
  team: string;
}

const TICKETS: readonly Ticket[] = [
  { id: "T-1042", subject: "Refund for order #4821 never arrived", status: "open", priority: "urgent", team: "billing" },
  { id: "T-1041", subject: "Cannot change delivery address", status: "open", priority: "high", team: "shipping" },
  { id: "T-1039", subject: "Invoice shows the wrong VAT number", status: "pending", priority: "normal", team: "billing" },
  { id: "T-1038", subject: "Two-factor code not arriving", status: "open", priority: "high", team: "accounts" },
  { id: "T-1036", subject: "Export to CSV times out", status: "pending", priority: "normal", team: "technical" },
  { id: "T-1035", subject: "Partner pricing sheet for Kestrel Foods", status: "solved", priority: "low", team: "partnerships" },
  { id: "T-1033", subject: "Parcel marked delivered, not received", status: "open", priority: "urgent", team: "shipping" },
  { id: "T-1031", subject: "Add a second owner to the account", status: "solved", priority: "low", team: "accounts" },
  { id: "T-1030", subject: "Webhook retries stopped on Sunday", status: "pending", priority: "high", team: "technical" },
  { id: "T-1028", subject: "Wrong item in the Halcyon pallet", status: "closed", priority: "normal", team: "shipping" },
  { id: "T-1026", subject: "Cancel the annual plan", status: "closed", priority: "normal", team: "billing" },
  { id: "T-1024", subject: "Request for a wholesale catalogue", status: "solved", priority: "low", team: "partnerships" },
  { id: "T-1022", subject: "Login loop on Safari", status: "open", priority: "normal", team: "technical" },
  { id: "T-1019", subject: "Reset the sandbox data", status: "closed", priority: "low", team: "technical" },
];

type Facet = "status" | "priority" | "team";
type Picks = Record<Facet, string[]>;

const LABELS: Record<Facet, Record<string, string>> = {
  status: { open: "Open", pending: "Pending", solved: "Solved", closed: "Closed" },
  priority: { urgent: "Urgent", high: "High", normal: "Normal", low: "Low" },
  team: { billing: "Billing", shipping: "Shipping", accounts: "Accounts", technical: "Technical", partnerships: "Partnerships" },
};

const ICONS: Record<string, React.JSX.Element> = {
  open: <IconCircleDot />,
  pending: <IconClock />,
  solved: <IconCheckCircle />,
  closed: <IconArchive />,
  urgent: <IconAlertCircle />,
  high: <IconArrowUp />,
  normal: <IconMinus />,
  low: <IconArrowDown />,
};

/** Rows that match every facet except `skip`: what choosing an option of `skip` would leave. */
const matching = (picks: Picks, skip?: Facet): Ticket[] =>
  TICKETS.filter((ticket) => (Object.keys(picks) as Facet[]).every((facet) => facet === skip || picks[facet].length === 0 || picks[facet].includes(ticket[facet])));

const ASSIGNEES: readonly FacetOption[] = [
  { value: "anna", label: "Anna de Vries", count: 6 },
  { value: "mo", label: "Mo Haddad", count: 4 },
  { value: "priya", label: "Priya Nair", count: 3 },
  { value: "sofia", label: "Sofia Marin", count: 2 },
  { value: "tom", label: "Tom Jansen", count: 0 },
];

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <section className="min-w-0">
      <p className="mb-3 text-xs text-muted-foreground">{caption}</p>
      {children}
    </section>
  );
}

export default function Demo(): React.JSX.Element {
  const [picks, setPicks] = useState<Picks>({ status: ["open", "pending"], priority: [], team: ["billing", "shipping", "technical"] });
  const [assignees, setAssignees] = useState<string[]>(["anna", "priya"]);
  const rows = matching(picks);

  const optionsFor = (facet: Facet): FacetOption[] =>
    Object.entries(LABELS[facet]).map(([value, label]) => ({ value, label, icon: ICONS[value], count: matching(picks, facet).filter((ticket) => ticket[facet] === value).length }));
  const change = (facet: Facet) => (next: string[]) => setPicks((current) => ({ ...current, [facet]: next }));

  return (
    <div className="grid w-full max-w-3xl gap-12">
      <Example caption="The panel: a search field, a count per option and Clear filter. Tom has no rows, so he stays in the list, dimmed">
        {/* The panel is not modal, so a click elsewhere closes it. The stage has a fixed height, so nothing on the page moves when it does. */}
        <div className="h-[23rem] rounded-xl border border-border bg-muted/30 p-3 sm:p-4">
          <FacetFilter title="Assignee" options={ASSIGNEES} value={assignees} onValueChange={setAssignees} defaultOpen />
        </div>
      </Example>

      <Example caption="Above a table: the picks sit on the button, and each option says how many rows it would leave">
        <div className="flex flex-wrap items-center gap-2">
          <FacetFilter title="Status" options={optionsFor("status")} value={picks.status} onValueChange={change("status")} searchable={false} />
          <FacetFilter title="Priority" options={optionsFor("priority")} value={picks.priority} onValueChange={change("priority")} searchable={false} />
          <FacetFilter title="Team" options={optionsFor("team")} value={picks.team} onValueChange={change("team")} />
          <p role="status" className="ml-auto text-sm text-muted-foreground tabular-nums">
            Showing {rows.length} of {TICKETS.length} tickets
          </p>
        </div>

        <div className="mt-3 rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ticket</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden sm:table-cell">Priority</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length ? (
                rows.map((ticket) => (
                  <TableRow key={ticket.id}>
                    <TableCell className="font-mono text-xs whitespace-nowrap text-muted-foreground">{ticket.id}</TableCell>
                    <TableCell className="max-w-[18rem] whitespace-normal sm:truncate">{ticket.subject}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{LABELS.status[ticket.status]}</Badge>
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground sm:table-cell">{LABELS.priority[ticket.priority]}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="py-10 text-center whitespace-normal text-muted-foreground">
                    No tickets match these filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Example>
    </div>
  );
}
