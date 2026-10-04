"use client";

import { useState } from "react";

import { IconEdit } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { PopoverForm } from "@rhs-ui/primitives/popover-form";

export default function Demo(): React.JSX.Element {
  const [name, setName] = useState("Q2 launch plan.pdf");
  return (
    <div className="mx-auto flex min-h-64 max-w-sm items-start justify-center gap-2 p-10 text-sm">
      <span className="font-medium">{name}</span>
      <PopoverForm
        label="File name"
        defaultValue={name}
        onSubmit={(value) => new Promise<void>((resolve, reject) => setTimeout(() => (value.endsWith(".pdf") ? (setName(value), resolve()) : reject(new Error("Keep the .pdf at the end."))), 400))}
      >
        <Button size="sm" variant="ghost" aria-label="Rename file"><IconEdit /></Button>
      </PopoverForm>
    </div>
  );
}
