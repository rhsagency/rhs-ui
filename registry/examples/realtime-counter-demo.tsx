"use client";

import { useEffect, useState } from "react";

import { RealtimeCounter } from "@rhs-ui/dashboard/realtime-counter";

export default function Demo(): React.JSX.Element {
  const [value, setValue] = useState(214);
  useEffect(() => {
    const timer = setInterval(() => setValue((v) => Math.max(150, v + Math.round((Math.sin(Date.now() / 3000) + 0.2) * 6))), 3000);
    return () => clearInterval(timer);
  }, []);
  return (
    <div className="mx-auto max-w-xs p-8">
      <RealtimeCounter label="Visitors right now" value={value} footnote="Updated every 3 seconds" breakdown={[{ label: "/pricing", value: Math.round(value * 0.31) }, { label: "/", value: Math.round(value * 0.27) }, { label: "/blog/four-day-week", value: Math.round(value * 0.14) }]} />
    </div>
  );
}
