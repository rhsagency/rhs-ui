"use client";

import { useEffect, useId, useRef, useState, type ReactNode, type SyntheticEvent } from "react";

import { SegmentedControl } from "@rhs-ui/application/segmented-control";
import { AsyncSelect, type AsyncSelectOption, type AsyncSelectProps } from "@rhs-ui/primitives/async-select";
import { Label } from "@rhs-ui/primitives/label";
import { cn } from "@/lib/utils";

const CUSTOMERS: readonly (readonly [id: string, name: string, email: string, city: string])[] = [
  ["c-01", "Acme Industries", "accounts@acme.example", "Rotterdam"],
  ["c-02", "Acorn Studio", "hello@acorn.example", "Utrecht"],
  ["c-03", "Alder & Finch", "billing@alderfinch.example", "Haarlem"],
  ["c-04", "Beacon Freight", "ops@beacon.example", "Antwerp"],
  ["c-05", "Birch Street Bakery", "orders@birchstreet.example", "Ghent"],
  ["c-06", "Cobalt Labs", "finance@cobalt.example", "Eindhoven"],
  ["c-07", "Copper Kettle", "hello@copperkettle.example", "Leiden"],
  ["c-08", "Delta Marine", "invoices@deltamarine.example", "Vlissingen"],
  ["c-09", "Dune Outfitters", "shop@dune.example", "The Hague"],
  ["c-10", "Elm & Oak Furniture", "sales@elmoak.example", "Arnhem"],
  ["c-11", "Fjord Coffee", "ap@fjord.example", "Groningen"],
  ["c-12", "Halcyon Health", "billing@halcyon.example", "Amsterdam"],
  ["c-13", "Harbor Light Hotels", "stay@harborlight.example", "Texel"],
  ["c-14", "Ironbridge Tools", "accounts@ironbridge.example", "Tilburg"],
  ["c-15", "Juniper Print", "studio@juniper.example", "Delft"],
  ["c-16", "Kensington Hotels", "ap@kensington.example", "Brussels"],
  ["c-17", "Kestrel Logistics", "billing@kestrel.example", "Venlo"],
  ["c-18", "Keystone Bakery", "hello@keystone.example", "Breda"],
  ["c-19", "Lantern Books", "orders@lantern.example", "Maastricht"],
  ["c-20", "Maple Works", "finance@maple.example", "Zwolle"],
  ["c-21", "Northwind Traders", "ap@northwind.example", "Amsterdam"],
  ["c-22", "Orchard Row", "hello@orchardrow.example", "Haarlem"],
  ["c-23", "Pioneer Cycles", "shop@pioneer.example", "Nijmegen"],
  ["c-24", "Quill & Co", "accounts@quill.example", "Utrecht"],
];

const optionOf = ([id, name, email, city]: (typeof CUSTOMERS)[number]): AsyncSelectOption => ({ value: id, label: name, description: `${email} · ${city}` });

type Server = "fast" | "slow" | "offline";

/**
 * A pretend customers service: it answers after a delay, stops when the request is aborted (as fetch does),
 * and in "offline" mode refuses. Names that begin with the text come first.
 */
function ask(server: Server, query: string, signal: AbortSignal): Promise<AsyncSelectOption[]> {
  return new Promise((resolve, reject) => {
    const abort = () => reject(new DOMException("The request was aborted.", "AbortError"));
    if (signal.aborted) return abort();
    const timer = window.setTimeout(
      () => {
        if (server === "offline") return reject(new Error("The customers service is not reachable."));
        const wanted = query.toLowerCase();
        const found = CUSTOMERS.filter(([, name, email]) => name.toLowerCase().includes(wanted) || email.toLowerCase().includes(wanted));
        found.sort((a, b) => Number(b[1].toLowerCase().startsWith(wanted)) - Number(a[1].toLowerCase().startsWith(wanted)));
        resolve(found.slice(0, 6).map(optionOf));
      },
      server === "slow" ? 1600 : 90,
    );
    signal.addEventListener("abort", () => {
      window.clearTimeout(timer);
      abort();
    });
  });
}

/**
 * Holds the room a list that starts open needs, so the preview shows it whole and covers nothing. The room goes
 * back when the person uses what it holds (a press that ends in it, or a key in it), and never for a press
 * elsewhere on the page, or a swipe that scrolls it: a page that shrinks above a finger moves the very thing the
 * finger was about to tap.
 */
function Reserve({ className, children }: { className: string; children: ReactNode }): React.JSX.Element {
  const [reserved, setReserved] = useState(true);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  // A moment after the press ends, so that a control that moves away under the pointer still gets its click. A key sent by the demo itself is not use.
  const used = (event: SyntheticEvent) => {
    if (!event.nativeEvent.isTrusted) return;
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setReserved(false), 300);
  };
  return (
    <div onPointerUp={used} onKeyDown={used} className={cn("transition-[min-height] duration-200 ease-out motion-reduce:transition-none", reserved ? className : "min-h-0")}>
      {children}
    </div>
  );
}

