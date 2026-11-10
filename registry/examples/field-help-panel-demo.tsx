"use client";

import type { ReactNode } from "react";

import { FieldHelpPanel, type FieldHelp } from "@rhs-ui/application/field-help-panel";
import { Button } from "@rhs-ui/primitives/button";
import { FormControl, FormDescription, FormField, FormLabel } from "@rhs-ui/primitives/form-field";
import { Input } from "@rhs-ui/primitives/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@rhs-ui/primitives/select";

/** A caption and the example under it. */
function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

const BUSINESS_HELP: Record<string, FieldHelp> = {
  overview: {
    title: "Why we ask so much",
    body: "Payment rules require us to verify a business, and the person who controls it, before we pay anything out. Click or tab into any question and its explanation appears here.",
    next: "A reviewer reads every application, usually within one working day.",
    link: { label: "How verification works", href: "#" },
  },
  "legal-name": {
    title: "Why we need the registered name",
    body: "The commercial register and your bank both know the business by its legal name, which can differ from the name on your shop. We match the two before any payout.",
    example: "Halcyon Bike Fitting B.V.",
    next: "We check it against the register within a minute. A close match is accepted without a person looking at it.",
    link: { label: "Where to find your registered name", href: "#" },
  },
  country: {
    title: "Why the country matters",
    body: "The country decides which documents we can accept and which tax forms apply. It cannot be changed later without a new application.",
    next: "The documents you can upload in the next step are limited to what that country accepts.",
  },
  registration: {
    title: "Your chamber of commerce number",
    body: "A short number from the commercial register that identifies the business, and nothing else.",
    example: "81234567",
    next: "We look it up in the register ourselves, so you do not need to upload an extract.",
    link: { label: "Find your number in the register", href: "#" },
  },
  vat: {
    title: "Your VAT number",
    body: "We need it to invoice you correctly and to know whether VAT is due on our fees. Not VAT-registered yet? Leave it empty and tell us in the next step.",
    example: "NL123456789B01",
    next: "We validate the number with the European VIES service.",
  },
  revenue: {
    title: "Why we ask about revenue",
    body: "An estimate is enough. It sets your first payout limit, which grows by itself as you sell.",
    next: "You can change the estimate later in Settings.",
  },
  director: {
    title: "Who counts as the director",
    body: "The person who can legally sign for the business: a director, a managing partner, or the owner of a sole proprietorship. We ask them to confirm their identity in the next step.",
    example: "Imani Okafor",
  },
};

