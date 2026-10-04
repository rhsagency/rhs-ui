"use client";

import { useState } from "react";

import { CheckboxTree } from "@rhs-ui/primitives/checkbox-tree";

export default function Demo(): React.JSX.Element {
  const [value, setValue] = useState<string[]>(["projects.read", "projects.write", "billing.read"]);
  return (
    <div className="mx-auto max-w-sm p-8">
      <CheckboxTree
        label="Permissions for the Editor role"
        value={value}
        onValueChange={setValue}
        defaultExpanded={["projects", "billing"]}
        nodes={[
          { id: "projects", label: "Projects", children: [{ id: "projects.read", label: "View projects" }, { id: "projects.write", label: "Edit projects" }, { id: "projects.delete", label: "Delete projects" }] },
          { id: "billing", label: "Billing", children: [{ id: "billing.read", label: "View invoices" }, { id: "billing.manage", label: "Change the plan" }] },
          { id: "members", label: "Members", children: [{ id: "members.invite", label: "Invite people" }, { id: "members.remove", label: "Remove people" }] },
        ]}
      />
      <p className="mt-4 text-xs text-muted-foreground">{value.length} permissions selected</p>
    </div>
  );
}
