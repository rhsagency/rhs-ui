"use client";

import { useCallback, useState } from "react";

import { SearchTrigger } from "@rhs-ui/primitives/search-trigger";

export default function Demo(): React.JSX.Element {
  const [opened, setOpened] = useState(0);
  const open = useCallback(() => setOpened((value) => value + 1), []);
  return (
    <div className="mx-auto grid max-w-sm gap-3 p-10">
      <SearchTrigger onOpen={open} placeholder="Search docs…" />
      <p role="status" className="text-xs text-muted-foreground">{opened ? `Your command palette would open now (${opened}).` : "Click it, or press the shortcut."}</p>
    </div>
  );
}
