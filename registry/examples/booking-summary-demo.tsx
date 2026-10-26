"use client";

import { useState, type ReactNode } from "react";

import { BookingSummary, type BookingPart } from "@rhs-ui/commerce/booking-summary";

const PARTS: Record<BookingPart, string> = {
  service: "the service",
  datetime: "the date and time",
  staff: "who you book with",
  location: "the location",
  notes: "your notes",
};

function Example({ caption, children }: { caption: string; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

export default function Demo(): React.JSX.Element {
  const [editing, setEditing] = useState<BookingPart | null>(null);

  return (
    <div className="grid w-full max-w-4xl min-w-0 gap-x-8 gap-y-10 [grid-template-columns:repeat(auto-fit,minmax(min(100%,24rem),1fr))]">
      <Example caption="Last step of the flow: every row has its own edit link">
        <div className="grid gap-3">
          <BookingSummary
            service={{ name: "Deep tissue massage", detail: "Treatment room 2, towels included" }}
            start="2026-11-03T10:00:00+01:00"
            duration={60}
            staff={{ name: "Marit de Vries", role: "Senior therapist" }}
            location={{ name: "Halcyon Studio Amsterdam", address: ["Keizersgracht 214", "1016 DX Amsterdam"] }}
            price={{ amount: 9500, currency: "EUR", note: "VAT included. You pay at the studio." }}
            policy="Free cancellation until 24 hours before your visit. After that the full price is charged."
            locale="en-GB"
            timeZone="Europe/Amsterdam"
            onEdit={setEditing}
          />
          <p role="status" className="min-h-5 text-xs text-muted-foreground">
            {editing ? `Going back to change ${PARTS[editing]}.` : "Press an edit link to see what it reports."}
          </p>
        </div>
      </Example>

      <Example caption="Confirmation page: the same summary, final and read-only, with the reference">
        <BookingSummary
          confirmed
          reference="NW-48213"
          service={{ name: "Colour and cut", detail: "Includes wash and style" }}
          start="2026-11-12T14:30:00+01:00"
          duration={150}
          staff={{ name: "Sofia Marchetti", role: "Colour specialist" }}
          location={{ name: "Northwind Salon Utrecht", address: ["Oudegracht 112", "3511 AV Utrecht"] }}
          notes="Allergic to ammonia-based dyes."
          price={{ amount: 14800, currency: "EUR", note: "VAT included. Paid online." }}
          policy="Free changes until 48 hours before. Cancelling later costs half the price."
          locale="en-GB"
          timeZone="Europe/Amsterdam"
        />
      </Example>
    </div>
  );
}
