"use client";

import { useState } from "react";

import { EditableSection } from "@rhs-ui/application/editable-section";
import { Input } from "@rhs-ui/primitives/input";
import { Label } from "@rhs-ui/primitives/label";
import { DescriptionList } from "@rhs-ui/primitives/description-list";

type SectionId = "contact" | "billing";

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

function Field({ id, label, optional, children }: { id: string; label: string; optional?: boolean; children: React.ReactNode }): React.JSX.Element {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>
        {label}
        {optional ? <span className="font-normal text-muted-foreground">Optional</span> : null}
      </Label>
      {children}
    </div>
  );
}

const NOT_PROVIDED = <span className="font-normal text-muted-foreground">Not provided</span>;

export default function Demo(): React.JSX.Element {
  // One section is open at a time. The others wait, which is what `disabled` is for.
  const [open, setOpen] = useState<SectionId | null>("billing");
  const [contact, setContact] = useState({ name: "Mara Jansen", email: "mara@kestrel.dev", phone: "+31 6 1234 5678" });
  const [billing, setBilling] = useState({ company: "Kestrel Studio B.V.", street: "Prinsengracht 267 A", postcode: "1016 GV", city: "Amsterdam", vat: "" });

  const section = (id: SectionId) => ({
    editing: open === id,
    onEditingChange: (editing: boolean) => setOpen(editing ? id : null),
    disabled: open !== null && open !== id,
  });

  return (
    <div className="grid w-full max-w-xl min-w-0 gap-4">
      <EditableSection
        {...section("contact")}
        title="Contact details"
        description="Where we send receipts and where we call when a delivery goes wrong."
        saveLabel="Save contact details"
        onSave={async (values) => {
          const email = String(values.get("email") ?? "").trim().toLowerCase();
          await wait(900);
          if (email === "theo@kestrel.dev") throw new Error("That email address already belongs to another account. Use one that is yours.");
          setContact({ name: String(values.get("name") ?? "").trim(), email, phone: String(values.get("phone") ?? "").trim() });
        }}
        view={
          <DescriptionList
            items={[
              { term: "Full name", value: contact.name },
              { term: "Email address", value: contact.email },
              { term: "Phone", value: contact.phone || NOT_PROVIDED },
            ]}
          />
        }
      >
        <Field id="es-name" label="Full name">
          <Input id="es-name" name="name" defaultValue={contact.name} required autoComplete="name" />
        </Field>
        <Field id="es-email" label="Email address">
          <Input id="es-email" name="email" type="email" defaultValue={contact.email} required autoComplete="email" />
        </Field>
        <Field id="es-phone" label="Phone" optional>
          <Input id="es-phone" name="phone" type="tel" inputMode="tel" defaultValue={contact.phone} autoComplete="tel" />
        </Field>
      </EditableSection>

      <EditableSection
        {...section("billing")}
        title="Billing address"
        description="Printed on every invoice we send you."
        saveLabel="Save billing address"
        onSave={(values) => {
          setBilling({
            company: String(values.get("company") ?? "").trim(),
            street: String(values.get("street") ?? "").trim(),
            postcode: String(values.get("postcode") ?? "").trim(),
            city: String(values.get("city") ?? "").trim(),
            vat: String(values.get("vat") ?? "").trim(),
          });
        }}
        view={
          <DescriptionList
            items={[
              { term: "Company", value: billing.company },
              {
                term: "Address",
                value: (
                  <span className="block">
                    {billing.street}
                    <br />
                    {billing.postcode} {billing.city}
                  </span>
                ),
              },
              { term: "VAT number", value: billing.vat || NOT_PROVIDED },
            ]}
          />
        }
      >
        <Field id="es-company" label="Company">
          <Input id="es-company" name="company" defaultValue={billing.company} required autoComplete="organization" />
        </Field>
        <Field id="es-street" label="Street and number">
          <Input id="es-street" name="street" defaultValue={billing.street} required autoComplete="billing street-address" />
        </Field>
        <div className="grid gap-4 sm:grid-cols-[9rem_minmax(0,1fr)]">
          <Field id="es-postcode" label="Postcode">
            <Input id="es-postcode" name="postcode" defaultValue={billing.postcode} required autoComplete="billing postal-code" />
          </Field>
          <Field id="es-city" label="City">
            <Input id="es-city" name="city" defaultValue={billing.city} required autoComplete="billing address-level2" />
          </Field>
        </div>
        <Field id="es-vat" label="VAT number" optional>
          <Input id="es-vat" name="vat" defaultValue={billing.vat} autoComplete="off" placeholder="NL123456789B01" />
        </Field>
      </EditableSection>

      <p className="text-xs text-muted-foreground">
        Only one section is open at a time: while Billing address is open, Contact details waits. Press Escape to leave a form, or change a field first and see it ask. In Contact details, use theo@kestrel.dev as the email and the save fails, with everything left as typed.
      </p>
    </div>
  );
}
