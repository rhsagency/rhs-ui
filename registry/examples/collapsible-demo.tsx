"use client";

import { useState } from "react";

import { IconChevronsUpDown } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@rhs-ui/primitives/collapsible";

const FILES = ["app/layout.tsx", "app/page.tsx", "components/hero.tsx", "components/pricing.tsx", "lib/site.ts"];

export default function Demo(): React.JSX.Element {
  const [open, setOpen] = useState(false);
  return (
    <Collapsible open={open} onOpenChange={setOpen} className="grid w-full max-w-sm gap-2">
      <div className="flex items-center justify-between gap-4 px-1">
        <p className="text-sm font-medium">5 files changed</p>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label={open ? "Hide the files" : "Show the files"}>
            <IconChevronsUpDown />
          </Button>
        </CollapsibleTrigger>
      </div>
      <div className="rounded-lg border border-border px-3 py-2 font-mono text-xs">{FILES[0]}</div>
      <CollapsibleContent className="grid gap-2">
        {FILES.slice(1).map((file) => (
          <div key={file} className="rounded-lg border border-border px-3 py-2 font-mono text-xs">
            {file}
          </div>
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}
