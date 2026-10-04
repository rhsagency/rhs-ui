"use client";

import { BreadcrumbCollapsed } from "@rhs-ui/primitives/breadcrumb-collapsed";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto grid max-w-xl gap-6 p-8">
      <BreadcrumbCollapsed
        items={[
          { label: "Drive", href: "#drive" },
          { label: "Clients", href: "#clients" },
          { label: "Northwind", href: "#northwind" },
          { label: "2026", href: "#2026" },
          { label: "Brand refresh", href: "#brand" },
          { label: "Deliverables", href: "#deliverables" },
          { label: "Logo files" },
        ]}
      />
      <BreadcrumbCollapsed items={[{ label: "Settings", href: "#settings" }, { label: "Billing" }]} />
    </div>
  );
}
