import type { ReactNode } from "react";

import { IconMoreHorizontal } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@rhs-ui/primitives/table";
import { ActionsCell, DateCell, IdentityCell, MeterCell, MoneyCell, StatusCell, TagsCell, type StatusTone } from "@rhs-ui/primitives/table-cells";

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

/** A flat grey portrait, drawn here so the demo needs no image from anywhere. */
function portrait(background: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="${background}"/><circle cx="32" cy="26" r="11" fill="#8b8b8b"/><path d="M10 64c2-14 12-20 22-20s20 6 22 20z" fill="#8b8b8b"/></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

// A fixed "now", so the relative dates read the same today and in a year.
const NOW = "2026-11-10T12:00:00Z";

type Account = {
  id: string;
  name: string;
  detail?: string;
  src?: string;
  active: string;
  balance: number | null;
  status: { label: string; tone: StatusTone };
  used: number;
  quota: number;
  tags: readonly string[];
};

const ACCOUNTS: readonly Account[] = [
  { id: "a1", name: "Mara Okafor", detail: "Support lead", src: portrait("#e4e4e4"), active: "2026-11-10T11:48:00Z", balance: 1240, status: { label: "Paid", tone: "success" }, used: 41.3, quota: 50, tags: ["Design", "Billing", "EU", "VIP"] },
  { id: "a2", name: "Jonas Weber-Lindqvist", detail: "jonas.weber@kestrel-analytics.example", active: "2026-11-10T07:30:00Z", balance: -320, status: { label: "Pending", tone: "pending" }, used: 12.4, quota: 50, tags: ["API", "Beta"] },
  { id: "a3", name: "Aiko Tanaka", detail: "Head of operations", src: portrait("#d8d8d8"), active: "2026-11-09T09:00:00Z", balance: 0, status: { label: "Paid", tone: "success" }, used: 28.9, quota: 50, tags: ["EU"] },
  // No second line here: the picture keeps its size and the name sits level with the others.
  { id: "a7", name: "Fjord Freight", active: "2026-11-08T15:20:00Z", balance: 2150, status: { label: "Needs review", tone: "warning" }, used: 38.4, quota: 50, tags: ["API"] },
  { id: "a4", name: "Lucas Moreau", detail: "Billing contact", active: "2026-11-06T14:05:00Z", balance: -1875.5, status: { label: "Overdue", tone: "danger" }, used: 47.8, quota: 50, tags: ["Billing", "Priority", "Retention"] },
  { id: "a5", name: "Zoë van Dijk", detail: "Customer success", active: "2026-10-27T10:00:00Z", balance: null, status: { label: "Draft", tone: "neutral" }, used: 3.1, quota: 50, tags: [] },
  { id: "a6", name: "Émile Roche", detail: "Studio manager", active: "2026-09-21T16:40:00Z", balance: 462.9, status: { label: "On trial", tone: "info" }, used: 19.6, quota: 50, tags: ["Beta", "Design"] },
];

const GUESTS = [
  { id: "g1", name: "Sir Bartholomew Featherstonehaugh-Cholmondeley III", detail: "Chair of the supervisory board, northern region", joined: "2024-02-29", balance: 1200, status: { label: "Confirmed", tone: "success" as StatusTone } },
  { id: "g2", name: "Nia Mwangi", detail: "nia@fjordfreight.example", joined: "2026-10-31", balance: -45.5, status: { label: "Waitlist", tone: "pending" as StatusTone } },
  { id: "g3", name: "Tomás Herrera", detail: "tomas@lumen.example", joined: "2026-11-11", balance: null, status: { label: "Invited", tone: "info" as StatusTone } },
] as const;

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto grid w-full max-w-4xl gap-10">
      <Example caption="All seven cells in one row: person, date, amount, status, meter, tags and actions">
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead scope="col">Account</TableHead>
                <TableHead scope="col" className="hidden sm:table-cell">
                  Last active
                </TableHead>
                <TableHead scope="col" className="text-right">
                  Balance
                </TableHead>
                <TableHead scope="col">Status</TableHead>
                <TableHead scope="col" className="hidden sm:table-cell">
                  Storage
                </TableHead>
                <TableHead scope="col" className="hidden sm:table-cell">
                  Tags
                </TableHead>
                <TableHead scope="col" className="w-px">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ACCOUNTS.map((account) => {
                const share = account.used / account.quota;
                return (
                  <TableRow key={account.id}>
                    <TableCell>
                      <IdentityCell name={account.name} detail={account.detail} src={account.src} className="max-w-36 sm:max-w-40" />
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground sm:table-cell">
                      <DateCell value={account.active} now={NOW} />
                    </TableCell>
                    <TableCell>
                      <MoneyCell value={account.balance} currency="EUR" locale="en-IE" signed />
                    </TableCell>
                    <TableCell>
                      <StatusCell label={account.status.label} tone={account.status.tone} />
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <MeterCell value={account.used} max={account.quota} label={`Storage used by ${account.name}`} valueLabel={`${Math.round(share * 100)}%`} tone={share >= 0.9 ? "danger" : "default"} />
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <TagsCell tags={account.tags} />
                    </TableCell>
                    <TableCell>
                      <ActionsCell>
                        <Button type="button" variant="ghost" size="icon-sm" aria-label={`Actions for ${account.name}`} className="text-muted-foreground hover:text-foreground">
                          <IconMoreHorizontal strokeWidth={2.5} className="size-[1.125rem]" />
                        </Button>
                      </ActionsCell>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </Example>

      <Example caption="The edges: long names are cut, a missing amount reads as nothing, a minus stays a minus">
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead scope="col">Guest</TableHead>
                <TableHead scope="col" className="hidden sm:table-cell">
                  Joined
                </TableHead>
                <TableHead scope="col" className="text-right">
                  Balance
                </TableHead>
                <TableHead scope="col" className="hidden sm:table-cell">
                  Status
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {GUESTS.map((guest) => (
                <TableRow key={guest.id}>
                  <TableCell className="w-full max-w-0 sm:w-auto sm:max-w-none">
                    <IdentityCell name={guest.name} detail={guest.detail} className="max-w-none sm:max-w-56" />
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground sm:table-cell">
                    <DateCell value={guest.joined} now={NOW} />
                  </TableCell>
                  <TableCell>
                    <MoneyCell value={guest.balance} currency="EUR" locale="en-IE" signed />
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <StatusCell label={guest.status.label} tone={guest.status.tone} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Example>
    </div>
  );
}
