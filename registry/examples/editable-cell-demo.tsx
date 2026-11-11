"use client";

import { useState, type ReactNode } from "react";

import { EditableCell, type EditableOption } from "@rhs-ui/primitives/editable-cell";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@rhs-ui/primitives/table";

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

/** A server that takes a moment to answer, and refuses when it is given a reason to. */
function fakeSave(milliseconds: number, refusal?: string): Promise<void> {
  return new Promise((resolve, reject) => {
    window.setTimeout(() => (refusal ? reject(new Error(refusal)) : resolve()), milliseconds);
  });
}

const euro = new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR" });

type Category = "lighting" | "kitchen" | "bags" | "textiles" | "audio";
type Item = { id: string; name: string; category: Category; price: number; stock: number };

const CATEGORIES: readonly EditableOption[] = [
  { value: "lighting", label: "Lighting" },
  { value: "kitchen", label: "Kitchen" },
  { value: "bags", label: "Bags" },
  { value: "textiles", label: "Textiles" },
  { value: "audio", label: "Audio" },
];

const START: readonly Item[] = [
  { id: "i1", name: "Halcyon desk lamp", category: "lighting", price: 48, stock: 23 },
  { id: "i2", name: "Northwind kettle", category: "kitchen", price: 64, stock: 60 },
  { id: "i3", name: "Kestrel backpack", category: "bags", price: 129, stock: 97 },
  { id: "i4", name: "Oak Lane tea towel", category: "textiles", price: 18, stock: 134 },
  { id: "i5", name: "Mirror Labs speaker", category: "audio", price: 86, stock: 41 },
];

function PriceList(): React.JSX.Element {
  const [items, setItems] = useState<readonly Item[]>(START);
  const change = (id: string, patch: Partial<Item>) => setItems((list) => list.map((item) => (item.id === id ? { ...item, ...patch } : item)));

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead scope="col">Product</TableHead>
            <TableHead scope="col" className="hidden sm:table-cell">
              Category
            </TableHead>
            <TableHead scope="col" className="text-right">
              Price
            </TableHead>
            <TableHead scope="col" className="hidden text-right sm:table-cell">
              Stock
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              {/* On a phone the name column takes what the price leaves and cuts the name there; from sm up it is as wide as its content. */}
              <TableCell className="w-full max-w-0 font-medium sm:w-auto sm:max-w-none">
                <EditableCell label={`Name of ${item.name}`} value={item.name} required maxLength={40} onCommit={(name) => change(item.id, { name })} />
              </TableCell>
              <TableCell className="hidden sm:table-cell">
                <EditableCell
                  type="select"
                  label={`Category of ${item.name}`}
                  value={item.category}
                  options={CATEGORIES}
                  onCommit={async (category) => {
                    await fakeSave(450);
                    change(item.id, { category: category as Category });
                  }}
                />
              </TableCell>
              <TableCell>
                <EditableCell
                  type="number"
                  align="right"
                  label={`Price of ${item.name}`}
                  value={item.price}
                  min={0}
                  format={(price) => <span className="tabular-nums">{euro.format(price)}</span>}
                  onCommit={async (price) => {
                    await fakeSave(650, price > 500 ? "Prices above €500 need a manager's approval, so nothing was saved." : undefined);
                    change(item.id, { price });
                  }}
                />
              </TableCell>
              <TableCell className="hidden sm:table-cell">
                <EditableCell
                  type="number"
                  align="right"
                  label={`Stock of ${item.name}`}
                  value={item.stock}
                  min={0}
                  validate={(stock) => (Number.isInteger(stock) ? undefined : "Stock is a whole number.")}
                  format={(stock) => <span className="tabular-nums">{stock}</span>}
                  onCommit={(stock) => change(item.id, { stock })}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function ProfileList(): React.JSX.Element {
  const [name, setName] = useState("Mara Okafor");
  const [role, setRole] = useState("lead");
  const [rate, setRate] = useState(95);
  const roles: readonly EditableOption[] = [
    { value: "lead", label: "Support lead" },
    { value: "agent", label: "Support agent" },
    { value: "admin", label: "Administrator" },
  ];

  return (
    <dl className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card shadow-xs">
      {(
        [
          ["Display name", <EditableCell key="name" label="Display name" value={name} required onCommit={setName} />],
          ["Role", <EditableCell key="role" type="select" label="Role" value={role} options={roles} onCommit={setRole} />],
          [
            "Hourly rate",
            <EditableCell
              key="rate"
              type="number"
              label="Hourly rate"
              value={rate}
              min={1}
              max={400}
              format={(value) => euro.format(value)}
              onCommit={async (next) => {
                await fakeSave(500);
                setRate(next);
              }}
            />,
          ],
          ["Plan", <EditableCell key="plan" label="Plan" value="Business" disabled onCommit={() => undefined} />],
        ] as const
      ).map(([term, cell]) => (
        <div key={term} className="grid grid-cols-[7.5rem_minmax(0,1fr)] items-center gap-3 px-4 py-2 sm:grid-cols-[10rem_minmax(0,1fr)]">
          <dt className="text-sm text-muted-foreground">{term}</dt>
          <dd className="min-w-0 text-sm font-medium">{cell}</dd>
        </div>
      ))}
    </dl>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto grid w-full max-w-3xl gap-10">
      <Example caption="Enter or double-click to edit; try a price over 500, or a stock of 2.5">
        <PriceList />
      </Example>
      <Example caption="It also works outside a table: text, a choice, a slow number and a read-only value">
        <ProfileList />
      </Example>
    </div>
  );
}
