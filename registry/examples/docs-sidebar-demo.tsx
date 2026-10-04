"use client";

import { DocsSidebar } from "@rhs-ui/primitives/docs-sidebar";

export default function Demo(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-xs p-8">
      <DocsSidebar
        current="#forms-validation"
        sections={[
          { title: "Getting started", pages: [{ title: "Introduction", href: "#intro" }, { title: "Installation", href: "#install" }, { title: "Theming", href: "#theming" }] },
          {
            title: "Guides",
            pages: [
              { title: "Forms", pages: [{ title: "Fields", href: "#forms-fields" }, { title: "Validation", href: "#forms-validation" }, { title: "Server actions", href: "#forms-actions", badge: "New" }] },
              { title: "Data", pages: [{ title: "Tables", href: "#tables" }, { title: "Charts", href: "#charts" }] },
              { title: "Dark mode", href: "#dark-mode" },
            ],
          },
        ]}
      />
    </div>
  );
}
