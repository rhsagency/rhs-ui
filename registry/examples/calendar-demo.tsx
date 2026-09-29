"use client";

import { useState } from "react";

import { Calendar } from "@rhs-ui/primitives/calendar";

const booked = new Set(["2026-10-8", "2026-10-9", "2026-10-15"]);

export default function Demo(): React.JSX.Element {
  const [day, setDay] = useState<Date | null>(new Date(2026, 9, 14));
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="rounded-xl border border-border">
        <Calendar
          value={day}
          onValueChange={setDay}
          min={new Date(2026, 9, 1)}
          max={new Date(2026, 11, 31)}
          isDisabled={(date) => date.getDay() === 0 || booked.has(`${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`)}
        />
      </div>
      <p className="text-xs text-muted-foreground" aria-live="polite">
        {day ? `Booked for ${new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long" }).format(day)}.` : "Pick a day."} Sundays and full days are closed.
      </p>
    </div>
  );
}
