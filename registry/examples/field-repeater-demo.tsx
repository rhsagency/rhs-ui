"use client";

import { useState, type ReactNode } from "react";

import { FieldRepeater } from "@rhs-ui/application/field-repeater";
import { Input } from "@rhs-ui/primitives/input";
import { Label } from "@rhs-ui/primitives/label";

interface Contact {
  id: string;
  name: string;
  relationship: string;
  phone: string;
}

interface Reference {
  id: string;
}

/** Ids are made when a row is added, never while rendering, so server and browser agree. */
let nextContact = 3;
let nextReference = 1;

function Example({ title, children, caption }: { title: string; caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <section className="grid min-w-0 content-start gap-4">
      <div className="grid gap-1">
        <h2 className="text-base font-semibold tracking-[-0.015em]">{title}</h2>
        <p className="text-sm text-muted-foreground">{caption}</p>
      </div>
      {children}
    </section>
  );
}

function Field({ id, label, children }: { id: string; label: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  const [contacts, setContacts] = useState<Contact[]>([
    { id: "contact-1", name: "Ines Carvalho", relationship: "Sister", phone: "+31 6 1234 5678" },
    { id: "contact-2", name: "Theo Okonkwo", relationship: "Neighbour", phone: "+31 6 8765 4321" },
  ]);

  return (
    <div className="grid w-full max-w-xl min-w-0 gap-14">
      <Example title="Emergency contacts" caption="We call them in this order. At least one, at most four. The list is yours: every keystroke comes back through onChange.">
        <FieldRepeater<Contact>
          value={contacts}
          onChange={setContacts}
          min={1}
          max={4}
          itemLabel="Contact"
          createItem={() => ({ id: `contact-${nextContact++}`, name: "", relationship: "", phone: "" })}
          renderRow={(contact, _index, row) => (
            <>
              <Field id={`${contact.id}-name`} label="Full name">
                <Input id={`${contact.id}-name`} value={contact.name} autoComplete="off" onChange={(event) => row.update({ name: event.target.value })} />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field id={`${contact.id}-relationship`} label="Relationship">
                  <Input id={`${contact.id}-relationship`} value={contact.relationship} autoComplete="off" onChange={(event) => row.update({ relationship: event.target.value })} />
                </Field>
                <Field id={`${contact.id}-phone`} label="Phone">
                  <Input id={`${contact.id}-phone`} type="tel" inputMode="tel" value={contact.phone} autoComplete="off" onChange={(event) => row.update({ phone: event.target.value })} />
                </Field>
              </div>
            </>
          )}
        />
      </Example>

      <Example title="Work references" caption="Starts empty, so there is one dashed row to begin with. The fields here are not controlled: type in the second row, remove the first, and the text stays with its row.">
        <FieldRepeater<Reference>
          defaultValue={[]}
          max={3}
          itemLabel="Reference"
          createItem={() => ({ id: `reference-${nextReference++}` })}
          renderRow={(reference) => (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field id={`${reference.id}-name`} label="Name">
                  <Input id={`${reference.id}-name`} name={`${reference.id}-name`} autoComplete="off" />
                </Field>
                <Field id={`${reference.id}-company`} label="Company">
                  <Input id={`${reference.id}-company`} name={`${reference.id}-company`} autoComplete="off" />
                </Field>
              </div>
              <Field id={`${reference.id}-email`} label="Email">
                <Input id={`${reference.id}-email`} name={`${reference.id}-email`} type="email" autoComplete="off" placeholder="name@company.example" />
              </Field>
            </>
          )}
        />
      </Example>
    </div>
  );
}
