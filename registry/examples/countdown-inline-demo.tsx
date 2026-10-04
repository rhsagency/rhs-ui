"use client";

import { CountdownInline } from "@rhs-ui/primitives/countdown-inline";

export default function Demo(): React.JSX.Element {
  return (
    <div className="flex min-h-40 flex-col items-center justify-center gap-3 p-6">
      <p className="rounded-full border border-border px-4 py-1.5"><CountdownInline until="2030-01-01T00:00:00+01:00" label="Early-bird ends in" /></p>
      <CountdownInline until="2020-01-01T00:00:00+01:00" endedLabel="The early-bird price has ended" />
    </div>
  );
}
