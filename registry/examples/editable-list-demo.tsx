"use client";

import { useState } from "react";

import { EditableList } from "@rhs-ui/primitives/editable-list";

export default function Demo(): React.JSX.Element {
  const [items, setItems] = useState(["Wins from last week", "Pricing page review", "Hiring update"]);
  return (
    <div className="mx-auto max-w-md p-8">
      <EditableList label="Monday agenda" numbered items={items} onItemsChange={setItems} max={8} />
    </div>
  );
}
