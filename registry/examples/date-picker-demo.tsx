"use client";

import { useState } from "react";

import { DatePicker } from "@rhs-ui/primitives/date-picker";
import { Label } from "@rhs-ui/primitives/label";

export default function Demo(): React.JSX.Element {
  const [launch, setLaunch] = useState<Date | null>(null);
  return (
    <div className="grid w-full max-w-xs gap-2">
      <Label htmlFor="launch">Launch date</Label>
      <DatePicker id="launch" name="launch" value={launch} onValueChange={setLaunch} min={new Date(2026, 9, 1)} isDisabled={(date) => date.getDay() === 0 || date.getDay() === 6} />
      <p className="text-xs text-muted-foreground" aria-live="polite">
        {launch ? "We will remind the team a week before." : "Weekdays only."}
      </p>
    </div>
  );
}
