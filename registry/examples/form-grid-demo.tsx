"use client";

import { useEffect, useRef, useState, type ComponentProps, type ReactNode } from "react";

import { SegmentedControl } from "@rhs-ui/application/segmented-control";
import { Button } from "@rhs-ui/primitives/button";
import { FormControl, FormDescription, FormField, FormLabel } from "@rhs-ui/primitives/form-field";
import { FormGrid } from "@rhs-ui/primitives/form-grid";
import { Input } from "@rhs-ui/primitives/input";
import { Textarea } from "@rhs-ui/primitives/textarea";

function TextField({ label, hint, error, ...input }: { label: string; hint?: string; error?: string } & Omit<ComponentProps<"input">, "children">): React.JSX.Element {
  return (
    <FormField error={error} described={Boolean(hint)}>
      <FormLabel>{label}</FormLabel>
      <FormControl>
        <Input {...input} />
      </FormControl>
      {hint ? <FormDescription>{hint}</FormDescription> : null}
    </FormField>
  );
}

function Heading({ id, title, children }: { id: string; title: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="mb-5">
      <h2 id={id} className="text-lg font-semibold tracking-[-0.02em]">
        {title}
      </h2>
      <p className="mt-1 max-w-prose text-sm text-muted-foreground">{children}</p>
    </div>
  );
}

/** The address form, drawn as the twelve columns it sits on. */
const SPANS: readonly (readonly (readonly [string, number])[])[] = [
  [["First name", 6], ["Last name", 6]],
  [["Email", 12]],
  [["Street", 8], ["Number", 4]],
  [["City", 5], ["Region", 3], ["Postcode", 4]],
  [["Delivery note", 12]],
];

