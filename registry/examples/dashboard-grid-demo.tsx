import type { ReactNode } from "react";

import { DashboardGrid } from "@rhs-ui/dashboard/dashboard-grid";
import { IconArrowDown, IconArrowRight, IconArrowUp, IconCheck } from "@rhs-ui/icons";
import { Badge } from "@rhs-ui/primitives/badge";
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@rhs-ui/primitives/card";

function Tile({ label, value, change, direction }: { label: string; value: string; change: string; direction: "up" | "down" }): React.JSX.Element {
  const Arrow = direction === "up" ? IconArrowUp : IconArrowDown;
  return (
    <Card className="justify-between gap-1 px-5 py-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <div>
        <p className="text-2xl leading-none font-medium tracking-[-0.03em] tabular-nums">{value}</p>
        <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
          <Arrow aria-hidden="true" className="size-3.5 text-foreground" />
          <span className="sr-only">{direction === "up" ? "Up" : "Down"} </span>
          {change} on last week
        </p>
      </div>
    </Card>
  );
}

function Panel({ title, description, size, more, children }: { title: string; description: string; size: string; more?: string; children: ReactNode }): React.JSX.Element {
  return (
    <Card className="gap-3 py-5">
      <CardHeader className="gap-1">
        <CardTitle className="text-base tracking-[-0.02em]">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
        <CardAction>
          <Badge variant="muted" className="font-mono font-normal">
            {size}
          </Badge>
        </CardAction>
      </CardHeader>
      <CardContent>{children}</CardContent>
      {more ? (
        <CardFooter className="mt-auto">
          <a
            href="#orders"
            className="inline-flex items-center gap-1 rounded-sm text-sm font-medium underline-offset-4 outline-none hover:underline focus-visible:ring-[3px] focus-visible:ring-ring/40"
          >
            {more}
            <IconArrowRight aria-hidden="true" className="size-3.5" />
          </a>
        </CardFooter>
      ) : null}
    </Card>
  );
}

const orders = [
  { id: "#4821", customer: "Studio Kestrel", total: "€1,240.00", status: "Shipped" },
  { id: "#4820", customer: "Halcyon Bakery", total: "€386.50", status: "Packing" },
  { id: "#4819", customer: "Lena Bakker", total: "€92.00", status: "Paid" },
  { id: "#4818", customer: "Polder & Co", total: "€2,115.00", status: "Shipped" },
  { id: "#4817", customer: "Northwind Cycles", total: "€540.75", status: "Paid" },
];

const products = [
  { name: "Linen apron", sold: 214 },
  { name: "Ceramic mug set", sold: 168 },
  { name: "Walnut serving board", sold: 131 },
  { name: "Beeswax wraps", sold: 97 },
  { name: "Enamel stock pot", sold: 64 },
];

const tasks = [
  { label: "Reply to 3 wholesale enquiries", done: true },
  { label: "Approve the autumn newsletter", done: true },
  { label: "Reorder walnut boards (12 left)", done: false },
  { label: "Pack the Studio Kestrel pallet", done: false },
  { label: "Send the Halcyon Bakery invoice", done: false },
  { label: "Update the autumn price list", done: false },
];

