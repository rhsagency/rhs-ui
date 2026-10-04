"use client";

import { useState } from "react";

import { DurationInput } from "@rhs-ui/primitives/duration-input";

export default function Demo(): React.JSX.Element {
  const [minutes, setMinutes] = useState(90);
  return (
    <div className="mx-auto max-w-md p-8">
      <DurationInput label="Meeting length" value={minutes} onValueChange={setMinutes} presets={[15, 30, 60]} />
    </div>
  );
}
