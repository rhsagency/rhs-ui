"use client";

import { useState } from "react";

import { InlineEdit } from "@rhs-ui/application/inline-edit";

export default function Demo(): React.JSX.Element {
  const [name, setName] = useState("Spring launch");
  return (
    <div className="mx-auto max-w-lg p-10">
      <p className="text-xs text-muted-foreground">Project</p>
      <h2 className="mt-1 text-2xl font-medium tracking-[-.03em]">
        <InlineEdit label="Project name" value={name} onSave={(value) => new Promise<void>((resolve) => setTimeout(() => { setName(value); resolve(); }, 300))} />
      </h2>
      <p className="mt-4 text-sm text-muted-foreground">Click the name, type, then press Enter. Escape cancels.</p>
    </div>
  );
}
