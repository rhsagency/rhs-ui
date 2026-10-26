"use client";

import { useState, type ReactNode } from "react";

import { FlightCard, type FlightAirport } from "@rhs-ui/commerce/flight-card";

const AMS: FlightAirport = { code: "AMS", city: "Amsterdam", timeZone: "Europe/Amsterdam" };
const LIS: FlightAirport = { code: "LIS", city: "Lisbon", timeZone: "Europe/Lisbon" };
const ZRH: FlightAirport = { code: "ZRH", city: "Zurich", timeZone: "Europe/Zurich" };
const SIN: FlightAirport = { code: "SIN", city: "Singapore", timeZone: "Asia/Singapore" };

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  const [chosen, setChosen] = useState<"cheap" | "stop" | "fast">("fast");

  return (
    <div className="grid w-full max-w-3xl min-w-0 gap-8">
      <Example caption="Direct: hover or tap a time to see its zone. Flight details lists the flight">
        <FlightCard
          badge="Cheapest"
          segments={[{ from: AMS, to: LIS, departure: "2026-11-14T08:25:00+01:00", arrival: "2026-11-14T10:15:00+00:00", carrier: "Halcyon Air", flightNumber: "HA 2214" }]}
          price={17900}
          priceNote="per person"
          cabin="Economy"
          baggage="Cabin bag only"
          selected={chosen === "cheap"}
          onSelect={() => setChosen("cheap")}
          locale="en-GB"
        />
      </Example>

      <Example caption="One stop, landing the next day: the stop in words, the layover between the flights, and +1 day">
        <FlightCard
          segments={[
            { from: AMS, to: ZRH, departure: "2026-11-14T19:10:00+01:00", arrival: "2026-11-14T20:35:00+01:00", carrier: "Kestrel Airways", flightNumber: "KA 1176" },
            { from: ZRH, to: SIN, departure: "2026-11-14T21:55:00+01:00", arrival: "2026-11-15T17:30:00+08:00", carrier: "Kestrel Airways", flightNumber: "KA 52" },
          ]}
          price={74800}
          priceNote="per person"
          cabin="Premium economy"
          baggage="2 checked bags included"
          selected={chosen === "stop"}
          onSelect={() => setChosen("stop")}
          locale="en-GB"
        />
      </Example>

      <Example caption="Chosen: a heavier border and a button that says so">
        <FlightCard
          badge="Fastest"
          segments={[{ from: AMS, to: LIS, departure: "2026-11-14T12:40:00+01:00", arrival: "2026-11-14T14:20:00+00:00", carrier: "Northwind Air", flightNumber: "NW 441" }]}
          price={20400}
          priceNote="per person"
          cabin="Economy"
          baggage="1 checked bag included"
          selected={chosen === "fast"}
          onSelect={() => setChosen("fast")}
          locale="en-GB"
        />
      </Example>
    </div>
  );
}
