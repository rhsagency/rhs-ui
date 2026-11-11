"use client";

import { useState, type FormEvent, type ReactNode } from "react";

import { IconEdit, IconPlus } from "@rhs-ui/icons";
import { Badge } from "@rhs-ui/primitives/badge";
import { Button } from "@rhs-ui/primitives/button";
import { FormSheet, type FormSheetProblem } from "@rhs-ui/primitives/form-sheet";
import { Input } from "@rhs-ui/primitives/input";
import { Label } from "@rhs-ui/primitives/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@rhs-ui/primitives/select";
import { Switch } from "@rhs-ui/primitives/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@rhs-ui/primitives/table";
import { Textarea } from "@rhs-ui/primitives/textarea";

export default function Demo(): React.JSX.Element {
  const [customers, setCustomers] = useState<readonly Customer[]>(START);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [open, setOpen] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState("");

  function show(customer: Customer | null) {
    setEditing(customer);
    setErrors({});
    setDirty(false);
    setOpen(true);
  }

  async function save(values: FormData): Promise<FormSheetProblem[] | void> {
    await wait(800);
    const name = String(values.get("name") ?? "").trim();
    const email = String(values.get("email") ?? "").trim().toLowerCase();
    const problems: FormSheetProblem[] = [];
    const next: Record<string, string> = {};
    if (!name) problems.push({ field: "name", message: "Add the customer's name." });
    if (!/^\S+@\S+\.\S+$/.test(email)) problems.push({ field: "email", message: "Write the email address as name@company.example." });
    else if (customers.some((customer) => customer.email === email && customer.id !== editing?.id)) problems.push({ field: "email", message: "A customer with this email address already exists." });
    for (const problem of problems) if (problem.field) next[problem.field] = problem.message;
    setErrors(next);
    if (problems.length) return problems;
    const record: Customer = {
      id: editing?.id ?? `c${customers.length + 1}`,
      name,
      email,
      company: String(values.get("company") ?? ""),
      plan: String(values.get("plan") ?? "team"),
      notes: String(values.get("notes") ?? ""),
    };
    setCustomers((list) => (editing ? list.map((customer) => (customer.id === record.id ? record : customer)) : [...list, record]));
    setSaved(`${record.name} was ${editing ? "updated" : "added"}.`);
  }

  /** Typing in the form is a change, and a field that was wrong stops being wrong the moment it is edited. */
  function edited(event: FormEvent<HTMLDivElement>) {
    setDirty(true);
    const field = (event.target as HTMLElement).getAttribute("name");
    if (!field) return;
    setErrors((old) => {
      if (!old[field]) return old;
      const { [field]: _gone, ...rest } = old;
      return rest;
    });
  }

  return (
    <div className="mx-auto grid w-full max-w-3xl gap-4 p-2 sm:p-6">
      {/* The sheet draws itself in front of the page; the form inside is yours. */}
      <FormSheet
        open={open}
        onOpenChange={setOpen}
        title={editing ? "Edit customer" : "Add customer"}
        description={editing ? "Changes apply to new invoices only." : "They get a welcome email as soon as you save."}
        submitLabel={editing ? "Save changes" : "Add customer"}
        dirty={dirty}
        onSubmit={save}
      >
        <div className="grid gap-5" onInput={edited}>
          <Field id="cs-name" label="Full name" error={errors.name}>
            <Input id="cs-name" name="name" defaultValue={editing?.name ?? ""} autoComplete="off" aria-invalid={errors.name ? true : undefined} aria-describedby={errors.name ? "cs-name-note" : undefined} />
          </Field>
          <Field id="cs-email" label="Work email" error={errors.email} hint="Invoices and receipts go here.">
            <Input id="cs-email" name="email" type="email" defaultValue={editing?.email ?? ""} autoComplete="off" aria-invalid={errors.email ? true : undefined} aria-describedby="cs-email-note" />
          </Field>
          <Field id="cs-company" label="Company">
            <Input id="cs-company" name="company" defaultValue={editing?.company ?? ""} autoComplete="off" />
          </Field>
          <Field id="cs-plan" label="Plan">
            <Select name="plan" defaultValue={editing?.plan ?? "team"} onValueChange={() => setDirty(true)}>
              <SelectTrigger id="cs-plan">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="starter" description="Up to 3 seats">
                  Starter
                </SelectItem>
                <SelectItem value="team" description="Up to 25 seats">
                  Team
                </SelectItem>
                <SelectItem value="scale" description="Unlimited seats, priority support">
                  Scale
                </SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field id="cs-street" label="Street and number">
            <Input id="cs-street" name="street" defaultValue={editing ? "Prinsengracht 412" : ""} autoComplete="off" />
          </Field>
          <div className="grid gap-5 sm:grid-cols-[1fr_2fr]">
            <Field id="cs-postcode" label="Postcode">
              <Input id="cs-postcode" name="postcode" defaultValue={editing ? "1016 JK" : ""} autoComplete="off" />
            </Field>
            <Field id="cs-city" label="City">
              <Input id="cs-city" name="city" defaultValue={editing ? "Amsterdam" : ""} autoComplete="off" />
            </Field>
          </div>
          <Field id="cs-country" label="Country">
            <Select name="country" defaultValue="nl" onValueChange={() => setDirty(true)}>
              <SelectTrigger id="cs-country">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="nl">Netherlands</SelectItem>
                <SelectItem value="be">Belgium</SelectItem>
                <SelectItem value="de">Germany</SelectItem>
                <SelectItem value="fr">France</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field id="cs-vat" label="VAT number" hint="Printed on every invoice.">
            <Input id="cs-vat" name="vat" defaultValue={editing ? "NL855094215B01" : ""} autoComplete="off" className="font-mono" />
          </Field>
          <Field id="cs-notes" label="Notes" hint="Only your team sees these.">
            <Textarea id="cs-notes" name="notes" rows={4} defaultValue={editing?.notes ?? ""} />
          </Field>
          <div className="flex items-center justify-between gap-4 rounded-lg border border-border p-3.5">
            <div className="grid gap-0.5">
              <Label htmlFor="cs-welcome">Send a welcome email</Label>
              <p className="text-xs text-muted-foreground">Sent once, right after saving.</p>
            </div>
            <Switch id="cs-welcome" name="welcome" defaultChecked={!editing} onCheckedChange={() => setDirty(true)} />
          </div>
        </div>
      </FormSheet>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="grid gap-0.5">
          <h2 className="text-lg font-semibold tracking-[-0.02em]">Customers</h2>
          <p className="text-sm text-muted-foreground" role="status">
            {saved || `${customers.length} customers`}
          </p>
        </div>
        <Button type="button" onClick={() => show(null)}>
          <IconPlus />
          Add customer
        </Button>
      </div>

      <dl className="m-0 grid grid-cols-3 gap-3">
        {[
          ["Customers", customers.length],
          ["On the Scale plan", customers.filter((customer) => customer.plan === "scale").length],
          ["With a note", customers.filter((customer) => customer.notes.trim() !== "").length],
        ].map(([label, value]) => (
          // The number sits at the bottom of the tile, so a label that wraps to two lines does not push its number out of line with the others.
          <div key={label} className="grid grid-rows-[1fr_auto] gap-1 rounded-xl border border-border bg-card px-4 py-3.5 shadow-xs">
            <dt className="text-xs text-muted-foreground">{label}</dt>
            <dd className="m-0 text-2xl font-semibold tracking-[-0.03em] tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="max-sm:px-2">Name</TableHead>
              <TableHead className="hidden sm:table-cell">Company</TableHead>
              <TableHead className="max-sm:px-2">Plan</TableHead>
              <TableHead className="w-px max-sm:px-2">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.map((customer) => (
              <TableRow key={customer.id}>
                <TableCell className="max-sm:px-2">
                  <div className="grid">
                    <span className="font-medium">{customer.name}</span>
                    <span className="text-xs text-muted-foreground">{customer.email}</span>
                  </div>
                </TableCell>
                <TableCell className="hidden text-muted-foreground sm:table-cell">{customer.company}</TableCell>
                <TableCell className="max-sm:px-2">
                  <Badge variant="outline">{PLANS[customer.plan as keyof typeof PLANS] ?? customer.plan}</Badge>
                </TableCell>
                <TableCell className="max-sm:px-2">
                  {/* On a phone the button is the pencil alone, so the row keeps its name, plan and button in 302px; the name stays for a screen reader. */}
                  <Button type="button" variant="ghost" size="sm" onClick={() => show(customer)} className="max-sm:w-8 max-sm:px-0">
                    <IconEdit />
                    <span className="max-sm:sr-only">Edit</span>
                    <span className="sr-only"> {customer.name}</span>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <p className="text-xs leading-relaxed text-muted-foreground">Change a field and press Cancel or Escape to see the question. Save with ana@northwind.example to see a failed save: the sheet stays open, lists the problem and focuses the field.</p>

    </div>
  );
}

interface Customer {
  id: string;
  name: string;
  email: string;
  company: string;
  plan: string;
  notes: string;
}

const START: readonly Customer[] = [
  { id: "c1", name: "Ana Pereira", email: "ana@northwind.example", company: "Northwind Traders", plan: "scale", notes: "Prefers invoices on the first of the month." },
  { id: "c2", name: "Jonas Weber", email: "jonas@kestrel.example", company: "Kestrel Analytics", plan: "team", notes: "" },
  { id: "c3", name: "Aiko Tanaka", email: "aiko@halcyon.example", company: "Halcyon Labs", plan: "starter", notes: "Asked about the annual discount." },
  { id: "c4", name: "Lucas Moreau", email: "lucas@oaklane.example", company: "Oak Lane Bakery", plan: "starter", notes: "" },
  { id: "c5", name: "Priya Nair", email: "priya@mirror.example", company: "Mirror Labs", plan: "team", notes: "Two billing contacts." },
  { id: "c6", name: "Emile Roche", email: "emile@roche.example", company: "Roche Studio", plan: "scale", notes: "" },
  { id: "c7", name: "Zoe van Dijk", email: "zoe@dijk.example", company: "Dijk and Zonen", plan: "team", notes: "" },
];

const PLANS = { starter: "Starter", team: "Team", scale: "Scale" } as const;

const wait = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));

/** A label, a control and the reason it is wrong, tied together: the control is marked invalid and points at its message. */
function Field({ id, label, error, hint, children }: { id: string; label: string; error?: string; hint?: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error ? (
        <p id={`${id}-note`} className="text-xs text-[color-mix(in_oklch,var(--destructive),var(--foreground)_20%)]">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-note`} className="text-xs text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