function Columns(): React.JSX.Element {
  return (
    <aside aria-hidden="true" className="hidden content-start lg:grid">
      <p className="mb-3 text-xs text-muted-foreground">The same form, as twelve columns</p>
      <div className="grid gap-1.5 rounded-xl border border-dashed border-border bg-muted/30 p-4">
        <div className="mb-1 grid grid-cols-12 gap-1 text-center text-[0.625rem] text-muted-foreground tabular-nums">
          {Array.from({ length: 12 }, (_, index) => (
            <span key={index}>{index + 1}</span>
          ))}
        </div>
        {SPANS.map((row) => (
          <div key={row.map(([label]) => label).join("-")} className="grid grid-cols-12 gap-1">
            {row.map(([label, span]) => (
              <div key={label} style={{ gridColumn: `span ${span}` }} className="flex min-w-0 items-baseline justify-between gap-1 rounded-md border border-border bg-card px-2 py-1.5 text-xs shadow-xs">
                <span className="truncate">{label}</span>
                <span className="text-muted-foreground tabular-nums">{span}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </aside>
  );
}

function Mini(): React.JSX.Element {
  return (
    <FormGrid as="fieldset" legend="Billing contact">
      <FormGrid.Item span={6}>
        <TextField label="First name" defaultValue="Ines" autoComplete="given-name" />
      </FormGrid.Item>
      <FormGrid.Item span={6}>
        <TextField label="Last name" defaultValue="Kowalski" autoComplete="family-name" />
      </FormGrid.Item>
      <FormGrid.Item span={8}>
        <TextField label="Street" defaultValue="Keizersgracht" autoComplete="address-line1" />
      </FormGrid.Item>
      <FormGrid.Item span={4}>
        <TextField label="Number" defaultValue="412" inputMode="numeric" />
      </FormGrid.Item>
      <FormGrid.Item>
        <TextField label="Email" type="email" defaultValue="ines.kowalski@halcyon.studio" autoComplete="email" />
      </FormGrid.Item>
    </FormGrid>
  );
}

/** Where the form sits: the width each place asks for, in rem. The screen may not be able to give it. */
const PLACES = [
  { value: "22", label: "Sheet", what: "A sheet from the side", rem: 22 },
  { value: "32", label: "Dialog", what: "A dialog", rem: 32 },
  { value: "40", label: "Page", what: "A page column", rem: 40 },
] as const;

/** The widths the form really has, measured: the card the place asks for (the screen may cap it) and the grid inside it. */
interface Fit {
  card: number;
  grid: number;
  rem: number;
}

/** The sentence is written from the measure, so it can never disagree with what is drawn: the grid stacks its fields below 28rem of its own width. */
function sentence(what: string, rem: number, fit: Fit): string {
  const capped = fit.card < rem * fit.rem - 1;
  const stacks = fit.grid < 28 * fit.rem;
  const lead = capped ? `${what} is ${rem}rem, but this screen leaves ${fit.grid}px for the fields` : `${what}: ${rem}rem, ${fit.grid}px for the fields`;
  return `${lead}, so ${stacks ? "they stack" : "names and street share a row"}.`;
}

function Places(): React.JSX.Element {
  const [place, setPlace] = useState("32");
  const chosen = PLACES.find((item) => item.value === place) ?? PLACES[1];
  const card = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState<Fit | null>(null);
  useEffect(() => {
    const node = card.current;
    const grid = node?.querySelector<HTMLElement>("[data-slot=form-grid-fields]");
    if (!node || !grid) return;
    const read = () =>
      setFit({
        card: Math.round(node.getBoundingClientRect().width),
        grid: Math.round(grid.getBoundingClientRect().width),
        rem: Number.parseFloat(getComputedStyle(document.documentElement).fontSize) || 16,
      });
    read();
    const observer = new ResizeObserver(read);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return (
    <div className="grid grid-cols-1 gap-5">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
        <SegmentedControl label="Where the form sits" value={place} onValueChange={setPlace} options={PLACES.map(({ value, label }) => ({ value, label }))} />
        <p role="status" className="text-xs text-muted-foreground">
          {fit === null ? `${chosen.what}: ${chosen.rem}rem` : sentence(chosen.what, chosen.rem, fit)}
        </p>
      </div>
      <div className="rounded-xl border border-dashed border-border bg-muted/30 p-3 sm:p-5">
        <div ref={card} className="max-w-full rounded-xl border border-border bg-card p-5 shadow-xs sm:p-6" style={{ width: `${chosen.rem}rem` }}>
          <Mini />
        </div>
      </div>
    </div>
  );
}

function Code({ children }: { children: ReactNode }): React.JSX.Element {
  return <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.6875rem] text-foreground">{children}</code>;
}

/** What each prop of the form below does, one line each. */
const NOTES: readonly (readonly [string, string])[] = [
  ["span={{ base: 12, sm: 6, lg: 4 }}", "One field to a row, then two, then three."],
  ["start={5}", "Leaves four columns free in front of the promo code."],
  ["fullWidth", "Takes the whole row at every width."],
  ["as=\"fieldset\" disabled", "Switches every field of the group off together."],
  ["gap=\"sm\"", "Tightens the space between fields, here in the locked group."],
];

/** The rest of the API at work: a span per width, an offset, a field that always takes the row, and a group that is switched off. */
function Counts(): React.JSX.Element {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
      <div className="p-5 sm:p-6">
        <FormGrid as="fieldset" legend="Subscription">
          <FormGrid.Item span={{ base: 12, sm: 6, lg: 4 }}>
            <TextField label="Workspace" defaultValue="Halcyon Studio" />
          </FormGrid.Item>
          <FormGrid.Item span={{ base: 12, sm: 6, lg: 4 }}>
            <TextField label="Seats" defaultValue="25" inputMode="numeric" hint="Up to 25 on the Scale plan." />
          </FormGrid.Item>
          <FormGrid.Item span={{ base: 12, lg: 4 }}>
            <TextField label="Billing cycle" defaultValue="Yearly" hint="Save 20% against paying monthly." />
          </FormGrid.Item>
          <FormGrid.Item span={4} start={5}>
            <TextField label="Promo code" placeholder="HALCYON-2026" />
          </FormGrid.Item>
          <FormGrid.Item fullWidth>
            <FormField>
              <FormLabel>Note on the invoice</FormLabel>
              <FormControl>
                <Textarea rows={2} defaultValue="Please send invoices to accounts@halcyon.studio and add our PO number." />
              </FormControl>
            </FormField>
          </FormGrid.Item>
        </FormGrid>

        <div className="my-5 border-t border-border" />

        <FormGrid
          as="fieldset"
          disabled
          gap="sm"
          legend={
            <>
              Invoice address <span className="ml-2 font-normal text-muted-foreground">Locked after the first payment</span>
            </>
          }
        >
          <FormGrid.Item span={8}>
            <TextField label="Company" defaultValue="Halcyon Studio B.V." />
          </FormGrid.Item>
          <FormGrid.Item span={4}>
            <TextField label="VAT number" defaultValue="NL8123.45.678.B01" />
          </FormGrid.Item>
        </FormGrid>
      </div>
      <ul className="grid gap-1.5 border-t border-border bg-muted/40 px-5 py-3.5 text-xs text-muted-foreground sm:px-6">
        {NOTES.map(([code, text]) => (
          <li key={code} className="grid justify-items-start gap-1 sm:flex sm:flex-wrap sm:items-baseline sm:gap-x-2.5">
            <Code>{code}</Code>
            <span>{text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto grid w-full max-w-5xl grid-cols-1 gap-14 px-4 py-8 sm:px-6">
      <section aria-labelledby="form-grid-address">
        <Heading id="form-grid-address" title="An address, row by row">
          Names share a row, a street takes eight columns beside a number of four, and the note takes the whole width. The hint under the first name and the error under the last one never push each other out of line.
        </Heading>
        <div className="grid gap-10 lg:grid-cols-[minmax(0,36rem)_minmax(0,1fr)] lg:items-start">
          <form className="overflow-hidden rounded-xl border border-border bg-card shadow-xs" onSubmit={(event) => event.preventDefault()}>
            <div className="p-5 sm:p-6">
              <FormGrid as="fieldset" legend="Delivery address">
                <FormGrid.Item span={6}>
                  <TextField label="First name" defaultValue="Ines" hint="As it appears on your ID, for the courier." autoComplete="given-name" />
                </FormGrid.Item>
                <FormGrid.Item span={6}>
                  <TextField label="Last name" error="Enter a last name" autoComplete="family-name" />
                </FormGrid.Item>
                <FormGrid.Item>
                  <TextField label="Email" type="email" defaultValue="ines.kowalski@halcyon.studio" autoComplete="email" />
                </FormGrid.Item>
                <FormGrid.Item span={8}>
                  <TextField label="Street" defaultValue="Keizersgracht" autoComplete="address-line1" />
                </FormGrid.Item>
                <FormGrid.Item span={4}>
                  <TextField label="Number" defaultValue="412" inputMode="numeric" />
                </FormGrid.Item>
                <FormGrid.Item span={5}>
                  <TextField label="City" defaultValue="Amsterdam" autoComplete="address-level2" />
                </FormGrid.Item>
                <FormGrid.Item span={3}>
                  <TextField label="Region" defaultValue="NH" autoComplete="address-level1" />
                </FormGrid.Item>
                <FormGrid.Item span={4}>
                  <TextField label="Postcode" defaultValue="1016 GE" autoComplete="postal-code" />
                </FormGrid.Item>
                <FormGrid.Item>
                  <FormField described>
                    <FormLabel>Delivery note</FormLabel>
                    <FormControl>
                      <Textarea defaultValue="Ring twice, the bell is stiff. Leave it with the neighbours at 410 if nobody answers." />
                    </FormControl>
                    <FormDescription>Only the courier sees this.</FormDescription>
                  </FormField>
                </FormGrid.Item>
              </FormGrid>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-muted/40 px-5 py-3 sm:px-6">
              <p className="text-xs text-muted-foreground">Delivery in 2 to 3 working days.</p>
              <Button type="submit" size="sm">
                Save address
              </Button>
            </div>
          </form>
          <Columns />
        </div>
      </section>

      <section aria-labelledby="form-grid-places">
        <Heading id="form-grid-places" title="Page, dialog or sheet">
          The grid answers to its own width, not the window&rsquo;s. Where the room is narrower than 28rem the fields stack, with their labels still in line.
        </Heading>
        <Places />
      </section>

      <section aria-labelledby="form-grid-counts">
        <Heading id="form-grid-counts" title="A count for each width, and a locked group">
          A span can be a map: one count on a narrow grid, another from 28rem and another from 48rem. A field can start further along, take the whole row, or be switched off with the rest of its group.
        </Heading>
        <Counts />
      </section>
    </div>
  );
}
