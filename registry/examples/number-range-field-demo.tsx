"use client";

import { useState, type ReactNode } from "react";

import { NumberRangeField, type NumberRange, type NumberRangeLabels } from "@rhs-ui/primitives/number-range-field";

function Example({ caption, children }: { caption: ReactNode; children: ReactNode }): React.JSX.Element {
  return (
    <div className="grid min-w-0 grid-cols-1 content-start gap-3">
      <p className="text-xs text-muted-foreground">{caption}</p>
      {children}
    </div>
  );
}

/** Thirty-six used cars, the same on the server and in the browser. */
const LISTINGS = Array.from({ length: 36 }, (_, index) => ({
  year: 2012 + ((index * 7) % 13),
  mileage: 8000 + ((index * 9301) % 142000),
  price: 4200 + ((index * 3517) % 31000),
}));

const within = (value: number, range: NumberRange) => (range.min === null || value >= range.min) && (range.max === null || value <= range.max);

/** Every word the field says, in Dutch: the placeholders, the word between the fields and the three sentences. */
const DUTCH: Partial<NumberRangeLabels> = {
  noMin: "Geen min",
  noMax: "Geen max",
  to: "tot",
  inverted: (start) => `Het maximum kan niet lager zijn dan het minimum van ${start}.`,
  capped: (limit) => `Teruggebracht tot het hoogste toegestane getal, ${limit}.`,
  raised: (limit) => `Opgehoogd tot het laagste toegestane getal, ${limit}.`,
};

function Filters(): React.JSX.Element {
  const [price, setPrice] = useState<NumberRange>({ min: null, max: 18000 });
  const [mileage, setMileage] = useState<NumberRange>({ min: null, max: 60000 });
  const [year, setYear] = useState<NumberRange>({ min: 2018, max: null });
  const matching = LISTINGS.filter((car) => within(car.price, price) && within(car.mileage, mileage) && within(car.year, year)).length;
  return (
    <form noValidate onSubmit={(event) => event.preventDefault()} className="grid gap-5 rounded-xl border border-border bg-card p-5 shadow-xs">
      <div className="grid gap-1">
        <h2 className="text-sm font-medium tracking-[-0.02em]">Used cars at Kestrel Motors</h2>
        <p className="text-xs text-muted-foreground">Leave an end empty to leave it open. The list follows every change.</p>
      </div>
      <NumberRangeField label="Price" name="price" unit="EUR" min={0} step={500} value={price} onValueChange={setPrice} />
      <NumberRangeField label="Mileage" name="mileage" unit="km" min={0} step={5000} value={mileage} onValueChange={setMileage} />
      <NumberRangeField label="Year" name="year" min={2000} max={2025} grouping={false} value={year} onValueChange={setYear} />
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 border-t border-border pt-4 text-xs text-muted-foreground">
        <p role="status">
          <span className="text-sm font-medium text-foreground tabular-nums">{matching}</span> of {LISTINGS.length} cars match
        </p>
        {/* What the price field reported is for the reader of the demo, so a screen reader is not read it on every key. */}
        <code aria-hidden="true" className="font-mono text-[0.6875rem] text-foreground">
          price {JSON.stringify(price)}
        </code>
      </div>
    </form>
  );
}

export default function Demo(): React.JSX.Element {
  return (
    <div className="grid w-full max-w-4xl grid-cols-1 gap-x-10 gap-y-9 md:grid-cols-2 md:items-start">
      <Example caption="Try it: an empty end is open. The arrow keys step by 5000 km or 500 EUR, ten times as much with Shift, and never take the end below the start">
        <Filters />
      </Example>

      <div className="grid min-w-0 content-start gap-9">
        <Example caption="An end below the start is explained in words, and only the later field is marked">
          <NumberRangeField label="Battery capacity" unit="kWh" defaultValue={{ min: 75, max: 40 }} />
        </Example>
        <Example caption="Typing outside the limits is brought in when you leave the field, and a line says so. Try 5 or 900">
          <NumberRangeField label="Range per charge" unit="km" min={100} max={600} defaultValue={{ min: 250, max: null }} />
        </Example>
        <Example caption="Written the locale's way and in its own words: a decimal comma, and 1.250 means one thousand two hundred and fifty">
          <NumberRangeField label="Gewicht" unit="kg" locale="nl-NL" labels={DUTCH} step={0.5} min={0} defaultValue={{ min: 1250.5, max: 1900 }} />
        </Example>
        <Example caption="Disabled">
          <NumberRangeField label="Odometer" unit="km" disabled defaultValue={{ min: 10000, max: 80000 }} />
        </Example>
      </div>
    </div>
  );
}
