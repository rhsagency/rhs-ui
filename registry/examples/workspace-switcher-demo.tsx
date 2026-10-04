"use client";

import { useState } from "react";

import { WorkspaceSwitcher } from "@rhs-ui/primitives/workspace-switcher";

const WORKSPACES = [
  { id: "northwind", name: "Northwind Studio", detail: "Pro plan, 12 members" },
  { id: "atlas", name: "Atlas Logistics", detail: "Team plan, 4 members" },
  { id: "side", name: "Side project", detail: "Free plan" },
];

export default function Demo(): React.JSX.Element {
  const [current, setCurrent] = useState("northwind");
  return (
    <div className="mx-auto min-h-64 max-w-xs p-8">
      <WorkspaceSwitcher workspaces={WORKSPACES} current={current} onSelect={setCurrent} onCreate={() => undefined} />
    </div>
  );
}
