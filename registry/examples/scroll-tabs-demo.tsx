"use client";

import { useState } from "react";

import { ScrollTabs } from "@rhs-ui/primitives/scroll-tabs";

const TABS = ["Overview", "Activity", "Tasks", "Files", "Decisions", "Releases", "Members", "Integrations", "Billing", "Settings", "Audit log"].map((label, i) => ({ id: label.toLowerCase().replace(" ", "-"), label, count: [undefined, 12, 34, 8, 5, 3, 9, undefined, undefined, undefined, 120][i] }));

export default function Demo(): React.JSX.Element {
  const [tab, setTab] = useState("tasks");
  return (
    <div className="mx-auto max-w-md p-8">
      <ScrollTabs label="Project" tabs={TABS} value={tab} onValueChange={setTab} />
      <p className="mt-4 text-sm text-muted-foreground">Showing: {TABS.find((t) => t.id === tab)?.label}</p>
    </div>
  );
}
