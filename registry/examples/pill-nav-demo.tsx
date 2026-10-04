import { PillNav } from "@rhs-ui/primitives/pill-nav";

export default function Demo(): React.JSX.Element {
  return (
    <div className="flex min-h-40 items-center justify-center p-6">
      <PillNav
        label="Project sections"
        current="#issues"
        links={[
          { href: "#overview", label: "Overview" },
          { href: "#issues", label: "Issues", count: 12 },
          { href: "#members", label: "Members", count: 8 },
          { href: "#billing", label: "Billing" },
          { href: "#settings", label: "Settings" },
        ]}
      />
    </div>
  );
}