/** Types a text into the search of the open list with this name, once, so the preview shows what a search brings. The focus is never touched. */
function Typed({ panel, text, children }: { panel: string; text: string; children: ReactNode }): React.JSX.Element {
  useEffect(() => {
    let tries = 0;
    const timer = window.setInterval(() => {
      const input = document.querySelector<HTMLInputElement>(`[role="dialog"][aria-label="${panel}"] [cmdk-input]`);
      tries += 1;
      if (!input && tries < 40) return;
      window.clearInterval(timer);
      if (!input) return;
      // React listens for the input event, and only sees a value that was set through the native setter.
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set?.call(input, text);
      input.dispatchEvent(new Event("input", { bubbles: true }));
    }, 50);
    return () => window.clearInterval(timer);
  }, [panel, text]);
  return <>{children}</>;
}

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-1 content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

/** The visible label also names the list, so what is seen and what is said are the same words. */
function Field({ label, ...props }: { label: string } & Omit<AsyncSelectProps, "id" | "label" | "loadOptions"> & { loadOptions?: AsyncSelectProps["loadOptions"] }): React.JSX.Element {
  const id = useId();
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <AsyncSelect id={id} label={label} loadOptions={(query, signal) => ask("fast", query, signal)} {...props} />
    </div>
  );
}

function Invoice(): React.JSX.Element {
  const id = useId();
  const [server, setServer] = useState<Server>("fast");
  const [customer, setCustomer] = useState<AsyncSelectOption | null>(() => optionOf(CUSTOMERS[16] ?? CUSTOMERS[0]!));
  return (
    <form noValidate onSubmit={(event) => event.preventDefault()} className="grid grid-cols-1 gap-5 rounded-xl border border-border bg-card p-5 shadow-xs">
      <div className="grid gap-1">
        <h2 className="text-sm font-medium tracking-[-0.01em]">Assign invoice 2026-0412</h2>
        <p className="text-xs text-muted-foreground">Search the 24 customers on the server. Change the server to see the slow and the failing list.</p>
      </div>
      <div className="grid gap-2">
        <Label htmlFor={id}>Customer</Label>
        <Reserve className="min-h-[25rem]">
          <Typed panel="Customer" text="ke">
            <AsyncSelect
              id={id}
              label="Customer"
              name="customer"
              debounce={120}
              loadOptions={(query, signal) => ask(server, query, signal)}
              value={customer}
              onValueChange={setCustomer}
              defaultOpen
              placement="bottom"
            />
          </Typed>
        </Reserve>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-xs text-muted-foreground">Server</span>
        <SegmentedControl
          label="Server behaviour"
          value={server}
          onValueChange={(next) => setServer(next as Server)}
          options={[
            { value: "fast", label: "Fast" },
            { value: "slow", label: "Slow" },
            { value: "offline", label: "Offline" },
          ]}
        />
      </div>
      <p role="status" className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-t border-border pt-4 text-xs text-muted-foreground">
        <span>Reported</span>
        <code className="font-mono text-[0.6875rem] text-foreground [overflow-wrap:anywhere]">{customer ? `{ "value": "${customer.value}", "label": "${customer.label}" }` : "null"}</code>
      </p>
    </form>
  );
}

const RECENT: readonly AsyncSelectOption[] = [CUSTOMERS[20], CUSTOMERS[11], CUSTOMERS[0]].flatMap((row) => (row ? [optionOf(row)] : []));

export default function Demo(): React.JSX.Element {
  return (
    <div className="grid w-full max-w-4xl grid-cols-1 gap-x-10 gap-y-9 md:grid-cols-2 md:items-start">
      <Example caption="Try it: type to search, and switch the server to make it slow or fail">
        <Invoice />
      </Example>

      <div className="grid min-w-0 content-start gap-9">
        <Example caption="Recent customers before anything is typed, from defaultOptions">
          <Field label="Bill to" defaultOptions={RECENT} />
        </Example>
        <Example caption="A choice that shows before anything loads, and a button to clear it">
          <Field label="Account owner" clearable defaultValue={optionOf(CUSTOMERS[20] ?? CUSTOMERS[0]!)} />
        </Example>
        <Example caption="Waits for three characters before it asks">
          <Field label="Search by email" minChars={3} placeholder="Type an email address" />
        </Example>
        <Example caption="Disabled">
          <Field label="Locked by the finance team" disabled defaultValue={optionOf(CUSTOMERS[11] ?? CUSTOMERS[0]!)} />
        </Example>
      </div>
    </div>
  );
}
