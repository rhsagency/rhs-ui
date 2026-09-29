"use client";

import { useState } from "react";

import { IconFile, IconFileText, IconFolder, IconImage } from "@rhs-ui/icons";
import { TreeView, type TreeNode } from "@rhs-ui/primitives/tree-view";

const FILES: TreeNode[] = [
  {
    id: "app", label: "app", icon: <IconFolder />, children: [
      { id: "app/layout.tsx", label: "layout.tsx", icon: <IconFile /> },
      { id: "app/page.tsx", label: "page.tsx", icon: <IconFile /> },
      { id: "app/pricing", label: "pricing", icon: <IconFolder />, children: [{ id: "app/pricing/page.tsx", label: "page.tsx", icon: <IconFile /> }] },
    ],
  },
  {
    id: "components", label: "components", icon: <IconFolder />, children: [
      { id: "components/hero.tsx", label: "hero.tsx", icon: <IconFile /> },
      { id: "components/rhs-ui", label: "rhs-ui", icon: <IconFolder />, children: [{ id: "components/rhs-ui/primitives", label: "primitives", icon: <IconFolder />, children: [{ id: "components/rhs-ui/primitives/button.tsx", label: "button.tsx", icon: <IconFile /> }] }] },
    ],
  },
  { id: "public", label: "public", icon: <IconFolder />, children: [{ id: "public/og.png", label: "og.png", icon: <IconImage /> }] },
  { id: "README.md", label: "README.md", icon: <IconFileText /> },
];

export default function Demo(): React.JSX.Element {
  const [selected, setSelected] = useState<string | null>("app/page.tsx");
  return (
    <div className="grid w-full max-w-xs gap-3">
      <TreeView nodes={FILES} label="Project files" selected={selected} onSelectedChange={setSelected} defaultExpanded={["app"]} className="rounded-lg border border-border p-1.5" />
      <p className="font-mono text-xs text-muted-foreground" aria-live="polite">
        {selected}
      </p>
    </div>
  );
}