const activity = [
  { who: "Mo Haddad", what: "shipped order #4821", when: "12 minutes ago" },
  { who: "Priya Nair", what: "refunded order #4812", when: "1 hour ago" },
  { who: "Anna de Vries", what: "published Autumn collection", when: "3 hours ago" },
  { who: "Tom Jansen", what: "restocked Linen apron", when: "5 hours ago" },
  { who: "Lena Bakker", what: "left a five-star review", when: "6 hours ago" },
  { who: "Mo Haddad", what: "packed order #4815", when: "7 hours ago" },
];

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <h2 className="text-xl font-medium tracking-[-0.02em]">Store overview</h2>
        <p className="mt-1 text-sm text-muted-foreground">Week of 12 October. Every widget sits on the grid by name, and every row is one height.</p>
      </div>

      <DashboardGrid label="Store overview" dense>
        <DashboardGrid.Widget label="Revenue" size="sm">
          <Tile label="Revenue" value="€48,210" change="6.4%" direction="up" />
        </DashboardGrid.Widget>
        <DashboardGrid.Widget label="Orders" size="sm">
          <Tile label="Orders" value="1,284" change="2.1%" direction="up" />
        </DashboardGrid.Widget>
        <DashboardGrid.Widget label="Conversion rate" size="sm">
          <Tile label="Conversion rate" value="3.4%" change="0.3 points" direction="down" />
        </DashboardGrid.Widget>
        <DashboardGrid.Widget label="Refund rate" size="sm">
          <Tile label="Refund rate" value="1.2%" change="0.1 points" direction="down" />
        </DashboardGrid.Widget>

        <DashboardGrid.Widget label="Recent orders" size="wide" rowSpan={3}>
          <Panel title="Recent orders" description="The last five in the shop" size="wide, 3 rows" more="View all orders">
            <ul>
              {orders.map((order) => (
                <li key={order.id} className="flex items-center gap-3 border-t border-border py-2.5 text-sm first:border-t-0">
                  <span className="w-14 shrink-0 text-muted-foreground tabular-nums">{order.id}</span>
                  <span className="min-w-0 flex-1 truncate font-medium">{order.customer}</span>
                  <Badge variant="outline" className="hidden sm:inline-flex">
                    {order.status}
                  </Badge>
                  <span className="w-24 shrink-0 text-right tabular-nums">{order.total}</span>
                </li>
              ))}
            </ul>
          </Panel>
        </DashboardGrid.Widget>
        <DashboardGrid.Widget label="Top products" size="md" rowSpan={3}>
          <Panel title="Top products" description="Units sold this week" size="md, 3 rows" more="Open the catalogue">
            <ol>
              {products.map((product, index) => (
                <li key={product.name} className="flex items-center gap-3 border-t border-border py-2.5 text-sm first:border-t-0">
                  <span className="w-4 text-muted-foreground tabular-nums">{index + 1}</span>
                  <span className="min-w-0 flex-1 truncate">{product.name}</span>
                  <span className="tabular-nums">{product.sold}</span>
                </li>
              ))}
            </ol>
          </Panel>
        </DashboardGrid.Widget>

        <DashboardGrid.Widget label="Tasks due today" size="md" rowSpan={3}>
          <Panel title="Due today" description="2 of 6 done" size="md, 3 rows" more="Open the task list">
            <ul className="grid gap-2.5">
              {tasks.map((task) => (
                <li key={task.label} className="flex items-center gap-2.5 text-sm">
                  <span
                    aria-hidden="true"
                    className={
                      task.done
                        ? "grid size-[18px] shrink-0 place-items-center rounded-[5px] bg-primary text-primary-foreground"
                        : "size-[18px] shrink-0 rounded-[5px] border border-muted-foreground"
                    }
                  >
                    {task.done ? <IconCheck size={12} strokeWidth={2.5} /> : null}
                  </span>
                  <span className={task.done ? "text-muted-foreground line-through" : undefined}>
                    {task.label}
                    <span className="sr-only">{task.done ? " (done)" : " (to do)"}</span>
                  </span>
                </li>
              ))}
            </ul>
          </Panel>
        </DashboardGrid.Widget>
        <DashboardGrid.Widget label="Team activity" size="wide" rowSpan={3}>
          <Panel title="Team activity" description="Across the shop" size="wide, 3 rows" more="Open the activity log">
            <ul className="grid gap-2.5">
              {activity.map((entry) => (
                <li key={entry.what} className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="min-w-0">
                    <span className="font-medium">{entry.who}</span> {entry.what}
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground">{entry.when}</span>
                </li>
              ))}
            </ul>
          </Panel>
        </DashboardGrid.Widget>
      </DashboardGrid>
    </div>
  );
}
