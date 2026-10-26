import type { ReactNode } from "react";

import { FieldDiffTable, type FieldChange } from "@rhs-ui/dashboard/field-diff-table";

const euro = new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR" });

const product: FieldChange[] = [
  { field: "status", before: "Draft", after: "Published" },
  { field: "price", before: 649, after: 599 },
  { field: "owner", before: null, after: "Priya Nair" },
  { field: "discount_code", before: "AUTUMN25", after: "" },
  { field: "tags", before: ["office", "desk"], after: ["office", "desk", "ergonomic"] },
  {
    field: "description",
    before: "A sturdy sit-stand desk with a bamboo top and two memory presets.",
    after:
      "A sturdy sit-stand desk with a sustainably harvested bamboo top, a quiet dual-motor frame and four memory presets. It assembles in about twenty minutes with the tools in the box, and the frame and both motors carry a ten-year warranty.",
  },
  { field: "last_reviewed", before: new Date("2026-10-02T09:14:00Z"), after: new Date("2026-10-20T14:05:00Z") },
  { field: "sku", label: "SKU", before: "HLC-SD-140", after: "HLC-SD-140" },
  { field: "category", before: "Furniture", after: "Furniture" },
  { field: "stock", before: 38, after: 38 },
  { field: "supplier", before: "Kestrel Furnishings", after: "Kestrel Furnishings" },
];

const workspace: FieldChange[] = [
  { field: "role", label: "Role", before: "Editor", after: "Admin" },
  { field: "two_factor", label: "Two-factor sign-in", before: false, after: true },
  { field: "session_timeout", label: "Session timeout", before: 30, after: 60 },
  { field: "billing_email", label: "Billing email", before: "accounts@northwind.example", after: "finance@northwind.example" },
  { field: "seats", label: "Seat limit", before: 25, after: 25 },
  { field: "region", label: "Data region", before: "EU (Frankfurt)", after: "EU (Frankfurt)" },
];

const untouched: FieldChange[] = [
  { field: "title", before: "Quarterly planning", after: "Quarterly planning" },
  { field: "visibility", before: "Team only", after: "Team only" },
  { field: "owner", before: "Mo Haddad", after: "Mo Haddad" },
];

function Example({ title, description, children }: { title: string; description: string; children: ReactNode }): React.JSX.Element {
  return (
    <section className="min-w-0">
      <h3 className="text-base font-medium tracking-[-0.02em]">{title}</h3>
      <p className="mt-1 mb-5 max-w-xl text-sm text-muted-foreground">{description}</p>
      {children}
    </section>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto grid w-full max-w-4xl gap-14 px-4 py-10 sm:px-6">
      <Example
        title="Product edit review"
        description="Before anything goes live. The old value is struck through and the new one is at full strength; an empty value says so in words."
      >
        <FieldDiffTable
          caption="Changes to the Halcyon standing desk"
          changes={product}
          locale="en-GB"
          timeZone="Europe/Amsterdam"
          formatters={{ price: (value) => euro.format(Number(value)) }}
        />
      </Example>

      <div className="grid items-start gap-14 md:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
        <Example title="In a side panel" description="The table answers to the width of its container: the field takes a line of its own and each pair stays side by side.">
          <FieldDiffTable
            caption="Changes to the Northwind workspace"
            changes={workspace}
            formatters={{ session_timeout: (value) => `${String(value)} minutes` }}
          />
        </Example>
        <Example title="Nothing changed" description="A save that changed nothing says so, and the untouched fields stay one click away.">
          <FieldDiffTable caption="Changes to Quarterly planning" changes={untouched} />
        </Example>
      </div>
    </div>
  );
}
