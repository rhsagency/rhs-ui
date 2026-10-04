"use client";

import { useState } from "react";

import { Label } from "@rhs-ui/primitives/label";
import { TimezoneSelect } from "@rhs-ui/primitives/timezone-select";

const AT = new Date("2026-04-14T12:00:00Z");

export default function Demo(): React.JSX.Element {
  const [zone, setZone] = useState<string | null>("Europe/Amsterdam");
  return (
    <div className="mx-auto grid max-w-xs gap-2 p-8">
      <Label htmlFor="tz-demo">Time zone</Label>
      <TimezoneSelect id="tz-demo" value={zone} onValueChange={setZone} at={AT} />
      <p className="text-xs text-muted-foreground">Meetings are shown in {zone ?? "your browser's zone"}.</p>
    </div>
  );
}
