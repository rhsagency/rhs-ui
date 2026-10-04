"use client";

import { useState } from "react";

import { TimePicker } from "@rhs-ui/primitives/time-picker";

export default function Demo(): React.JSX.Element {
  const [time, setTime] = useState<string | null>("10:30");
  return (
    <div className="flex min-h-40 flex-col items-center gap-3 p-8">
      <TimePicker value={time} onValueChange={setTime} step={30} min="09:00" max="17:00" unavailable={["12:00", "12:30", "15:00"]} />
      <p className="text-xs text-muted-foreground">Lunch and 15:00 are taken.</p>
    </div>
  );
}
