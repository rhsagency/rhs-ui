"use client";

import { TreeTable } from "@rhs-ui/primitives/tree-table";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-2xl p-8">
      <TreeTable
        label="Budget by department"
        columns={["Department", "Budget", "Spent", "Left"]}
        defaultExpanded={["product"]}
        rows={[
          { id: "product", name: "Product", cells: ["€240k", "€151k", "€89k"], children: [
            { id: "design", name: "Design", cells: ["€80k", "€52k", "€28k"] },
            { id: "eng", name: "Engineering", cells: ["€140k", "€88k", "€52k"], children: [
              { id: "platform", name: "Platform", cells: ["€70k", "€41k", "€29k"] },
              { id: "apps", name: "Apps", cells: ["€70k", "€47k", "€23k"] },
            ] },
            { id: "research", name: "Research", cells: ["€20k", "€11k", "€9k"] },
          ] },
          { id: "marketing", name: "Marketing", cells: ["€120k", "€97k", "€23k"], children: [
            { id: "brand", name: "Brand", cells: ["€50k", "€44k", "€6k"] },
            { id: "growth", name: "Growth", cells: ["€70k", "€53k", "€17k"] },
          ] },
          { id: "ops", name: "Operations", cells: ["€60k", "€31k", "€29k"] },
        ]}
      />
    </div>
  );
}