const OWNER_HELP: Record<string, FieldHelp> = {
  name: {
    title: "Your name as on your passport",
    body: "We compare it with your ID document in the next step, so use the full name rather than a nickname.",
    example: "Imani Okafor",
    next: "It appears on invoices and on the account owner line in your settings.",
  },
  email: {
    title: "Why a work address is best",
    body: "Security alerts and payout notices go here. A shared inbox such as billing@ is fine, as long as someone reads it.",
    example: "imani@halcyonbikes.example",
    next: "We send a code to this address to confirm it is yours.",
  },
  phone: {
    title: "When we would call you",
    body: "Only to confirm a large or unusual payout, never to sell you anything. We do not share the number.",
    example: "+31 6 1234 5678",
  },
};

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto grid w-full max-w-5xl gap-14 px-4 py-10 sm:px-6">
      <Example caption="Try it: click or tab into a question and the panel changes to explain it, and gives way to the general note when nothing has the focus. Pin keeps it still while you read. Below 1024px the panel becomes a bar above the form, and the help of the field you are in opens in a bar under that field.">
        <FieldHelpPanel help={BUSINESS_HELP} defaultId="overview">
          <form onSubmit={(event) => event.preventDefault()} className="grid gap-5">
            <div className="grid gap-1">
              <p className="text-xs font-medium text-muted-foreground tabular-nums">Step 2 of 4</p>
              <h2 className="text-xl leading-tight font-semibold tracking-[-0.03em]">Verify your business</h2>
              <p className="text-sm leading-5 text-muted-foreground">Northwind Payments needs these details before your first payout.</p>
            </div>

            <FormField data-help-id="legal-name" described>
              <FormLabel>Legal business name</FormLabel>
              <FormControl>
                <Input autoComplete="organization" defaultValue="Halcyon Bike Fitting B.V." />
              </FormControl>
              <FormDescription>As it appears on your registration extract.</FormDescription>
            </FormField>

            <div className="grid gap-5 sm:grid-cols-2 sm:items-start">
              <FormField data-help-id="country" described>
                <FormLabel>Country of registration</FormLabel>
                <Select defaultValue="nl">
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a country" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="nl">Netherlands</SelectItem>
                    <SelectItem value="de">Germany</SelectItem>
                    <SelectItem value="be">Belgium</SelectItem>
                    <SelectItem value="fr">France</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>Where the business is registered.</FormDescription>
              </FormField>

              <FormField data-help-id="registration" described>
                <FormLabel>Chamber of commerce number</FormLabel>
                <FormControl>
                  <Input inputMode="numeric" placeholder="8 digits" />
                </FormControl>
                <FormDescription>Eight digits, no spaces.</FormDescription>
              </FormField>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 sm:items-start">
              <FormField data-help-id="vat" described>
                <FormLabel>VAT number</FormLabel>
                <FormControl>
                  <Input placeholder="NL123456789B01" className="font-mono" />
                </FormControl>
                <FormDescription>Starts with your country code.</FormDescription>
              </FormField>

              <FormField data-help-id="revenue" described>
                <FormLabel>Expected yearly revenue</FormLabel>
                <Select>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a range" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="a">Under &euro;100,000</SelectItem>
                    <SelectItem value="b">&euro;100,000 to &euro;500,000</SelectItem>
                    <SelectItem value="c">&euro;500,000 to &euro;2 million</SelectItem>
                    <SelectItem value="d">Over &euro;2 million</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>An estimate is fine.</FormDescription>
              </FormField>
            </div>

            <FormField data-help-id="director" described>
              <FormLabel>Director</FormLabel>
              <FormControl>
                <Input autoComplete="name" placeholder="Full name" />
              </FormControl>
              <FormDescription>The person who can sign for the business.</FormDescription>
            </FormField>

            <div className="flex items-center gap-3 border-t border-border pt-5">
              <Button type="submit">Continue</Button>
              <Button type="button" variant="ghost">
                Save and finish later
              </Button>
            </div>
          </form>
        </FieldHelpPanel>
      </Example>

      <Example caption="A short form can start on a question (defaultId is a field, not a general note): the panel is never empty, even before anyone has clicked.">
        <FieldHelpPanel help={OWNER_HELP} defaultId="name" labels={{ region: "About this field" }} className="lg:grid-cols-[minmax(0,1fr)_17rem]">
          <form onSubmit={(event) => event.preventDefault()} className="grid gap-5">
            <h2 className="text-base leading-tight font-semibold tracking-[-0.02em]">Account owner</h2>
            <FormField data-help-id="name" described>
              <FormLabel>Full name</FormLabel>
              <FormControl>
                <Input autoComplete="name" defaultValue="Imani Okafor" />
              </FormControl>
              <FormDescription>As on your passport.</FormDescription>
            </FormField>
            <FormField data-help-id="email" described>
              <FormLabel>Work email</FormLabel>
              <FormControl>
                <Input type="email" autoComplete="email" placeholder="you@company.example" />
              </FormControl>
              <FormDescription>Alerts and payout notices go here.</FormDescription>
            </FormField>
            <FormField data-help-id="phone" described>
              <FormLabel>Phone</FormLabel>
              <FormControl>
                <Input type="tel" autoComplete="tel" placeholder="+31 6 1234 5678" />
              </FormControl>
              <FormDescription>Only for large or unusual payouts.</FormDescription>
            </FormField>
          </form>
        </FieldHelpPanel>
      </Example>
    </div>
  );
}
