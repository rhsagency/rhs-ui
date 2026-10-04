"use client";

import { useState } from "react";

import { MultiSelect } from "@rhs-ui/primitives/multi-select";

const SKILLS = ["Design", "Research", "React", "TypeScript", "Postgres", "Writing", "Motion", "Accessibility", "Product", "Branding"].map((label) => ({ value: label.toLowerCase(), label }));

export default function Demo(): React.JSX.Element {
  const [value, setValue] = useState<string[]>(["design", "react", "accessibility", "writing"]);
  return (
    <div className="mx-auto grid max-w-md gap-2 p-8">
      <p className="text-sm font-medium">Skills</p>
      <MultiSelect label="Skills" options={SKILLS} value={value} onValueChange={setValue} />
    </div>
  );
}
