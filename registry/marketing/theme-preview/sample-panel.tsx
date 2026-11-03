import { IconCheck, IconClock, IconLayers, IconTrendUp, IconWarning } from "@rhs-ui/icons";
import { Badge } from "@rhs-ui/primitives/badge";
import { Button } from "@rhs-ui/primitives/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@rhs-ui/primitives/card";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@rhs-ui/primitives/table";

const NAV = ["Overview", "Invoices", "Customers", "Reports"] as const;

const INVOICES = [
  { id: "INV-2041", customer: "Northwind Traders", status: "paid", amount: "$2,400.00" },
  { id: "INV-2040", customer: "Kestrel Labs", status: "pending", amount: "$890.00" },
  { id: "INV-2039", customer: "Polder & Co", status: "paid", amount: "$1,250.00" },
  { id: "INV-2038", customer: "Lumen Studio", status: "overdue", amount: "$320.00" },
] as const;

function Status({ status }: { status: (typeof INVOICES)[number]["status"] }) {
  if (status === "paid") {
    return (
      <Badge variant="secondary">
        <IconCheck />
        Paid
      </Badge>
    );
  }
  if (status === "pending") {
    return (
      <Badge variant="outline">
        <IconClock />
        Pending
      </Badge>
    );
  }
  return (
    // Destructive text on the plain surface keeps 4.5:1 in all three themes; the tinted fill of the destructive badge does not in the light one.
    <Badge variant="outline" className="border-destructive/40 text-destructive">
      <IconWarning />
      Overdue
    </Badge>
  );
}

/**
 * The sample the preview shows when you give it nothing of your own: the
 * kind of screen a theme has to get right. A header with a mark, navigation
 * and a person; a card with a figure, a change and a meter; a table of
 * invoices whose status is told in a word and an icon as well as a tone; and
 * the buttons of every kind. It is drawn with RHS UI's own components and
 * semantic tokens only, so it takes on whatever theme it sits in.
 */
export function SamplePanel() {
  return (
    <div className="text-sm">
      <header className="flex items-center justify-between gap-4 border-b border-border px-4 py-3 sm:px-6">
        <div className="flex items-center gap-6">
          <span className="flex items-center gap-2 font-medium tracking-[-0.01em]">
            <span aria-hidden="true" className="grid size-6 place-items-center rounded-md bg-primary text-primary-foreground">
              <IconLayers className="size-3.5" />
            </span>
            Halcyon
          </span>
          <ul aria-hidden="true" className="hidden items-center gap-1 sm:flex">
            {NAV.map((item, index) => (
              <li key={item} className={index === 0 ? "rounded-md bg-muted px-2.5 py-1.5 font-medium text-foreground" : "px-2.5 py-1.5 text-muted-foreground"}>
                {item}
              </li>
            ))}
          </ul>
        </div>
        <span aria-hidden="true" className="grid size-8 place-items-center rounded-full bg-secondary text-xs font-medium text-secondary-foreground">
          MC
        </span>
      </header>

      <div className="grid gap-4 p-4 sm:p-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <Card className="gap-4 py-5">
          <CardHeader className="px-5">
            <CardTitle className="text-sm">Monthly revenue</CardTitle>
            <CardDescription>October, against September</CardDescription>
          </CardHeader>
          <CardContent className="px-5">
            <p className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
              <span className="text-3xl font-medium tracking-[-0.03em] tabular-nums">$48,200</span>
              <Badge variant="secondary">
                <IconTrendUp />
                12.4%
              </Badge>
            </p>
            <div aria-hidden="true" className="mt-5 h-1.5 overflow-hidden rounded-full bg-muted">
              <div className="h-full w-[72%] rounded-full bg-primary" />
            </div>
            <p className="mt-2.5 text-xs text-muted-foreground tabular-nums">72% of the $67,000 goal</p>
          </CardContent>
          {/* The card stretches to the height of the table beside it: the footer sits on its bottom padding and the spare room goes in the middle. */}
          <CardFooter className="mt-auto gap-2 px-5">
            <Button size="sm">View report</Button>
            <Button size="sm" variant="outline">
              Export
            </Button>
          </CardFooter>
        </Card>

        <div className="overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-xs">
          <Table>
            <TableCaption className="sr-only">Recent invoices</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden text-right sm:table-cell">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {INVOICES.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell>
                    <span className="block font-medium">{invoice.customer}</span>
                    <span className="block font-mono text-xs text-muted-foreground">{invoice.id}</span>
                  </TableCell>
                  <TableCell>
                    <Status status={invoice.status} />
                  </TableCell>
                  <TableCell className="hidden text-right tabular-nums sm:table-cell">{invoice.amount}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-border px-4 py-4 sm:px-6">
        <Button>Create invoice</Button>
        <Button variant="secondary">Save draft</Button>
        <Button variant="outline">Preview</Button>
        <Button variant="ghost">Cancel</Button>
        <Button variant="destructive">Delete</Button>
      </div>
    </div>
  );
}
