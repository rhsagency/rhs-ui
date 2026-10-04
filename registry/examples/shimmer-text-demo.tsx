"use client";

import { useState } from "react";

import { ShimmerText } from "@rhs-ui/motion/shimmer-text";

export default function Demo(): React.JSX.Element {
  const [active, setActive] = useState(true);
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center gap-6 p-10">
      <p className="text-lg">
        <ShimmerText active={active}>{active ? "Generating your report…" : "Report ready."}</ShimmerText>
      </p>
      <button type="button" onClick={() => setActive((value) => !value)} className="rounded-full border border-border px-4 py-2 text-sm">
        {active ? "Finish" : "Start again"}
      </button>
    </div>
  );
}
