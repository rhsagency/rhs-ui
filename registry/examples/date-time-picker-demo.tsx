"use client";

import { useState } from "react";

import { DateTimePicker, toLocalDateTime, type DateTimeValue } from "@rhs-ui/primitives/date-time-picker";

export default function Demo(): React.JSX.Element {
  const [value, setValue] = useState<DateTimeValue>({ date: new Date(2026, 3, 14), time: null });
  return (
    <div className="mx-auto grid max-w-md gap-3 p-8">
      <p className="text-sm font-medium">Appointment</p>
      <DateTimePicker value={value} onValueChange={setValue} unavailable={["12:00", "12:30"]} name="appointment" />
      <p className="text-xs text-muted-foreground">Submits: {toLocalDateTime(value) || "pick a day and a time"}</p>
    </div>
  );
}
