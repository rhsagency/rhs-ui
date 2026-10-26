"use client";

import { useState, type ReactNode } from "react";

import { BookingBar, type BookingLocation, type BookingSearch } from "@rhs-ui/marketing/booking-bar";

const locations: BookingLocation[] = [
  { value: "lisbon", label: "Lisbon", description: "Alfama, Baixa and Chiado" },
  { value: "porto", label: "Porto", description: "Ribeira and the Douro" },
  { value: "algarve", label: "The Algarve", description: "Lagos, Tavira and the coast" },
  { value: "madeira", label: "Madeira", description: "Funchal and the north shore" },
  { value: "alentejo", label: "Alentejo", description: "Cork forests and quiet villages" },
];

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="min-w-0">
      <p className="mb-6 text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  const [result, setResult] = useState("");
  const search = (query: BookingSearch) => {
    const day = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long" });
    const place = locations.find((location) => location.value === query.location)?.label ?? "anywhere";
    setResult(`Searching ${place}, ${day.format(query.range.from)} to ${day.format(query.range.to)} (${query.nights} nights), adults: ${query.adults}, children: ${query.children}. Demo only: nothing is searched.`);
  };
  return (
    <div className="mx-auto max-w-6xl px-6 py-10 sm:py-16">
      <Example caption="A stay with a minimum of two nights, six guests at most and a location first, with the dates open: check-in and check-out in one calendar, the stay as a band. Open the guests for the counters, press a day too close to the check-in for the reason, and press Check availability.">
        {/* The calendar floats over what is under the bar; the space is kept here so it never covers the next example. */}
        <div className="min-h-[30rem]">
          <BookingBar
            locations={locations}
            minNights={2}
            maxGuests={6}
            minDate="2026-11-01"
            locale="en-GB"
            defaultValue={{ range: { from: "2026-12-18", to: "2026-12-21" }, adults: 2, children: 1, location: "lisbon" }}
            defaultOpen="dates"
            onSearch={search}
          />
        </div>
        <p role="status" className="min-h-6 text-sm text-muted-foreground">
          {result}
        </p>
      </Example>

      <div className="mt-16 max-w-md border-t border-border pt-12">
        <Example caption="Narrow, with no location and no dates yet: the parts stack as a form. Search without dates and the bar says why, and puts focus on them.">
          <BookingBar minNights={3} maxGuests={4} minDate="2026-11-01" locale="en-GB" defaultValue={{ adults: 2 }} onSearch={search} />
        </Example>
      </div>
    </div>
  );
}
